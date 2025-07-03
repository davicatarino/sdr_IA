import { pool } from './mysql.js';
export async function addMessageToHistoryMySQL(threadId, userId, role, message) {
    await pool.query('INSERT INTO conversation_history (thread_id, user_id, role, message) VALUES (?, ?, ?, ?)', [threadId, userId, role, message]);
}
export async function getHistoryByThreadIdMySQL(threadId, limit = 50) {
    const [rows] = await pool.query('SELECT * FROM conversation_history WHERE thread_id = ? ORDER BY created_at ASC LIMIT ?', [threadId, limit]);
    return rows;
}
//# sourceMappingURL=history.js.map