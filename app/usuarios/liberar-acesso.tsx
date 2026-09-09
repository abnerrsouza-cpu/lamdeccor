'use client';

import { useState } from 'react';
import { KeyRound, Check, X } from 'lucide-react';
import { definirAcesso, definirSenha } from './actions';
import type { Loja, User, Empresa } from '@/lib/types';

const ROLES = [
  ['admin', 'Admin'], ['diretor', 'Diretor'], ['coordenador', 'Coordenador'],
  ['gestor_trafego', 'Gestor de tráfego'], ['social_media', 'Social media'],
  ['designer', 'Designer'], ['gerente_loja', 'Gerente de loja'],
  ['visualizador', 'Visualizador'],
] as const;

const NIVEIS = [
  [1, '1 — Admin'], [2, '2 — Coordenação'], [3, '3 — Gestão'], [4, '4 — Liderança'],
  [5, '5 — Operacional'], [6, '6 — Estagiário'], [9, '9 — Visualizador'],
] as const;

export default function LiberarAcesso({ user, lojas, empresas, podeMoverEmpresa }: {
  user: User & { loja_nome: string | null };
  lojas: Loja[];
  empresas: Empresa[];
  podeMoverEmpresa: boolean;
}) {
  const [aberto, setAberto] = useState<'acesso' | 'senha' | null>(null);
  const pendente = user.ativo === 0;

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setAberto(aberto === 'acesso' ? null : 'acesso')}
          className={pendente ? 'btn-primary !py-1.5 !text-xs' : 'btn-secondary !py-1.5 !text-xs'}
        >
          {pendente ? <><Check className="w-3.5 h-3.5" /> Liberar e definir cargo</> : 'Editar acesso'}
        </button>
        <button
          type="button"
          onClick={() => setAberto(aberto === 'senha' ? null : 'senha')}
          className="btn-secondary !py-1.5 !text-xs"
        >
          <KeyRound className="w-3.5 h-3.5" /> Definir senha
        </button>
        {aberto && (
          <button
            type="button"
            onClick={() => setAberto(null)}
            className="btn-secondary !py-1.5 !text-xs"
          >
            <X className="w-3.5 h-3.5" /> Fechar
          </button>
        )}
      </div>

      {aberto === 'acesso' && (
        <form
          action={definirAcesso.bind(null, user.id)}
          className="mt-3 p-4 bg-navy-50/60 rounded-lg space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Função</label>
              <select name="role" defaultValue={user.role} className="input">
                {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Nível hierárquico</label>
              <select name="hierarquia" defaultValue={user.hierarquia} className="input">
                {NIVEIS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Cargo</label>
              <input name="cargo" defaultValue={user.cargo ?? ''} className="input"
                placeholder="Ex: Coordenador de Marketing" />
            </div>
            <div>
              <label className="label">Loja (se aplicável)</label>
              <select name="loja_id" defaultValue={user.loja_id ?? ''} className="input">
                <option value="">— Nenhuma —</option>
                {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </div>
          </div>
          {podeMoverEmpresa && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
              <div>
                <label className="label">Empresa</label>
                <select name="empresa_id" defaultValue={user.empresa_id} className="input">
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate pb-2.5">
                <input type="checkbox" name="acesso_global" value="1"
                  defaultChecked={user.acesso_global === 1} className="w-4 h-4" />
                Pode alternar entre as empresas
              </label>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm font-semibold text-navy-900">
            <input type="checkbox" name="ativo" value="1" defaultChecked={user.ativo === 1}
              className="w-4 h-4" />
            Conta liberada (pode acessar o hub)
          </label>
          <button type="submit" className="btn-primary">Salvar acesso</button>
        </form>
      )}

      {aberto === 'senha' && (
        <form
          action={definirSenha.bind(null, user.id)}
          className="mt-3 p-4 bg-navy-50/60 rounded-lg flex flex-col sm:flex-row gap-2 sm:items-end"
        >
          <div className="flex-1">
            <label className="label">Nova senha (mínimo 6 caracteres)</label>
            <input type="password" name="senha" required minLength={6} className="input" />
          </div>
          <button type="submit" className="btn-primary shrink-0">Salvar senha</button>
        </form>
      )}
    </div>
  );
}
