import { pool } from './mysql';

// Lista de agendas (pode ser expandida futuramente)
const agendaEmails = [
  'paulomotta@autenticagrupo.com.br',
  'brunoralho@autenticagrupo.com.br',
  // Adicione mais e-mails aqui conforme necessário
];

const ROTACAO_ID = 1; // ID fixo da tabela agenda_rotacao

/**
 * Busca o índice atual do rodízio no banco
 */
export async function getIndiceAtual(): Promise<number> {
  const [rows] = await pool.execute(
    'SELECT indice_atual FROM agenda_rotacao WHERE id = ?',
    [ROTACAO_ID]
  );
  if (Array.isArray(rows) && rows.length > 0) {
    // @ts-ignore
    return Number(rows[0].indice_atual);
  }
  // Se não existir, inicializa com 0
  await pool.execute(
    'INSERT INTO agenda_rotacao (id, indice_atual) VALUES (?, ?)',
    [ROTACAO_ID, 0]
  );
  return 0;
}

/**
 * Atualiza o índice para o próximo da lista (cíclico)
 */
export async function avancarIndice(): Promise<number> {
  const atual = await getIndiceAtual();
  const total = agendaEmails.length;
  const proximo = (atual + 1) % total;
  await pool.execute(
    'UPDATE agenda_rotacao SET indice_atual = ? WHERE id = ?',
    [proximo, ROTACAO_ID]
  );
  return proximo;
}

/**
 * Retorna o e-mail do responsável da vez
 */
export async function getResponsavelAtual(): Promise<string> {
  const indice = await getIndiceAtual();
  return agendaEmails[indice] || agendaEmails[0];
}

/**
 * Retorna o e-mail do próximo responsável (sem avançar o índice)
 */
export function getResponsavelPorIndice(indice: number): string {
  return agendaEmails[indice] || agendaEmails[0];
}

/**
 * Retorna a lista de agendas cadastradas
 */
export function getListaAgendas(): string[] {
  return agendaEmails;
} 