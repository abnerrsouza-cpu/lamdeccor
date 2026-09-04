'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Edit3, Trash2, MessageCircle, Zap } from 'lucide-react';
import SelectionBar, { CheckboxOverlay } from '@/components/selection-bar';
import { deletarParceiroInline, deletarMultiplosParceiros } from './actions';
import {
  STATUS_PARCEIRO, diasDesde, rotuloDias, fmtBRL, LIMITE_SEM_CONTATO,
} from './constantes';
import type { ParceiroCard } from './page';

/** Só dígitos, para montar o link do WhatsApp. */
function soDigitos(tel: string) {
  return tel.replace(/\D/g, '');
}

export default function ParceirosList({
  parceiros, editar,
}: {
  parceiros: ParceiroCard[];
  editar: boolean;
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
    if (!confirm(`Excluir ${selecionados.size} parceiro(s)? As indicações e conversas vão junto.`)) return;
    start(async () => {
      await deletarMultiplosParceiros(Array.from(selecionados));
      setSelecionados(new Set());
    });
  };

  return (
    <>
      {editar && (
        <SelectionBar
          count={selecionados.size}
          onClear={() => setSelecionados(new Set())}
          onDelete={excluir}
          pending={pending}
          label="parceiro"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {parceiros.map(p => {
          const status = STATUS_PARCEIRO[p.status] ?? STATUS_PARCEIRO.prospeccao;
          const iniciais = p.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
          const isSel = selecionados.has(p.id);

          const diasConversa = diasDesde(p.ultima_conversa);
          const frio = p.status === 'ativo' && (diasConversa === null || diasConversa > LIMITE_SEM_CONTATO);
          const conversao = p.total_indicacoes > 0
            ? Math.round((p.indicacoes_fechadas / p.total_indicacoes) * 100)
            : null;

          return (
            <div
              key={p.id}
              className={`card-hover relative group ${isSel ? 'ring-2 ring-navy-500 ring-offset-2' : ''}`}
            >
              {editar && <CheckboxOverlay checked={isSel} onChange={() => toggle(p.id)} />}

              <Link href={`/parceiros/${p.id}`} className="block p-5">
                <div className="flex items-start justify-between gap-2 pl-6">
                  <div className="w-12 h-12 rounded-xl bg-navy-100 flex items-center justify-center
                                  text-navy-700 font-bold shrink-0">
                    {iniciais}
                  </div>
                  <span className={status.className}>{status.label}</span>
                </div>

                <h3 className="mt-3 h3 truncate">{p.nome}</h3>
                {p.tipo && <p className="text-xs text-navy-500 font-semibold">{p.tipo}</p>}

                <div className="mt-2 space-y-1 text-xs text-slate-muted">
                  {p.responsavel && (
                    <div className="truncate">Contato: <span className="text-slate">{p.responsavel}</span></div>
                  )}
                  {p.telefone && (
                    <div className="flex items-center gap-1 truncate">
                      <Phone className="w-3 h-3 shrink-0" /> {p.telefone}
                    </div>
                  )}
                  {p.email && (
                    <div className="flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 shrink-0" /> {p.email}
                    </div>
                  )}
                  {p.cidade && (
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" /> {p.cidade}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-line grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-base font-bold text-navy-900">{p.total_indicacoes}</div>
                    <div className="text-[10px] text-slate-muted uppercase tracking-wide">Indicações</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-emerald-700">{p.indicacoes_fechadas}</div>
                    <div className="text-[10px] text-slate-muted uppercase tracking-wide">
                      Fechadas{conversao !== null && ` · ${conversao}%`}
                    </div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-navy-900 truncate">{fmtBRL(p.valor_fechado)}</div>
                    <div className="text-[10px] text-slate-muted uppercase tracking-wide">Gerado</div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-line space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-muted flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> Última conversa
                    </span>
                    <span className={`font-semibold ${frio ? 'text-amber-700' : 'text-navy-700'}`}>
                      {p.ultima_conversa ? rotuloDias(diasConversa) : 'nunca'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-muted flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Ativação
                    </span>
                    <span className="font-semibold text-navy-700">
                      {p.data_ativacao
                        ? new Date(p.data_ativacao + 'T00:00:00').toLocaleDateString('pt-BR')
                        : '—'}
                    </span>
                  </div>
                </div>

                {frio && (
                  <div className="mt-3 text-[11px] text-amber-800 bg-amber-50 border border-amber-200
                                  rounded-lg px-2.5 py-1.5">
                    Parceiro ativo sem conversa registrada
                    {diasConversa !== null ? ` há ${diasConversa} dias` : ''}.
                  </div>
                )}
              </Link>

              {editar && (
                <div className="absolute top-2 right-2 flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  {p.telefone && (
                    <a
                      href={`https://wa.me/55${soDigitos(p.telefone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      title="Abrir no WhatsApp"
                      className="p-1.5 bg-white/90 hover:bg-white rounded text-emerald-600 hover:text-emerald-700 shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <Link
                    href={`/parceiros/${p.id}`}
                    className="p-1.5 bg-white/90 hover:bg-white rounded text-navy-600 hover:text-navy-900 shadow-sm"
                    title="Abrir"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm(`Excluir o parceiro "${p.nome}"? As indicações e conversas vão junto.`)) return;
                      start(async () => { await deletarParceiroInline(p.id); });
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
