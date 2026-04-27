'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function criarSolicitacao(formData: FormData) {
  const db = getDb();
  const user = await getCurrentUser();
  const r = db.prepare(`
    INSERT INTO solicitacoes (tipo, titulo, descricao, loja_id, solicitante_id, prioridade, prazo, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'aberta')
  `).run(
    String(formData.get('tipo') ?? 'outro'),
    String(formData.get('titulo') ?? ''),
    String(formData.get('descricao') ?? ''),
    Number(formData.get('loja_id') ?? 1),
    user?.id ?? null,
    String(formData.get('prioridade') ?? 'media'),
    String(formData.get('prazo') ?? '') || null
  );

  // Cria notificação para os admins
  const admins = db.prepare(`SELECT id FROM users WHERE role IN ('admin', 'coordenador')`).all() as any[];
  const insN = db.prepare(`
    INSERT INTO notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (?, ?, ?, ?, ?)
  `);
  admins.forEach(a => insN.run(a.id, 'Nova solicitação', `Solicitação aberta: ${formData.get('titulo')}`, 'info', `/solicitacoes/${r.lastInsertRowid}`));

  revalidatePath('/solicitacoes');
}

export async function atualizarStatus(id: number, status: string) {
  const db = getDb();
  db.prepare('UPDATE solicitacoes SET status = ? WHERE id = ?').run(status, id);
  revalidatePath('/solicitacoes');
}

export async function atribuirResponsavel(id: number, formData: FormData) {
  const db = getDb();
  const r = formData.get('responsavel_id');
  db.prepare('UPDATE solicitacoes SET responsavel_id = ? WHERE id = ?').run(r ? Number(r) : null, id);
  revalidatePath('/solicitacoes');
}

export async function deletarSolicitacao(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM solicitacoes WHERE id = ?').run(id);
  revalidatePath('/solicitacoes');
}

export async function deletarMultiplasSolicitacoes(ids: number[]) {
  if (ids.length === 0) return;
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM solicitacoes WHERE id IN (${placeholders})`).run(...ids);
  revalidatePath('/solicitacoes');
}
