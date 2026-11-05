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
/**
 * "todas" no formulário = evento da empresa inteira, que no banco é NULL.
 * Qualquer outro valor vira o id da unidade.
 */
function lojaDoEvento(formData: FormData): number | null {
  const v = String(formData.get('loja_id') ?? '');
  return v === 'todas' || v === '' ? null : Number(v);
}

/** Rótulo do tipo, para compor o aviso no mural da loja. */
const TIPO_LABEL: Record<string, string> = {
  gravacao: 'Uma gravação', reuniao: 'Uma reunião', campanha: 'Uma ação de campanha',
  lancamento: 'Um lançamento', evento_loja: 'Um evento', feira: 'Uma feira',
  outro: 'Um compromisso',
};

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
    lojaDoEvento(formData),
    formData.get('organizador_id') ? Number(formData.get('organizador_id')) : null,
    String(formData.get('descricao') ?? ''),
    String(formData.get('ata') ?? ''),
    String(formData.get('cor') ?? '#2D5F97')
  );

  // Convidados (multi-select)
  const convidados = formData.getAll('convidados').map(Number);
  const ins = db.prepare(`INSERT INTO evento_convidados (evento_id, user_id, status) VALUES (?, ?, 'convidado')`);
  convidados.forEach(uid => ins.run(r.lastInsertRowid as number, uid));

  await avisarLojaDoEvento(Number(r.lastInsertRowid), formData);

  revalidatePath('/calendario');
  redirect(`/calendario/${r.lastInsertRowid}`);
}

/**
 * Publica no mural o aviso de que há algo marcado para a loja. Não é
 * "importante": é informação, não exige confirmação. A confirmação vem
 * depois do evento, perguntando como foi.
 */
async function avisarLojaDoEvento(eventoId: number, formData: FormData) {
  const db = getDb();
  const emp = await getEmpresaId();
  const user = await getCurrentUser();
  const lojaId = lojaDoEvento(formData);

  const titulo = String(formData.get('titulo') ?? '');
  const tipo = String(formData.get('tipo') ?? 'outro');
  const data = String(formData.get('data') ?? '');
  const quando = data
    ? new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
    : '';

  const alvo = lojaId ? 'sua loja' : 'as lojas';
  db.prepare(`
    INSERT INTO avisos (empresa_id, loja_id, titulo, corpo, importante, ativo, autor_id)
    VALUES (?, ?, ?, ?, 0, 1, ?)
  `).run(
    emp,
    lojaId,
    `${TIPO_LABEL[tipo] ?? 'Um compromisso'} foi agendad${(TIPO_LABEL[tipo] ?? '').startsWith('Uma') ? 'a' : 'o'} para ${alvo}`,
    `${titulo}${quando ? ` — ${quando}` : ''}.`,
    user?.id ?? null
  );
  revalidatePath('/avisos');
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
    lojaDoEvento(formData),
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

/** Resposta do gerente sobre como foi o evento na loja dele. */
export async function responderRetornoEvento(eventoId: number, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const db = getDb();
  const ev = db.prepare('SELECT loja_id FROM eventos WHERE id = ? AND empresa_id = ?')
    .get(eventoId, await getEmpresaId()) as { loja_id: number | null } | undefined;
  if (!ev) return;

  db.prepare(`
    INSERT OR IGNORE INTO evento_retornos (evento_id, user_id, loja_id, tudo_certo, comentario)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    eventoId,
    user.id,
    ev.loja_id ?? user.loja_id ?? null,
    formData.get('tudo_certo') === 'nao' ? 0 : 1,
    String(formData.get('comentario') ?? '') || null
  );

  revalidatePath('/');
  revalidatePath(`/calendario/${eventoId}`);
}
