'use server';

import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import { listEmpresas } from '@/lib/empresa';
import { hashSenha } from '@/lib/senha';

function erro(msg: string): never {
  redirect(`/cadastro?error=${encodeURIComponent(msg)}`);
}

/**
 * Cadastro aberto: qualquer pessoa cria a conta, mas ela nasce PENDENTE
 * (ativo = 0) e sem cargo. Só passa a abrir o hub depois que um admin
 * definir a função e liberar em Usuários — então o link ser público não
 * expõe nenhum dado.
 */
export async function criarConta(formData: FormData) {
  const nome = String(formData.get('nome') ?? '').trim();
  const usuario = String(formData.get('usuario') ?? '').trim().toLowerCase();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const senha = String(formData.get('senha') ?? '');
  const senha2 = String(formData.get('senha_confirma') ?? '');
  const empresaId = Number(formData.get('empresa_id'));

  if (!nome || !usuario || !email || !senha) erro('Preencha todos os campos.');
  if (senha.length < 6) erro('A senha precisa ter pelo menos 6 caracteres.');
  if (senha !== senha2) erro('As senhas não conferem.');
  if (!/^[a-z0-9._-]+$/.test(usuario)) {
    erro('O usuário pode ter apenas letras minúsculas, números, ponto, hífen e underline.');
  }

  const empresas = await listEmpresas();
  if (!empresas.some(e => e.id === empresaId)) erro('Escolha uma empresa.');

  const db = getDb();
  const jaExiste = db.prepare(
    'SELECT id FROM users WHERE LOWER(usuario) = ? OR LOWER(email) = ?'
  ).get(usuario, email);
  if (jaExiste) erro('Já existe uma conta com esse usuário ou email.');

  db.prepare(`
    INSERT INTO users
      (empresa_id, acesso_global, nome, usuario, email, senha, role, hierarquia, cargo, loja_id, ativo)
    VALUES (?, 0, ?, ?, ?, ?, 'visualizador', 9, NULL, NULL, 0)
  `).run(empresaId, nome, usuario, email, hashSenha(senha));

  redirect('/login?aviso=' + encodeURIComponent(
    'Conta criada. Ela precisa ser liberada por um administrador antes do primeiro acesso.'
  ));
}
