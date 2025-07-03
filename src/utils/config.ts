import dotenv from 'dotenv';
import { AppConfig } from '../types/index.js';

// Carrega variáveis de ambiente
dotenv.config();

/**
 * Configuração da aplicação baseada em variáveis de ambiente
 */
export const config: AppConfig = {
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
  port: parseInt(process.env.PORT || '3000', 10),
  environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  businessHours: {
    start: process.env.BUSINESS_HOURS_START || '08:00',
    end: process.env.BUSINESS_HOURS_END || '18:00',
    days: (process.env.BUSINESS_DAYS || '1,2,3,4,5').split(',').map(Number),
  },
  maxRescheduleAttempts: parseInt(process.env.MAX_RESCHEDULE_ATTEMPTS || '3', 10),
};

/**
 * Valida se a configuração está completa
 */
export function validateConfig(): void {
  const requiredKeys = [
    'OPENAI_API_KEY',
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_VERIFY_TOKEN',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REFRESH_TOKEN',
  ];

  const missingKeys = requiredKeys.filter(key => !process.env[key]);
  
  if (missingKeys.length > 0) {
    throw new Error(
      `Configuração incompleta. Chaves obrigatórias ausentes: ${missingKeys.join(', ')}`
    );
  }
}

/**
 * Configura o OpenAI API key globalmente
 */
export function setupOpenAI(): void {
  if (config.openaiApiKey) {
    console.log('✅ OpenAI API configurada');
  }
}

/**
 * Verifica se está dentro do horário comercial
 */
export function isBusinessHours(date: Date = new Date()): boolean {
  const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Segunda, etc.
  const hour = date.getHours();
  const minute = date.getMinutes();
  const currentTime = hour * 60 + minute;
  
  const [startHour, startMinute] = config.businessHours.start.split(':').map(Number);
  const [endHour, endMinute] = config.businessHours.end.split(':').map(Number);
  
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;
  
  return config.businessHours.days.includes(dayOfWeek) && 
         currentTime >= startTime && 
         currentTime <= endTime;
}

/**
 * Obtém configuração de tracing
 */
export function getTracingConfig() {
  return {
    enabled: !!process.env.OPENAI_TRACING_API_KEY,
    apiKey: process.env.OPENAI_TRACING_API_KEY,
    exportInterval: 5000, // 5 segundos
  };
}

/**
 * Obtém configuração do webhook
 */
export function getWebhookConfig() {
  return {
    url: process.env.WEBHOOK_URL || `http://localhost:${config.port}/webhook`,
    verifyToken: config.whatsappVerifyToken,
  };
} 