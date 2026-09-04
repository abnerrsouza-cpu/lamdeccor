'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import { getEmpresaId } from '@/lib/empresa';

export async function conectarIntegracao(formData: FormData) {
  const db = getDb();
  const plataforma = String(formData.get('plataforma') ?? '');
  const nome_conta = String(formData.get('nome_conta') ?? '');
  // Em produção, criptografar o token antes de salvar
  const token = String(formData.get('token') ?? '');
  const detalhes = JSON.stringify({ token_hash: token.slice(0, 6) + '...' + token.slice(-4) });
  const now = new Date().toISOString();

  // A empresa pode ainda não ter linha para essa plataforma (ex: empresa nova)
  db.prepare(`
    INSERT INTO integracoes (empresa_id, plataforma, nome_conta, conectado, ultima_sync, detalhes)
    VALUES (?, ?, ?, 1, ?, ?)
    ON CONFLICT(empresa_id, plataforma) DO UPDATE SET
      nome_conta = excluded.nome_conta,
      conectado = 1,
      ultima_sync = excluded.ultima_sync,
      detalhes = excluded.detalhes
  `).run(await getEmpresaId(), plataforma, nome_conta, now, detalhes);

  revalidatePath('/anuncios/integracoes');
}

export async function desconectarIntegracao(plataforma: string) {
  const db = getDb();
  db.prepare(`
    UPDATE integracoes SET conectado=0, nome_conta='', ultima_sync='', detalhes=''
    WHERE plataforma=? AND empresa_id=?
  `).run(plataforma, await getEmpresaId());
  revalidatePath('/anuncios/integracoes');
}
