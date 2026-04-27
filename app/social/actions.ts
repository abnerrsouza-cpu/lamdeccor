'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db';

export async function criarPost(formData: FormData) {
  const db = getDb();
  const r = db.prepare(`
    INSERT INTO posts (titulo, texto, rede, formato, status, data_publicacao, hora, responsavel_id, campanha, hashtags, midia_url, observacoes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    String(formData.get('titulo') ?? ''),
    String(formData.get('texto') ?? ''),
    String(formData.get('rede') ?? 'instagram'),
    String(formData.get('formato') ?? 'feed'),
    String(formData.get('status') ?? 'rascunho'),
    String(formData.get('data_publicacao') ?? '') || null,
    String(formData.get('hora') ?? '') || null,
    formData.get('responsavel_id') ? Number(formData.get('responsavel_id')) : null,
    String(formData.get('campanha') ?? '') || null,
    String(formData.get('hashtags') ?? ''),
    String(formData.get('midia_url') ?? ''),
    String(formData.get('observacoes') ?? '')
  );
  revalidatePath('/social');
  redirect(`/social/${r.lastInsertRowid}`);
}

export async function atualizarPost(id: number, formData: FormData) {
  const db = getDb();
  db.prepare(`
    UPDATE posts SET titulo=?, texto=?, rede=?, formato=?, status=?, data_publicacao=?, hora=?, responsavel_id=?, campanha=?, hashtags=?, midia_url=?, observacoes=?
    WHERE id=?
  `).run(
    String(formData.get('titulo') ?? ''),
    String(formData.get('texto') ?? ''),
    String(formData.get('rede') ?? 'instagram'),
    String(formData.get('formato') ?? 'feed'),
    String(formData.get('status') ?? 'rascunho'),
    String(formData.get('data_publicacao') ?? '') || null,
    String(formData.get('hora') ?? '') || null,
    formData.get('responsavel_id') ? Number(formData.get('responsavel_id')) : null,
    String(formData.get('campanha') ?? '') || null,
    String(formData.get('hashtags') ?? ''),
    String(formData.get('midia_url') ?? ''),
    String(formData.get('observacoes') ?? ''),
    id
  );
  revalidatePath(`/social/${id}`);
  revalidatePath('/social');
}

export async function deletarPost(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM posts WHERE id = ?').run(id);
  revalidatePath('/social');
  redirect('/social');
}

export async function deletarPostInline(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM posts WHERE id = ?').run(id);
  revalidatePath('/social');
}

export async function deletarMultiplosPosts(ids: number[]) {
  if (ids.length === 0) return;
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM posts WHERE id IN (${placeholders})`).run(...ids);
  revalidatePath('/social');
}
