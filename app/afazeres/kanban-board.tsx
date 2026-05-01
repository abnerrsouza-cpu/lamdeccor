'use client';

import { useState, useTransition } from 'react';
import {
  criarAfazer, atualizarAfazer, moverAfazer, deletarAfazer, deletarMultiplos
} from './actions';
import {
  Calendar, User as UserIcon, Trash2, Plus, X,
  Hash, Users as UsersIcon, MoveHorizontal, Check, CheckSquare, Square
} from 'lucide-react';
import clsx from 'clsx';
import type { Afazer, User } from '@/lib/types';

const COLUNAS: Array<{ id: Afazer['coluna']; label: string; accent: string; bg: string }> = [
  { id: 'a_fazer', label: 'A fazer', accent: 'bg-slate-400', bg: 'bg-slate-50' },
  { id: 'em_andamento', label: 'Em andamento', accent: 'bg-navy-500', bg: 'bg-navy-50' },
  { id: 'em_revisao', label: 'Em revisão', accent: 'bg-amber-500', bg: 'bg-amber-50' },
  { id: 'concluido', label: 'Concluído', accent: 'bg-emerald-500', bg: 'bg-emerald-50' },
];

const PRIO_BADGE: Record<string, string> = {
  baixa: 'badge-slate',
  media: 'badge-blue',
  alta: 'badge-gold',
  urgente: 'badge-red',
};

const TIMES = ['Coordenação', 'Mídia', 'Conteúdo', 'Tráfego', 'Design', 'Audiovisual', 'Operações'];

type AfazerWithUser = Afazer & { responsavel_nome: string | null };

export default function KanbanBoard({ afazeres, users }: {
  afazeres: AfazerWithUser[];
  users: User[];
}) {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [novoColuna, setNovoColuna] = useState<string | null>(null);
  const [editing, setEditing] = useState<AfazerWithUser | null>(null);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [moveMenuFor, setMoveMenuFor] = useState<number | null>(null);
  const [pending, start] = useTransition();

  const toggle = (id: number) => {
    setSelecionados(prev => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id); else novo.add(id);
      return novo;
    });
  };

  const limparSelecao = () => setSelecionados(new Set());

  const excluirSelecionados = () => {
    if (selecionados.size === 0) return;
    if (!confirm(`Excluir ${selecionados.size} afazer(es)? Esta ação não pode ser desfeita.`)) return;
    start(async () => {
      await deletarMultiplos(Array.from(selecionados));
      setSelecionados(new Set());
    });
  };

  const selecionarTodosColuna = (colId: string) => {
    const idsCol = afazeres.filter(a => a.coluna === colId).map(a => a.id);
    setSelecionados(prev => {
      const todosJa = idsCol.every(id => prev.has(id));
      const novo = new Set(prev);
      if (todosJa) idsCol.forEach(id => novo.delete(id));
      else idsCol.forEach(id => novo.add(id));
      return novo;
    });
  };

  return (
    <>
      {/* Barra de ações em massa */}
      {selecionados.size > 0 && (
        <div className="sticky top-0 z-10 mb-4 card !p-3 flex items-center justify-between
                        bg-navy-800 border-navy-800 shadow-card">
          <div className="flex items-center gap-3 text-white">
            <CheckSquare className="w-4 h-4 text-gold" />
            <span className="text-sm font-semibold">
              {selecionados.size} {selecionados.size === 1 ? 'afazer selecionado' : 'afazeres selecionados'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={limparSelecao}
              className="text-xs text-navy-200 hover:text-white px-3 py-1.5 rounded-lg hover:bg-navy-700"
            >
              Limpar seleção
            </button>
            <button
              onClick={excluirSelecionados}
              disabled={pending}
              className="btn-danger !bg-rose-500 !text-white !border-rose-600 hover:!bg-rose-600"
            >
              <Trash2 className="w-4 h-4" /> Excluir selecionados
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {COLUNAS.map(col => {
          const items = afazeres.filter(a => a.coluna === col.id);
          const idsCol = items.map(i => i.id);
          const todosSelCol = idsCol.length > 0 && idsCol.every(id => selecionados.has(id));
          return (
            <div
              key={col.id}
              onDragOver={e => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault();
                if (draggingId) {
                  await moverAfazer(draggingId, col.id);
                  setDraggingId(null);
                }
              }}
              className={clsx(col.bg, 'rounded-xl p-3 min-h-[600px]')}
            >
              <div className="flex items-center justify-between px-2 py-2 mb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => selecionarTodosColuna(col.id)}
                    className="text-slate-400 hover:text-navy-700"
                    title={todosSelCol ? 'Desmarcar coluna' : 'Selecionar tudo da coluna'}
                  >
                    {todosSelCol ? <CheckSquare className="w-3.5 h-3.5 text-navy-700" /> : <Square className="w-3.5 h-3.5" />}
                  </button>
                  <span className={clsx('w-2 h-2 rounded-full', col.accent)} />
                  <span className="font-bold text-navy-900 text-sm">{col.label}</span>
                  <span className="text-xs text-slate-muted">{items.length}</span>
                </div>
                <button
                  onClick={() => setNovoColuna(col.id)}
                  className="text-navy-500 hover:bg-white rounded p-1 transition-colors"
                  title="Adicionar nesta coluna"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {items.map(item => {
                  const isSelected = selecionados.has(item.id);
                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => setDraggingId(item.id)}
                      onDragEnd={() => setDraggingId(null)}
                      onClick={(e) => {
                        // Não abre modal se clicar em checkbox/dropdown
                        const target = e.target as HTMLElement;
                        if (target.closest('[data-no-card-click]')) return;
                        setEditing(item);
                      }}
                      className={clsx(
                        'card p-3 cursor-pointer transition-all hover:shadow-card group relative',
                        draggingId === item.id && 'opacity-50',
                        isSelected && 'ring-2 ring-navy-500 ring-offset-2'
                      )}
                    >
                      {/* Checkbox de seleção */}
                      <label
                        data-no-card-click
                        onClick={(e) => e.stopPropagation()}
                        className={clsx(
                          'absolute top-2 left-2 cursor-pointer transition-opacity',
                          isSelected ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggle(item.id)}
                          className="sr-only peer"
                        />
                        <span className={clsx(
                          'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                          isSelected
                            ? 'bg-navy-700 border-navy-700'
                            : 'bg-white border-slate-300 hover:border-navy-500'
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </span>
                      </label>

                      <div className="flex items-start justify-between gap-2 pl-6">
                        <h4 className="text-sm font-semibold text-navy-900 leading-snug flex-1">
                          {item.titulo}
                        </h4>
                        <span className={PRIO_BADGE[item.prioridade]}>
                          {item.prioridade}
                        </span>
                      </div>
                      {item.descricao && (
                        <p className="text-xs text-slate mt-1.5 line-clamp-2 pl-6">
                          {item.descricao}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-muted pl-6">
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.time && (
                            <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
                              <UsersIcon className="w-2.5 h-2.5" />
                              {item.time}
                            </span>
                          )}
                          {item.responsavel_nome && (
                            <span className="flex items-center gap-1">
                              <UserIcon className="w-2.5 h-2.5" />
                              {item.responsavel_nome.split(' ')[0]}
                            </span>
                          )}
                        </div>
                        {item.prazo && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {item.prazo}
                          </span>
                        )}
                      </div>
                      {item.campanha && (
                        <div className="mt-2 pl-6">
                          <span className="badge-blue">
                            <Hash className="w-2.5 h-2.5 mr-0.5" /> {item.campanha}
                          </span>
                        </div>
                      )}

                      {/* Botão de mover status */}
                      <div className="mt-3 pt-2 border-t border-line/70 flex items-center justify-between pl-6 relative">
                        <div
                          data-no-card-click
                          onClick={(e) => e.stopPropagation()}
                          className="relative"
                        >
                          <button
                            onClick={() => setMoveMenuFor(moveMenuFor === item.id ? null : item.id)}
                            className="text-[11px] flex items-center gap-1 text-navy-600 hover:text-navy-900 font-semibold"
                          >
                            <MoveHorizontal className="w-3 h-3" />
                            Mover
                          </button>
                          {moveMenuFor === item.id && (
                            <div className="absolute bottom-full left-0 mb-1 z-20 bg-white border border-line rounded-lg shadow-card py-1 min-w-[140px]">
                              {COLUNAS.map(c => {
                                const atual = c.id === item.coluna;
                                return (
                                  <button
                                    key={c.id}
                                    disabled={atual}
                                    onClick={async () => {
                                      setMoveMenuFor(null);
                                      if (!atual) await moverAfazer(item.id, c.id);
                                    }}
                                    className={clsx(
                                      'w-full text-left text-xs px-3 py-1.5 flex items-center gap-2 transition-colors',
                                      atual
                                        ? 'text-slate-muted cursor-not-allowed bg-navy-50/50'
                                        : 'text-navy-700 hover:bg-navy-50'
                                    )}
                                  >
                                    <span className={clsx('w-1.5 h-1.5 rounded-full', c.accent)} />
                                    <span className="font-semibold">{c.label}</span>
                                    {atual && <span className="ml-auto text-[10px]">(atual)</span>}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-muted italic">
                          clique para detalhes
                        </span>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <button
                    onClick={() => setNovoColuna(col.id)}
                    className="w-full text-xs text-slate-muted text-center py-6 italic
                               border-2 border-dashed border-line rounded-lg
                               hover:border-navy-300 hover:text-navy-500 transition-colors"
                  >
                    + Adicionar afazer
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Click fora fecha o menu de mover */}
      {moveMenuFor !== null && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setMoveMenuFor(null)}
        />
      )}

      {/* Modal Novo */}
      {novoColuna && (
        <Modal title="Novo afazer" onClose={() => setNovoColuna(null)}>
          <form action={async (fd) => { await criarAfazer(fd); setNovoColuna(null); }} className="space-y-4">
            <input type="hidden" name="coluna" value={novoColuna} />
            <FormFields users={users} />
            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <button type="button" onClick={() => setNovoColuna(null)} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary">Criar afazer</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Editar */}
      {editing && (
        <Modal title="Editar afazer" onClose={() => setEditing(null)}>
          <form action={async (fd) => { await atualizarAfazer(editing.id, fd); setEditing(null); }} className="space-y-4">
            <FormFields users={users} item={editing} />

            <div>
              <label className="label">Coluna (status)</label>
              <select name="coluna" defaultValue={editing.coluna} className="input">
                {COLUNAS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-line">
              <form action={async () => { await deletarAfazer(editing.id); setEditing(null); }}>
                <button type="submit" className="btn-danger">
                  <Trash2 className="w-4 h-4" /> Excluir
                </button>
              </form>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditing(null)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Salvar alterações</button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div
      className="fixed inset-0 bg-navy-900/60 z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-line flex items-center justify-between sticky top-0 bg-white">
          <h2 className="h2">{title}</h2>
          <button onClick={onClose} className="text-slate hover:text-navy-900">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function FormFields({ users, item }: { users: User[]; item?: any }) {
  return (
    <>
      <div>
        <label className="label">Título</label>
        <input name="titulo" required defaultValue={item?.titulo} className="input" placeholder="Ex: Aprovar storyboard do filme" />
      </div>
      <div>
        <label className="label">Descrição detalhada</label>
        <textarea name="descricao" defaultValue={item?.descricao} rows={3} className="input"
          placeholder="O que precisa ser feito? Contexto, links, decisões, etc." />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Prioridade / urgência</label>
          <select name="prioridade" defaultValue={item?.prioridade ?? 'media'} className="input">
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>
        <div>
          <label className="label">Time</label>
          <select name="time" defaultValue={item?.time ?? ''} className="input">
            <option value="">— Nenhum —</option>
            {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Responsável</label>
          <select name="responsavel_id" defaultValue={item?.responsavel_id ?? ''} className="input">
            <option value="">— Sem responsável —</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Campanha</label>
          <input name="campanha" defaultValue={item?.campanha ?? ''} className="input"
            placeholder="Ex: Hora da mãe descansar" />
        </div>
        <div>
          <label className="label">Prazo</label>
          <input type="date" name="prazo" defaultValue={item?.prazo ?? ''} className="input" />
        </div>
      </div>

      <div>
        <label className="label">Checklist (uma tarefa por linha)</label>
        <textarea name="checklist" defaultValue={item?.checklist ?? ''} rows={4} className="input"
          placeholder="[ ] Subitens da tarefa, um por linha&#10;[ ] Cada [ ] vira um item" />
      </div>
    </>
  );
}
