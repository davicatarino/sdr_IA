import { LeadSession } from './LeadSession.js';

export class ThreadsManager {
  private threads: Map<string, LeadSession>;

  constructor() {
    this.threads = new Map();
  }

  getOrCreate(threadId: string, userId: string): LeadSession {
    if (!this.threads.has(threadId)) {
      this.threads.set(threadId, new LeadSession(threadId, userId));
    }
    return this.threads.get(threadId)!;
  }
} 