'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import { getEmpresaId } from '@/lib/empresa';
import { getCurrentUser } from '@/lib/auth';
import { ehAdmin } from '@/lib/permissions';

async function podeMexer() {
  const user = await getCurrentUser();
  return ehAdmin(user?.role);
}

/** Confere se a loja é da empresa ativa antes de qualquer alteração. */
async function ehDaEmpresa(lojaId: number) {
  if (!(await podeMexer())) return false;
  const db = getDb();
  return !!db.prepare('SELECT id FROM lojas WHERE id = ? AND empresa_id = ?')
    .get(lojaId, await getEmpresaId());
}

export async function criarLoja(formData: FormData) {
  if (!(await podeMexer())) return;
  const nome = String(formData.get('nome') ?? '').trim();
  if (!nome) return;

  const db = getDb();
  db.prepare('INSERT INTO lojas (empresa_id, nome, cidade, endereco) VALUES (?, ?, ?, ?)').run(
    await getEmpresaId(),
    nome,
    String(formData.get('cidade') ?? '').trim(),
    String(formData.get('endereco') ?? '').trim() || null
  );
  revalidatePath('/configuracoes');
}

export async function atualizarLoja(id: number, formData: FormData) {
  if (!(await ehDaEmpresa(id))) return;
  const nome = String(formData.get('nome') ?? '').trim();
  if (!nome) return;

  const db = getDb();
  db.prepare('UPDATE lojas SET nome = ?, cidade = ?, endereco = ? WHERE id = ? AND empresa_id = ?').run(
    nome,
    String(formData.get('cidade') ?? '').trim(),
    String(formData.get('endereco') ?? '').trim() || null,
    id,
    await getEmpresaId()
  );
  revalidatePath('/configuracoes');
}

export type UsoDaLoja = {
  solicitacoes: number;
  usuarios: number;
  influencers: number;
  eventos: number;
  financeiro: number;
};

/** Quantos registros apontam para a loja — usado para avisar antes de excluir. */
export async function usoDaLoja(id: number): Promise<UsoDaLoja> {
  const db = getDb();
  const conta = (tabela: string, coluna = 'loja_id') =>
    (db.prepare(`SELECT COUNT(*) as c FROM ${tabela} WHERE ${coluna} = ?`).get(id) as { c: number }).c;

  return {
    solicitacoes: conta('solicitacoes'),
    usuarios: conta('users'),
    influencers: conta('influencers'),
    eventos: conta('eventos'),
    financeiro: conta('financeiro'),
  };
}

export async function deletarLoja(id: number): Promise<{ ok: boolean; erro?: string }> {
  if (!(await ehDaEmpresa(id))) {
    return { ok: false, erro: 'Sem permissão para excluir esta loja.' };
  }

  const db = getDb();
  const uso = await usoDaLoja(id);

  // solicitacoes.loja_id é NOT NULL: apagar a loja quebraria esses registros
  if (uso.solicitacoes > 0) {
    return {
      ok: false,
      erro: `Esta loja tem ${uso.solicitacoes} solicitaç${uso.solicitacoes === 1 ? 'ão' : 'ões'} ligada${uso.solicitacoes === 1 ? '' : 's'} a ela. ` +
        'Exclua ou transfira essas solicitações antes de remover a loja.',
    };
  }

  // As demais referências são opcionais: o registro fica, sem loja
  const tx = db.transaction((lojaId: number) => {
    for (const t of ['users', 'influencers', 'eventos', 'financeiro']) {
      db.prepare(`UPDATE ${t} SET loja_id = NULL WHERE loja_id = ?`).run(lojaId);
    }
    db.prepare('DELETE FROM lojas WHERE id = ?').run(lojaId);
  });
  tx(id);

  revalidatePath('/configuracoes');
  return { ok: true };
}
