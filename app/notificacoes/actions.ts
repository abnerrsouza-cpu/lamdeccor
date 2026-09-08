'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import { getEmpresaId } from '@/lib/empresa';
import { getCurrentUser } from '@/lib/auth';

export async function marcarLida(id: number) {
  const db = getDb();
  const u = await getCurrentUser();
  if (!u) return;
  db.prepare('UPDATE notificacoes SET lida = 1 WHERE id = ? AND user_id = ?').run(id, u.id);
  revalidatePath('/notificacoes');
}

export async function marcarTodasLidas() {
  const u = await getCurrentUser();
  if (!u) return;
  const db = getDb();
  db.prepare('UPDATE notificacoes SET lida = 1 WHERE user_id = ? AND empresa_id = ?')
    .run(u.id, await getEmpresaId());
  revalidatePath('/notificacoes');
}
