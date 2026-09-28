'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getEmpresaId } from '@/lib/empresa';
import { getCurrentUser } from '@/lib/auth';
import { podeTrocarEmpresa, ehAdmin } from '@/lib/permissions';
import { hashSenha } from '@/lib/senha';

/** Só permite mexer em usuários que aparecem na empresa ativa. */
async function visivelNaEmpresa(ids: number[]) {
  if (ids.length === 0) return false;
  const db = getDb();
  const ph = ids.map(() => '?').join(',');
  const n = (db.prepare(
    `SELECT COUNT(*) as c FROM users
     WHERE id IN (${ph}) AND (empresa_id = ? OR acesso_global = 1)`
  ).get(...ids, await getEmpresaId()) as { c: number }).c;
  return n === ids.length;
}

function erroUsuario(msg: string): never {
  redirect(`/usuarios?error=${encodeURIComponent(msg)}`);
}

export async function criarUsuario(formData: FormData) {
  const db = getDb();
  const atual = await getCurrentUser();
  const empAtiva = await getEmpresaId();

  const nome = String(formData.get('nome') ?? '').trim();
  const usuario = String(formData.get('usuario') ?? '').trim().toLowerCase();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();

  // users.usuario e users.email são UNIQUE: sem esta checagem o banco lança
  // exceção e a tela vira um "Application error" sem explicação nenhuma.
  if (!nome) erroUsuario('Informe o nome completo.');
  if (!usuario) erroUsuario('Informe o usuário (login).');
  if (!email) erroUsuario('Informe o email.');

  const jaExiste = db.prepare(
    'SELECT usuario, email FROM users WHERE LOWER(usuario) = ? OR LOWER(email) = ?'
  ).get(usuario, email) as { usuario: string; email: string } | undefined;
  if (jaExiste) {
    erroUsuario(
      jaExiste.email.toLowerCase() === email
        ? `Já existe uma conta com o email ${email}.`
        : `Já existe uma conta com o usuário ${usuario}.`
    );
  }

  // Só quem tem acesso global escolhe a empresa do novo usuário
  const empresaId = podeTrocarEmpresa(atual) && formData.get('empresa_id')
    ? Number(formData.get('empresa_id'))
    : empAtiva;
  const acessoGlobal = podeTrocarEmpresa(atual) && formData.get('acesso_global') ? 1 : 0;

  try {
    db.prepare(`
      INSERT INTO users (empresa_id, acesso_global, nome, usuario, email, senha, role, hierarquia, cargo, loja_id, ativo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      empresaId,
      acessoGlobal,
      nome,
      usuario,
      email,
      hashSenha(String(formData.get('senha') || '123456')),
      String(formData.get('role') ?? 'social_media'),
      Number(formData.get('hierarquia') ?? 5),
      String(formData.get('cargo') ?? ''),
      formData.get('loja_id') ? Number(formData.get('loja_id')) : null
    );
  } catch (err) {
    // Rede de segurança: qualquer recusa do banco vira mensagem, não tela de erro
    const msg = (err as Error).message ?? '';
    if (msg.includes('UNIQUE')) erroUsuario('Já existe uma conta com esse usuário ou email.');
    erroUsuario('Não foi possível criar o usuário. Confira os dados e tente de novo.');
  }
  revalidatePath('/usuarios');
  // Limpa o ?error= de uma tentativa anterior — senão a mensagem antiga
  // fica na tela mesmo depois do cadastro dar certo.
  redirect('/usuarios');
}

export async function alternarAtivo(id: number, novoEstado: number) {
  const db = getDb();
  db.prepare(
    'UPDATE users SET ativo = ? WHERE id = ? AND (empresa_id = ? OR acesso_global = 1)'
  ).run(novoEstado, id, await getEmpresaId());
  revalidatePath('/usuarios');
}

/**
 * Antes de remover um usuário, precisamos lidar com as referências em outras
 * tabelas. Estratégia:
 *   - Histórico/recursos pessoais (logs, notificações, convites de evento)
 *     são apagados junto.
 *   - Referências em registros compartilhados (solicitações, eventos, posts,
 *     afazeres) viram NULL para preservar o conteúdo.
 */
function limparReferencias(db: ReturnType<typeof getDb>, ids: number[]) {
  if (ids.length === 0) return;
  const ph = ids.map(() => '?').join(',');

  // Apagar dados que pertencem ao usuário
  db.prepare(`DELETE FROM acessos_log     WHERE user_id IN (${ph})`).run(...ids);
  db.prepare(`DELETE FROM notificacoes    WHERE user_id IN (${ph})`).run(...ids);
  db.prepare(`DELETE FROM evento_convidados WHERE user_id IN (${ph})`).run(...ids);

  // Nulificar referências em registros compartilhados
  db.prepare(`UPDATE solicitacoes SET solicitante_id = NULL WHERE solicitante_id IN (${ph})`).run(...ids);
  db.prepare(`UPDATE solicitacoes SET responsavel_id = NULL WHERE responsavel_id IN (${ph})`).run(...ids);
  db.prepare(`UPDATE eventos      SET organizador_id = NULL WHERE organizador_id IN (${ph})`).run(...ids);
  db.prepare(`UPDATE posts        SET responsavel_id = NULL WHERE responsavel_id IN (${ph})`).run(...ids);
  db.prepare(`UPDATE afazeres     SET responsavel_id = NULL WHERE responsavel_id IN (${ph})`).run(...ids);
}

export async function deletarUsuario(id: number) {
  const db = getDb();
  if (!(await visivelNaEmpresa([id]))) return;
  const tx = db.transaction((id: number) => {
    limparReferencias(db, [id]);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  });
  tx(id);
  revalidatePath('/usuarios');
}

export async function deletarMultiplosUsuarios(ids: number[]) {
  if (ids.length === 0) return;
  const db = getDb();
  if (!(await visivelNaEmpresa(ids))) return;
  const tx = db.transaction((ids: number[]) => {
    limparReferencias(db, ids);
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`DELETE FROM users WHERE id IN (${placeholders})`).run(...ids);
  });
  tx(ids);
  revalidatePath('/usuarios');
}

/**
 * Libera a conta e define o cargo — é o passo que tira o usuário do
 * estágio "aguardando liberação" criado pelo cadastro aberto.
 */
export async function definirAcesso(id: number, formData: FormData) {
  const atual = await getCurrentUser();
  if (!ehAdmin(atual?.role)) return;
  if (!(await visivelNaEmpresa([id]))) return;

  const db = getDb();
  const acessoGlobal = podeTrocarEmpresa(atual) && formData.get('acesso_global') ? 1 : 0;
  const empresaId = podeTrocarEmpresa(atual) && formData.get('empresa_id')
    ? Number(formData.get('empresa_id'))
    : undefined;

  db.prepare(`
    UPDATE users SET
      role = ?, hierarquia = ?, cargo = ?, loja_id = ?, ativo = ?, acesso_global = ?
      ${empresaId ? ', empresa_id = ?' : ''}
    WHERE id = ?
  `).run(
    String(formData.get('role') ?? 'visualizador'),
    Number(formData.get('hierarquia') ?? 9),
    String(formData.get('cargo') ?? '') || null,
    formData.get('loja_id') ? Number(formData.get('loja_id')) : null,
    formData.get('ativo') ? 1 : 0,
    acessoGlobal,
    ...(empresaId ? [empresaId] : []),
    id
  );
  revalidatePath('/usuarios');
}

/** Define uma senha nova para o usuário (guardada como hash). */
export async function definirSenha(id: number, formData: FormData) {
  const atual = await getCurrentUser();
  if (!ehAdmin(atual?.role)) return;
  if (!(await visivelNaEmpresa([id]))) return;

  const nova = String(formData.get('senha') ?? '');
  if (nova.length < 6) return;

  const db = getDb();
  db.prepare('UPDATE users SET senha = ? WHERE id = ?').run(hashSenha(nova), id);
  revalidatePath('/usuarios');
}
