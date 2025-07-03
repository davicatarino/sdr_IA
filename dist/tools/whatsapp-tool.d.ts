/// <reference types="node" />
import { z } from 'zod';
export declare const whatsappTool: import("@openai/agents").FunctionTool<unknown, z.ZodObject<{
    phoneNumber: z.ZodString;
    message: z.ZodString;
    messageType: z.ZodOptional<z.ZodUnion<[z.ZodEnum<["text", "confirmation", "options"]>, z.ZodNull]>>;
    options: z.ZodOptional<z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodNull]>>;
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