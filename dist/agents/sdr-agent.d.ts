import { Agent } from '@openai/agents';
import { SDRContext, SDRResponse } from '../types/index.js';
export declare const sdrAgent: Agent<unknown, "text">;
export declare function processUserMessage(userId: string, message: string, messageType?: 'text' | 'audio'): Promise<SDRResponse>;
export declare function updateUserContext(userId: string, updates: Partial<SDRContext>): void;
export declare function getUserContext(userId: string): SDRContext | undefined;
export declare function cleanupOldContexts(maxAgeHours?: number): void;
//# sourceMappingURL=sdr-agent.d.ts.map