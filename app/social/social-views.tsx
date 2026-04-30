'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { LayoutGrid, List, Calendar as CalendarIcon, Hash, Clock, Edit3, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import SelectionBar, { CheckboxOverlay } from '@/components/selection-bar';
import { deletarPostInline, deletarMultiplosPosts } from './actions';
import type { PostSocial } from '@/lib/types';

const STATUS_BADGE: Record<string, string> = {
  rascunho: 'badge-slate',
  agendado: 'badge-gold',
  publicado: 'badge-green',
};
const REDE_COR: Record<string, string> = {
  instagram: '#E4405F',
  tiktok: '#000000',
  youtube: '#FF0000',
  linkedin: '#0A66C2',
  facebook: '#1877F2',
};

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

type View = 'cards' | 'lista' | 'calendario';

type PostWithUser = PostSocial & { responsavel_nome: string | null };

export default function SocialViews({ posts }: { posts: PostWithUser[] }) {
  const [view, setView] = useState<View>('cards');
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [pending, start] = useTransition();

  const toggle = (id: number) =>
    setSelecionados(prev => {
      const novo = new Set(prev);
      novo.has(id) ? novo.delete(id) : novo.add(id);
      return novo;
    });

  const excluir = () => {
    if (!confirm(`Excluir ${selecionados.size} post(s)?`)) return;
    start(async () => {
      await deletarMultiplosPosts(Array.from(selecionados));
      setSelecionados(new Set());
    });
  };

  return (
    <>
      <SelectionBar
        count={selecionados.size}
        onClear={() => setSelecionados(new Set())}
        onDelete={excluir}
        pending={pending}
        label="post"
      />

      <div className="flex items-center justify-between mb-5">
        <div className="inline-flex bg-navy-50 rounded-lg p-1">
          <ViewBtn active={view === 'cards'} onClick={() => setView('cards')} icon={LayoutGrid} label="Cards" />
          <ViewBtn active={view === 'lista'} onClick={() => setView('lista')} icon={List} label="Lista" />
          <ViewBtn active={view === 'calendario'} onClick={() => setView('calendario')} icon={CalendarIcon} label="Calendário" />
        </div>
        <span className="text-xs text-slate-muted">{posts.length} posts</span>
      </div>

      {view === 'cards' && <CardsView posts={posts} selecionados={selecionados} toggle={toggle} />}
      {view === 'lista' && <ListaView posts={posts} selecionados={selecionados} toggle={toggle} />}
      {view === 'calendario' && <CalendarioView posts={posts} ano={ano} mes={mes} setAno={setAno} setMes={setMes} />}
    </>
  );
}

function ViewBtn({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors',
        active ? 'bg-white shadow-sm text-navy-900' : 'text-slate hover:text-navy-900'
      )}
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}

function CardsView({ posts, selecionados, toggle }: {
  posts: PostWithUser[];
  selecionados: Set<number>;
  toggle: (id: number) => void;
}) {
  const [, start] = useTransition();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {posts.map(post => {
        const isSel = selecionados.has(post.id);
        return (
          <div
            key={post.id}
            className={`card-hover relative group ${isSel ? 'ring-2 ring-navy-500 ring-offset-2' : ''}`}
          >
            <CheckboxOverlay checked={isSel} onChange={() => toggle(post.id)} />

            <Link href={`/social/${post.id}`} className="block p-4 pl-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: REDE_COR[post.rede] ?? '#999' }} />
                  <span className="text-xs uppercase font-bold text-navy-700">{post.rede}</span>
                  <span className="text-xs text-slate-muted">· {post.formato}</span>
                </div>
                <span className={STATUS_BADGE[post.status]}>{post.status}</span>
              </div>
              <h4 className="mt-3 text-sm font-bold text-navy-900">{post.titulo}</h4>
              {post.texto && (
                <p className="text-xs text-slate mt-1 line-clamp-3">{post.texto}</p>
              )}
              <div className="mt-3 pt-3 border-t border-line text-xs text-slate-muted space-y-1">
                {post.data_publicacao && (
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" /> {post.data_publicacao} {post.hora && `· ${post.hora}`}
                  </div>
                )}
                {post.campanha && (
                  <div className="flex items-center gap-1">
                    <Hash className="w-3 h-3" /> {post.campanha}
                  </div>
                )}
              </div>
            </Link>

            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100">
              <Link href={`/social/${post.id}`} className="p-1.5 bg-white/90 hover:bg-white rounded text-navy-600 shadow-sm" title="Editar">
                <Edit3 className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (!confirm(`Excluir o post "${post.titulo}"?`)) return;
                  start(async () => { await deletarPostInline(post.id); });
                }}
                title="Excluir"
                className="p-1.5 bg-white/90 hover:bg-white rounded text-rose-500 hover:text-rose-700 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListaView({ posts, selecionados, toggle }: {
  posts: PostWithUser[];
  selecionados: Set<number>;
  toggle: (id: number) => void;
}) {
  const [, start] = useTransition();
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-navy-50 text-navy-700">
          <tr>
            <th className="px-3 py-2 w-8"></th>
            <th className="px-4 py-2 text-left font-semibold">Data</th>
            <th className="px-4 py-2 text-left font-semibold">Rede</th>
            <th className="px-4 py-2 text-left font-semibold">Formato</th>
            <th className="px-4 py-2 text-left font-semibold">Título</th>
            <th className="px-4 py-2 text-left font-semibold">Campanha</th>
            <th className="px-4 py-2 text-left font-semibold">Resp.</th>
            <th className="px-4 py-2 text-left font-semibold">Status</th>
            <th className="px-4 py-2 w-20"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {posts.map(p => {
            const isSel = selecionados.has(p.id);
            return (
              <tr key={p.id} className={`group hover:bg-navy-50/30 ${isSel ? 'bg-navy-50' : ''}`}>
                <td className="px-3 py-3">
                  <input type="checkbox" checked={isSel} onChange={() => toggle(p.id)} className="cursor-pointer" />
                </td>
                <td className="px-4 py-3 text-xs text-slate">
                  <Link href={`/social/${p.id}`}>
                    {p.data_publicacao}{p.hora && <span className="text-slate-muted"> {p.hora}</span>}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: REDE_COR[p.rede] ?? '#999' }} />
                    {p.rede}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate">{p.formato}</td>
                <td className="px-4 py-3">
                  <Link href={`/social/${p.id}`} className="font-semibold text-navy-900 hover:text-navy-500">
                    {p.titulo}
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs text-slate">{p.campanha ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-slate">{p.responsavel_nome ?? '—'}</td>
                <td className="px-4 py-3"><span className={STATUS_BADGE[p.status]}>{p.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <Link href={`/social/${p.id}`} className="p-1 text-navy-500" title="Editar">
                      <Edit3 className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm(`Excluir o post "${p.titulo}"?`)) return;
                        start(async () => { await deletarPostInline(p.id); });
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
  );
}

function CalendarioView({ posts, ano, mes, setAno, setMes }: any) {
  const inicio = new Date(ano, mes - 1, 1);
  const totalDias = new Date(ano, mes, 0).getDate();
  const diaInicial = inicio.getDay();

  const postsPorDia: Record<number, PostWithUser[]> = {};
  posts.forEach((p: PostWithUser) => {
    if (!p.data_publicacao) return;
    const [py, pm, pd] = p.data_publicacao.split('-').map(Number);
    if (py !== ano || pm !== mes) return;
    if (!postsPorDia[pd]) postsPorDia[pd] = [];
    postsPorDia[pd].push(p);
  });

  const cells: Array<{ dia: number | null }> = [];
  for (let i = 0; i < diaInicial; i++) cells.push({ dia: null });
  for (let d = 1; d <= totalDias; d++) cells.push({ dia: d });
  while (cells.length % 7 !== 0) cells.push({ dia: null });

  const navMes = (delta: number) => {
    let m = mes + delta, a = ano;
    if (m < 1) { m = 12; a -= 1; }
    if (m > 12) { m = 1; a += 1; }
    setMes(m); setAno(a);
  };

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-line flex items-center gap-3">
        <button onClick={() => navMes(-1)} className="btn-secondary !px-2">‹</button>
        <button onClick={() => navMes(1)} className="btn-secondary !px-2">›</button>
        <h2 className="text-lg font-bold text-navy-900">{MESES[mes - 1]} {ano}</h2>
      </div>
      <div className="grid grid-cols-7 border-b border-line bg-navy-50/50">
        {DIAS.map(d => (
          <div key={d} className="px-2 py-2 text-xs font-bold uppercase text-navy-700 text-center tracking-wider">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, idx) => {
          const pps = cell.dia ? postsPorDia[cell.dia] ?? [] : [];
          return (
            <div key={idx} className="min-h-[110px] p-2 border-b border-r border-line">
              {cell.dia && <div className="text-xs font-bold text-navy-700 mb-1">{cell.dia}</div>}
              <div className="space-y-1">
                {pps.map(p => (
                  <Link
                    key={p.id}
                    href={`/social/${p.id}`}
                    className="block text-[11px] px-1.5 py-0.5 rounded truncate hover:opacity-80"
                    style={{
                      backgroundColor: (REDE_COR[p.rede] ?? '#999') + '22',
                      borderLeft: `3px solid ${REDE_COR[p.rede] ?? '#999'}`,
                    }}
                  >
                    {p.hora && <span className="font-bold">{p.hora} </span>}
                    {p.titulo}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
