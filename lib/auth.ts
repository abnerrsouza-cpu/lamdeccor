'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from './db';
import { podeTrocarEmpresa } from './permissions';
import { revalidatePath } from 'next/cache';

const SESSION_COOKIE = 'lam_session';
const EMPRESA_COOKIE = 'lam_empresa';

// Login simples - admin/admin123 funciona pra qualquer user com role admin
// Demais usuários têm senha = primeiro nome em minúsculas (ex: "mariana")
export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const senha = String(formData.get('senha') ?? '').trim();

  const db = getDb();
  const user = db.prepare(
    'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(usuario) = ?'
  ).get(email, email) as any;

  if (!user) return erroLogin('Usuário não encontrado.');

  // Verificação simplificada (MVP)
  const validAdmin = user.role === 'admin' && senha === 'admin123';
  const validNormal = senha === user.senha;
  if (!validAdmin && !validNormal) {
    return erroLogin('Senha incorreta.');
  }

  // Empresa escolhida na tela de login
  const escolhida = Number(formData.get('empresa_id')) || user.empresa_id;
  const empresa = db.prepare('SELECT * FROM empresas WHERE id = ? AND ativa = 1')
    .get(escolhida) as { id: number; nome: string } | undefined;

  if (!empresa) return erroLogin('Empresa inválida.');
  if (!podeTrocarEmpresa(user) && empresa.id !== user.empresa_id) {
    return erroLogin(`Sua conta não tem acesso à ${empresa.nome}.`);
  }

  // Registra acesso
  db.prepare(
    `INSERT INTO acessos_log (user_id, ip, user_agent) VALUES (?, ?, ?)`
  ).run(user.id, '127.0.0.1', 'web');

  cookies().set(SESSION_COOKIE, String(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });

  cookies().set(EMPRESA_COOKIE, String(empresa.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect('/');
}

/**
 * O <form action={login}> descarta valores de retorno, então o erro volta pela URL.
 */
function erroLogin(msg: string): never {
  redirect(`/login?error=${encodeURIComponent(msg)}`);
}

export async function logout() {
  cookies().delete(SESSION_COOKIE);
  cookies().delete(EMPRESA_COOKIE);
  redirect('/login');
}

export async function getCurrentUser() {
  const sid = cookies().get(SESSION_COOKIE)?.value;
  if (!sid) return null;
  const db = getDb();
  const user = db.prepare(`
    SELECT u.*, l.nome as loja_nome
    FROM users u
    LEFT JOIN lojas l ON l.id = u.loja_id
    WHERE u.id = ? AND u.ativo = 1
  `).get(Number(sid)) as any;
  return user ?? null;
}

export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) redirect('/login');
  return u;
}

// Helpers síncronos de permissão estão em lib/permissions.ts
// (arquivos com 'use server' não podem ter funções síncronas)
