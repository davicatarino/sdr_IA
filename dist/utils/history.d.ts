export declare function addMessageToHistoryMySQL(threadId: string, userId: string, role: 'user' | 'assistant', message: string): Promise<void>;
export declare function getHistoryByThreadIdMySQL(threadId: string, limit?: number): Promise<import("mysql2").QueryResult>;
//# sourceMappingURL=history.d.ts.map