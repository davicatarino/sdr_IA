import { z } from 'zod';
export declare const googleCalendarTool: import("@openai/agents").FunctionTool<unknown, z.ZodObject<{
    action: z.ZodEnum<["schedule", "reschedule", "cancel", "list", "check_availability"]>;
    eventId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    summary: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    startDateTime: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    endDateTime: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    attendees: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    duration: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    timeZone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    action: "schedule" | "reschedule" | "cancel" | "list" | "check_availability";
    eventId?: string | null | undefined;
    summary?: string | null | undefined;
    description?: string | null | undefined;
    startDateTime?: string | null | undefined;
    endDateTime?: string | null | undefined;
    attendees?: string[] | null | undefined;
    duration?: number | null | undefined;
    timeZone?: string | null | undefined;
}, {
    action: "schedule" | "reschedule" | "cancel" | "list" | "check_availability";
    eventId?: string | null | undefined;
    summary?: string | null | undefined;
    description?: string | null | undefined;
    startDateTime?: string | null | undefined;
    endDateTime?: string | null | undefined;
    attendees?: string[] | null | undefined;
    duration?: number | null | undefined;
    timeZone?: string | null | undefined;
}>, string>;
//# sourceMappingURL=google-calendar-tool.d.ts.map