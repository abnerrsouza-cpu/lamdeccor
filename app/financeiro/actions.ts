'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db';

export async function criarMovimento(formData: FormData) {
  const db = getDb();
  const r = db.prepare(`
    INSERT INTO financeiro (tipo, categoria, descricao, valor, data, campanha, loja_id, fornecedor, nf_numero, observacoes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    String(formData.get('tipo') ?? 'saida'),
    String(formData.get('categoria') ?? ''),
    String(formData.get('descricao') ?? ''),
    Number(formData.get('valor') ?? 0),
    String(formData.get('data') ?? ''),
    String(formData.get('campanha') ?? '') || null,
    formData.get('loja_id') ? Number(formData.get('loja_id')) : null,
    String(formData.get('fornecedor') ?? ''),
    String(formData.get('nf_numero') ?? ''),
    String(formData.get('observacoes') ?? ''),
    String(formData.get('status') ?? 'pago')
  );
  revalidatePath('/financeiro');
  redirect(`/financeiro/${r.lastInsertRowid}`);
}

export async function atualizarMovimento(id: number, formData: FormData) {
  const db = getDb();
  db.prepare(`
    UPDATE financeiro SET tipo=?, categoria=?, descricao=?, valor=?, data=?, campanha=?, loja_id=?, fornecedor=?, nf_numero=?, observacoes=?, status=?
    WHERE id=?
  `).run(
    String(formData.get('tipo') ?? 'saida'),
    String(formData.get('categoria') ?? ''),
    String(formData.get('descricao') ?? ''),
    Number(formData.get('valor') ?? 0),
    String(formData.get('data') ?? ''),
    String(formData.get('campanha') ?? '') || null,
    formData.get('loja_id') ? Number(formData.get('loja_id')) : null,
    String(formData.get('fornecedor') ?? ''),
    String(formData.get('nf_numero') ?? ''),
    String(formData.get('observacoes') ?? ''),
    String(formData.get('status') ?? 'pago'),
    id
  );
  revalidatePath(`/financeiro/${id}`);
  revalidatePath('/financeiro');
}

export async function uploadNF(id: number, formData: FormData) {
  const db = getDb();
  const url = String(formData.get('nf_arquivo') ?? '');
  db.prepare('UPDATE financeiro SET nf_arquivo=? WHERE id=?').run(url, id);
  revalidatePath(`/financeiro/${id}`);
}

export async function deletarMovimento(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM financeiro WHERE id = ?').run(id);
  revalidatePath('/financeiro');
  redirect('/financeiro');
}

export async function deletarMovimentoInline(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM financeiro WHERE id = ?').run(id);
  revalidatePath('/financeiro');
}

export async function deletarMultiplosMovimentos(ids: number[]) {
  if (ids.length === 0) return;
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM financeiro WHERE id IN (${placeholders})`).run(...ids);
  revalidatePath('/financeiro');
}
