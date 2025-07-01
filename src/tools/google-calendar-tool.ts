import { tool } from '@openai/agents';
import { z } from 'zod';
import { google } from 'googleapis';
import { CalendarEvent, AvailableSlot, SchedulingRequest, SchedulingResponse } from '../types';
import { config } from '../utils/config';

// Configuração do Google Calendar
const oauth2Client = new google.auth.OAuth2(
  config.googleClientId,
  config.googleClientSecret,
  process.env.GOOGLE_REDIRECT_URI
);

// Configurar refresh token
oauth2Client.setCredentials({
  refresh_token: config.googleRefreshToken,
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

/**
 * Ferramenta para agendar reuniões no Google Calendar
 */
export const googleCalendarTool = tool({
  name: 'google_calendar',
  description: 'Agenda, busca, modifica ou cancela reuniões no Google Calendar',
  parameters: z.object({
    action: z.enum(['schedule', 'reschedule', 'cancel', 'list', 'check_availability']).describe('Ação a ser executada'),
    eventId: z.string().optional().describe('ID do evento (para reschedule/cancel)'),
    summary: z.string().optional().describe('Título da reunião'),
    description: z.string().optional().describe('Descrição da reunião'),
    startDateTime: z.string().optional().describe('Data e hora de início (ISO 8601)'),
    endDateTime: z.string().optional().describe('Data e hora de fim (ISO 8601)'),
    attendees: z.array(z.string()).optional().describe('Lista de emails dos participantes'),
    duration: z.number().optional().describe('Duração em minutos'),
    timeZone: z.string().optional().describe('Fuso horário (padrão: America/Sao_Paulo)'),
  }),
  execute: async ({ action, eventId, summary, description, startDateTime, endDateTime, attendees, duration, timeZone = 'America/Sao_Paulo' }) => {
    try {
      switch (action) {
        case 'schedule':
          return await scheduleMeeting({ summary, description, startDateTime, endDateTime, attendees, duration, timeZone });
        
        case 'reschedule':
          return await rescheduleMeeting(eventId!, { startDateTime, endDateTime, timeZone });
        
        case 'cancel':
          return await cancelMeeting(eventId!);
        
        case 'list':
          return await listMeetings();
        
        case 'check_availability':
          return await checkAvailability(startDateTime!, endDateTime!, timeZone);
        
        default:
          throw new Error(`Ação não suportada: ${action}`);
      }
    } catch (error) {
      console.error('Erro na ferramenta Google Calendar:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        action
      };
    }
  }
});

/**
 * Agenda uma nova reunião
 */
async function scheduleMeeting(params: {
  summary?: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  attendees?: string[];
  duration?: number;
  timeZone: string;
}): Promise<SchedulingResponse> {
  const { summary, description, startDateTime, endDateTime, attendees, duration, timeZone } = params;
  
  if (!summary || !startDateTime) {
    return {
      success: false,
      message: 'Título e data/hora de início são obrigatórios'
    };
  }

  const start = new Date(startDateTime);
  const end = endDateTime ? new Date(endDateTime) : new Date(start.getTime() + (duration || 60) * 60000);

  const event: CalendarEvent = {
    summary,
    description,
    start: {
      dateTime: start.toISOString(),
      timeZone
    },
    end: {
      dateTime: end.toISOString(),
      timeZone
    },
    attendees: attendees?.map(email => ({ email })),
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 dia antes
        { method: 'popup', minutes: 15 } // 15 minutos antes
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
      eventId: response.data.id!,
      message: `Reunião "${summary}" agendada para ${formatDateTime(start)}`,
      requiresConfirmation: false
    };
  } catch (error) {
    return {
      success: false,
      message: `Erro ao agendar reunião: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

/**
 * Remarca uma reunião existente
 */
async function rescheduleMeeting(eventId: string, params: {
  startDateTime?: string;
  endDateTime?: string;
  timeZone: string;
}): Promise<SchedulingResponse> {
  const { startDateTime, endDateTime, timeZone } = params;
  
  if (!startDateTime) {
    return {
      success: false,
      message: 'Nova data/hora de início é obrigatória'
    };
  }

  try {
    // Busca o evento atual
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
      : 60 * 60000; // 60 minutos padrão

    const newEnd = endDateTime ? new Date(endDateTime) : new Date(newStart.getTime() + duration);

    const updatedEvent: CalendarEvent = {
      ...currentEvent.data,
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
      eventId: response.data.id!,
      message: `Reunião remarcada para ${formatDateTime(newStart)}`,
      requiresConfirmation: false
    };
  } catch (error) {
    return {
      success: false,
      message: `Erro ao remarcar reunião: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

/**
 * Cancela uma reunião
 */
async function cancelMeeting(eventId: string): Promise<SchedulingResponse> {
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
  } catch (error) {
    return {
      success: false,
      message: `Erro ao cancelar reunião: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

/**
 * Lista reuniões futuras
 */
async function listMeetings(): Promise<SchedulingResponse> {
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
      metadata: {
        events: events.map(event => ({
          id: event.id,
          summary: event.summary,
          start: event.start?.dateTime,
          end: event.end?.dateTime
        }))
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Erro ao listar reuniões: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

/**
 * Verifica disponibilidade de horários
 */
async function checkAvailability(startDateTime: string, endDateTime: string, timeZone: string): Promise<SchedulingResponse> {
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
    
    return {
      success: true,
      message: `Verificação de disponibilidade concluída`,
      metadata: {
        busyPeriods: busy,
        available: busy.length === 0
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Erro ao verificar disponibilidade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

/**
 * Formata data e hora para exibição
 */
function formatDateTime(date: Date): string {
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
} 