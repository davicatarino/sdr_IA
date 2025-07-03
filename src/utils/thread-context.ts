import { pool } from './mysql.js';
import { SDRContext } from '../types/index.js';

export async function getContextByThreadId(threadId: string): Promise<SDRContext | null> {
  const [rows]: any = await pool.query('SELECT context FROM leads WHERE external_id = ?', [threadId]);
  if (Array.isArray(rows) && rows.length > 0 && rows[0].context) {
    return JSON.parse(rows[0].context);
  }
  return null;
}

export async function saveContextByThreadId(threadId: string, context: SDRContext): Promise<void> {
  const contextStr = JSON.stringify(context);
  await pool.query('UPDATE leads SET context = ? WHERE external_id = ?', [contextStr, threadId]);
} 