export type Message = {
    role: 'user' | 'assistant' | 'human';
    content: string;
    timestamp: string;
};
export declare class LeadSession {
    threadId: string;
    userId: string;
    history: Message[];
    state: Record<string, any>;
    currentAgent: string;
    constructor(threadId: string, userId: string);
    addMessage(role: Message['role'], content: string): void;
    handoffTo(agent: string): void;
    handoffBack(): void;
    getLastNMessages(n?: number): Message[];
}
//# sourceMappingURL=LeadSession.d.ts.map