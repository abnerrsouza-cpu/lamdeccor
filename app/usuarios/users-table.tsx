'use client';

import { useState, useTransition } from 'react';
import { Trash2, Shield } from 'lucide-react';
import SelectionBar from '@/components/selection-bar';
import { alternarAtivo, deletarUsuario, deletarMultiplosUsuarios } from './actions';
import type { User } from '@/lib/types';

const HIERARQUIA_LABEL: Record<number, string> = {
  1: 'Admin', 2: 'Coordenação', 3: 'Gestão', 4: 'Liderança',
  5: 'Operacional', 6: 'Estagiário', 9: 'Visualizador',
};
const ROLE_BADGE: Record<string, string> = {
  admin: 'badge-red', diretor: 'badge-gold', coordenador: 'badge-blue',
  gestor_trafego: 'badge-purple', social_media: 'badge-purple',
  designer: 'badge-purple', gerente_loja: 'badge-slate',
};

export default function UsersTable({
  users
}: {
  users: (User & { loja_nome: string | null })[];
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
    if (selecionados.size === users.length) setSelecionados(new Set());
    else setSelecionados(new Set(users.map(u => u.id)));
  };

  const excluir = () => {
    if (!confirm(`Excluir ${selecionados.size} usuário(s)?`)) return;
    start(async () => {
      await deletarMultiplosUsuarios(Array.from(selecionados));
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
        label="usuário"
      />
      <div className="card overflow-x-auto">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <h2 className="h2">Usuários cadastrados</h2>
          <span className="text-xs text-slate-muted">{users.length} usuários</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-navy-50 text-navy-700">
            <tr>
              <th className="px-3 py-2.5 w-8">
                <input
                  type="checkbox"
                  checked={selecionados.size === users.length && users.length > 0}
                  onChange={toggleAll}
                  className="cursor-pointer"
                />
              </th>
              <th className="px-4 py-2.5 text-left font-semibold">Nome</th>
              <th className="px-4 py-2.5 text-left font-semibold">Login</th>
              <th className="px-4 py-2.5 text-left font-semibold">Função</th>
              <th className="px-4 py-2.5 text-left font-semibold">Hierarquia</th>
              <th className="px-4 py-2.5 text-left font-semibold">Loja</th>
              <th className="px-4 py-2.5 text-left font-semibold">Status</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map(u => {
              const isSel = selecionados.has(u.id);
              return (
                <tr key={u.id} className={`group hover:bg-navy-50/30 ${isSel ? 'bg-navy-50' : ''}`}>
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={isSel} onChange={() => toggle(u.id)} className="cursor-pointer" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-navy-900">{u.nome}</div>
                    <div className="text-xs text-slate-muted">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-navy-50 px-2 py-0.5 rounded">{u.usuario}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className={ROLE_BADGE[u.role] ?? 'badge-slate'}>{u.role.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3 h-3 text-navy-500" />
                      <span className="font-semibold text-navy-900">{u.hierarquia}</span>
                      <span className="text-xs text-slate-muted">{HIERARQUIA_LABEL[u.hierarquia] ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate">{u.loja_nome ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={u.ativo ? 'badge-green' : 'badge-slate'}>
                      {u.ativo ? 'ativo' : 'inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100">
                      <form action={alternarAtivo.bind(null, u.id, u.ativo ? 0 : 1)}>
                        <button className="text-xs text-navy-500 hover:underline">
                          {u.ativo ? 'desativar' : 'ativar'}
                        </button>
                      </form>
                      <button
                        type="button"
                        onClick={() => {
                          if (!confirm(`Excluir o usuário ${u.nome}?`)) return;
                          start(async () => { await deletarUsuario(u.id); });
                        }}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3 h-3" />
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
