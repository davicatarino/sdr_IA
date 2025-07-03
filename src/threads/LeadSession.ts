export type Message = {
  role: 'user' | 'assistant' | 'human';
  content: string;
  timestamp: string;
};

export class LeadSession {
  threadId: string;
  userId: string;
  history: Message[];
  state: Record<string, any>;
  currentAgent: string;

  constructor(threadId: string, userId: string) {
    this.threadId = threadId;
    this.userId = userId;
    this.history = [];
    this.state = {};
    this.currentAgent = 'sdr';
  }

  addMessage(role: Message['role'], content: string) {
    this.history.push({
      role,
      content,
      timestamp: new Date().toISOString(),
    });
  }

  handoffTo(agent: string) {
    this.currentAgent = agent;
  }

  handoffBack() {
    this.currentAgent = 'sdr';
  }

  getLastNMessages(n: number = 12): Message[] {
    return this.history.slice(-n);
  }
} 