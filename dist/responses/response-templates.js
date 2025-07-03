export const responseTemplates = [
    {
        id: 'greeting_morning',
        type: 'greeting',
        template: 'Bom dia! 👋 Sou seu assistente virtual para agendamento de reuniões. Como posso ajudá-lo hoje?',
        variables: [],
        conditions: {
            timeOfDay: ['morning']
        }
    },
    {
        id: 'greeting_afternoon',
        type: 'greeting',
        template: 'Boa tarde! 👋 Sou seu assistente virtual para agendamento de reuniões. Como posso ajudá-lo hoje?',
        variables: [],
        conditions: {
            timeOfDay: ['afternoon']
        }
    },
    {
        id: 'greeting_evening',
        type: 'greeting',
        template: 'Boa noite! 👋 Sou seu assistente virtual para agendamento de reuniões. Como posso ajudá-lo hoje?',
        variables: [],
        conditions: {
            timeOfDay: ['evening']
        }
    },
    {
        id: 'schedule_confirmation',
        type: 'confirmation',
        template: 'Perfeito! Vou agendar sua reunião "{summary}" para {date} às {time}. Confirma?',
        variables: ['summary', 'date', 'time'],
        conditions: {
            intent: ['schedule']
        }
    },
    {
        id: 'schedule_success',
        type: 'confirmation',
        template: '✅ Reunião agendada com sucesso!\n\n📅 {summary}\n📅 Data: {date}\n⏰ Horário: {time}\n⏱️ Duração: {duration} minutos\n\nVocê receberá um lembrete 15 minutos antes. Precisa de mais alguma coisa?',
        variables: ['summary', 'date', 'time', 'duration'],
        conditions: {
            intent: ['schedule']
        }
    },
    {
        id: 'reschedule_confirmation',
        type: 'confirmation',
        template: 'Entendi! Você quer remarcar a reunião "{summary}" para {newDate} às {newTime}. Confirma a alteração?',
        variables: ['summary', 'newDate', 'newTime'],
        conditions: {
            intent: ['reschedule']
        }
    },
    {
        id: 'reschedule_success',
        type: 'confirmation',
        template: '✅ Reunião remarcada com sucesso!\n\n📅 {summary}\n📅 Nova data: {newDate}\n⏰ Novo horário: {newTime}\n\nTodos os participantes foram notificados. Precisa de mais alguma coisa?',
        variables: ['summary', 'newDate', 'newTime'],
        conditions: {
            intent: ['reschedule']
        }
    },
    {
        id: 'cancel_confirmation',
        type: 'confirmation',
        template: 'Tem certeza que deseja cancelar a reunião "{summary}" agendada para {date} às {time}?',
        variables: ['summary', 'date', 'time'],
        conditions: {
            intent: ['cancel']
        }
    },
    {
        id: 'cancel_success',
        type: 'confirmation',
        template: '✅ Reunião cancelada com sucesso!\n\n📅 {summary}\n❌ Cancelada\n\nTodos os participantes foram notificados. Posso ajudá-lo com mais alguma coisa?',
        variables: ['summary'],
        conditions: {
            intent: ['cancel']
        }
    },
    {
        id: 'list_meetings',
        type: 'options',
        template: '📋 Suas próximas reuniões:\n\n{meetings}\n\nPrecisa de mais alguma informação?',
        variables: ['meetings'],
        conditions: {
            intent: ['list']
        }
    },
    {
        id: 'check_availability',
        type: 'options',
        template: '🔍 Verificando disponibilidade para {date}...\n\n{availability}\n\nGostaria de agendar algum desses horários?',
        variables: ['date', 'availability'],
        conditions: {
            intent: ['check_availability']
        }
    },
    {
        id: 'ask_meeting_details',
        type: 'options',
        template: 'Para agendar sua reunião, preciso de algumas informações:\n\n📝 Qual o assunto da reunião?\n📅 Qual data você prefere?\n⏰ Qual horário?\n⏱️ Qual a duração estimada?\n👥 Há outros participantes?',
        variables: [],
        conditions: {
            intent: ['schedule']
        }
    },
    {
        id: 'outside_business_hours',
        type: 'greeting',
        template: '⏰ Estamos fora do horário comercial ({start} às {end}, dias úteis).\n\nDeixe sua mensagem e retornaremos no próximo dia útil. Para casos urgentes, marque sua mensagem como "urgente".',
        variables: ['start', 'end'],
        conditions: {
            timeOfDay: ['night']
        }
    },
    {
        id: 'handoff_request',
        type: 'handoff',
        template: 'Entendo sua solicitação. Vou transferir você para um atendente humano que poderá ajudá-lo melhor.\n\n👤 Um atendente entrará em contato em breve.\n⏱️ Tempo estimado: 5-10 minutos\n\nObrigado pela paciência! 🙏',
        variables: [],
        conditions: {
            intent: ['handoff']
        }
    },
    {
        id: 'error_generic',
        type: 'error',
        template: '❌ Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente ou entre em contato com nosso suporte.',
        variables: [],
        conditions: {
            intent: ['error']
        }
    },
    {
        id: 'error_calendar',
        type: 'error',
        template: '❌ Não consegui acessar o calendário no momento. Tente novamente em alguns minutos ou entre em contato conosco.',
        variables: [],
        conditions: {
            intent: ['error']
        }
    },
    {
        id: 'goodbye',
        type: 'greeting',
        template: 'Obrigado por usar nosso serviço! 😊\n\nSe precisar de mais alguma coisa, é só me chamar. Tenha um ótimo dia! 👋',
        variables: [],
        conditions: {
            intent: ['goodbye']
        }
    }
];
export function getResponseTemplate(type, intent, timeOfDay) {
    const templates = responseTemplates.filter(template => {
        if (template.type !== type)
            return false;
        if (intent && template.conditions?.intent &&
            !template.conditions.intent.includes(intent)) {
            return false;
        }
        if (timeOfDay && template.conditions?.timeOfDay &&
            !template.conditions.timeOfDay.includes(timeOfDay)) {
            return false;
        }
        return true;
    });
    return templates.length > 0 ? templates[0] : null;
}
export function renderTemplate(template, variables) {
    let message = template.template;
    for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{${key}}`;
        message = message.replace(new RegExp(placeholder, 'g'), value);
    }
    return message;
}
export function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12)
        return 'morning';
    if (hour >= 12 && hour < 18)
        return 'afternoon';
    if (hour >= 18 && hour < 22)
        return 'evening';
    return 'night';
}
export function formatMeetingsList(meetings) {
    if (meetings.length === 0) {
        return 'Nenhuma reunião agendada.';
    }
    return meetings.map((meeting, index) => {
        const date = new Date(meeting.start).toLocaleDateString('pt-BR');
        const time = new Date(meeting.start).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        return `${index + 1}. ${meeting.summary}\n   📅 ${date} às ${time}`;
    }).join('\n\n');
}
export function formatAvailability(availability) {
    if (availability.available) {
        return '✅ Horário disponível!';
    }
    if (availability.busyPeriods && availability.busyPeriods.length > 0) {
        const busyTimes = availability.busyPeriods.map((period) => {
            const start = new Date(period.start).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const end = new Date(period.end).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            return `${start} - ${end}`;
        }).join(', ');
        return `❌ Horário ocupado\n⏰ Períodos ocupados: ${busyTimes}`;
    }
    return '❌ Horário não disponível';
}
//# sourceMappingURL=response-templates.js.map