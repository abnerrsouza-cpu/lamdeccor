'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getEmpresaId } from '@/lib/empresa';
import { extrairPostsDoPdf, type PostExtraido } from '@/lib/pdf-importer';

export async function criarPost(formData: FormData) {
  const db = getDb();
  const r = db.prepare(`
    INSERT INTO posts (empresa_id, titulo, texto, rede, formato, status, data_publicacao, hora, responsavel_id, campanha, hashtags, midia_url, observacoes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    await getEmpresaId(),
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
    WHERE id=? AND empresa_id=?
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
    id,
    await getEmpresaId()
  );
  revalidatePath(`/social/${id}`);
  revalidatePath('/social');
}

export async function deletarPost(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM posts WHERE id = ? AND empresa_id = ?').run(id, await getEmpresaId());
  revalidatePath('/social');
  redirect('/social');
}

export async function deletarPostInline(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM posts WHERE id = ? AND empresa_id = ?').run(id, await getEmpresaId());
  revalidatePath('/social');
}

export async function deletarMultiplosPosts(ids: number[]) {
  if (ids.length === 0) return;
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM posts WHERE empresa_id = ? AND id IN (${placeholders})`)
    .run(await getEmpresaId(), ...ids);
  revalidatePath('/social');
}

/**
 * Recebe um File de PDF, extrai os posts e devolve a prévia.
 * NÃO salva nada — só faz parsing.
 */
export async function previewPdf(formData: FormData): Promise<{
  ok: boolean;
  ano?: number;
  mes?: number;
  campanha_principal?: string;
  posts?: PostExtraido[];
  erro?: string;
}> {
  try {
    const file = formData.get('pdf') as File | null;
    if (!file || file.size === 0) {
      return { ok: false, erro: 'Nenhum arquivo enviado.' };
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return { ok: false, erro: 'O arquivo precisa ser .pdf' };
    }
    if (file.size > 10 * 1024 * 1024) {
      return { ok: false, erro: 'Arquivo maior que 10MB. Comprima antes de subir.' };
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const resultado = await extrairPostsDoPdf(buffer);
    return { ok: true, ...resultado };
  } catch (err: any) {
    return { ok: false, erro: err?.message || 'Erro ao processar PDF.' };
  }
}

/**
 * Recebe lista de posts (já confirmada pelo usuário no preview) e cria
 * todos como rascunho na rede Instagram.
 */
export async function criarPostsEmLote(posts: PostExtraido[]): Promise<{
  ok: boolean;
  criados: number;
  erro?: string;
}> {
  if (!posts || posts.length === 0) {
    return { ok: false, criados: 0, erro: 'Lista vazia.' };
  }
  try {
    const db = getDb();
    const emp = await getEmpresaId();
    const stmt = db.prepare(`
      INSERT INTO posts (empresa_id, titulo, texto, rede, formato, status, data_publicacao, hora, campanha, observacoes)
      VALUES (?, ?, ?, 'instagram', ?, 'rascunho', ?, NULL, ?, ?)
    `);
    const tx = db.transaction((rows: PostExtraido[]) => {
      let count = 0;
      for (const p of rows) {
        stmt.run(
          emp,
          p.titulo,
          p.descricao || '',
          p.formato,
          p.data,
          p.campanha || null,
          p.observacoes || null
        );
        count++;
      }
      return count;
    });
    const criados = tx(posts);
    revalidatePath('/social');
    return { ok: true, criados };
  } catch (err: any) {
    return { ok: false, criados: 0, erro: err?.message || 'Erro ao salvar posts.' };
  }
}
