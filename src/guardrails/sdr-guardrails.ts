import { defineOutputGuardrail } from '@openai/agents';
import { z } from 'zod';
import { SDRContext } from '../types';
import { config, isBusinessHours } from '../utils/config';

/**
 * Guardrail para validar horário comercial
 */
export const businessHoursGuardrail = defineOutputGuardrail({
  name: 'horario_comercial',
  description: 'Valida se a ação está sendo executada dentro do horário comercial',
  schema: z.object({
    dentro_horario: z.boolean().refine(val => val, 'Ação fora do horário comercial'),
    horario_atual: z.string(),
    horario_permitido: z.string()
  }),
  validate: async (output) => {
    const now = new Date();
    const dentroHorario = isBusinessHours(now);
    
    return {
      dentro_horario: dentroHorario,
      horario_atual: now.toLocaleTimeString('pt-BR'),
      horario_permitido: `${config.businessHours.start} às ${config.businessHours.end}`
    };
  }
});

/**
 * Guardrail para validar confirmações de agendamento
 */
export const confirmationGuardrail = defineOutputGuardrail({
  name: 'confirmacao_agendamento',
  description: 'Valida se o agendamento foi confirmado pelo usuário',
  schema: z.object({
    confirmado: z.boolean().refine(val => val, 'Agendamento não confirmado'),
    detalhes_completos: z.boolean().refine(val => val, 'Detalhes incompletos'),
    horario_valido: z.boolean().refine(val => val, 'Horário inválido')
  }),
  validate: async (output) => {
    const { summary, startDateTime, endDateTime } = output;
    
    return {
      confirmado: output.confirmed === true,
      detalhes_completos: !!(summary && startDateTime && endDateTime),
      horario_valido: startDateTime && endDateTime && new Date(startDateTime) < new Date(endDateTime)
    };
  }
});

/**
 * Guardrail para limitar tentativas de remarcação
 */
export const rescheduleLimitGuardrail = defineOutputGuardrail({
  name: 'limite_remarcacao',
  description: 'Valida se não excedeu o limite de tentativas de remarcação',
  schema: z.object({
    dentro_limite: z.boolean().refine(val => val, 'Limite de remarcações excedido'),
    tentativas_atual: z.number(),
    limite_maximo: z.number()
  }),
  validate: async (output, context: SDRContext) => {
    const tentativasAtual = context.rescheduleAttempts || 0;
    const dentroLimite = tentativasAtual < config.maxRescheduleAttempts;
    
    return {
      dentro_limite: dentroLimite,
      tentativas_atual: tentativasAtual,
      limite_maximo: config.maxRescheduleAttempts
    };
  }
});

/**
 * Guardrail para validar dados sensíveis
 */
export const sensitiveDataGuardrail = defineOutputGuardrail({
  name: 'dados_sensiveis',
  description: 'Valida se não há dados sensíveis sendo expostos',
  schema: z.object({
    sem_dados_sensiveis: z.boolean().refine(val => val, 'Dados sensíveis detectados'),
    tipo_conteudo: z.string(),
    nivel_seguranca: z.enum(['baixo', 'medio', 'alto'])
  }),
  validate: async (output) => {
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
});

/**
 * Guardrail para validar duração de reuniões
 */
export const meetingDurationGuardrail = defineOutputGuardrail({
  name: 'duracao_reuniao',
  description: 'Valida se a duração da reunião está dentro dos limites aceitáveis',
  schema: z.object({
    duracao_valida: z.boolean().refine(val => val, 'Duração inválida'),
    duracao_minutos: z.number(),
    duracao_maxima: z.number()
  }),
  validate: async (output) => {
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
});

/**
 * Guardrail para validar participantes
 */
export const attendeesGuardrail = defineOutputGuardrail({
  name: 'participantes',
  description: 'Valida se os participantes da reunião são válidos',
  schema: z.object({
    participantes_validos: z.boolean().refine(val => val, 'Participantes inválidos'),
    quantidade_participantes: z.number(),
    limite_maximo: z.number()
  }),
  validate: async (output) => {
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
});

/**
 * Guardrail para detectar intenção de handoff
 */
export const handoffDetectionGuardrail = defineOutputGuardrail({
  name: 'detecao_handoff',
  description: 'Detecta se o usuário quer falar com humano',
  schema: z.object({
    precisa_handoff: z.boolean(),
    motivo: z.string().optional(),
    urgencia: z.enum(['baixa', 'media', 'alta', 'critica'])
  }),
  validate: async (output, context: SDRContext) => {
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
}); 