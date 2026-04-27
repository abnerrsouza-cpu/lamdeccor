'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';

export async function criarAfazer(formData: FormData) {
  const db = getDb();
  const coluna = String(formData.get('coluna') ?? 'a_fazer');
  const max = (db.prepare(
    `SELECT COALESCE(MAX(ordem), 0) as o FROM afazeres WHERE coluna = ?`
  ).get(coluna) as { o: number }).o;

  db.prepare(`
    INSERT INTO afazeres (titulo, descricao, coluna, prioridade, time, responsavel_id, campanha, prazo, ordem, checklist)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
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
    WHERE id = ?
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
    id
  );
  revalidatePath('/afazeres');
}

export async function moverAfazer(id: number, novaColuna: string) {
  const db = getDb();
  const max = (db.prepare(
    `SELECT COALESCE(MAX(ordem), 0) as o FROM afazeres WHERE coluna = ?`
  ).get(novaColuna) as { o: number }).o;
  db.prepare(`UPDATE afazeres SET coluna = ?, ordem = ? WHERE id = ?`)
    .run(novaColuna, max + 1, id);
  revalidatePath('/afazeres');
}

export async function deletarAfazer(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM afazeres WHERE id = ?').run(id);
  revalidatePath('/afazeres');
}

export async function deletarMultiplos(ids: number[]) {
  if (ids.length === 0) return;
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM afazeres WHERE id IN (${placeholders})`).run(...ids);
  revalidatePath('/afazeres');
}
