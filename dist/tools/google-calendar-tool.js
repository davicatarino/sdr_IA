import { tool } from '@openai/agents';
import { z } from 'zod';
import { google } from 'googleapis';
import { config } from '../utils/config.js';
const auth = new google.auth.OAuth2(config.googleClientId, config.googleClientSecret);
const calendar = google.calendar({ version: 'v3', auth });
const GoogleCalendarParams = z.object({
    action: z.enum(['schedule', 'reschedule', 'cancel', 'list', 'check_availability']),
    eventId: z.union([z.string(), z.null()]).optional(),
    summary: z.union([z.string(), z.null()]).optional(),
    description: z.union([z.string(), z.null()]).optional(),
    startDateTime: z.union([z.string(), z.null()]).optional(),
    endDateTime: z.union([z.string(), z.null()]).optional(),
    attendees: z.union([z.array(z.string()), z.null()]).optional(),
    duration: z.union([z.number(), z.null()]).optional(),
    timeZone: z.union([z.string(), z.null()]).optional(),
});
export const googleCalendarTool = tool({
    name: 'google_calendar',
    description: 'Agenda, busca, modifica ou cancela reuniões no Google Calendar',
    parameters: GoogleCalendarParams,
    async execute(args) {
        const { action, eventId, summary, description, startDateTime, endDateTime, attendees, duration, timeZone = 'America/Sao_Paulo' } = args;
        try {
            switch (action) {
                case 'schedule':
                    return await scheduleMeeting({
                        summary: summary || undefined,
                        description: description || undefined,
                        startDateTime: startDateTime || undefined,
                        endDateTime: endDateTime || undefined,
                        attendees: attendees || undefined,
                        duration: duration || undefined,
                        timeZone: timeZone || 'America/Sao_Paulo'
                    });
                case 'reschedule':
                    return await rescheduleMeeting(eventId, {
                        startDateTime: startDateTime || undefined,
                        endDateTime: endDateTime || undefined,
                        timeZone: timeZone || 'America/Sao_Paulo'
                    });
                case 'cancel':
                    return await cancelMeeting(eventId);
                case 'list':
                    return await listMeetings();
                case 'check_availability':
                    return await checkAvailability(startDateTime || null, endDateTime || null, timeZone || null);
                default:
                    throw new Error(`Ação não suportada: ${action}`);
            }
        }
        catch (error) {
            console.error('Erro na ferramenta Google Calendar:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido',
                action
            };
        }
    }
});
async function scheduleMeeting(params) {
    const { summary, description, startDateTime, endDateTime, attendees, duration, timeZone } = params;
    if (!summary || !startDateTime || !timeZone) {
        return {
            success: false,
            message: 'Título, data/hora de início e fuso horário são obrigatórios'
        };
    }
    const start = new Date(startDateTime);
    const end = endDateTime ? new Date(endDateTime) : new Date(start.getTime() + (duration || 60) * 60000);
    const event = {
        summary,
        description: description || undefined,
        start: {
            dateTime: start.toISOString(),
            timeZone
        },
        end: {
            dateTime: end.toISOString(),
            timeZone
        },
        attendees: attendees?.map(email => ({ email })) || undefined,
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 24 * 60 },
                { method: 'popup', minutes: 15 }
            ]
        }
    };
    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
            sendUpdates: 'all'
        });
        return {
            success: true,
            eventId: response.data.id || undefined,
            message: `Reunião "${summary}" agendada para ${formatDateTime(start)}`,
            requiresConfirmation: false
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Erro ao agendar reunião: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        };
    }
}
async function rescheduleMeeting(eventId, params) {
    const { startDateTime, endDateTime, timeZone } = params;
    if (!startDateTime || !timeZone) {
        return {
            success: false,
            message: 'Nova data/hora de início e fuso horário são obrigatórios'
        };
    }
    try {
        const currentEvent = await calendar.events.get({
            calendarId: 'primary',
            eventId
        });
        if (!currentEvent.data) {
            return {
                success: false,
                message: 'Evento não encontrado'
            };
        }
        const newStart = new Date(startDateTime);
        const duration = currentEvent.data.end?.dateTime && currentEvent.data.start?.dateTime
            ? new Date(currentEvent.data.end.dateTime).getTime() - new Date(currentEvent.data.start.dateTime).getTime()
            : 60 * 60000;
        const newEnd = endDateTime ? new Date(endDateTime) : new Date(newStart.getTime() + duration);
        const updatedEvent = {
            summary: currentEvent.data.summary || '',
            start: {
                dateTime: newStart.toISOString(),
                timeZone
            },
            end: {
                dateTime: newEnd.toISOString(),
                timeZone
            }
        };
        const response = await calendar.events.update({
            calendarId: 'primary',
            eventId,
            requestBody: updatedEvent,
            sendUpdates: 'all'
        });
        return {
            success: true,
            eventId: response.data.id || undefined,
            message: `Reunião remarcada para ${formatDateTime(newStart)}`,
            requiresConfirmation: false
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Erro ao remarcar reunião: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        };
    }
}
async function cancelMeeting(eventId) {
    try {
        await calendar.events.delete({
            calendarId: 'primary',
            eventId,
            sendUpdates: 'all'
        });
        return {
            success: true,
            message: 'Reunião cancelada com sucesso',
            requiresConfirmation: false
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Erro ao cancelar reunião: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        };
    }
}
async function listMeetings() {
    try {
        const now = new Date();
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: now.toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime'
        });
        const events = response.data.items || [];
        return {
            success: true,
            message: `Encontradas ${events.length} reuniões futuras`,
            requiresConfirmation: false
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Erro ao listar reuniões: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        };
    }
}
async function checkAvailability(startDateTime, endDateTime, timeZone) {
    if (!startDateTime || !endDateTime || !timeZone) {
        return {
            success: false,
            message: 'Data/hora de início, fim e fuso horário são obrigatórios'
        };
    }
    try {
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);
        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: start.toISOString(),
                timeMax: end.toISOString(),
                items: [{ id: 'primary' }]
            }
        });
        const busy = response.data.calendars?.primary?.busy || [];
        const availableSlots = [];
        let currentTime = new Date(start);
        while (currentTime < end) {
            const slotEnd = new Date(currentTime.getTime() + 60 * 60000);
            const isBusy = busy.some(busyPeriod => {
                const busyStart = new Date(busyPeriod.start || '');
                const busyEnd = new Date(busyPeriod.end || '');
                return currentTime < busyEnd && slotEnd > busyStart;
            });
            availableSlots.push({
                start: currentTime.toISOString(),
                end: slotEnd.toISOString(),
                available: !isBusy
            });
            currentTime = slotEnd;
        }
        return {
            success: true,
            message: `Verificação de disponibilidade concluída`,
            suggestedSlots: availableSlots,
            requiresConfirmation: false
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Erro ao verificar disponibilidade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        };
    }
}
function formatDateTime(date) {
    return date.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
//# sourceMappingURL=google-calendar-tool.js.map