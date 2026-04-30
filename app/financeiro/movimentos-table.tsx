'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Trash2, Edit3 } from 'lucide-react';
import SelectionBar from '@/components/selection-bar';
import { deletarMovimentoInline, deletarMultiplosMovimentos } from './actions';
import type { MovimentoFinanceiro } from '@/lib/types';

export default function MovimentosTable({
  movs
}: {
  movs: (MovimentoFinanceiro & { loja_nome: string | null })[];
}) {
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [pending, start] = useTransition();

  const toggle = (id: number) =>
    setSelecionados(prev => {
      const novo = new Set(prev);
      novo.has(id) ? novo.delete(id) : novo.add(id);
      return novo;
    });

  const toggleAll = () => {
    if (selecionados.size === movs.length) setSelecionados(new Set());
    else setSelecionados(new Set(movs.map(m => m.id)));
  };

  const excluir = () => {
    if (!confirm(`Excluir ${selecionados.size} lançamento(s)?`)) return;
    start(async () => {
      await deletarMultiplosMovimentos(Array.from(selecionados));
      setSelecionados(new Set());
    });
  };

  const fmtBRL = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  return (
    <>
      <SelectionBar
        count={selecionados.size}
        onClear={() => setSelecionados(new Set())}
        onDelete={excluir}
        pending={pending}
        label="lançamento"
      />
      <div className="card overflow-x-auto">
        <div className="px-5 py-4 border-b border-line">
          <h2 className="h2">Lançamentos recentes</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-navy-50 text-navy-700">
            <tr>
              <th className="px-3 py-3 w-8">
                <input
                  type="checkbox"
                  checked={selecionados.size === movs.length && movs.length > 0}
                  onChange={toggleAll}
                  className="cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold">Data</th>
              <th className="px-4 py-3 text-left font-semibold">Tipo</th>
              <th className="px-4 py-3 text-left font-semibold">Categoria</th>
              <th className="px-4 py-3 text-left font-semibold">Descrição</th>
              <th className="px-4 py-3 text-left font-semibold">Campanha</th>
              <th className="px-4 py-3 text-left font-semibold">NF</th>
              <th className="px-4 py-3 text-right font-semibold">Valor</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {movs.map(m => {
              const isSel = selecionados.has(m.id);
              return (
                <tr key={m.id} className={`group hover:bg-navy-50/30 ${isSel ? 'bg-navy-50' : ''}`}>
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => toggle(m.id)}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate">
                    <Link href={`/financeiro/${m.id}`}>{m.data}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={m.tipo === 'saida' ? 'badge-red' : 'badge-green'}>{m.tipo}</span>
                  </td>
                  <td className="px-4 py-3">{m.categoria}</td>
                  <td className="px-4 py-3">
                    <Link href={`/financeiro/${m.id}`} className="font-semibold text-navy-900 hover:text-navy-500">
                      {m.descricao}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate">{m.campanha ?? '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    {m.nf_arquivo ? <span className="badge-green">anexada</span> :
                      m.nf_numero ? <span className="badge-slate">{m.nf_numero}</span> :
                      <span className="text-slate-muted">—</span>}
                  </td>
                  <td className={'px-4 py-3 text-right font-bold ' + (m.tipo === 'saida' ? 'text-rose-600' : 'text-emerald-700')}>
                    {m.tipo === 'saida' ? '−' : '+'}{fmtBRL(m.valor)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      <Link href={`/financeiro/${m.id}`} className="p-1 text-navy-500 hover:text-navy-900" title="Editar">
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          if (!confirm(`Excluir o lançamento "${m.descricao}"?`)) return;
                          start(async () => { await deletarMovimentoInline(m.id); });
                        }}
                        title="Excluir"
                        className="p-1 text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
