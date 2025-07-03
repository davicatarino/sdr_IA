import { pool } from './mysql.js';

interface MeetingParams {
  threadId: string;
  userId: string;
  eventId: string;
  summary: string;
  startTime: Date;
  endTime: Date;
}

export async function addMeetingToMySQL({ threadId, userId, eventId, summary, startTime, endTime }: MeetingParams) {
  console.log('[MYSQL] Salvando reunião:', { threadId, userId, eventId, summary, startTime, endTime });
  await pool.query(
    'INSERT INTO meetings (thread_id, user_id, event_id, summary, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)',
    [threadId, userId, eventId, summary, startTime, endTime]
  );
  console.log('[MYSQL] Reunião salva com sucesso!');
}

export async function getMeetingEventIdByThread(threadId: string, userId: string): Promise<string | null> {
  const [rows]: any = await pool.query(
    'SELECT event_id FROM meetings WHERE thread_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1',
    [threadId, userId]
  );
  if (rows && rows.length > 0) {
    return rows[0].event_id;
  }
  return null;
} 