import { Agent } from '@openai/agents';
import { SDRResponse } from '../types/index.js';
import { z } from 'zod';
export declare const agendarTool: import("@openai/agents").FunctionTool<unknown, z.ZodObject<{
    nome: z.ZodString;
    email: z.ZodString;
    startDateTime: z.ZodString;
    endDateTime: z.ZodString;
    threadId: z.ZodString;
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    threadId: string;
    startDateTime: string;
    endDateTime: string;
    email: string;
    nome: string;
}, {
    userId: string;
    threadId: string;
    startDateTime: string;
    endDateTime: string;
    email: string;
    nome: string;
}>, string>;
export declare const cancelarTool: import("@openai/agents").FunctionTool<unknown, z.ZodObject<{
    threadId: z.ZodString;
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    threadId: string;
}, {
    userId: string;
    threadId: string;
}>, string>;
export declare const verificarDisponibilidadeTool: import("@openai/agents").FunctionTool<unknown, z.ZodObject<{
    startDateTime: z.ZodString;
    endDateTime: z.ZodString;
    timeZone: z.ZodString;
    threadId: z.ZodString;
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    threadId: string;
    startDateTime: string;
    endDateTime: string;
    timeZone: string;
}, {
    userId: string;
    threadId: string;
    startDateTime: string;
    endDateTime: string;
    timeZone: string;
}>, string>;
export declare const sdrAgent: Agent<unknown, "text">;
export declare function processUserMessage(threadId: string, userId: string, message: string, messageType?: string): Promise<SDRResponse>;
//# sourceMappingURL=sdr-agent.d.ts.map