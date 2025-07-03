import { z } from 'zod';

// Tipos básicos para agentes
export interface AgentConfig {
  name: string;
  instructions: string;
  tools?: any[];
  model?: string;
}

// Tipos para WhatsApp
export interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: string;
  type: 'text' | 'audio' | 'document' | 'image';
  text?: {
    body: string;
  };
  audio?: {
    id: string;
    mime_type: string;
  };
  document?: {
    id: string;
    filename: string;
    mime_type: string;
  };
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: WhatsAppMessage[];
      };
      field: string;
    }>;
  }>;
}

// Tipos para Google Calendar
export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

export interface AvailableSlot {
  start: string;
  end: string;
  available: boolean;
}

// Tipos para o Agente SDR
export interface SDRContext {
  userId: string;
  userName?: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  currentIntent?: string;
  scheduledMeetings: CalendarEvent[];
  rescheduleAttempts: number;
  lastInteraction: Date;
  preferences?: {
    preferredTimeSlots?: string[];
    preferredDuration?: number;
    notes?: string;
  };
}

export interface SDRResponse {
  message: string;
  type: 'text' | 'confirmation' | 'options' | 'handoff';
  metadata?: {
    intent?: string;
    confidence?: number;
    requiresConfirmation?: boolean;
    suggestedActions?: string[];
  };
}

// Tipos para Tools
export interface ToolConfig {
  name: string;
  description: string;
  parameters: z.ZodSchema;
  execute: (args: any) => Promise<any>;
}

// Tipos para Guardrails
export interface GuardrailConfig {
  name: string;
  validate: (input: any, context: SDRContext) => Promise<boolean>;
  message?: string;
  action?: 'block' | 'warn' | 'handoff';
}

// Tipos para Handoffs
export interface HandoffTrigger {
  condition: (input: string, context: SDRContext) => boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata?: Record<string, any>;
}

// Tipos para configuração da aplicação
export interface AppConfig {
  openaiApiKey: string;
  whatsappAccessToken: string;
  whatsappPhoneNumberId: string;
  whatsappVerifyToken: string;
  googleClientId: string;
  googleClientSecret: string;
  googleRefreshToken: string;
  port: number;
  environment: 'development' | 'production' | 'test';
  businessHours: {
    start: string;
    end: string;
    days: number[];
  };
  maxRescheduleAttempts: number;
}

// Tipos para resultados de execução
export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  metadata?: Record<string, any>;
}

// Tipos para agentes em tempo real
export interface RealtimeAgentConfig extends AgentConfig {
  voiceEnabled?: boolean;
  audioFormat?: string;
  interruptionDetection?: boolean;
}

// Tipos para validação de entrada
export const InputValidationSchema = z.object({
  message: z.string().min(1, 'Mensagem não pode estar vazia'),
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
  messageType: z.enum(['text', 'audio']),
  timestamp: z.date().optional().nullable(),
});

export type InputValidation = z.infer<typeof InputValidationSchema>;

// Tipos para respostas padronizadas
export interface ResponseTemplate {
  id: string;
  type: 'greeting' | 'confirmation' | 'options' | 'error' | 'handoff' | 'text';
  template: string;
  variables?: string[];
  conditions?: {
    intent?: string[];
    timeOfDay?: string[];
    userType?: string[];
  };
}

// Tipos para análise de sentimento
export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions?: string[];
  urgency?: 'low' | 'medium' | 'high';
}

// Tipos para agendamento
export interface SchedulingRequest {
  userId: string;
  preferredDate?: string;
  preferredTime?: string;
  duration?: number;
  subject?: string;
  attendees?: string[];
  notes?: string;
}

export interface SchedulingResponse {
  success: boolean;
  eventId?: string;
  message: string;
  suggestedSlots?: AvailableSlot[];
  requiresConfirmation?: boolean;
}

// Tipos para configuração de tracing
export interface TracingConfig {
  enabled: boolean;
  apiKey?: string;
  exportInterval?: number;
  processors?: string[];
} 