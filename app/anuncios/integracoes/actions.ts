'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';

export async function conectarIntegracao(formData: FormData) {
  const db = getDb();
  const plataforma = String(formData.get('plataforma') ?? '');
  const nome_conta = String(formData.get('nome_conta') ?? '');
  // Em produção, criptografar o token antes de salvar
  const token = String(formData.get('token') ?? '');
  const detalhes = JSON.stringify({ token_hash: token.slice(0, 6) + '...' + token.slice(-4) });
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE integracoes SET nome_conta=?, conectado=1, ultima_sync=?, detalhes=?
    WHERE plataforma=?
  `).run(nome_conta, now, detalhes, plataforma);

  revalidatePath('/anuncios/integracoes');
}

export async function desconectarIntegracao(plataforma: string) {
  const db = getDb();
  db.prepare(`
    UPDATE integracoes SET conectado=0, nome_conta='', ultima_sync='', detalhes=''
    WHERE plataforma=?
  `).run(plataforma);
  revalidatePath('/anuncios/integracoes');
}
