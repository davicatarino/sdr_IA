import { SDRContext } from '../types/index.js';
export declare function getContextByThreadId(threadId: string): Promise<SDRContext | null>;
export declare function saveContextByThreadId(threadId: string, context: SDRContext): Promise<void>;
export declare function getOrCreateSession(threadId: string, userId: string): import("../threads/LeadSession.js").LeadSession;
//# sourceMappingURL=thread-context.d.ts.map