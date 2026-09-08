'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getEmpresaId } from '@/lib/empresa';
import { getCurrentUser } from '@/lib/auth';

export async function criarSolicitacao(formData: FormData) {
  const db = getDb();
  const emp = await getEmpresaId();
  const user = await getCurrentUser();

  // Sem sessão não dá para saber quem pediu; melhor recusar do que gravar
  // uma solicitação órfã que ninguém consegue rastrear depois.
  if (!user) redirect('/login');

  // SEGURANÇA: gerente de loja só pode criar para a própria loja
  // (independente do que vier no formulário)
  const lojaIdInformada = Number(formData.get('loja_id') ?? 1);
  const lojaId = user.role === 'gerente_loja' && user.loja_id
    ? user.loja_id
    : lojaIdInformada;

  const r = db.prepare(`
    INSERT INTO solicitacoes (empresa_id, tipo, titulo, descricao, loja_id, solicitante_id, prioridade, prazo, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aberta')
  `).run(
    emp,
    String(formData.get('tipo') ?? 'outro'),
    String(formData.get('titulo') ?? ''),
    String(formData.get('descricao') ?? ''),
    lojaId,
    user.id,
    String(formData.get('prioridade') ?? 'media'),
    String(formData.get('prazo') ?? '') || null
  );

  // Cria notificação para os admins
  const admins = db.prepare(
    `SELECT id FROM users WHERE role IN ('admin', 'coordenador') AND (empresa_id = ? OR acesso_global = 1)`
  ).all(emp) as any[];
  const insN = db.prepare(`
    INSERT INTO notificacoes (empresa_id, user_id, titulo, mensagem, tipo, link)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  admins.forEach(a => insN.run(emp, a.id, 'Nova solicitação', `Solicitação aberta: ${formData.get('titulo')}`, 'info', `/solicitacoes/${r.lastInsertRowid}`));

  revalidatePath('/solicitacoes');
}

export async function atualizarStatus(id: number, status: string) {
  const db = getDb();
  db.prepare('UPDATE solicitacoes SET status = ? WHERE id = ? AND empresa_id = ?')
    .run(status, id, await getEmpresaId());
  revalidatePath('/solicitacoes');
}

export async function atribuirResponsavel(id: number, formData: FormData) {
  const db = getDb();
  const r = formData.get('responsavel_id');
  db.prepare('UPDATE solicitacoes SET responsavel_id = ? WHERE id = ? AND empresa_id = ?')
    .run(r ? Number(r) : null, id, await getEmpresaId());
  revalidatePath('/solicitacoes');
}

export async function deletarSolicitacao(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM solicitacoes WHERE id = ? AND empresa_id = ?').run(id, await getEmpresaId());
  revalidatePath('/solicitacoes');
}

export async function deletarMultiplasSolicitacoes(ids: number[]) {
  if (ids.length === 0) return;
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM solicitacoes WHERE empresa_id = ? AND id IN (${placeholders})`)
    .run(await getEmpresaId(), ...ids);
  revalidatePath('/solicitacoes');
}
