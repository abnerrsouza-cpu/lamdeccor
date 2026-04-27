'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';

export async function criarUsuario(formData: FormData) {
  const db = getDb();
  db.prepare(`
    INSERT INTO users (nome, usuario, email, senha, role, hierarquia, cargo, loja_id, ativo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    String(formData.get('nome') ?? ''),
    String(formData.get('usuario') ?? ''),
    String(formData.get('email') ?? ''),
    String(formData.get('senha') ?? '123456'),
    String(formData.get('role') ?? 'social_media'),
    Number(formData.get('hierarquia') ?? 5),
    String(formData.get('cargo') ?? ''),
    formData.get('loja_id') ? Number(formData.get('loja_id')) : null
  );
  revalidatePath('/usuarios');
}

export async function alternarAtivo(id: number, novoEstado: number) {
  const db = getDb();
  db.prepare('UPDATE users SET ativo = ? WHERE id = ?').run(novoEstado, id);
  revalidatePath('/usuarios');
}

export async function deletarUsuario(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  revalidatePath('/usuarios');
}

export async function deletarMultiplosUsuarios(ids: number[]) {
  if (ids.length === 0) return;
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM users WHERE id IN (${placeholders})`).run(...ids);
  revalidatePath('/usuarios');
}
