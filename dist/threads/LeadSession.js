export class LeadSession {
    constructor(threadId, userId) {
        this.threadId = threadId;
        this.userId = userId;
        this.history = [];
        this.state = {};
        this.currentAgent = 'sdr';
    }
    addMessage(role, content) {
        this.history.push({
            role,
            content,
            timestamp: new Date().toISOString(),
        });
    }
    handoffTo(agent) {
        this.currentAgent = agent;
    }
    handoffBack() {
        this.currentAgent = 'sdr';
    }
    getLastNMessages(n = 12) {
        return this.history.slice(-n);
    }
}
//# sourceMappingURL=LeadSession.js.map