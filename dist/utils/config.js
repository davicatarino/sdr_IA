import dotenv from 'dotenv';
dotenv.config();
export const config = {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
    port: parseInt(process.env.PORT || '3000', 10),
    environment: process.env.NODE_ENV || 'development',
    businessHours: {
        start: process.env.BUSINESS_HOURS_START || '08:00',
        end: process.env.BUSINESS_HOURS_END || '18:00',
        days: (process.env.BUSINESS_DAYS || '1,2,3,4,5').split(',').map(Number),
    },
    maxRescheduleAttempts: parseInt(process.env.MAX_RESCHEDULE_ATTEMPTS || '3', 10),
};
export function validateConfig() {
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
        throw new Error(`Configuração incompleta. Chaves obrigatórias ausentes: ${missingKeys.join(', ')}`);
    }
}
export function setupOpenAI() {
    if (config.openaiApiKey) {
        console.log('✅ OpenAI API configurada');
    }
}
export function isBusinessHours(date = new Date()) {
    const dayOfWeek = date.getDay();
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
export function getTracingConfig() {
    return {
        enabled: !!process.env.OPENAI_TRACING_API_KEY,
        apiKey: process.env.OPENAI_TRACING_API_KEY,
        exportInterval: 5000,
    };
}
export function getWebhookConfig() {
    return {
        url: process.env.WEBHOOK_URL || `http://localhost:${config.port}/webhook`,
        verifyToken: config.whatsappVerifyToken,
    };
}
//# sourceMappingURL=config.js.map