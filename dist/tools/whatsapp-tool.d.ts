/// <reference types="node" />
import { z } from 'zod';
export declare const whatsappTool: import("@openai/agents").FunctionTool<unknown, z.ZodObject<{
    phoneNumber: z.ZodString;
    message: z.ZodString;
    messageType: z.ZodNullable<z.ZodOptional<z.ZodEnum<["text", "confirmation", "options"]>>>;
    options: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    phoneNumber: string;
    options?: string[] | null | undefined;
    messageType?: "text" | "confirmation" | "options" | null | undefined;
}, {
    message: string;
    phoneNumber: string;
    options?: string[] | null | undefined;
    messageType?: "text" | "confirmation" | "options" | null | undefined;
}>, string>;
export declare function downloadWhatsAppMedia(mediaId: string): Promise<Buffer>;
export declare function validatePhoneNumber(phoneNumber: string): boolean;
export declare function formatPhoneNumber(phoneNumber: string): string;
//# sourceMappingURL=whatsapp-tool.d.ts.map