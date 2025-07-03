import { pool } from './mysql.js';
export async function addMeetingToMySQL({ threadId, userId, eventId, summary, startTime, endTime }) {
    console.log('[MYSQL] Salvando reunião:', { threadId, userId, eventId, summary, startTime, endTime });
    await pool.query('INSERT INTO meetings (thread_id, user_id, event_id, summary, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)', [threadId, userId, eventId, summary, startTime, endTime]);
    console.log('[MYSQL] Reunião salva com sucesso!');
}
export async function getMeetingEventIdByThread(threadId, userId) {
    const [rows] = await pool.query('SELECT event_id FROM meetings WHERE thread_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1', [threadId, userId]);
    if (rows && rows.length > 0) {
        return rows[0].event_id;
    }
    return null;
}
//# sourceMappingURL=meetings.js.map