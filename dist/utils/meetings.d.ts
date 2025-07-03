interface MeetingParams {
    threadId: string;
    userId: string;
    eventId: string;
    summary: string;
    startTime: Date;
    endTime: Date;
}
export declare function addMeetingToMySQL({ threadId, userId, eventId, summary, startTime, endTime }: MeetingParams): Promise<void>;
export declare function getMeetingEventIdByThread(threadId: string, userId: string): Promise<string | null>;
export {};
//# sourceMappingURL=meetings.d.ts.map