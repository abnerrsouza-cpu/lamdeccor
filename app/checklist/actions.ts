'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import { getEmpresaId } from '@/lib/empresa';
import { getCurrentUser } from '@/lib/auth';
import { ehAdmin } from '@/lib/permissions';

/** Data de hoje no fuso de Brasília, no formato YYYY-MM-DD. */
export async function hojeISO() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

/** A loja em que a pessoa trabalha; admin escolhe pela URL. */
async function lojaDoContexto(lojaIdPedida?: number) {
  const user = await getCurrentUser();
  if (!user) return null;
  if (ehAdmin(user.role) && lojaIdPedida) return lojaIdPedida;
  return user.loja_id ?? lojaIdPedida ?? null;
}

export async function marcarItem(itemId: number, lojaId: number, marcar: boolean) {
  const user = await getCurrentUser();
  if (!user) return;

  // Gerente só marca na própria loja
  if (!ehAdmin(user.role) && user.loja_id !== lojaId) return;

  const db = getDb();
  const data = await hojeISO();

  if (marcar) {
    db.prepare(`
      INSERT OR IGNORE INTO checklist_marcacoes (item_id, loja_id, data, feito_por)
      VALUES (?, ?, ?, ?)
    `).run(itemId, lojaId, data, user.id);
  } else {
    db.prepare(
      'DELETE FROM checklist_marcacoes WHERE item_id = ? AND loja_id = ? AND data = ?'
    ).run(itemId, lojaId, data);
  }
  revalidatePath('/checklist');
  revalidatePath('/');
}

/**
 * Item novo. O admin cria para todas as lojas (loja_id NULL); o gerente cria
 * um item extra, válido só para a loja dele.
 */
export async function criarItem(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const titulo = String(formData.get('titulo') ?? '').trim();
  if (!titulo) return;

  const paraTodas = ehAdmin(user.role) && formData.get('para_todas') === '1';
  const lojaId = paraTodas
    ? null
    : await lojaDoContexto(Number(formData.get('loja_id')) || undefined);
  if (!paraTodas && !lojaId) return;

  const db = getDb();
  const emp = await getEmpresaId();
  const ordem = (db.prepare(
    'SELECT COALESCE(MAX(ordem), 0) + 1 as n FROM checklist_itens WHERE empresa_id = ?'
  ).get(emp) as { n: number }).n;

  db.prepare(`
    INSERT INTO checklist_itens (empresa_id, loja_id, titulo, descricao, ordem, ativo, criado_por)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `).run(emp, lojaId, titulo, String(formData.get('descricao') ?? '') || null, ordem, user.id);

  revalidatePath('/checklist');
}

export async function removerItem(itemId: number) {
  const user = await getCurrentUser();
  if (!user) return;

  const db = getDb();
  const item = db.prepare(
    'SELECT loja_id FROM checklist_itens WHERE id = ? AND empresa_id = ?'
  ).get(itemId, await getEmpresaId()) as { loja_id: number | null } | undefined;
  if (!item) return;

  // Item global só o admin apaga; o extra da loja, o gerente daquela loja também
  const podeApagar = ehAdmin(user.role) || (item.loja_id !== null && item.loja_id === user.loja_id);
  if (!podeApagar) return;

  db.prepare('DELETE FROM checklist_itens WHERE id = ?').run(itemId);
  revalidatePath('/checklist');
}
