import { tool } from '@openai/agents';
import { z } from 'zod';
import { getHistoryByThreadId } from '../utils/history.js';
export const searchHistoryTool = tool({
    name: 'search_history',
    description: "Busca perguntas e respostas anteriores do usuário nesta conversa. Se a busca for vazia ou 'tudo', retorna todo o histórico formatado.",
    parameters: z.object({
        query: z.string().describe("Trecho da mensagem a buscar no histórico. Se vazio ou 'tudo', retorna todo o histórico."),
    }),
    async execute({ query }, context) {
        const threadId = context?.threadId;
        if (!threadId)
            return 'ThreadId não informado.';
        const history = await getHistoryByThreadId(threadId, 100);
        if (!query || query.trim().toLowerCase() === 'tudo') {
            if (!history.length)
                return 'Nenhuma mensagem encontrada no histórico.';
            return history
                .map((h) => `${h.role === 'user' ? 'Usuário' : 'Assistente'}: ${h.message}`)
                .join('\n');
        }
        const found = history.reverse().find((h) => h.message && h.message.toLowerCase().includes(query.toLowerCase()));
        return found
            ? `Mensagem encontrada: ${found.role} disse "${found.message}" em ${found.created_at}`
            : 'Nada encontrado no histórico.';
    },
});
//# sourceMappingURL=search-history-tool.js.map