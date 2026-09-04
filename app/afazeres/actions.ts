'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import { getEmpresaId } from '@/lib/empresa';

export async function criarAfazer(formData: FormData) {
  const db = getDb();
  const emp = await getEmpresaId();
  const coluna = String(formData.get('coluna') ?? 'a_fazer');
  const max = (db.prepare(
    `SELECT COALESCE(MAX(ordem), 0) as o FROM afazeres WHERE coluna = ? AND empresa_id = ?`
  ).get(coluna, emp) as { o: number }).o;

  db.prepare(`
    INSERT INTO afazeres (empresa_id, titulo, descricao, coluna, prioridade, time, responsavel_id, campanha, prazo, ordem, checklist)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    emp,
    String(formData.get('titulo') ?? ''),
    String(formData.get('descricao') ?? ''),
    coluna,
    String(formData.get('prioridade') ?? 'media'),
    String(formData.get('time') ?? '') || null,
    formData.get('responsavel_id') ? Number(formData.get('responsavel_id')) : null,
    String(formData.get('campanha') ?? '') || null,
    String(formData.get('prazo') ?? '') || null,
    max + 1,
    String(formData.get('checklist') ?? '')
  );
  revalidatePath('/afazeres');
}

export async function atualizarAfazer(id: number, formData: FormData) {
  const db = getDb();
  db.prepare(`
    UPDATE afazeres SET
      titulo = ?, descricao = ?, prioridade = ?, time = ?,
      responsavel_id = ?, campanha = ?, prazo = ?, checklist = ?, coluna = ?
    WHERE id = ? AND empresa_id = ?
  `).run(
    String(formData.get('titulo') ?? ''),
    String(formData.get('descricao') ?? ''),
    String(formData.get('prioridade') ?? 'media'),
    String(formData.get('time') ?? '') || null,
    formData.get('responsavel_id') ? Number(formData.get('responsavel_id')) : null,
    String(formData.get('campanha') ?? '') || null,
    String(formData.get('prazo') ?? '') || null,
    String(formData.get('checklist') ?? ''),
    String(formData.get('coluna') ?? 'a_fazer'),
    id,
    await getEmpresaId()
  );
  revalidatePath('/afazeres');
}

export async function moverAfazer(id: number, novaColuna: string) {
  const db = getDb();
  const emp = await getEmpresaId();
  const max = (db.prepare(
    `SELECT COALESCE(MAX(ordem), 0) as o FROM afazeres WHERE coluna = ? AND empresa_id = ?`
  ).get(novaColuna, emp) as { o: number }).o;
  db.prepare(`UPDATE afazeres SET coluna = ?, ordem = ? WHERE id = ? AND empresa_id = ?`)
    .run(novaColuna, max + 1, id, emp);
  revalidatePath('/afazeres');
}

export async function deletarAfazer(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM afazeres WHERE id = ? AND empresa_id = ?').run(id, await getEmpresaId());
  revalidatePath('/afazeres');
}

export async function deletarMultiplos(ids: number[]) {
  if (ids.length === 0) return;
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM afazeres WHERE empresa_id = ? AND id IN (${placeholders})`)
    .run(await getEmpresaId(), ...ids);
  revalidatePath('/afazeres');
}
