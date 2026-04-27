'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function marcarLida(id: number) {
  const db = getDb();
  db.prepare('UPDATE notificacoes SET lida = 1 WHERE id = ?').run(id);
  revalidatePath('/notificacoes');
}

export async function marcarTodasLidas() {
  const u = await getCurrentUser();
  if (!u) return;
  const db = getDb();
  db.prepare('UPDATE notificacoes SET lida = 1 WHERE user_id = ?').run(u.id);
  revalidatePath('/notificacoes');
}
