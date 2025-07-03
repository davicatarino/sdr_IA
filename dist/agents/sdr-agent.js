import { Agent, run } from '@openai/agents';
import { googleCalendarTool } from '../tools/google-calendar-tool.js';
import { whatsappTool } from '../tools/whatsapp-tool.js';
import { config } from '../utils/config.js';
import { ThreadsManager } from '../threads/ThreadsManager.js';
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
</Outros>
`;
        return prompt;
    },
    tools: [googleCalendarTool, whatsappTool],
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
export async function processUserMessage(threadId, userId, message, messageType = 'text') {
    const session = threadsManager.getOrCreate(threadId, userId);
    session.addMessage('user', message);
    let response = '';
    if (session.currentAgent === 'humano') {
        response = 'Encaminhado para atendente humano.';
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
            session.state.aguardandoConfirmacao = false;
            session.state.dadosAgendamento = null;
            response = 'Reunião agendada com sucesso!';
        }
    }
    session.addMessage('assistant', response);
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
//# sourceMappingURL=sdr-agent.js.map