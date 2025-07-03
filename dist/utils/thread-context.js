import { pool } from './mysql.js';
import { ThreadsManager } from '../threads/ThreadsManager.js';
const threadsManager = new ThreadsManager();
export async function getContextByThreadId(threadId) {
    const [rows] = await pool.query('SELECT context FROM leads WHERE external_id = ?', [threadId]);
    if (Array.isArray(rows) && rows.length > 0 && rows[0].context) {
        return JSON.parse(rows[0].context);
    }
    return null;
}
export async function saveContextByThreadId(threadId, context) {
    const contextStr = JSON.stringify(context);
    await pool.query('UPDATE leads SET context = ? WHERE external_id = ?', [contextStr, threadId]);
}
export function getOrCreateSession(threadId, userId) {
    return threadsManager.getOrCreate(threadId, userId);
}
//# sourceMappingURL=thread-context.js.map