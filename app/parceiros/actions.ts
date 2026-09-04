'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getEmpresaId, getEmpresaAtiva } from '@/lib/empresa';
import { getCurrentUser } from '@/lib/auth';
import { podeEditar } from '@/lib/permissions';
import { moduloVisivel } from '@/lib/modulos';

/**
 * As rotas já bloqueiam quem não deve ver o módulo, mas server actions são
 * endpoints próprios: sem esta checagem uma empresa sem o módulo conseguiria
 * criar parceiros órfãos, e um gerente de loja conseguiria escrever.
 */
async function podeMexer() {
  const empresa = await getEmpresaAtiva();
  if (!moduloVisivel('/parceiros', empresa.slug)) return false;
  const user = await getCurrentUser();
  return podeEditar(user?.role);
}

/** Impede que uma empresa mexa em parceiro (ou filhos) de outra. */
async function ehDaEmpresa(parceiroId: number) {
  if (!(await podeMexer())) return false;
  const db = getDb();
  return !!db.prepare('SELECT id FROM parceiros WHERE id = ? AND empresa_id = ?')
    .get(parceiroId, await getEmpresaId());
}

function campos(formData: FormData) {
  const status = String(formData.get('status') ?? 'prospeccao');
  return {
    nome: String(formData.get('nome') ?? '').trim(),
    tipo: String(formData.get('tipo') ?? '') || null,
    responsavel: String(formData.get('responsavel') ?? '') || null,
    telefone: String(formData.get('telefone') ?? '') || null,
    email: String(formData.get('email') ?? '') || null,
    instagram: String(formData.get('instagram') ?? '') || null,
    cidade: String(formData.get('cidade') ?? '') || null,
    endereco: String(formData.get('endereco') ?? '') || null,
    status,
    // Ativo sem data informada assume hoje — é a data que o card mostra
    data_ativacao: String(formData.get('data_ativacao') ?? '') ||
      (status === 'ativo' ? new Date().toISOString().slice(0, 10) : null),
    comissao_pct: Number(formData.get('comissao_pct') ?? 0),
    observacoes: String(formData.get('observacoes') ?? '') || null,
  };
}

export async function criarParceiro(formData: FormData) {
  if (!(await podeMexer())) return;
  const db = getDb();
  const c = campos(formData);
  const r = db.prepare(`
    INSERT INTO parceiros (
      empresa_id, nome, tipo, responsavel, telefone, email, instagram,
      cidade, endereco, status, data_ativacao, comissao_pct, observacoes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    await getEmpresaId(), c.nome, c.tipo, c.responsavel, c.telefone, c.email,
    c.instagram, c.cidade, c.endereco, c.status, c.data_ativacao,
    c.comissao_pct, c.observacoes
  );

  revalidatePath('/parceiros');
  redirect(`/parceiros/${r.lastInsertRowid}`);
}

export async function atualizarParceiro(id: number, formData: FormData) {
  if (!(await ehDaEmpresa(id))) return;
  const db = getDb();
  const c = campos(formData);
  db.prepare(`
    UPDATE parceiros SET
      nome=?, tipo=?, responsavel=?, telefone=?, email=?, instagram=?,
      cidade=?, endereco=?, status=?, data_ativacao=?, comissao_pct=?, observacoes=?
    WHERE id=? AND empresa_id=?
  `).run(
    c.nome, c.tipo, c.responsavel, c.telefone, c.email, c.instagram,
    c.cidade, c.endereco, c.status, c.data_ativacao, c.comissao_pct,
    c.observacoes, id, await getEmpresaId()
  );
  revalidatePath(`/parceiros/${id}`);
  revalidatePath('/parceiros');
}

export async function deletarParceiro(id: number) {
  if (!(await ehDaEmpresa(id))) return;
  const db = getDb();
  db.prepare('DELETE FROM parceiros WHERE id = ? AND empresa_id = ?')
    .run(id, await getEmpresaId());
  revalidatePath('/parceiros');
  redirect('/parceiros');
}

export async function deletarParceiroInline(id: number) {
  if (!(await ehDaEmpresa(id))) return;
  const db = getDb();
  db.prepare('DELETE FROM parceiros WHERE id = ? AND empresa_id = ?')
    .run(id, await getEmpresaId());
  revalidatePath('/parceiros');
}

export async function deletarMultiplosParceiros(ids: number[]) {
  if (ids.length === 0) return;
  if (!(await podeMexer())) return;
  const db = getDb();
  const ph = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM parceiros WHERE empresa_id = ? AND id IN (${ph})`)
    .run(await getEmpresaId(), ...ids);
  revalidatePath('/parceiros');
}

// ---------------------------------------------------------------- indicações

export async function adicionarIndicacao(parceiroId: number, formData: FormData) {
  if (!(await ehDaEmpresa(parceiroId))) return;
  const db = getDb();
  db.prepare(`
    INSERT INTO parceiro_indicacoes
      (parceiro_id, cliente_nome, cliente_contato, servico, data, status, valor, observacoes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    parceiroId,
    String(formData.get('cliente_nome') ?? ''),
    String(formData.get('cliente_contato') ?? '') || null,
    String(formData.get('servico') ?? '') || null,
    String(formData.get('data') ?? '') || new Date().toISOString().slice(0, 10),
    String(formData.get('status') ?? 'nova'),
    Number(formData.get('valor') ?? 0),
    String(formData.get('observacoes') ?? '') || null
  );
  revalidatePath(`/parceiros/${parceiroId}`);
  revalidatePath('/parceiros');
}

export async function atualizarStatusIndicacao(
  indicacaoId: number, parceiroId: number, status: string, valor?: number
) {
  if (!(await ehDaEmpresa(parceiroId))) return;
  const db = getDb();
  if (valor === undefined) {
    db.prepare('UPDATE parceiro_indicacoes SET status = ? WHERE id = ? AND parceiro_id = ?')
      .run(status, indicacaoId, parceiroId);
  } else {
    db.prepare('UPDATE parceiro_indicacoes SET status = ?, valor = ? WHERE id = ? AND parceiro_id = ?')
      .run(status, valor, indicacaoId, parceiroId);
  }
  revalidatePath(`/parceiros/${parceiroId}`);
  revalidatePath('/parceiros');
}

export async function removerIndicacao(indicacaoId: number, parceiroId: number) {
  if (!(await ehDaEmpresa(parceiroId))) return;
  const db = getDb();
  db.prepare('DELETE FROM parceiro_indicacoes WHERE id = ? AND parceiro_id = ?')
    .run(indicacaoId, parceiroId);
  revalidatePath(`/parceiros/${parceiroId}`);
  revalidatePath('/parceiros');
}

// ---------------------------------------------------------------- conversas

export async function registrarConversa(parceiroId: number, formData: FormData) {
  if (!(await ehDaEmpresa(parceiroId))) return;
  const db = getDb();
  const user = await getCurrentUser();
  db.prepare(`
    INSERT INTO parceiro_conversas (parceiro_id, data, canal, resumo, autor_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    parceiroId,
    String(formData.get('data') ?? '') || new Date().toISOString().slice(0, 10),
    String(formData.get('canal') ?? 'whatsapp'),
    String(formData.get('resumo') ?? '') || null,
    user?.id ?? null
  );
  revalidatePath(`/parceiros/${parceiroId}`);
  revalidatePath('/parceiros');
}

export async function removerConversa(conversaId: number, parceiroId: number) {
  if (!(await ehDaEmpresa(parceiroId))) return;
  const db = getDb();
  db.prepare('DELETE FROM parceiro_conversas WHERE id = ? AND parceiro_id = ?')
    .run(conversaId, parceiroId);
  revalidatePath(`/parceiros/${parceiroId}`);
}
