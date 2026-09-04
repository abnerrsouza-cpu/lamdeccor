'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getEmpresaId } from '@/lib/empresa';

export async function criarEvento(formData: FormData) {
  const db = getDb();
  const r = db.prepare(`
    INSERT INTO eventos (empresa_id, titulo, data, hora_inicio, hora_fim, tipo, local, loja_id, organizador_id, descricao, ata, cor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    await getEmpresaId(),
    String(formData.get('titulo') ?? ''),
    String(formData.get('data') ?? ''),
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
    UPDATE eventos SET titulo=?, data=?, hora_inicio=?, hora_fim=?, tipo=?, local=?, loja_id=?, organizador_id=?, descricao=?, ata=?, cor=?
    WHERE id=? AND empresa_id=?
  `).run(
    String(formData.get('titulo') ?? ''),
    String(formData.get('data') ?? ''),
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
