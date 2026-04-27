import Topbar from '@/components/topbar';
import { getDb } from '@/lib/db';
import { atualizarMovimento, deletarMovimento, uploadNF } from '../actions';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Trash2, FileText, Upload, ExternalLink } from 'lucide-react';
import type { MovimentoFinanceiro, Loja } from '@/lib/types';

export default function MovimentoDetail({ params }: { params: { id: string } }) {
  const db = getDb();
  const id = Number(params.id);
  const m = db.prepare(`
    SELECT f.*, l.nome as loja_nome
    FROM financeiro f
    LEFT JOIN lojas l ON l.id = f.loja_id
    WHERE f.id = ?
  `).get(id) as (MovimentoFinanceiro & { loja_nome: string | null }) | undefined;
  if (!m) notFound();
  const lojas = db.prepare('SELECT * FROM lojas ORDER BY nome').all() as Loja[];

  const fmtBRL = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  return (
    <>
      <Topbar title={m.descricao} subtitle={`${m.tipo} · ${m.data}`} />
      <main className="p-6 space-y-6">
        <Link href="/financeiro" className="text-sm text-navy-500 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Voltar
        </Link>

        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <span className={m.tipo === 'saida' ? 'badge-red' : 'badge-green'}>
              {m.tipo === 'saida' ? 'SAÍDA' : 'ENTRADA'}
            </span>
            <span className={
              m.status === 'pago' ? 'badge-green' :
              m.status === 'pendente' ? 'badge-gold' : 'badge-slate'
            }>{m.status}</span>
          </div>
          <h2 className="text-2xl font-bold text-navy-900">{m.descricao}</h2>
          <div className={'mt-2 text-3xl font-bold ' + (m.tipo === 'saida' ? 'text-rose-600' : 'text-emerald-700')}>
            {m.tipo === 'saida' ? '−' : '+'}{fmtBRL(m.valor)}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-4 text-sm">
            <Field label="Data" value={m.data} />
            <Field label="Categoria" value={m.categoria} />
            <Field label="Campanha" value={m.campanha ?? '—'} />
            <Field label="Loja" value={m.loja_nome ?? '—'} />
            <Field label="Fornecedor" value={m.fornecedor || '—'} />
            <Field label="Número da NF" value={m.nf_numero || '—'} />
          </div>
          {m.observacoes && (
            <div className="mt-5 pt-5 border-t border-line">
              <div className="label">Observações</div>
              <p className="text-sm text-slate">{m.observacoes}</p>
            </div>
          )}
        </div>

        {/* Nota fiscal */}
        <div className="card p-6">
          <h3 className="h2 mb-4 flex items-center gap-2"><FileText className="w-4 h-4" /> Nota fiscal</h3>
          {m.nf_arquivo ? (
            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div>
                <div className="text-sm font-semibold text-emerald-700">Nota fiscal anexada</div>
                <div className="text-xs text-slate truncate max-w-md">{m.nf_arquivo}</div>
              </div>
              <a href={m.nf_arquivo} target="_blank" rel="noopener" className="btn-secondary">
                <ExternalLink className="w-4 h-4" /> Abrir
              </a>
            </div>
          ) : (
            <p className="text-sm text-slate-muted mb-3">Nenhum arquivo anexado.</p>
          )}
          <form action={uploadNF.bind(null, id)} className="mt-3 space-y-3">
            <div>
              <label className="label">URL do arquivo (Google Drive, Dropbox, etc)</label>
              <input name="nf_arquivo" defaultValue={m.nf_arquivo} type="url" className="input"
                placeholder="https://drive.google.com/..." />
              <p className="text-xs text-slate-muted mt-1">
                Cole o link do arquivo da NF. Em produção, isso vira upload direto.
              </p>
            </div>
            <button type="submit" className="btn-primary">
              <Upload className="w-4 h-4" /> Salvar link da NF
            </button>
          </form>
        </div>

        {/* Edição */}
        <details className="card p-6">
          <summary className="cursor-pointer h2">Editar lançamento</summary>
          <form action={atualizarMovimento.bind(null, id)} className="mt-5 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Tipo</label>
                <select name="tipo" defaultValue={m.tipo} className="input">
                  <option value="saida">Saída</option>
                  <option value="entrada">Entrada</option>
                </select>
              </div>
              <div>
                <label className="label">Categoria</label>
                <input name="categoria" defaultValue={m.categoria} className="input" />
              </div>
              <div>
                <label className="label">Status</label>
                <select name="status" defaultValue={m.status} className="input">
                  <option value="pago">Pago</option>
                  <option value="pendente">Pendente</option>
                  <option value="previsto">Previsto</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Descrição</label>
              <input name="descricao" defaultValue={m.descricao} required className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Valor</label>
                <input type="number" step="0.01" name="valor" defaultValue={m.valor} className="input" />
              </div>
              <div>
                <label className="label">Data</label>
                <input type="date" name="data" defaultValue={m.data} className="input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Campanha</label>
                <input name="campanha" defaultValue={m.campanha ?? ''} className="input" />
              </div>
              <div>
                <label className="label">Loja</label>
                <select name="loja_id" defaultValue={m.loja_id ?? ''} className="input">
                  <option value="">— Nenhuma —</option>
                  {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Fornecedor</label>
                <input name="fornecedor" defaultValue={m.fornecedor} className="input" />
              </div>
              <div>
                <label className="label">Nº NF</label>
                <input name="nf_numero" defaultValue={m.nf_numero} className="input" />
              </div>
            </div>
            <div>
              <label className="label">Observações</label>
              <textarea name="observacoes" defaultValue={m.observacoes} rows={2} className="input" />
            </div>
            <div className="flex justify-between pt-3 border-t border-line">
              <form action={deletarMovimento.bind(null, id)}>
                <button className="btn-danger"><Trash2 className="w-4 h-4" /> Excluir</button>
              </form>
              <button type="submit" className="btn-primary">Salvar</button>
            </div>
          </form>
        </details>
      </main>
    </>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs text-slate-muted">{label}</div>
      <div className="font-semibold text-navy-900">{value}</div>
    </div>
  );
}
