'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db';

export async function criarInfluencer(formData: FormData) {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO influencers (
      nome, handle, cidade, loja_id, perfil,
      alcance_medio, engajamento, cache_mensal, bonus_pct,
      status, observacoes, avatar_url,
      valor_acordo, acordo_inicio, acordo_fim
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    String(formData.get('nome') ?? ''),
    String(formData.get('handle') ?? ''),
    String(formData.get('cidade') ?? ''),
    formData.get('loja_id') ? Number(formData.get('loja_id')) : null,
    String(formData.get('perfil') ?? ''),
    Number(formData.get('alcance_medio') ?? 0),
    Number(formData.get('engajamento') ?? 0),
    Number(formData.get('cache_mensal') ?? 0),
    Number(formData.get('bonus_pct') ?? 0),
    String(formData.get('status') ?? 'prospeccao'),
    String(formData.get('observacoes') ?? ''),
    String(formData.get('avatar_url') ?? '') || null,
    Number(formData.get('valor_acordo') ?? 0),
    String(formData.get('acordo_inicio') ?? '') || null,
    String(formData.get('acordo_fim') ?? '') || null
  );
  revalidatePath('/influencers');
  redirect(`/influencers/${result.lastInsertRowid}`);
}

export async function atualizarInfluencer(id: number, formData: FormData) {
  const db = getDb();
  db.prepare(`
    UPDATE influencers SET
      nome=?, handle=?, cidade=?, loja_id=?, perfil=?,
      alcance_medio=?, engajamento=?, cache_mensal=?, bonus_pct=?,
      status=?, observacoes=?, avatar_url=?,
      valor_acordo=?, acordo_inicio=?, acordo_fim=?
    WHERE id = ?
  `).run(
    String(formData.get('nome') ?? ''),
    String(formData.get('handle') ?? ''),
    String(formData.get('cidade') ?? ''),
    formData.get('loja_id') ? Number(formData.get('loja_id')) : null,
    String(formData.get('perfil') ?? ''),
    Number(formData.get('alcance_medio') ?? 0),
    Number(formData.get('engajamento') ?? 0),
    Number(formData.get('cache_mensal') ?? 0),
    Number(formData.get('bonus_pct') ?? 0),
    String(formData.get('status') ?? 'prospeccao'),
    String(formData.get('observacoes') ?? ''),
    String(formData.get('avatar_url') ?? '') || null,
    Number(formData.get('valor_acordo') ?? 0),
    String(formData.get('acordo_inicio') ?? '') || null,
    String(formData.get('acordo_fim') ?? '') || null,
    id
  );
  revalidatePath(`/influencers/${id}`);
  revalidatePath('/influencers');
}

export async function adicionarRede(influencerId: number, formData: FormData) {
  const db = getDb();
  db.prepare(`
    INSERT INTO influencer_redes (influencer_id, rede, url, seguidores, engajamento)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    influencerId,
    String(formData.get('rede') ?? 'instagram'),
    String(formData.get('url') ?? ''),
    Number(formData.get('seguidores') ?? 0),
    Number(formData.get('engajamento') ?? 0)
  );
  revalidatePath(`/influencers/${influencerId}`);
}

export async function removerRede(redeId: number, influencerId: number) {
  const db = getDb();
  db.prepare('DELETE FROM influencer_redes WHERE id = ?').run(redeId);
  revalidatePath(`/influencers/${influencerId}`);
}

export async function adicionarCampanha(influencerId: number, formData: FormData) {
  const db = getDb();
  db.prepare(`
    INSERT INTO influencer_campanhas (
      influencer_id, campanha_nome, data_inicio, data_fim,
      investimento, vendas_atribuidas, views, engajamentos, observacoes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    influencerId,
    String(formData.get('campanha_nome') ?? ''),
    String(formData.get('data_inicio') ?? ''),
    String(formData.get('data_fim') ?? ''),
    Number(formData.get('investimento') ?? 0),
    Number(formData.get('vendas_atribuidas') ?? 0),
    Number(formData.get('views') ?? 0),
    Number(formData.get('engajamentos') ?? 0),
    String(formData.get('observacoes') ?? '')
  );
  revalidatePath(`/influencers/${influencerId}`);
}

export async function deletarInfluencer(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM influencers WHERE id = ?').run(id);
  revalidatePath('/influencers');
  redirect('/influencers');
}

export async function deletarInfluencerInline(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM influencers WHERE id = ?').run(id);
  revalidatePath('/influencers');
}

export async function deletarMultiplosInfluencers(ids: number[]) {
  if (ids.length === 0) return;
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM influencers WHERE id IN (${placeholders})`).run(...ids);
  revalidatePath('/influencers');
}
