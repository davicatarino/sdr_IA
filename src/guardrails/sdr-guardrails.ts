import { z } from 'zod';
import { SDRContext } from '../types/index.js';
import { config, isBusinessHours } from '../utils/config.js';

/**
 * Guardrail para validar horário comercial
 */
export const businessHoursGuardrail = {
  name: 'horario_comercial',
  validate: async (output: any) => {
    const now = new Date();
    const dentroHorario = isBusinessHours(now);
    
    return {
      dentro_horario: dentroHorario,
      horario_atual: now.toLocaleTimeString('pt-BR'),
      horario_permitido: `${config.businessHours.start} às ${config.businessHours.end}`
    };
  }
};

/**
 * Guardrail para validar confirmações de agendamento
 */
export const confirmationGuardrail = {
  name: 'confirmacao_agendamento',
  validate: async (output: any) => {
    const { summary, startDateTime, endDateTime } = output;
    
    return {
      confirmado: output.confirmed === true,
      detalhes_completos: !!(summary && startDateTime && endDateTime),
      horario_valido: startDateTime && endDateTime && new Date(startDateTime) < new Date(endDateTime)
    };
  }
};

/**
 * Guardrail para limitar tentativas de remarcação
 */
export const rescheduleLimitGuardrail = {
  name: 'limite_remarcacao',
  validate: async (output: any, context: SDRContext) => {
    const tentativasAtual = context.rescheduleAttempts || 0;
    const dentroLimite = tentativasAtual < config.maxRescheduleAttempts;
    
    return {
      dentro_limite: dentroLimite,
      tentativas_atual: tentativasAtual,
      limite_maximo: config.maxRescheduleAttempts
    };
  }
};

/**
 * Guardrail para validar dados sensíveis
 */
export const sensitiveDataGuardrail = {
  name: 'dados_sensiveis',
  validate: async (output: any) => {
    const content = JSON.stringify(output);
    const sensitivePatterns = [
      /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/, // CPF
      /\b\d{14}\b/, // CNPJ
      /\b\d{4}\s\d{4}\s\d{4}\s\d{4}\b/, // Cartão de crédito
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email
    ];
    
    const hasSensitiveData = sensitivePatterns.some(pattern => pattern.test(content));
    
    return {
      sem_dados_sensiveis: !hasSensitiveData,
      tipo_conteudo: 'agendamento',
      nivel_seguranca: hasSensitiveData ? 'alto' : 'baixo'
    };
  }
};

/**
 * Guardrail para validar duração de reuniões
 */
export const meetingDurationGuardrail = {
  name: 'duracao_reuniao',
  validate: async (output: any) => {
    const { startDateTime, endDateTime } = output;
    
    if (!startDateTime || !endDateTime) {
      return {
        duracao_valida: false,
        duracao_minutos: 0,
        duracao_maxima: 480 // 8 horas
      };
    }
    
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    
    const duracaoValida = durationMinutes > 0 && durationMinutes <= 480; // Máximo 8 horas
    
    return {
      duracao_valida: duracaoValida,
      duracao_minutos: Math.round(durationMinutes),
      duracao_maxima: 480
    };
  }
};

/**
 * Guardrail para validar participantes
 */
export const attendeesGuardrail = {
  name: 'participantes',
  validate: async (output: any) => {
    const attendees = output.attendees || [];
    const quantidadeParticipantes = attendees.length;
    const limiteMaximo = 50; // Limite do Google Calendar
    const participantesValidos = quantidadeParticipantes <= limiteMaximo;
    
    return {
      participantes_validos: participantesValidos,
      quantidade_participantes: quantidadeParticipantes,
      limite_maximo: limiteMaximo
    };
  }
};

/**
 * Guardrail para detectar intenção de handoff
 */
export const handoffDetectionGuardrail = {
  name: 'detecao_handoff',
  validate: async (output: any, context: SDRContext) => {
    const lastMessage = context.conversationHistory[context.conversationHistory.length - 1]?.content || '';
    const lowerMessage = lastMessage.toLowerCase();
    
    const handoffKeywords = {
      critica: ['emergência', 'urgente', 'problema crítico'],
      alta: ['falar com humano', 'atendente', 'pessoa', 'reclamação'],
      media: ['não entendi', 'confuso', 'dúvida'],
      baixa: ['obrigado', 'valeu', 'tchau']
    };
    
    let urgencia: 'baixa' | 'media' | 'alta' | 'critica' = 'baixa';
    let motivo = '';
    
    for (const [level, keywords] of Object.entries(handoffKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        urgencia = level as any;
        motivo = keywords.find(keyword => lowerMessage.includes(keyword)) || '';
        break;
      }
    }
    
    const precisaHandoff = urgencia !== 'baixa';
    
    return {
      precisa_handoff: precisaHandoff,
      motivo: motivo,
      urgencia: urgencia
    };
  }
}; 