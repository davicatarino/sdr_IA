import { AppConfig } from '../types/index.js';
export declare const config: AppConfig;
export declare function validateConfig(): void;
export declare function setupOpenAI(): void;
export declare function isBusinessHours(date?: Date): boolean;
export declare function getTracingConfig(): {
    enabled: boolean;
    apiKey: string | undefined;
    exportInterval: number;
};
export declare function getWebhookConfig(): {
    url: string;
    verifyToken: string;
};
//# sourceMappingURL=config.d.ts.map