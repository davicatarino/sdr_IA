import { Agent } from '@openai/agents';
import { SDRResponse } from '../types/index.js';
export declare const sdrAgent: Agent<unknown, "text">;
export declare function processUserMessage(threadId: any, userId: any, message: any, messageType?: any): Promise<SDRResponse>;
//# sourceMappingURL=sdr-agent.d.ts.map