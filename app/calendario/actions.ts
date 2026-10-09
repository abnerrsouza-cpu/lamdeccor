'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getEmpresaId } from '@/lib/empresa';
import { getCurrentUser } from '@/lib/auth';

/**
 * Data final do evento. Só vale se vier preenchida e for depois do início —
 * senão o evento é de um dia só (NULL), que é o comportamento antigo.
 */
function fimValido(formData: FormData): string | null {
  const inicio = String(formData.get('data') ?? '');
  const fim = String(formData.get('data_fim') ?? '');
  return fim && fim > inicio ? fim : null;
}

export async function criarEvento(formData: FormData) {
  const db = getDb();
  const r = db.prepare(`
    INSERT INTO eventos (empresa_id, titulo, data, data_fim, hora_inicio, hora_fim, tipo, local, loja_id, organizador_id, descricao, ata, cor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    await getEmpresaId(),
    String(formData.get('titulo') ?? ''),
    String(formData.get('data') ?? ''),
    fimValido(formData),
    String(formData.get('hora_inicio') ?? '') || null,
    String(formData.get('hora_fim') ?? '') || null,
    String(formData.get('tipo') ?? 'campanha'),
    String(formData.get('local') ?? '') || null,
    formData.get('loja_id') ? Number(formData.get('loja_id')) : null,
    formData.get('organizador_id') ? Number(formData.get('organizador_id')) : null,
    String(formData.get('descricao') ?? ''),
    String(formData.get('ata') ?? ''),
    String(formData.get('cor') ?? '#2D5F97')
  );

  // Convidados (multi-select)
  const convidados = formData.getAll('convidados').map(Number);
  const ins = db.prepare(`INSERT INTO evento_convidados (evento_id, user_id, status) VALUES (?, ?, 'convidado')`);
  convidados.forEach(uid => ins.run(r.lastInsertRowid as number, uid));

  revalidatePath('/calendario');
  redirect(`/calendario/${r.lastInsertRowid}`);
}

export async function atualizarEvento(id: number, formData: FormData) {
  const db = getDb();
  db.prepare(`
    UPDATE eventos SET titulo=?, data=?, data_fim=?, hora_inicio=?, hora_fim=?, tipo=?, local=?, loja_id=?, organizador_id=?, descricao=?, ata=?, cor=?
    WHERE id=? AND empresa_id=?
  `).run(
    String(formData.get('titulo') ?? ''),
    String(formData.get('data') ?? ''),
    fimValido(formData),
    String(formData.get('hora_inicio') ?? '') || null,
    String(formData.get('hora_fim') ?? '') || null,
    String(formData.get('tipo') ?? 'campanha'),
    String(formData.get('local') ?? '') || null,
    formData.get('loja_id') ? Number(formData.get('loja_id')) : null,
    formData.get('organizador_id') ? Number(formData.get('organizador_id')) : null,
    String(formData.get('descricao') ?? ''),
    String(formData.get('ata') ?? ''),
    String(formData.get('cor') ?? '#2D5F97'),
    id,
    await getEmpresaId()
  );
  revalidatePath(`/calendario/${id}`);
  revalidatePath('/calendario');
}

export async function deletarEvento(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM eventos WHERE id = ? AND empresa_id = ?').run(id, await getEmpresaId());
  revalidatePath('/calendario');
  redirect('/calendario');
}

/** Registra que a pessoa viu e confirmou o aviso do evento no painel. */
export async function confirmarCiencia(eventoId: number) {
  const user = await getCurrentUser();
  if (!user) return;

  const db = getDb();
  const existe = db.prepare('SELECT id FROM eventos WHERE id = ? AND empresa_id = ?')
    .get(eventoId, await getEmpresaId());
  if (!existe) return;

  db.prepare(
    'INSERT OR IGNORE INTO evento_ciencias (evento_id, user_id) VALUES (?, ?)'
  ).run(eventoId, user.id);

  revalidatePath('/');
  revalidatePath(`/calendario/${eventoId}`);
}
