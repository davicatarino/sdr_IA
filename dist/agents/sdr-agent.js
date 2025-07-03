import { Agent, run } from '@openai/agents';
import { googleCalendarTool } from '../tools/google-calendar-tool.js';
import { whatsappTool } from '../tools/whatsapp-tool.js';
import { config, isBusinessHours } from '../utils/config.js';
export const sdrAgent = new Agent({
    name: 'SDR-Agent',
    instructions: `
    Você é um assistente SDR (Sales Development Representative) especializado em agendar reuniões via WhatsApp.
    
    Suas responsabilidades incluem:
    1. Agendar reuniões no Google Calendar
    2. Remarcar reuniões existentes
    3. Cancelar reuniões quando solicitado
    4. Verificar disponibilidade de horários
    5. Listar reuniões futuras
    6. Manter conversas naturais e profissionais
    
    Regras importantes:
    - Sempre confirme detalhes antes de agendar (data, hora, duração, assunto)
    - Respeite horário comercial (${config.businessHours.start} às ${config.businessHours.end}, dias úteis)
    - Peça confirmação antes de remarcar ou cancelar reuniões
    - Seja educado e profissional em todas as interações
    - Use emojis moderadamente para manter conversa natural
    - Sempre informe o usuário sobre o status das ações
    
    Ferramentas disponíveis:
    - google_calendar: Para todas as operações de calendário
    - whatsapp_send: Para enviar mensagens de resposta
    
    Use as ferramentas conforme necessário para completar as tarefas solicitadas.
  `,
    tools: [googleCalendarTool, whatsappTool],
    model: 'gpt-4o',
});
const userContexts = new Map();
const handoffTriggers = [
    {
        condition: (input) => input.toLowerCase().includes('falar com humano') ||
            input.toLowerCase().includes('atendente') ||
            input.toLowerCase().includes('pessoa'),
        priority: 'high',
        message: 'Cliente solicitou falar com humano'
    },
    {
        condition: (input) => input.toLowerCase().includes('reclamação') ||
            input.toLowerCase().includes('problema') ||
            input.toLowerCase().includes('insatisfeito'),
        priority: 'medium',
        message: 'Cliente com reclamação detectada'
    },
    {
        condition: (input, context) => context.rescheduleAttempts >= config.maxRescheduleAttempts,
        priority: 'high',
        message: 'Máximo de tentativas de remarcação atingido'
    }
];
export async function processUserMessage(userId, message, messageType = 'text') {
    try {
        let context = userContexts.get(userId);
        if (!context) {
            context = createUserContext(userId);
            userContexts.set(userId, context);
        }
        context.conversationHistory.push({
            role: 'user',
            content: message,
            timestamp: new Date()
        });
        const handoffTrigger = checkHandoffTriggers(message, context);
        if (handoffTrigger) {
            return {
                message: `Entendo sua solicitação. Vou transferir você para um atendente humano que poderá ajudá-lo melhor. Em breve alguém entrará em contato.`,
                type: 'handoff',
                metadata: {
                    intent: 'handoff'
                }
            };
        }
        if (!isBusinessHours() && !isUrgentRequest(message)) {
            return {
                message: `Olá! Estamos fora do horário comercial (${config.businessHours.start} às ${config.businessHours.end}, dias úteis). Deixe sua mensagem e retornaremos no próximo dia útil.`,
                type: 'text'
            };
        }
        const result = await run(sdrAgent, message, {
            context: {
                userId,
                messageType,
                userContext: context,
                businessHours: config.businessHours
            }
        });
        context.conversationHistory.push({
            role: 'assistant',
            content: result.finalOutput || '',
            timestamp: new Date()
        });
        context.lastInteraction = new Date();
        return {
            message: result.finalOutput || '',
            type: 'text',
            metadata: {
                intent: extractIntent(message),
                confidence: 0.9
            }
        };
    }
    catch (error) {
        console.error('Erro ao processar mensagem:', error);
        return {
            message: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente ou entre em contato com nosso suporte.',
            type: 'text',
            metadata: {
                intent: 'error'
            }
        };
    }
}
function createUserContext(userId) {
    return {
        userId,
        conversationHistory: [],
        scheduledMeetings: [],
        rescheduleAttempts: 0,
        lastInteraction: new Date(),
        preferences: {
            preferredTimeSlots: [],
            preferredDuration: 60,
            notes: ''
        }
    };
}
function checkHandoffTriggers(message, context) {
    for (const trigger of handoffTriggers) {
        if (trigger.condition(message, context)) {
            return trigger;
        }
    }
    return null;
}
function isUrgentRequest(message) {
    const urgentKeywords = ['urgente', 'emergência', 'importante', 'crítico'];
    return urgentKeywords.some(keyword => message.toLowerCase().includes(keyword));
}
function extractIntent(message) {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('agendar') || lowerMessage.includes('marcar'))
        return 'schedule';
    if (lowerMessage.includes('remarcar') || lowerMessage.includes('alterar'))
        return 'reschedule';
    if (lowerMessage.includes('cancelar') || lowerMessage.includes('desmarcar'))
        return 'cancel';
    if (lowerMessage.includes('listar') || lowerMessage.includes('ver reuniões'))
        return 'list';
    if (lowerMessage.includes('disponibilidade') || lowerMessage.includes('horários'))
        return 'check_availability';
    if (lowerMessage.includes('tchau') || lowerMessage.includes('obrigado'))
        return 'goodbye';
    return 'general';
}
export function updateUserContext(userId, updates) {
    const context = userContexts.get(userId);
    if (context) {
        Object.assign(context, updates);
        userContexts.set(userId, context);
    }
}
export function getUserContext(userId) {
    return userContexts.get(userId);
}
export function cleanupOldContexts(maxAgeHours = 24) {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    for (const [userId, context] of userContexts.entries()) {
        if (context.lastInteraction < cutoffTime) {
            userContexts.delete(userId);
        }
    }
}
//# sourceMappingURL=sdr-agent.js.map