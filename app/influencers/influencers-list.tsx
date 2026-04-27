'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { MapPin, Calendar, Edit3, Trash2 } from 'lucide-react';
import SelectionBar, { CheckboxOverlay } from '@/components/selection-bar';
import { deletarInfluencerInline, deletarMultiplosInfluencers } from './actions';
import type { Influencer, InfluencerRede } from '@/lib/types';

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  ativo: { label: 'Ativo', className: 'badge-green' },
  em_negociacao: { label: 'Em negociação', className: 'badge-gold' },
  prospeccao: { label: 'Prospecção', className: 'badge-slate' },
  pausado: { label: 'Pausado', className: 'badge-red' },
};

type Item = Influencer & { loja_nome: string | null };

export default function InfluencersList({
  influencers, redesByInf
}: {
  influencers: Item[];
  redesByInf: Record<number, InfluencerRede[]>;
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
    if (!confirm(`Excluir ${selecionados.size} influencer(es)?`)) return;
    start(async () => {
      await deletarMultiplosInfluencers(Array.from(selecionados));
      setSelecionados(new Set());
    });
  };

  const fmtNum = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
  const fmtBRL = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  return (
    <>
      <SelectionBar
        count={selecionados.size}
        onClear={() => setSelecionados(new Set())}
        onDelete={excluir}
        pending={pending}
        label="influencer"
      />

      <div className="grid grid-cols-3 gap-4">
        {influencers.map((inf) => {
          const status = STATUS_LABEL[inf.status] ?? STATUS_LABEL.prospeccao;
          const initials = inf.nome.split(' ').slice(0, 2).map(n => n[0]).join('');
          const redes = redesByInf[inf.id] ?? [];
          const isSel = selecionados.has(inf.id);

          return (
            <div
              key={inf.id}
              className={`card-hover relative group ${isSel ? 'ring-2 ring-navy-500 ring-offset-2' : ''}`}
            >
              <CheckboxOverlay checked={isSel} onChange={() => toggle(inf.id)} />

              <Link href={`/influencers/${inf.id}`} className="block p-5">
                <div className="flex items-start justify-between pl-6">
                  {inf.avatar_url ? (
                    <img
                      src={inf.avatar_url}
                      alt={inf.nome}
                      className="w-14 h-14 rounded-full object-cover border-2 border-line"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-navy-100 flex items-center justify-center
                                    text-navy-700 font-bold text-lg">
                      {initials}
                    </div>
                  )}
                  <span className={status.className}>{status.label}</span>
                </div>
                <h3 className="mt-3 h3">{inf.nome}</h3>
                <p className="text-xs text-navy-500 font-semibold">{inf.handle}</p>
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-muted">
                  <MapPin className="w-3 h-3" />
                  {inf.cidade}
                  {inf.loja_nome && <span>· {inf.loja_nome}</span>}
                </div>
                {redes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {redes.map(r => (
                      <span key={r.id} className="badge-slate capitalize">
                        {r.rede} · {fmtNum(r.seguidores)}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-sm text-slate line-clamp-2">{inf.perfil}</p>
                <div className="mt-4 pt-4 border-t border-line space-y-1 text-xs">
                  {inf.valor_acordo > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-muted">Acordo</span>
                      <span className="font-bold text-navy-900">{fmtBRL(inf.valor_acordo)}</span>
                    </div>
                  )}
                  {inf.acordo_fim && (
                    <div className="flex justify-between">
                      <span className="text-slate-muted">Vigência até</span>
                      <span className="font-semibold text-navy-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {inf.acordo_fim}
                      </span>
                    </div>
                  )}
                </div>
              </Link>

              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/influencers/${inf.id}`}
                  className="p-1.5 bg-white/90 hover:bg-white rounded text-navy-600 hover:text-navy-900 shadow-sm"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </Link>
                <form action={async () => {
                  if (!confirm(`Excluir o influencer "${inf.nome}"?`)) return;
                  await deletarInfluencerInline(inf.id);
                }}>
                  <button
                    title="Excluir"
                    className="p-1.5 bg-white/90 hover:bg-white rounded text-rose-500 hover:text-rose-700 shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
