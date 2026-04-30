'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';

export async function criarUsuario(formData: FormData) {
  const db = getDb();
  db.prepare(`
    INSERT INTO users (nome, usuario, email, senha, role, hierarquia, cargo, loja_id, ativo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    String(formData.get('nome') ?? ''),
    String(formData.get('usuario') ?? ''),
    String(formData.get('email') ?? ''),
    String(formData.get('senha') ?? '123456'),
    String(formData.get('role') ?? 'social_media'),
    Number(formData.get('hierarquia') ?? 5),
    String(formData.get('cargo') ?? ''),
    formData.get('loja_id') ? Number(formData.get('loja_id')) : null
  );
  revalidatePath('/usuarios');
}

export async function alternarAtivo(id: number, novoEstado: number) {
  const db = getDb();
  db.prepare('UPDATE users SET ativo = ? WHERE id = ?').run(novoEstado, id);
  revalidatePath('/usuarios');
}

/**
 * Antes de remover um usuário, precisamos lidar com as referências em outras
 * tabelas. Estratégia:
 *   - Histórico/recursos pessoais (logs, notificações, convites de evento)
 *     são apagados junto.
 *   - Referências em registros compartilhados (solicitações, eventos, posts,
 *     afazeres) viram NULL para preservar o conteúdo.
 */
function limparReferencias(db: ReturnType<typeof getDb>, ids: number[]) {
  if (ids.length === 0) return;
  const ph = ids.map(() => '?').join(',');

  // Apagar dados que pertencem ao usuário
  db.prepare(`DELETE FROM acessos_log     WHERE user_id IN (${ph})`).run(...ids);
  db.prepare(`DELETE FROM notificacoes    WHERE user_id IN (${ph})`).run(...ids);
  db.prepare(`DELETE FROM evento_convidados WHERE user_id IN (${ph})`).run(...ids);

  // Nulificar referências em registros compartilhados
  db.prepare(`UPDATE solicitacoes SET solicitante_id = NULL WHERE solicitante_id IN (${ph})`).run(...ids);
  db.prepare(`UPDATE solicitacoes SET responsavel_id = NULL WHERE responsavel_id IN (${ph})`).run(...ids);
  db.prepare(`UPDATE eventos      SET organizador_id = NULL WHERE organizador_id IN (${ph})`).run(...ids);
  db.prepare(`UPDATE posts        SET responsavel_id = NULL WHERE responsavel_id IN (${ph})`).run(...ids);
  db.prepare(`UPDATE afazeres     SET responsavel_id = NULL WHERE responsavel_id IN (${ph})`).run(...ids);
}

export async function deletarUsuario(id: number) {
  const db = getDb();
  const tx = db.transaction((id: number) => {
    limparReferencias(db, [id]);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  });
  tx(id);
  revalidatePath('/usuarios');
}

export async function deletarMultiplosUsuarios(ids: number[]) {
  if (ids.length === 0) return;
  const db = getDb();
  const tx = db.transaction((ids: number[]) => {
    limparReferencias(db, ids);
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`DELETE FROM users WHERE id IN (${placeholders})`).run(...ids);
  });
  tx(ids);
  revalidatePath('/usuarios');
}
