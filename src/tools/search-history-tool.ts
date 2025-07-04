import { tool } from '@openai/agents';
import { z } from 'zod';
import { getHistoryByThreadIdMySQL } from '../utils/history.js';

export const searchHistoryTool = tool({
  name: 'search_history',
  description:
    "Busca perguntas e respostas anteriores do usuário nesta conversa. Se a busca for vazia ou 'tudo', retorna todo o histórico formatado.",
  parameters: z.object({
    query: z.string().describe("Trecho da mensagem a buscar no histórico. Se vazio ou 'tudo', retorna todo o histórico."),
  }),
  async execute({ query }: any, context: any) {
    const threadId = context?.threadId;
    if (!threadId) return 'ThreadId não informado.';
    const history = await getHistoryByThreadIdMySQL(threadId, 100) as any[];
    if (!history.length) return 'Nenhuma mensagem encontrada no histórico.';
    if (!query || query.trim().toLowerCase() === 'tudo') {
      return history
        .map((h: any) => `${h.role === 'user' ? 'Usuário' : 'Assistente'}: ${h.message}`)
        .join('\n');
    }
    const found = history.reverse().find(
      (h: any) => h.message && h.message.toLowerCase().includes(query.toLowerCase())
    );
    return found
      ? `Mensagem encontrada: ${found.role} disse "${found.message}" em ${found.created_at}`
      : 'Nada encontrado no histórico.';
  },
});
