import { pool } from './mysql.js';
import { LeadSession } from '../threads/LeadSession.js';

export async function addMessageToHistoryMySQL(threadId: string, userId: string, role: 'user' | 'assistant', message: string) {
  await pool.query(
    'INSERT INTO conversation_history (thread_id, user_id, role, message) VALUES (?, ?, ?, ?)',
    [threadId, userId, role, message]
  );
}

export async function getHistoryByThreadIdMySQL(threadId: string, limit: number = 50) {
  const [rows] = await pool.query(
    'SELECT * FROM conversation_history WHERE thread_id = ? ORDER BY created_at ASC LIMIT ?',
    [threadId, limit]
  );
  return rows;
}

// Se necessário, adicione helpers para integração com LeadSession
// Exemplo:
// export function addSessionMessage(session: LeadSession, role: string, content: string) {
//   session.addMessage(role, content);
// } 