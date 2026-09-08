'use client';

import { useState, useTransition } from 'react';
import {
  atualizarStatus, deletarSolicitacao, deletarMultiplasSolicitacoes
} from './actions';
import ResponsavelSelect from './responsavel-select';
import SelectionBar, { CheckboxOverlay, SelectAllToggle } from '@/components/selection-bar';
import {
  Trash2, Calendar, MapPin, User as UserIcon, Edit3,
  Image as ImageIcon, Megaphone, Video, FileText, Palette, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import type { User } from '@/lib/types';

const STATUS_LABEL: Record<string, string> = {
  aberta: 'badge-blue',
  em_analise: 'badge-gold',
  em_execucao: 'badge-purple',
  concluida: 'badge-green',
  recusada: 'badge-red',
};
const PRIO_LABEL: Record<string, string> = {
  baixa: 'badge-slate',
  media: 'badge-blue',
  alta: 'badge-gold',
  urgente: 'badge-red',
};
const TIPO_ICON: Record<string, any> = {
  post: ImageIcon, anuncio: Megaphone, video: Video,
  panfleto: FileText, arte: Palette, evento: Sparkles, outro: FileText,
};

export default function SolicitacoesList({
  solicitacoes, usersTime, gerente = false
}: {
  solicitacoes: any[];
  usersTime: User[];
  gerente?: boolean;
}) {
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [pending, start] = useTransition();

  const toggle = (id: number) =>
    setSelecionados(prev => {
      const novo = new Set(prev);
      novo.has(id) ? novo.delete(id) : novo.add(id);
      return novo;
    });

  const selecionarTodos = () => setSelecionados(new Set(solicitacoes.map(i => i.id)));
  const alternarTodos = () => {
    if (selecionados.size === solicitacoes.length) setSelecionados(new Set());
    else selecionarTodos();
  };

  const excluir = () => {
    if (!confirm(`Excluir ${selecionados.size} solicitação(ões)?`)) return;
    start(async () => {
      await deletarMultiplasSolicitacoes(Array.from(selecionados));
      setSelecionados(new Set());
    });
  };

  return (
    <>
      {!gerente && (
        <SelectionBar
          count={selecionados.size}
          onClear={() => setSelecionados(new Set())}
          onDelete={excluir}
          pending={pending}
          label="solicitação"
          total={solicitacoes.length}
          onSelectAll={selecionarTodos}
        />
      )}

      {!gerente && (
        <div className="flex justify-end mb-3">
          <SelectAllToggle
            total={solicitacoes.length}
            selecionados={selecionados.size}
            onToggle={alternarTodos}
          />
        </div>
      )}

      <div className="space-y-3">
        {solicitacoes.map(s => {
          const Icon = TIPO_ICON[s.tipo] ?? FileText;
          const isSel = selecionados.has(s.id);
          return (
            <div
              key={s.id}
              className={`card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-4 group relative ${
                isSel ? 'ring-2 ring-navy-500 ring-offset-2' : ''
              }`}
            >
              {!gerente && (
                <CheckboxOverlay checked={isSel} onChange={() => toggle(s.id)} />
              )}

              <div className="flex items-start gap-3 w-full sm:flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center shrink-0 ${gerente ? '' : 'ml-6 sm:ml-6'}`}>
                  <Icon className="w-5 h-5 text-navy-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge-slate uppercase">{s.tipo}</span>
                    <span className={STATUS_LABEL[s.status]}>{s.status.replace('_', ' ')}</span>
                    <span className={PRIO_LABEL[s.prioridade]}>{s.prioridade}</span>
                  </div>
                  <h3 className="mt-2 text-base font-bold text-navy-900 break-words">{s.titulo}</h3>
                  {s.descricao && <p className="text-sm text-slate mt-1 break-words">{s.descricao}</p>}
                  <div className="mt-3 flex items-center gap-x-4 gap-y-1 text-xs text-slate-muted flex-wrap">
                    {s.loja_nome && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.loja_nome}</span>}
                    {s.solicitante_nome && <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> Solicitante: {s.solicitante_nome}</span>}
                    {s.responsavel_nome && <span className="text-navy-700 font-semibold">Resp.: {s.responsavel_nome}</span>}
                    {s.prazo && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {s.prazo}</span>}
                  </div>
                </div>
              </div>

              {gerente ? (
                /* Visão do gerente: só leitura - mostra status atual */
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 sm:shrink-0 text-xs w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-line">
                  <span className="text-slate-muted">Status atual</span>
                  <span className={STATUS_LABEL[s.status] + ' text-sm'}>
                    {s.status.replace('_', ' ')}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto sm:shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-line">
                    <ResponsavelSelect
                      solicitacaoId={s.id}
                      responsavelAtual={s.responsavel_id}
                      users={usersTime}
                    />
                    <div className="flex gap-1 flex-wrap">
                      {(['aberta', 'em_analise', 'em_execucao', 'concluida'] as const).map(st => (
                        <form key={st} action={atualizarStatus.bind(null, s.id, st)}>
                          <button className={
                            'text-[10px] px-2 py-1 rounded font-semibold whitespace-nowrap ' +
                            (s.status === st ? 'bg-navy-800 text-white' : 'bg-navy-50 text-navy-700 hover:bg-navy-100')
                          }>
                            {st.replace('_', ' ')}
                          </button>
                        </form>
                      ))}
                    </div>
                  </div>

                  <div className="absolute top-2 right-2 flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm('Excluir esta solicitação?')) return;
                        start(async () => { await deletarSolicitacao(s.id); });
                      }}
                      title="Excluir"
                      className="p-1.5 bg-white/90 hover:bg-white rounded text-rose-500 hover:text-rose-700 shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
