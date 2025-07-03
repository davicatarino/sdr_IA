import { Agent, run } from '@openai/agents';
import { googleCalendarTool } from '../tools/google-calendar-tool.js';
import { whatsappTool } from '../tools/whatsapp-tool.js';
import { config, isBusinessHours } from '../utils/config.js';
import { getContextByThreadId, saveContextByThreadId } from '../utils/thread-context.js';
import { addMessageToHistory, getHistoryByThreadId } from '../utils/history.js';
export const sdrAgent = new Agent({
    name: 'SDR-Agent',
    instructions: ({ context }) => {
        let historyPrompt = '';
        if (context && context.history) {
            const lastMsgs = context.history.slice(-12);
            historyPrompt =
                'HISTÓRICO DA CONVERSA (use para responder perguntas sobre o passado):\n' +
                    lastMsgs
                        .map((h) => `[${h.role === 'user' ? 'Usuário' : 'Assistente'}]: ${h.message}`)
                        .join('\n') +
                    '\n\n';
        }
        const prompt = `
${historyPrompt}
Você é um SDR (pré-vendas) especialista em agendamento de reuniões via WhatsApp.

Sempre utilize o histórico acima para responder perguntas sobre o passado, mesmo que o usuário não peça explicitamente. Não há ferramenta de histórico: use apenas o que está acima para responder.

Suas responsabilidades:
1. Agendar reuniões no Google Calendar
2. Remarcar reuniões existentes
3. Cancelar reuniões quando solicitado
4. Verificar disponibilidade de horários
5. Listar reuniões futuras
6. Manter conversas naturais e profissionais

Regras:
- Sempre confirme detalhes antes de agendar (data, hora, duração, assunto)
- Respeite horário comercial (${config.businessHours.start} às ${config.businessHours.end}, dias úteis)
- Nunca agende reuniões fora do horário comercial
- Peça confirmação antes de remarcar ou cancelar reuniões
- Seja educado e profissional
- Use emojis moderadamente

Ferramentas:
- google_calendar: operações de calendário
- whatsapp_send: enviar respostas
    `;
        console.log('[INSTRUCTIONS] Prompt final enviado para IA:', prompt);
        return prompt;
    },
    tools: [googleCalendarTool, whatsappTool],
    model: 'gpt-4.1',
});
const handoffTriggers = [
    {
        condition: (input) => input.toLowerCase().includes('falar com humano') ||
            input.toLowerCase().includes('atendente') ||
            input.toLowerCase().includes('pessoa'),
        priority: 'high',
        message: 'Cliente solicitou falar com humano',
    },
    {
        condition: (input) => input.toLowerCase().includes('reclamação') ||
            input.toLowerCase().includes('problema') ||
            input.toLowerCase().includes('insatisfeito'),
        priority: 'medium',
        message: 'Cliente com reclamação detectada',
    },
    {
        condition: (input, context) => context.rescheduleAttempts >= config.maxRescheduleAttempts,
        priority: 'high',
        message: 'Máximo de tentativas de remarcação atingido',
    },
];
export async function processUserMessage(threadId, userId, message, messageType = 'text') {
    try {
        console.log(`[PROCESSO] Nova mensagem recebida: threadId=${threadId}, userId=${userId}, msg="${message}"`);
        await addMessageToHistory(threadId, userId, 'user', message);
        const history = await getHistoryByThreadId(threadId, 50);
        console.log(`[PROCESSO] Histórico recuperado (${history.length} mensagens):`, history);
        const messages = history.map((h) => ({
            role: h.role,
            content: h.message
        }));
        console.log('[PROCESSO] Contexto enviado para Responses API:', messages);
        let context = await getContextByThreadId(threadId);
        if (!context)
            context = createUserContext(userId);
        context.conversationHistory = history.map((h) => ({
            role: h.role,
            content: h.message,
            timestamp: h.created_at,
        }));
        const handoffTrigger = checkHandoffTriggers(message, context);
        if (handoffTrigger) {
            await saveContextByThreadId(threadId, context);
            await addMessageToHistory(threadId, userId, 'assistant', 'Entendo sua solicitação. Vou transferir você para um atendente humano.');
            return {
                message: 'Entendo sua solicitação. Vou transferir você para um atendente humano.',
                type: 'handoff',
                metadata: { intent: 'handoff' },
            };
        }
        const intent = extractIntent(message);
        if (intent === 'schedule' && !isBusinessHours() && !isUrgentRequest(message)) {
            await saveContextByThreadId(threadId, context);
            await addMessageToHistory(threadId, userId, 'assistant', `Posso te ajudar normalmente agora, mas só consigo marcar reuniões em horário comercial (${config.businessHours.start} às ${config.businessHours.end}, dias úteis).`);
            return {
                message: `Posso te ajudar normalmente agora, mas só consigo marcar reuniões em horário comercial (${config.businessHours.start} às ${config.businessHours.end}, dias úteis).`,
                type: 'text',
            };
        }
        if (intent === 'history') {
            console.log('[BACKEND] Forçando uso da tool search_history para histórico completo.');
            const history = await getHistoryByThreadId(threadId, 100);
            let historyResult = '';
            if (!history.length) {
                historyResult = 'Nenhuma mensagem encontrada no histórico.';
            }
            else {
                historyResult = history
                    .map((h) => `${h.role === 'user' ? 'Usuário' : 'Assistente'}: ${h.message}`)
                    .join('\n');
            }
            await addMessageToHistory(threadId, userId, 'assistant', historyResult);
            return {
                message: historyResult,
                type: 'text',
                metadata: { intent: 'history' },
            };
        }
        const agentContext = {
            userId,
            messageType,
            userContext: context,
            businessHours: config.businessHours,
            threadId,
            history: history.map((h) => ({ role: h.role, message: h.message })),
        };
        console.log('[AGENT] Contexto completo enviado para o agente:', agentContext);
        const result = await run(sdrAgent, message, {
            context: agentContext,
        });
        console.log('[AGENT] Resposta recebida do agente:', result);
        context.conversationHistory.push({
            role: 'assistant',
            content: result.finalOutput || '',
            timestamp: new Date(),
        });
        context.lastInteraction = new Date();
        await saveContextByThreadId(threadId, context);
        await addMessageToHistory(threadId, userId, 'assistant', result.finalOutput || '');
        return {
            message: result.finalOutput || '',
            type: 'text',
            metadata: {
                intent,
                confidence: 0.9,
            },
        };
    }
    catch (error) {
        console.error('[ERRO] Erro ao processar mensagem:', error);
        await addMessageToHistory(threadId, userId, 'assistant', 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente ou entre em contato com nosso suporte.');
        return {
            message: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente ou entre em contato com nosso suporte.',
            type: 'text',
            metadata: { intent: 'error' },
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
            notes: '',
        },
    };
}
function checkHandoffTriggers(message, context) {
    for (const trigger of handoffTriggers) {
        if (trigger.condition(message, context))
            return trigger;
    }
    return null;
}
function isUrgentRequest(message) {
    const urgentKeywords = ['urgente', 'emergência', 'importante', 'crítico'];
    return urgentKeywords.some((kw) => message.toLowerCase().includes(kw));
}
function extractIntent(message) {
    const lower = message.toLowerCase();
    if (lower.includes('agendar') || lower.includes('marcar'))
        return 'schedule';
    if (lower.includes('remarcar') || lower.includes('alterar'))
        return 'reschedule';
    if (lower.includes('cancelar') || lower.includes('desmarcar'))
        return 'cancel';
    if (lower.includes('listar') || lower.includes('ver reuniões'))
        return 'list';
    if (lower.includes('disponibilidade') || lower.includes('horários'))
        return 'check_availability';
    if (lower.includes('tchau') || lower.includes('obrigado'))
        return 'goodbye';
    if (lower.includes('histórico') ||
        lower.includes('o que a gente já conversou') ||
        lower.includes('me mostre o histórico') ||
        lower.includes('resuma nossa conversa'))
        return 'history';
    return 'general';
}
//# sourceMappingURL=sdr-agent.js.map