'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getDb, EMPRESA_LAM } from './db';
import { getCurrentUser } from './auth';
import { podeTrocarEmpresa } from './permissions';

const EMPRESA_COOKIE = 'lam_empresa';

export type Empresa = {
  id: number;
  nome: string;
  slug: string;
  subtitulo: string | null;
  logo_url: string | null;
  cor: string;
  ativa: number;
  ordem: number;
};

export async function listEmpresas(): Promise<Empresa[]> {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM empresas WHERE ativa = 1 ORDER BY ordem, nome'
  ).all() as Empresa[];
}

/**
 * Empresas que o usuário logado pode acessar.
 * Só quem tem acesso_global alterna; os demais ficam presos à própria empresa.
 */
export async function listEmpresasDoUsuario(): Promise<Empresa[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const todas = await listEmpresas();
  if (podeTrocarEmpresa(user)) return todas;
  return todas.filter(e => e.id === (user.empresa_id ?? EMPRESA_LAM));
}

/**
 * ID da empresa ativa. É a fonte única de verdade do filtro multi-empresa:
 * toda consulta do hub precisa passar por aqui.
 */
export async function getEmpresaId(): Promise<number> {
  const user = await getCurrentUser();
  const padrao = user?.empresa_id ?? EMPRESA_LAM;
  if (!podeTrocarEmpresa(user)) return padrao;

  const escolhida = Number(cookies().get(EMPRESA_COOKIE)?.value);
  if (!escolhida) return padrao;

  const db = getDb();
  const existe = db.prepare('SELECT id FROM empresas WHERE id = ? AND ativa = 1').get(escolhida);
  return existe ? escolhida : padrao;
}

export async function getEmpresaAtiva(): Promise<Empresa> {
  const id = await getEmpresaId();
  const db = getDb();
  const empresa = db.prepare('SELECT * FROM empresas WHERE id = ?').get(id) as Empresa | undefined;
  return empresa ?? (db.prepare('SELECT * FROM empresas WHERE id = ?').get(EMPRESA_LAM) as Empresa);
}

/** Troca a empresa ativa (só quem tem acesso_global). Chamada pelo seletor da sidebar. */
export async function trocarEmpresa(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const id = Number(formData.get('empresa_id'));
  const permitidas = await listEmpresasDoUsuario();
  if (!permitidas.some(e => e.id === id)) return;

  cookies().set(EMPRESA_COOKIE, String(id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath('/', 'layout');
  redirect('/');
}
