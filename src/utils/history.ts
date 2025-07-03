import { pool } from './mysql.js';

export async function addMessageToHistory(threadId: string, userId: string, role: 'user' | 'assistant' | 'system', message: string) {
  await pool.query(
    'INSERT INTO conversation_history (thread_id, user_id, role, message) VALUES (?, ?, ?, ?)',
    [threadId, userId, role, message]
  );
}

export async function getHistoryByThreadId(threadId: string, limit = 50) {
  const [rows]: any = await pool.query(
    'SELECT role, message, created_at FROM conversation_history WHERE thread_id = ? ORDER BY created_at ASC LIMIT ?',
    [threadId, limit]
  );
  return rows;
} 