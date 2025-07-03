import { LeadSession } from './LeadSession.js';
export class ThreadsManager {
    constructor() {
        this.threads = new Map();
    }
    getOrCreate(threadId, userId) {
        if (!this.threads.has(threadId)) {
            this.threads.set(threadId, new LeadSession(threadId, userId));
        }
        return this.threads.get(threadId);
    }
}
//# sourceMappingURL=ThreadsManager.js.map