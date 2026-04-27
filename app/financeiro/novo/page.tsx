import Topbar from '@/components/topbar';
import { getDb } from '@/lib/db';
import { criarMovimento } from '../actions';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Loja } from '@/lib/types';

export default function NovoMovimentoPage() {
  const db = getDb();
  const lojas = db.prepare('SELECT * FROM lojas ORDER BY nome').all() as Loja[];

  return (
    <>
      <Topbar title="Novo lançamento" />
      <main className="p-6">
        <Link href="/financeiro" className="text-sm text-navy-500 hover:underline flex items-center gap-1 mb-4">
          <ArrowLeft className="w-3 h-3" /> Voltar
        </Link>
        <form action={criarMovimento} className="card p-6 max-w-3xl space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Tipo</label>
              <select name="tipo" className="input">
                <option value="saida">Saída</option>
                <option value="entrada">Entrada</option>
              </select>
            </div>
            <div>
              <label className="label">Categoria</label>
              <input name="categoria" className="input" placeholder="Mídia paga / Produção / Influencer" />
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" className="input">
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
                <option value="previsto">Previsto</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Descrição</label>
            <input name="descricao" required className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor (R$)</label>
              <input type="number" name="valor" step="0.01" required className="input" />
            </div>
            <div>
              <label className="label">Data</label>
              <input type="date" name="data" required className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Campanha</label>
              <input name="campanha" className="input" />
            </div>
            <div>
              <label className="label">Loja</label>
              <select name="loja_id" className="input">
                <option value="">— Nenhuma —</option>
                {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fornecedor</label>
              <input name="fornecedor" className="input" />
            </div>
            <div>
              <label className="label">Número da NF</label>
              <input name="nf_numero" className="input" placeholder="NFE-12345" />
            </div>
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea name="observacoes" rows={2} className="input" />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-line">
            <Link href="/financeiro" className="btn-secondary">Cancelar</Link>
            <button type="submit" className="btn-primary">Salvar lançamento</button>
          </div>
        </form>
      </main>
    </>
  );
}
