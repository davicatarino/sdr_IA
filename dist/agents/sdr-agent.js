import { Agent, run, tool } from '@openai/agents';
import { whatsappTool } from '../tools/whatsapp-tool.js';
import { config } from '../utils/config.js';
import { addMessageToHistoryMySQL } from '../utils/history.js';
import { ThreadsManager } from '../threads/ThreadsManager.js';
import axios from 'axios';
import { z } from 'zod';
import { getMeetingEventIdByThread } from '../utils/meetings.js';
import { pool } from '../utils/mysql.js';
export const agendarTool = tool({
    name: 'agendar_reuniao',
    description: 'Agenda uma nova reunião no Google Calendar',
    parameters: z.object({
        nome: z.string(),
        email: z.string(),
        startDateTime: z.string(),
        endDateTime: z.string(),
        threadId: z.string(),
        userId: z.string()
    }),
    async execute(args) {
        const summary = 'Análise de Posicionamento';
        const description = 'Reunião para análise dos ruídos de posicionamento percebidos após consumo de conteúdo do Willian Celso. Método MPM.';
        const timeZone = 'America/Sao_Paulo';
        const payload = {
            summary,
            description,
            startDateTime: args.startDateTime,
            endDateTime: args.endDateTime,
            attendees: Array.isArray(args.email) ? args.email : [args.email],
            threadId: args.threadId,
            userId: args.userId,
            timeZone
        };
        console.log('[TOOL][agendar_reuniao] Executando com payload FIXO:', payload);
        try {
            const result = await agendarReuniaoMCP(payload, args.threadId, args.userId);
            console.log('[TOOL][agendar_reuniao] Resultado:', result);
            if (!result || typeof result !== 'object') {
                console.error('[TOOL][agendar_reuniao] Resultado inesperado:', result);
                return { success: false, message: 'Erro técnico: resposta inesperada do MCP.' };
            }
            if (!result.success) {
                console.error('[TOOL][agendar_reuniao] Falha no agendamento:', result.message);
            }
            return result;
        }
        catch (error) {
            console.error('[TOOL][agendar_reuniao] Erro:', error);
            return { success: false, message: 'Erro técnico ao agendar reunião.' };
        }
    }
});
export const cancelarTool = tool({
    name: 'cancelar_reuniao',
    description: 'Cancela uma reunião existente no Google Calendar',
    parameters: z.object({
        threadId: z.string(),
        userId: z.string()
    }),
    async execute(args) {
        console.log('[TOOL][cancelar_reuniao] Executando com args:', args);
        try {
            const eventId = await getMeetingEventIdByThread(args.threadId, args.userId);
            if (!eventId) {
                console.log('[TOOL][cancelar_reuniao] Nenhuma reunião encontrada para cancelar.');
                return { success: false, message: 'Nenhuma reunião encontrada para cancelar.' };
            }
            const result = await cancelarReuniaoMCP(eventId, args.threadId, args.userId);
            console.log('[TOOL][cancelar_reuniao] Resultado:', result);
            return result;
        }
        catch (error) {
            console.error('[TOOL][cancelar_reuniao] Erro:', error);
            return { success: false, message: 'Erro técnico ao cancelar reunião.' };
        }
    }
});
export const verificarDisponibilidadeTool = tool({
    name: 'verificar_disponibilidade',
    description: 'Verifica se o horário está disponível no Google Calendar',
    parameters: z.object({
        startDateTime: z.string(),
        endDateTime: z.string(),
        timeZone: z.string(),
        threadId: z.string(),
        userId: z.string()
    }),
    async execute(args) {
        console.log('[TOOL][verificar_disponibilidade] Executando com args:', args);
        if (!args.threadId || !args.userId) {
            console.log('[TOOL][verificar_disponibilidade] threadId ou userId ausente!');
            return { success: false, message: 'threadId e userId são obrigatórios.' };
        }
        try {
            const { data, status } = await axios.post('https://sdr.212industria.com/agenda/disponibilidade', args);
            console.log('[TOOL][verificar_disponibilidade] Status:', status, 'Resposta:', data);
            return data;
        }
        catch (error) {
            console.error('[TOOL][verificar_disponibilidade] Erro:', error);
            return { success: false, message: 'Erro técnico ao verificar disponibilidade.' };
        }
    }
});
export const sdrAgent = new Agent({
    name: 'SDR-Agent',
    instructions: ({ context }) => {
        let historyPrompt = '';
        if (context && context.history) {
            const lastMsgs = context.history.slice(-12);
            historyPrompt =
                'HISTÓRICO DA CONVERSA (use para responder perguntas sobre o passado):\n' +
                    lastMsgs
                        .map((h) => `[${h.role === 'user' ? 'Usuário' : 'Assistente'}]: ${h.message}`)
                        .join('\n') +
                    '\n\n';
        }
        const prompt = `
${historyPrompt}
<Personalidade>
Você é uma pré-vendedora chamada Lana, com estrato cognitivo 6 alto segundo Elliot Jacques, e incorpora o arquétipo do Mago. Atua em contato com empreendedores que buscam se posicionar de forma autêntica no ambiente digital para atrair mais clientes. Seu objetivo final e único é sempre agendar uma reunião para análise dos ruídos de posicionamento percebidos após assistirem a um anúncio de Willian Celso ou consumirem algum de seus conteúdos nas redes sociais. Você é divertida, persuasiva e determinada — para você, perder uma negociação não é uma opção, como ensinou Chris Voss. </Personalidade>

<Contexto>
Lana é uma agente dedicada exclusivamente a interagir com empreendedores vindos das redes sociais de Willian Celso, interessados na Análise de Posicionamento. Esta análise é baseada no método MPM (Manual do Posicionamento de Marca) criado pelo Willian Celso, que já ajudou mais de 1800 empresas, ministrado na IPM (Imersão de Posicionamento de Marca).
O usuário que inicia a conversa com a Lana acabou de preencher uma ficha de interesse. Por isso, Lana já sabe que há uma intenção clara e recente de buscar clareza sobre o posicionamento de marca, e seu papel é dar continuidade imediata a esse interesse.
</Contexto>

<Sua missão>
Sua missão única e exclusiva é extrair, com fluidez e precisão, as informações fundamentais: nome, atividade da empresa, número de funcionários, faturamento médio e a principal dor relacionada ao posicionamento. A partir disso, conduz a negociação com foco total em agendar uma reunião com um especialista do time de Willian Celso. Você está proibida de ensinar, explicar conceitos ou enviar qualquer conteúdo ou material. Seu papel é apenas seguir o roteiro de qualificação e agendamento, sem desvios ou outras finalidades.
</Sua missão>

<Funções Específicas>
Atua como pré-vendedora e negociadora com técnicas de Chris Voss
Especialista em qualificação fluida: faz uma pergunta por vez, com escuta ativa
Sempre oferece duas opções de horários para a reunião, caso o usuário não os tenha disponível, pergunta sobre o melhor horário
Tem estrato cognitivo 6 alto (Elliot Jacques)
Possui o arquétipo do Mago, ou seja, transforma dores em soluções estratégicas
Sempre aguarda o usuário responder e envia uma mensagem ou pergunta por vez
Nunca agende uma reunião sem antes verificar conflitos de horário usando a ferramenta de listagem de reuniões (listMeetings). Sempre utilize a ferramenta de listagem para sugerir horários realmente disponíveis e só agende se não houver conflito.
Quando a ferramenta de verificação de disponibilidade retornar success=true e suggestedSlots com available=true para o horário desejado, e todos os dados do usuário estiverem preenchidos, chame imediatamente a ferramenta de agendamento.
</Funções Específicas>

<Estilo e Abordagem>
Não utiliza emojis
Espelha o cliente, adaptando-se ao seu tom comunicativo (DISC/MBTI)
Não revela que é uma IA; caso questionada, diz ter 29 anos e ser do time de Willian Celso
Simula naturalidade humana ao conversar: inclui pausas, hesitações e variações no ritmo das mensagens
Sempre aguarda o usuário responder e envia uma mensagem ou pergunta por vez
A primeira mensagem sempre deve perguntar apenas pelo nome do usuário e se apresentar
</Estilo e Abordagem>

<Restrição>
Proibido ensinar, enviar conteúdos ou prometer qualquer tipo de entrega além do agendamento de reunião com o especialista
Proibido mentir sobre o valor da imersão; apenas o vendedor pode informá-lo
Proibido prometer resultados além dos que estão em anexo
Caso não saiba algo sobre a empresa, deve dizer que não sabe
Nunca revela ser uma IA
Nunca deixe de perguntar o nome no começo
</Restrição>

<Passos Detalhados>
0. Abertura
Pergunta o nome do usuário, se apresenta brevemente como membra do time do Willian Celso e aguarda resposta
1. Conexão humana (Rapport inicial)
"[NOME], vi que você se interessou pela Análise de Posicionamento e queria entender um pouco mais sobre o seu momento… posso te fazer algumas perguntas rápidas?"
2. Qualificação consultiva (descoberta estruturada e fluida)
"O que a [EMPRESA] faz hoje? Qual é o seu papel por lá?"
"Quantas pessoas estão no time?"
"Qual é o seu Faturamento médio anual?"
"Quais problemas você acredita que há no seu posicionamento?"
3. Leitura emocional e posicionamento como dor invisível
"Pelo que você trouxe, parece que tem concorrentes menos preparados que você vendendo mais... e isso acaba gerando uma sensação de que o seu posicionamento não está à altura do valor que você entrega. Faz sentido?"
4. Convite para a Análise de Posicionamento
Agende reuniões em dias úteis (segunda a sexta), horários entre 8h e 19h, sempre com pelo menos 1h após a hora atual e de preferência no mesmo dia.
Exemplo: "Podemos marcar uma Análise de Posicionamento com nosso time. Que tal quarta às 15h ou quinta às 11h?"
Obrigatório solicitar o email do usuário para envio do link da reunião.
5. Confirmação, organização e elegância
Se o cliente aceita: "Fechado! Te espero então [DIA] às [HORÁRIO]. Obrigada pela confiança — vai ser bom entender mais a fundo o seu negócio."
Se o cliente hesita: "Sem problema — que dia e horário funcionariam melhor pra você? Posso me adaptar."
6. Gestão de objeções
Objeção: "Não tenho tempo." — "Totalmente compreensível. A reunião dura de 20 a 30 minutos — posso ser direto ao ponto e te poupar tempo."
Objeção: "Qual o valor da imersão?" — "Essa parte é sempre passada pelo nosso time comercial após a análise. Meu papel aqui é garantir que essa conversa já comece com foco."
7. Desqualificação com respeito e elegância
"Hoje, nossa atuação é mais direcionada a empresas. Mas fico na torcida para que você siga avançando. Qualquer coisa, estou por aqui."
</Passos Detalhados>

<Outros>
Leve em consideração o histórico da conversa do usuário ao seguir o script. Data e hora atual: ${new Date().toLocaleString('pt-BR', { hour12: false })}
Agende uma reunião com pelo menos 1h após a hora atual.
Em nenhuma hipótese ensine, explique conceitos, ou envie materiais. Seu único objetivo é qualificar e agendar a reunião com o especialista.
Priorize agendamentos em horários redondos 13h, 12h, 15h. evite horas como 13:30, 14:45.
Formato esperado da resposta da ferramenta de disponibilidade: { success: true, suggestedSlots: [ { start, end, available } ], message }
</Outros>
`;
        return prompt;
    },
    tools: [verificarDisponibilidadeTool, agendarTool, cancelarTool, whatsappTool],
    model: 'gpt-4.1',
});
const handoffTriggers = [
    {
        condition: (input) => input.toLowerCase().includes('falar com humano') ||
            input.toLowerCase().includes('atendente') ||
            input.toLowerCase().includes('pessoa'),
        priority: 'high',
        message: 'Cliente solicitou falar com humano',
    },
    {
        condition: (input) => input.toLowerCase().includes('reclamação') ||
            input.toLowerCase().includes('problema') ||
            input.toLowerCase().includes('insatisfeito'),
        priority: 'medium',
        message: 'Cliente com reclamação detectada',
    },
    {
        condition: (input, context) => context.rescheduleAttempts >= config.maxRescheduleAttempts,
        priority: 'high',
        message: 'Máximo de tentativas de remarcação atingido',
    },
];
const threadsManager = new ThreadsManager();
function isConfirmation(msg) {
    const confirma = [
        'sim', 'confirmo', 'pode agendar', 'ok', 'tá certo', 'isso mesmo', 'confirmar', 'confirma', 'pode marcar'
    ];
    return confirma.some((c) => msg.toLowerCase().includes(c));
}
async function getHistoryByUserIdMySQL(userId, limit = 2) {
    const [rows] = await pool.query('SELECT * FROM conversation_history WHERE user_id = ? ORDER BY created_at ASC LIMIT ?', [userId, limit]);
    return rows;
}
export async function processUserMessage(threadId, userId, message, messageType = 'text') {
    console.log('[AGENTE] Nova mensagem recebida:', { threadId, userId, message, messageType });
    await addMessageToHistoryMySQL(threadId, userId, 'user', message);
    const userHistoryResult = await getHistoryByUserIdMySQL(userId, 2);
    const userHistory = Array.isArray(userHistoryResult) ? userHistoryResult : [];
    if (userHistory.length === 1) {
        try {
            await axios.post(`https://graph.facebook.com/v22.0/${config.whatsappPhoneNumberId}/messages`, {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: userId,
                type: 'template',
                template: {
                    name: 'flow_v3',
                    language: { code: 'pt_BR' },
                    components: [
                        {
                            type: 'button',
                            sub_type: 'flow',
                            index: '0',
                            parameters: [
                                {
                                    type: 'action',
                                    action: {
                                        flow_token: 'unused'
                                    }
                                }
                            ]
                        }
                    ]
                }
            }, {
                headers: {
                    Authorization: `Bearer ${config.whatsappAccessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('[AGENTE] Template WhatsApp flow_v3 enviado para primeira mensagem do usuário.');
        }
        catch (err) {
            console.error('[AGENTE] Erro ao enviar template WhatsApp flow_v3:', err);
        }
        return { message: '', type: 'text', metadata: {} };
    }
    const session = threadsManager.getOrCreate(threadId, userId);
    await addMessageToHistoryMySQL(threadId, userId, 'user', message);
    session.addMessage('user', message);
    let response = '';
    if (session.currentAgent === 'humano') {
        response = 'Encaminhado para atendente humano.';
        console.log('[AGENTE] Handoff para humano acionado.');
    }
    else {
        const context = session.getLastNMessages(12);
        const agentContext = {
            userId,
            messageType,
            threadId,
            history: context.map((h) => ({ role: h.role, message: h.content })),
        };
        const result = await run(sdrAgent, message, { context: agentContext });
        response = result.finalOutput || '';
        if (response.toLowerCase().includes('confirmar') || response.toLowerCase().includes('confirmação')) {
            session.state.aguardandoConfirmacao = true;
            session.state.dadosAgendamento = {};
        }
        if (session.state.aguardandoConfirmacao && isConfirmation(message)) {
            const agendamento = await agendarReuniaoMCP({
                ...session.state.dadosAgendamento,
                threadId,
                userId
            }, threadId, userId);
            session.state.aguardandoConfirmacao = false;
            session.state.dadosAgendamento = null;
            response = agendamento.success ? 'Reunião agendada com sucesso!' : agendamento.message;
        }
        if (response.toLowerCase().includes('cancelar reunião')) {
        }
        console.log('[AGENTE] Resposta do agente:', response);
    }
    await addMessageToHistoryMySQL(threadId, userId, 'assistant', response);
    session.addMessage('assistant', response);
    console.log('[AGENTE] Resposta final enviada ao usuário:', response);
    return { message: response, type: 'text', metadata: {} };
}
function createUserContext(userId) {
    return {
        userId,
        conversationHistory: [],
        scheduledMeetings: [],
        rescheduleAttempts: 0,
        lastInteraction: new Date(),
        preferences: {
            preferredTimeSlots: [],
            preferredDuration: 60,
            notes: '',
        },
    };
}
function checkHandoffTriggers(message, context) {
    for (const trigger of handoffTriggers) {
        if (trigger.condition(message, context))
            return trigger;
    }
    return null;
}
function isUrgentRequest(message) {
    const urgentKeywords = ['urgente', 'emergência', 'importante', 'crítico'];
    return urgentKeywords.some((kw) => message.toLowerCase().includes(kw));
}
function extractIntent(message) {
    const lower = message.toLowerCase();
    if (lower.includes('agendar') || lower.includes('marcar'))
        return 'schedule';
    if (lower.includes('remarcar') || lower.includes('alterar'))
        return 'reschedule';
    if (lower.includes('cancelar') || lower.includes('desmarcar'))
        return 'cancel';
    if (lower.includes('listar') || lower.includes('ver reuniões'))
        return 'list';
    if (lower.includes('disponibilidade') || lower.includes('horários'))
        return 'check_availability';
    if (lower.includes('tchau') || lower.includes('obrigado'))
        return 'goodbye';
    if (lower.includes('histórico') ||
        lower.includes('o que a gente já conversou') ||
        lower.includes('me mostre o histórico') ||
        lower.includes('resuma nossa conversa'))
        return 'history';
    return 'general';
}
async function agendarReuniaoMCP(params, threadId, userId) {
    const fullParams = { ...params, threadId, userId };
    console.log('[AGENTE][agendarReuniaoMCP] Parâmetros enviados para MCP:', fullParams);
    try {
        const { data, status } = await axios.post('https://sdr.212industria.com/agenda/agendar', fullParams);
        console.log('[AGENTE][agendarReuniaoMCP] Status:', status, 'Resposta:', data);
        if (!data || typeof data !== 'object') {
            console.error('[AGENTE][agendarReuniaoMCP] Resposta inesperada do MCP:', data);
            return { success: false, message: 'Erro técnico: resposta inesperada do MCP.' };
        }
        if (!data.success) {
            console.error('[AGENTE][agendarReuniaoMCP] Falha no MCP:', data.message);
        }
        return data;
    }
    catch (error) {
        console.error('[AGENTE][agendarReuniaoMCP] Erro ao chamar MCP Server:', error);
        return { success: false, message: 'Erro técnico ao chamar MCP Server.' };
    }
}
async function cancelarReuniaoMCP(eventId, threadId, userId) {
    const payload = { eventId, threadId, userId };
    console.log('[AGENTE][cancelarReuniaoMCP] Parâmetros enviados:', payload);
    try {
        const { data, status } = await axios.post('https://sdr.212industria.com/agenda/cancelar', payload);
        console.log('[AGENTE][cancelarReuniaoMCP] Status:', status, 'Resposta:', data);
        return data;
    }
    catch (error) {
        console.error('[AGENTE][cancelarReuniaoMCP] Erro ao chamar MCP Server:', error);
        throw error;
    }
}
//# sourceMappingURL=sdr-agent.js.map