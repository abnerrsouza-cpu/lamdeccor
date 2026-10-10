'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getEmpresaId } from '@/lib/empresa';
import { getCurrentUser } from '@/lib/auth';
import { podeEditar } from '@/lib/permissions';
import { salvarAnexo, apagarAnexo } from '@/lib/anexos';

export async function criarCampanha(formData: FormData) {
  const db = getDb();
  const emp = await getEmpresaId();
  const r = db.prepare(`
    INSERT INTO campanhas (empresa_id, nome, slogan, data_inicio, data_fim, orcamento, kpi_base, status, capa_cor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    emp,
    String(formData.get('nome') ?? ''),
    String(formData.get('slogan') ?? ''),
    String(formData.get('data_inicio') ?? ''),
    String(formData.get('data_fim') ?? ''),
    Number(formData.get('orcamento') ?? 0),
    String(formData.get('kpi_base') ?? ''),
    String(formData.get('status') ?? 'planejamento'),
    String(formData.get('capa_cor') ?? '#2D5F97')
  );

  // Cria todos os canais em branco
  const canais = ['INSTAGRAM','META ADS','GOOGLE ADS','WHATSAPP','RECLAME AQUI','INFLUENCERS','GMN','MÍDIA OFF','DESIGNER','AUDIOVISUAL','DADOS'];
  const ins = db.prepare(`INSERT INTO campanha_canais (campanha_id, canal, conteudo, ordem) VALUES (?, ?, ?, ?)`);
  canais.forEach((c, i) => ins.run(r.lastInsertRowid as number, c, '', i));

  revalidatePath('/campanhas');
  redirect(`/campanhas/${r.lastInsertRowid}`);
}

export async function atualizarCampanha(id: number, formData: FormData) {
  const db = getDb();
  const emp = await getEmpresaId();
  db.prepare(`
    UPDATE campanhas SET nome=?, slogan=?, data_inicio=?, data_fim=?, orcamento=?, kpi_base=?, status=?, capa_cor=?
    WHERE id=? AND empresa_id=?
  `).run(
    String(formData.get('nome') ?? ''),
    String(formData.get('slogan') ?? ''),
    String(formData.get('data_inicio') ?? ''),
    String(formData.get('data_fim') ?? ''),
    Number(formData.get('orcamento') ?? 0),
    String(formData.get('kpi_base') ?? ''),
    String(formData.get('status') ?? 'planejamento'),
    String(formData.get('capa_cor') ?? '#2D5F97'),
    id,
    emp
  );
  revalidatePath(`/campanhas/${id}`);
}

export async function atualizarCanal(canalId: number, campanhaId: number, conteudo: string) {
  const db = getDb();
  const emp = await getEmpresaId();
  db.prepare(`
    UPDATE campanha_canais SET conteudo=?
    WHERE id=? AND campanha_id IN (SELECT id FROM campanhas WHERE empresa_id = ?)
  `).run(conteudo, canalId, emp);
  revalidatePath(`/campanhas/${campanhaId}`);
}

export async function atualizarTituloCanal(canalId: number, campanhaId: number, titulo: string) {
  const db = getDb();
  const emp = await getEmpresaId();
  db.prepare(`
    UPDATE campanha_canais SET canal=?
    WHERE id=? AND campanha_id IN (SELECT id FROM campanhas WHERE empresa_id = ?)
  `).run(titulo, canalId, emp);
  revalidatePath(`/campanhas/${campanhaId}`);
}

export async function adicionarCanal(campanhaId: number, titulo: string = 'NOVO CANAL') {
  const db = getDb();
  const emp = await getEmpresaId();
  const dona = db.prepare('SELECT id FROM campanhas WHERE id = ? AND empresa_id = ?').get(campanhaId, emp);
  if (!dona) return;
  const max = (db.prepare(
    `SELECT COALESCE(MAX(ordem), 0) as o FROM campanha_canais WHERE campanha_id = ?`
  ).get(campanhaId) as { o: number }).o;
  db.prepare(`
    INSERT INTO campanha_canais (campanha_id, canal, conteudo, ordem)
    VALUES (?, ?, '', ?)
  `).run(campanhaId, titulo, max + 1);
  revalidatePath(`/campanhas/${campanhaId}`);
}

export async function deletarCanal(canalId: number, campanhaId: number) {
  const db = getDb();
  const emp = await getEmpresaId();
  db.prepare(`
    DELETE FROM campanha_canais
    WHERE id = ? AND campanha_id IN (SELECT id FROM campanhas WHERE empresa_id = ?)
  `).run(canalId, emp);
  revalidatePath(`/campanhas/${campanhaId}`);
}

export async function deletarCampanha(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM campanhas WHERE id = ? AND empresa_id = ?').run(id, await getEmpresaId());
  revalidatePath('/campanhas');
  redirect('/campanhas');
}

export async function arquivarCampanha(id: number) {
  const db = getDb();
  db.prepare('UPDATE campanhas SET arquivada = 1 WHERE id = ? AND empresa_id = ?').run(id, await getEmpresaId());
  revalidatePath('/campanhas');
}

export async function desarquivarCampanha(id: number) {
  const db = getDb();
  db.prepare('UPDATE campanhas SET arquivada = 0 WHERE id = ? AND empresa_id = ?').run(id, await getEmpresaId());
  revalidatePath('/campanhas');
}

export async function deletarCampanhaInline(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM campanhas WHERE id = ? AND empresa_id = ?').run(id, await getEmpresaId());
  revalidatePath('/campanhas');
}

export async function deletarMultiplasCampanhas(ids: number[]) {
  if (ids.length === 0) return;
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM campanhas WHERE empresa_id = ? AND id IN (${placeholders})`)
    .run(await getEmpresaId(), ...ids);
  revalidatePath('/campanhas');
}

/** Anexa um arquivo à campanha. Imagem marcada como capa vira a foto dela. */
export async function anexarNaCampanha(campanhaId: number, formData: FormData) {
  const user = await getCurrentUser();
  if (!podeEditar(user?.role)) return;

  const emp = await getEmpresaId();
  const db = getDb();
  const existe = db.prepare('SELECT id FROM campanhas WHERE id = ? AND empresa_id = ?')
    .get(campanhaId, emp);
  if (!existe) return;

  const arquivo = formData.get('arquivo') as File | null;
  if (!arquivo || arquivo.size === 0) return;

  const r = await salvarAnexo({
    arquivo, empresaId: emp, entidade: 'campanha', entidadeId: campanhaId, autorId: user?.id ?? null,
  });
  if (!r.ok) {
    redirect(`/campanhas/${campanhaId}?error=${encodeURIComponent(r.erro)}`);
  }

  if (formData.get('usar_como_capa') && arquivo.type.startsWith('image/')) {
    db.prepare('UPDATE campanhas SET capa_url = ? WHERE id = ? AND empresa_id = ?')
      .run(`/api/arquivo/${r.id}`, campanhaId, emp);
  }

  revalidatePath(`/campanhas/${campanhaId}`);
  revalidatePath('/campanhas');
}

export async function removerAnexoCampanha(anexoId: number, campanhaId: number) {
  const user = await getCurrentUser();
  if (!podeEditar(user?.role)) return;

  const emp = await getEmpresaId();
  const db = getDb();
  // Se era a capa, a campanha volta a não ter foto
  db.prepare('UPDATE campanhas SET capa_url = NULL WHERE capa_url = ? AND empresa_id = ?')
    .run(`/api/arquivo/${anexoId}`, emp);
  apagarAnexo(anexoId, emp);

  revalidatePath(`/campanhas/${campanhaId}`);
  revalidatePath('/campanhas');
}
