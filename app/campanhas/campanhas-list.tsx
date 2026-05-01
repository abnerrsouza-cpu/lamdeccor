'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Calendar, DollarSign, Edit3, Archive, ArchiveRestore, Trash2
} from 'lucide-react';
import SelectionBar, { CheckboxOverlay } from '@/components/selection-bar';
import {
  arquivarCampanha, desarquivarCampanha,
  deletarCampanhaInline, deletarMultiplasCampanhas
} from './actions';
import type { Campanha } from '@/lib/types';

const STATUS: Record<string, string> = {
  planejamento: 'badge-gold',
  em_execucao: 'badge-green',
  finalizada: 'badge-slate',
  pausada: 'badge-red',
};

export default function CampanhasList({
  campanhas, arquivadas, editar = true
}: {
  campanhas: Campanha[];
  arquivadas: boolean;
  editar?: boolean;
}) {
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [pending, start] = useTransition();

  const toggle = (id: number) =>
    setSelecionados(prev => {
      const novo = new Set(prev);
      novo.has(id) ? novo.delete(id) : novo.add(id);
      return novo;
    });

  const excluir = () => {
    if (!confirm(`Excluir ${selecionados.size} campanha(s)? Esta ação não pode ser desfeita.`)) return;
    start(async () => {
      await deletarMultiplasCampanhas(Array.from(selecionados));
      setSelecionados(new Set());
    });
  };

  const fmtBRL = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  if (campanhas.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-slate-muted text-sm">
          {arquivadas
            ? 'Nenhuma campanha arquivada ainda.'
            : 'Nenhuma campanha ativa. Crie a primeira!'}
        </p>
      </div>
    );
  }

  return (
    <>
      {editar && (
        <SelectionBar
          count={selecionados.size}
          onClear={() => setSelecionados(new Set())}
          onDelete={excluir}
          pending={pending}
          label="campanha"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campanhas.map(c => {
          const isSel = selecionados.has(c.id);
          return (
            <div
              key={c.id}
              className={`card-hover overflow-hidden relative group ${
                isSel ? 'ring-2 ring-navy-500 ring-offset-2' : ''
              }`}
            >
              {editar && <CheckboxOverlay checked={isSel} onChange={() => toggle(c.id)} />}

              <Link href={`/campanhas/${c.id}`} className="block">
                <div className="h-3" style={{ backgroundColor: c.capa_cor }} />
                <div className={'p-5 ' + (editar ? 'pl-8' : '')}>

                  <div className="flex items-start justify-between mb-2">
                    <span className={STATUS[c.status] ?? 'badge-slate'}>{c.status.replace('_', ' ')}</span>
                    {c.orcamento > 0 && (
                      <span className="text-xs text-slate-muted flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> {fmtBRL(c.orcamento)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-navy-900">{c.nome}</h3>
                  {c.slogan && <p className="text-sm text-slate mt-1">{c.slogan}</p>}
                  {(c.data_inicio || c.data_fim) && (
                    <div className="mt-3 text-xs text-slate-muted flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {c.data_inicio} → {c.data_fim}
                    </div>
                  )}
                  {c.kpi_base && (
                    <p className="mt-3 text-xs text-slate italic line-clamp-2 border-t border-line pt-3">
                      {c.kpi_base}
                    </p>
                  )}
                </div>
              </Link>

              {/* Ações no canto superior direito - apenas pra quem pode editar */}
              {editar && (
              <div className="absolute top-2 right-2 flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/campanhas/${c.id}`}
                  className="p-1.5 bg-white/90 hover:bg-white rounded text-navy-600 hover:text-navy-900 shadow-sm"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </Link>
                {arquivadas ? (
                  <button
                    type="button"
                    onClick={() => start(async () => { await desarquivarCampanha(c.id); })}
                    title="Desarquivar"
                    className="p-1.5 bg-white/90 hover:bg-white rounded text-emerald-600 hover:text-emerald-700 shadow-sm"
                  >
                    <ArchiveRestore className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => start(async () => { await arquivarCampanha(c.id); })}
                    title="Arquivar"
                    className="p-1.5 bg-white/90 hover:bg-white rounded text-navy-600 hover:text-navy-900 shadow-sm"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm(`Excluir a campanha "${c.nome}"?`)) return;
                    start(async () => { await deletarCampanhaInline(c.id); });
                  }}
                  title="Excluir"
                  className="p-1.5 bg-white/90 hover:bg-white rounded text-rose-500 hover:text-rose-700 shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
