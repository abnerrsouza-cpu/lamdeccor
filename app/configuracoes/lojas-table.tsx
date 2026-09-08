'use client';

import { useState, useTransition } from 'react';
import { Pencil, Trash2, Check, X, Store } from 'lucide-react';
import { atualizarLoja, deletarLoja } from './actions';
import type { Loja } from '@/lib/types';

export type LojaComUso = Loja & {
  em_uso: number;
  /** Bloqueiam a exclusão: solicitacoes.loja_id é NOT NULL */
  solicitacoes: number;
};

export default function LojasTable({ lojas }: { lojas: LojaComUso[] }) {
  const [editando, setEditando] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const excluir = (l: LojaComUso) => {
    // Solicitações impedem a exclusão: avisa aqui em vez de prometer e falhar
    if (l.solicitacoes > 0) {
      setErro(
        `"${l.nome}" tem ${l.solicitacoes} solicitaç${l.solicitacoes === 1 ? 'ão' : 'ões'} ligada${l.solicitacoes === 1 ? '' : 's'} a ela. ` +
        'Exclua ou transfira essas solicitações antes de remover a loja.'
      );
      return;
    }

    const outros = l.em_uso - l.solicitacoes;
    const aviso = outros > 0
      ? `"${l.nome}" está ligada a ${outros} registro(s) em Financeiro, Influencers, Calendário ou Usuários. Eles continuarão existindo, mas ficarão sem loja. Excluir mesmo assim?`
      : `Excluir "${l.nome}"?`;
    if (!confirm(aviso)) return;
    setErro(null);
    start(async () => {
      const r = await deletarLoja(l.id);
      if (!r.ok) setErro(r.erro ?? 'Não foi possível excluir.');
    });
  };

  if (lojas.length === 0) {
    return (
      <div className="card p-10 text-center">
        <Store className="w-8 h-8 text-slate-muted mx-auto mb-3" />
        <p className="text-sm text-slate">Nenhuma loja cadastrada ainda.</p>
      </div>
    );
  }

  return (
    <>
      {erro && (
        <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
          {erro}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-navy-50 text-navy-700">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Nome</th>
              <th className="px-4 py-2 text-left font-semibold">Cidade</th>
              <th className="px-4 py-2 text-left font-semibold">Endereço</th>
              <th className="px-4 py-2 text-left font-semibold">Em uso</th>
              <th className="px-4 py-2 w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {lojas.map(l => (
              editando === l.id ? (
                <tr key={l.id} className="bg-navy-50/40">
                  <td colSpan={5} className="px-4 py-3">
                    <form
                      action={async (fd) => {
                        await atualizarLoja(l.id, fd);
                        setEditando(null);
                      }}
                      className="flex flex-col md:flex-row gap-2 md:items-end"
                    >
                      <div className="flex-1">
                        <label className="label">Nome</label>
                        <input name="nome" required defaultValue={l.nome} className="input" />
                      </div>
                      <div className="flex-1">
                        <label className="label">Cidade</label>
                        <input name="cidade" defaultValue={l.cidade} className="input" />
                      </div>
                      <div className="flex-1">
                        <label className="label">Endereço</label>
                        <input name="endereco" defaultValue={l.endereco ?? ''} className="input" />
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button type="submit" className="btn-primary !px-3" title="Salvar">
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditando(null)}
                          className="btn-secondary !px-3"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={l.id} className={`group hover:bg-navy-50/30 ${pending ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-navy-900">{l.nome}</td>
                  <td className="px-4 py-3 text-slate">{l.cidade || '—'}</td>
                  <td className="px-4 py-3 text-slate text-xs">{l.endereco || '—'}</td>
                  <td className="px-4 py-3">
                    {l.em_uso > 0
                      ? <span className="badge-blue">{l.em_uso} registro{l.em_uso === 1 ? '' : 's'}</span>
                      : <span className="text-xs text-slate-muted">livre</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => { setErro(null); setEditando(l.id); }}
                        title="Editar"
                        className="p-1.5 rounded text-navy-600 hover:text-navy-900 hover:bg-navy-50"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => excluir(l)}
                        title="Excluir"
                        className="p-1.5 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
