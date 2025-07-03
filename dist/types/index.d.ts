import { z } from 'zod';
export interface AgentConfig {
    name: string;
    instructions: string;
    tools?: any[];
    model?: string;
}
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
export interface ToolConfig {
    name: string;
    description: string;
    parameters: z.ZodSchema;
    execute: (args: any) => Promise<any>;
}
export interface GuardrailConfig {
    name: string;
    validate: (input: any, context: SDRContext) => Promise<boolean>;
    message?: string;
    action?: 'block' | 'warn' | 'handoff';
}
export interface HandoffTrigger {
    condition: (input: string, context: SDRContext) => boolean;
    priority: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    metadata?: Record<string, any>;
}
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
export interface ExecutionResult {
    success: boolean;
    output?: string;
    error?: string;
    metadata?: Record<string, any>;
}
export interface RealtimeAgentConfig extends AgentConfig {
    voiceEnabled?: boolean;
    audioFormat?: string;
    interruptionDetection?: boolean;
}
export declare const InputValidationSchema: z.ZodObject<{
    message: z.ZodString;
    userId: z.ZodString;
    messageType: z.ZodEnum<["text", "audio"]>;
    timestamp: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    userId: string;
    messageType: "text" | "audio";
    timestamp?: Date | null | undefined;
}, {
    message: string;
    userId: string;
    messageType: "text" | "audio";
    timestamp?: Date | null | undefined;
}>;
export type InputValidation = z.infer<typeof InputValidationSchema>;
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
export interface SentimentAnalysis {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    emotions?: string[];
    urgency?: 'low' | 'medium' | 'high';
}
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
export interface TracingConfig {
    enabled: boolean;
    apiKey?: string;
    exportInterval?: number;
    processors?: string[];
}
//# sourceMappingURL=index.d.ts.map