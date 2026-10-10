'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import { salvarAnexo, apagarAnexo } from '@/lib/anexos';
import { redirect } from 'next/navigation';
import { getEmpresaId } from '@/lib/empresa';
import { getCurrentUser } from '@/lib/auth';
import { ehAdmin } from '@/lib/permissions';
import { janelaDaPesquisa } from '@/lib/pendencias';

export async function criarAviso(formData: FormData) {
  const user = await getCurrentUser();
  if (!ehAdmin(user?.role)) return;

  const titulo = String(formData.get('titulo') ?? '').trim();
  if (!titulo) return;

  const db = getDb();
  const r = db.prepare(`
    INSERT INTO avisos (empresa_id, loja_id, titulo, corpo, importante, ativo, autor_id)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `).run(
    await getEmpresaId(),
    formData.get('loja_id') ? Number(formData.get('loja_id')) : null,
    titulo,
    String(formData.get('corpo') ?? '') || null,
    formData.get('importante') ? 1 : 0,
    user!.id
  );
  const arquivo = formData.get('arquivo') as File | null;
  if (arquivo && arquivo.size > 0) {
    await salvarAnexo({
      arquivo, empresaId: await getEmpresaId(), entidade: 'aviso',
      entidadeId: Number(r.lastInsertRowid), autorId: user!.id,
    });
  }

  revalidatePath('/avisos');
  revalidatePath('/');
}

export async function arquivarAviso(id: number) {
  const user = await getCurrentUser();
  if (!ehAdmin(user?.role)) return;

  const db = getDb();
  db.prepare('UPDATE avisos SET ativo = 0 WHERE id = ? AND empresa_id = ?')
    .run(id, await getEmpresaId());
  revalidatePath('/avisos');
  revalidatePath('/');
}

/** A pessoa declarou que leu o aviso. Sem confete: é obrigação, não conquista. */
export async function confirmarAviso(avisoId: number) {
  const user = await getCurrentUser();
  if (!user) return;

  const db = getDb();
  const existe = db.prepare('SELECT id FROM avisos WHERE id = ? AND empresa_id = ?')
    .get(avisoId, await getEmpresaId());
  if (!existe) return;

  db.prepare('INSERT OR IGNORE INTO aviso_confirmacoes (aviso_id, user_id) VALUES (?, ?)')
    .run(avisoId, user.id);
  revalidatePath('/');
  revalidatePath('/avisos');
}

export async function responderPesquisa(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const { ref, aberta } = janelaDaPesquisa();
  if (!aberta) return;

  const nota = Number(formData.get('nota'));
  if (!nota || nota < 1 || nota > 5) return;

  const db = getDb();
  db.prepare(`
    INSERT OR IGNORE INTO pesquisa_respostas
      (empresa_id, loja_id, user_id, referencia, nota, materiais_no_prazo, faltou, sugestoes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    await getEmpresaId(),
    user.loja_id ?? null,
    user.id,
    ref,
    nota,
    String(formData.get('materiais_no_prazo') ?? '') || null,
    String(formData.get('faltou') ?? '') || null,
    String(formData.get('sugestoes') ?? '') || null
  );
  revalidatePath('/');
  revalidatePath('/avisos');
}

/** Anexa imagem ou PDF a um aviso do mural. */
export async function anexarNoAviso(avisoId: number, formData: FormData) {
  const user = await getCurrentUser();
  if (!ehAdmin(user?.role)) return;

  const emp = await getEmpresaId();
  const existe = getDb().prepare('SELECT id FROM avisos WHERE id = ? AND empresa_id = ?')
    .get(avisoId, emp);
  if (!existe) return;

  const arquivo = formData.get('arquivo') as File | null;
  if (!arquivo || arquivo.size === 0) return;

  const r = await salvarAnexo({
    arquivo, empresaId: emp, entidade: 'aviso', entidadeId: avisoId, autorId: user!.id,
  });
  if (!r.ok) redirect(`/avisos?error=${encodeURIComponent(r.erro)}`);

  revalidatePath('/avisos');
  revalidatePath('/');
}

export async function removerAnexoAviso(anexoId: number) {
  const user = await getCurrentUser();
  if (!ehAdmin(user?.role)) return;
  apagarAnexo(anexoId, await getEmpresaId());
  revalidatePath('/avisos');
  revalidatePath('/');
}
