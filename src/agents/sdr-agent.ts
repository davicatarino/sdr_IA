import { Agent, run, setDefaultOpenAIKey } from '@openai/agents';
import { googleCalendarTool } from '../tools/google-calendar-tool';
import { whatsappTool } from '../tools/whatsapp-tool';
import { SDRContext, SDRResponse, HandoffTrigger } from '../types';
import { config, isBusinessHours } from '../utils/config';

/**
 * Agente SDR principal para agendamento de reuniões via WhatsApp
 */
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

/**
 * Contexto do usuário para manter histórico e preferências
 */
const userContexts = new Map<string, SDRContext>();

/**
 * Triggers para handoff para humano
 */
const handoffTriggers: HandoffTrigger[] = [
  {
    condition: (input: string) => 
      input.toLowerCase().includes('falar com humano') || 
      input.toLowerCase().includes('atendente') ||
      input.toLowerCase().includes('pessoa'),
    priority: 'high',
    message: 'Cliente solicitou falar com humano'
  },
  {
    condition: (input: string) => 
      input.toLowerCase().includes('reclamação') || 
      input.toLowerCase().includes('problema') ||
      input.toLowerCase().includes('insatisfeito'),
    priority: 'medium',
    message: 'Cliente com reclamação detectada'
  },
  {
    condition: (input: string, context: SDRContext) => 
      context.rescheduleAttempts >= config.maxRescheduleAttempts,
    priority: 'high',
    message: 'Máximo de tentativas de remarcação atingido'
  }
];

/**
 * Processa mensagem do usuário e retorna resposta
 */
export async function processUserMessage(
  userId: string,
  message: string,
  messageType: 'text' | 'audio' = 'text'
): Promise<SDRResponse> {
  try {
    // Obtém ou cria contexto do usuário
    let context = userContexts.get(userId);
    if (!context) {
      context = createUserContext(userId);
      userContexts.set(userId, context);
    }

    // Atualiza contexto
    context.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Verifica triggers de handoff
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

    // Verifica horário comercial
    if (!isBusinessHours() && !isUrgentRequest(message)) {
      return {
        message: `Olá! Estamos fora do horário comercial (${config.businessHours.start} às ${config.businessHours.end}, dias úteis). Deixe sua mensagem e retornaremos no próximo dia útil.`,
        type: 'text'
      };
    }

    // Executa o agente
    const result = await run(sdrAgent, message, {
      context: {
        userId,
        messageType,
        userContext: context,
        businessHours: config.businessHours
      }
    });

    // Atualiza contexto com a resposta
    context.conversationHistory.push({
      role: 'assistant',
      content: result.finalOutput || '',
      timestamp: new Date()
    });

    // Atualiza última interação
    context.lastInteraction = new Date();

    return {
      message: result.finalOutput || '',
      type: 'text',
      metadata: {
        intent: extractIntent(message),
        confidence: 0.9
      }
    };

  } catch (error) {
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

/**
 * Cria contexto inicial para um usuário
 */
function createUserContext(userId: string): SDRContext {
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

/**
 * Verifica se há triggers de handoff
 */
function checkHandoffTriggers(message: string, context: SDRContext): HandoffTrigger | null {
  for (const trigger of handoffTriggers) {
    if (trigger.condition(message, context)) {
      return trigger;
    }
  }
  return null;
}

/**
 * Verifica se é uma solicitação urgente
 */
function isUrgentRequest(message: string): boolean {
  const urgentKeywords = ['urgente', 'emergência', 'importante', 'crítico'];
  return urgentKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
}

/**
 * Extrai intent da mensagem
 */
function extractIntent(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('agendar') || lowerMessage.includes('marcar')) {
    return 'schedule';
  }
  if (lowerMessage.includes('remarcar') || lowerMessage.includes('alterar')) {
    return 'reschedule';
  }
  if (lowerMessage.includes('cancelar') || lowerMessage.includes('desmarcar')) {
    return 'cancel';
  }
  if (lowerMessage.includes('listar') || lowerMessage.includes('ver') || lowerMessage.includes('mostrar')) {
    return 'list';
  }
  if (lowerMessage.includes('disponível') || lowerMessage.includes('horário')) {
    return 'check_availability';
  }
  
  return 'general';
}

/**
 * Atualiza contexto do usuário após ação
 */
export function updateUserContext(userId: string, updates: Partial<SDRContext>): void {
  const context = userContexts.get(userId);
  if (context) {
    Object.assign(context, updates);
    userContexts.set(userId, context);
  }
}

/**
 * Obtém contexto do usuário
 */
export function getUserContext(userId: string): SDRContext | undefined {
  return userContexts.get(userId);
}

/**
 * Limpa contexto antigo (para manutenção)
 */
export function cleanupOldContexts(maxAgeHours: number = 24): void {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
  
  for (const [userId, context] of userContexts.entries()) {
    if (context.lastInteraction < cutoff) {
      userContexts.delete(userId);
    }
  }
} 