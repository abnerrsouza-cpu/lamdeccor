import { getDb } from './db';

export type AvisoPendente = {
  id: number;
  titulo: string;
  corpo: string | null;
  autor_nome: string | null;
  created_at: string;
};

export type PesquisaPendente = {
  referencia: string;
  mesNome: string;
};

/** Mês de referência (YYYY-MM) e nome por extenso, no fuso de Brasília. */
function mesAtual() {
  const agora = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  );
  const ref = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
  const nome = agora.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const diasNoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate();
  return { ref, nome, dia: agora.getDate(), diasNoMes };
}

/** A pesquisa abre nos últimos 5 dias do mês. */
export function janelaDaPesquisa() {
  const { ref, nome, dia, diasNoMes } = mesAtual();
  return { ref, nome, aberta: dia > diasNoMes - 5 };
}

/**
 * O que trava a tela da pessoa: avisos importantes ainda não confirmados e,
 * para gerente de loja na última semana do mês, a pesquisa de satisfação.
 */
export function pendencias(
  emp: number,
  userId: number,
  lojaId: number | null,
  ehGerenteLoja: boolean
) {
  const db = getDb();

  const avisos = db.prepare(`
    SELECT a.id, a.titulo, a.corpo, a.created_at, u.nome AS autor_nome
    FROM avisos a
    LEFT JOIN users u ON u.id = a.autor_id
    LEFT JOIN aviso_confirmacoes c ON c.aviso_id = a.id AND c.user_id = ?
    WHERE a.empresa_id = ? AND a.ativo = 1 AND a.importante = 1
      AND (a.loja_id IS NULL OR a.loja_id = ?)
      AND c.id IS NULL
      -- Quem escreveu o aviso não precisa confirmar que leu o próprio texto
      AND (a.autor_id IS NULL OR a.autor_id != ?)
    ORDER BY a.created_at
  `).all(userId, emp, lojaId ?? -1, userId) as AvisoPendente[];

  let pesquisa: PesquisaPendente | null = null;
  if (ehGerenteLoja) {
    const { ref, nome, aberta } = janelaDaPesquisa();
    if (aberta) {
      const jaRespondeu = db.prepare(
        'SELECT id FROM pesquisa_respostas WHERE user_id = ? AND referencia = ?'
      ).get(userId, ref);
      if (!jaRespondeu) pesquisa = { referencia: ref, mesNome: nome };
    }
  }

  return { avisos, pesquisa };
}
