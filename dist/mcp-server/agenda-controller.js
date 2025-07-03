import express from 'express';
import { scheduleMeeting, cancelMeeting, listMeetings, checkAvailability } from '../tools/google-calendar-tool.js';
const router = express.Router();
router.post('/agendar', async (req, res) => {
    console.log('[MCP] Recebida requisição de agendamento:', req.body);
    const result = await scheduleMeeting(req.body);
    console.log('[MCP] Resultado do agendamento:', result);
    res.json(result);
});
router.post('/cancelar', async (req, res) => {
    console.log('[MCP] Recebida requisição de cancelamento:', req.body);
    const result = await cancelMeeting(req.body.eventId);
    console.log('[MCP] Resultado do cancelamento:', result);
    res.json(result);
});
router.get('/listar', async (req, res) => {
    console.log('[MCP] Recebida requisição de listagem de reuniões');
    const result = await listMeetings();
    console.log('[MCP] Resultado da listagem:', result);
    res.json(result);
});
router.post('/disponibilidade', async (req, res) => {
    console.log('[MCP] Recebida requisição de verificação de disponibilidade:', req.body);
    const { startDateTime, endDateTime, timeZone } = req.body;
    const result = await checkAvailability(startDateTime, endDateTime, timeZone);
    console.log('[MCP] Resultado da disponibilidade:', result);
    res.json({
        success: result.success,
        suggestedSlots: result.suggestedSlots || [],
        message: result.message || (result.success ? 'Horário verificado com sucesso.' : 'Falha ao verificar disponibilidade.')
    });
});
export default router;
//# sourceMappingURL=agenda-controller.js.map