'use client';

import { useState, useTransition } from 'react';
import { atualizarCanal, atualizarTituloCanal, deletarCanal } from '../actions';
import { Edit3, Check, X, Trash2 } from 'lucide-react';
import type { CampanhaCanal } from '@/lib/types';

const CANAL_ICON: Record<string, string> = {
  'INSTAGRAM': '📸',
  'META ADS': '📊',
  'GOOGLE ADS': '🔍',
  'WHATSAPP': '💬',
  'RECLAME AQUI': '⭐',
  'INFLUENCERS': '👥',
  'GMN': '📍',
  'MÍDIA OFF': '🏬',
  'DESIGNER': '🎨',
  'AUDIOVISUAL': '🎬',
  'DADOS': '📈',
};

function iconePara(titulo: string) {
  const upper = titulo.toUpperCase();
  if (CANAL_ICON[upper]) return CANAL_ICON[upper];
  // Detecção fuzzy por palavras-chave
  if (/insta/i.test(titulo)) return '📸';
  if (/meta|facebook|fb/i.test(titulo)) return '📊';
  if (/google|search/i.test(titulo)) return '🔍';
  if (/whats/i.test(titulo)) return '💬';
  if (/reclame|ra/i.test(titulo)) return '⭐';
  if (/influ/i.test(titulo)) return '👥';
  if (/gmn|maps|negoc/i.test(titulo)) return '📍';
  if (/midia|outdoor|off|shopping/i.test(titulo)) return '🏬';
  if (/desig|arte/i.test(titulo)) return '🎨';
  if (/audio|video|filme/i.test(titulo)) return '🎬';
  if (/dado|kpi|relat/i.test(titulo)) return '📈';
  return '•';
}

export default function CanalEditor({ canal }: { canal: CampanhaCanal }) {
  const [editingTitulo, setEditingTitulo] = useState(false);
  const [editingConteudo, setEditingConteudo] = useState(false);
  const [titulo, setTitulo] = useState(canal.canal);
  const [conteudo, setConteudo] = useState(canal.conteudo);
  const [pending, start] = useTransition();

  const salvarTitulo = () => {
    if (!titulo.trim()) { setTitulo(canal.canal); setEditingTitulo(false); return; }
    start(async () => {
      await atualizarTituloCanal(canal.id, canal.campanha_id, titulo.trim());
      setEditingTitulo(false);
    });
  };

  const salvarConteudo = () => {
    start(async () => {
      await atualizarCanal(canal.id, canal.campanha_id, conteudo);
      setEditingConteudo(false);
    });
  };

  const excluir = () => {
    if (!confirm(`Excluir o card "${canal.canal}"?`)) return;
    start(async () => {
      await deletarCanal(canal.id, canal.campanha_id);
    });
  };

  return (
    <div className="card p-4 group flex flex-col">
      {/* Cabeçalho com ícone, título editável e ações */}
      <div className="flex items-center gap-2 pb-3 border-b border-line">
        <span className="text-lg shrink-0">{iconePara(titulo)}</span>

        {editingTitulo ? (
          <div className="flex-1 flex items-center gap-1">
            <input
              autoFocus
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') salvarTitulo();
                if (e.key === 'Escape') { setTitulo(canal.canal); setEditingTitulo(false); }
              }}
              className="input !text-sm !py-1 !px-2 uppercase font-bold tracking-wider"
              placeholder="Nome do canal"
            />
            <button onClick={salvarTitulo} className="text-emerald-600 hover:bg-emerald-50 rounded p-1" title="Salvar">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => { setTitulo(canal.canal); setEditingTitulo(false); }}
                    className="text-slate hover:bg-slate-100 rounded p-1" title="Cancelar">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <h4 className="flex-1 font-bold text-navy-900 text-sm uppercase tracking-wider truncate">
              {canal.canal}
            </h4>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setEditingTitulo(true)}
                className="text-navy-500 hover:text-navy-700 hover:bg-navy-50 rounded p-1"
                title="Editar título"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={excluir}
                className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded p-1"
                title="Excluir card"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Corpo do card - conteúdo editável */}
      <div className="pt-3 flex-1">
        {editingConteudo ? (
          <div className="space-y-2">
            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={10}
              className="input text-xs"
              placeholder={`Conteúdo do canal ${canal.canal}...`}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setConteudo(canal.conteudo); setEditingConteudo(false); }}
                      className="btn-secondary !py-1 !text-xs">
                <X className="w-3 h-3" /> Cancelar
              </button>
              <button onClick={salvarConteudo} disabled={pending} className="btn-primary !py-1 !text-xs">
                <Check className="w-3 h-3" /> Salvar
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setEditingConteudo(true)}
            className="text-xs text-slate whitespace-pre-line min-h-[100px] cursor-text hover:bg-navy-50/30 -mx-1 px-1 py-1 rounded transition-colors"
          >
            {canal.conteudo || (
              <span className="italic text-slate-muted">
                Clique aqui para preencher.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
