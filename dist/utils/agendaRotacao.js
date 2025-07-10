import { pool } from './mysql';
const agendaEmails = [
    'paulomotta@autenticagrupo.com.br',
    'brunoralho@autenticagrupo.com.br',
];
const ROTACAO_ID = 1;
export async function getIndiceAtual() {
    const [rows] = await pool.execute('SELECT indice_atual FROM agenda_rotacao WHERE id = ?', [ROTACAO_ID]);
    if (Array.isArray(rows) && rows.length > 0) {
        return Number(rows[0].indice_atual);
    }
    await pool.execute('INSERT INTO agenda_rotacao (id, indice_atual) VALUES (?, ?)', [ROTACAO_ID, 0]);
    return 0;
}
export async function avancarIndice() {
    const atual = await getIndiceAtual();
    const total = agendaEmails.length;
    const proximo = (atual + 1) % total;
    await pool.execute('UPDATE agenda_rotacao SET indice_atual = ? WHERE id = ?', [proximo, ROTACAO_ID]);
    return proximo;
}
export async function getResponsavelAtual() {
    const indice = await getIndiceAtual();
    return agendaEmails[indice] || agendaEmails[0];
}
export function getResponsavelPorIndice(indice) {
    return agendaEmails[indice] || agendaEmails[0];
}
export function getListaAgendas() {
    return agendaEmails;
}
//# sourceMappingURL=agendaRotacao.js.map