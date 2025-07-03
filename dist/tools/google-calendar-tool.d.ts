import { z } from 'zod';
import { SchedulingResponse } from '../types/index.js';
export declare const googleCalendarTool: import("@openai/agents").FunctionTool<unknown, z.ZodObject<{
    action: z.ZodEnum<["schedule", "reschedule", "cancel", "list", "check_availability"]>;
    eventId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    summary: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    description: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    startDateTime: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    endDateTime: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    attendees: z.ZodOptional<z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodNull]>>;
    duration: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodNull]>>;
    timeZone: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
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
declare function scheduleMeeting(params: {
    summary?: string | null;
    description?: string | null;
    startDateTime?: string | null;
    endDateTime?: string | null;
    attendees?: string[] | null;
    duration?: number | null;
    timeZone: string | null;
    threadId?: string;
    userId?: string;
}): Promise<SchedulingResponse>;
declare function cancelMeeting(eventId: string): Promise<SchedulingResponse>;
declare function listMeetings(): Promise<SchedulingResponse>;
declare function checkAvailability(startDateTime: string | null, endDateTime: string | null, timeZone: string | null): Promise<SchedulingResponse>;
export { scheduleMeeting, cancelMeeting, listMeetings, checkAvailability };
//# sourceMappingURL=google-calendar-tool.d.ts.map