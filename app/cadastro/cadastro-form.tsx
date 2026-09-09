'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { ShieldCheck } from 'lucide-react';
import type { Empresa } from '@/lib/empresa';

export default function CadastroForm({ empresas, erro, empresaInicial, acao }: {
  empresas: Empresa[];
  erro?: string;
  empresaInicial?: number;
  acao: (formData: FormData) => void | Promise<void>;
}) {
  const [empresaId, setEmpresaId] = useState(empresaInicial ?? empresas[0]?.id);

  return (
    <div className="card w-full p-8">
      <h1 className="text-xl font-bold text-navy-900 text-center">Criar sua conta</h1>
      <p className="text-sm text-slate mt-1 mb-6 text-center">
        Preencha seus dados para solicitar acesso ao hub.
      </p>

      <form action={acao} className="space-y-4">
        {empresas.length > 1 && (
          <div>
            <label className="label">Empresa</label>
            <div className="grid grid-cols-2 gap-2">
              {empresas.map(e => {
                const ativo = e.id === empresaId;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setEmpresaId(e.id)}
                    aria-pressed={ativo}
                    className={clsx(
                      'px-3 py-2.5 rounded-lg border text-sm font-semibold transition-colors',
                      ativo
                        ? 'border-navy-800 bg-navy-800 text-white'
                        : 'border-line bg-white text-slate hover:border-navy-300'
                    )}
                  >
                    {e.nome}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <input type="hidden" name="empresa_id" value={empresaId ?? ''} />

        <div>
          <label className="label">Nome completo</label>
          <input name="nome" required className="input" placeholder="Ex: Mariana Souza" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Usuário (login)</label>
            <input name="usuario" required className="input" placeholder="ex: mariana" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" name="email" required className="input" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Senha</label>
            <input type="password" name="senha" required minLength={6} className="input" />
          </div>
          <div>
            <label className="label">Repita a senha</label>
            <input type="password" name="senha_confirma" required minLength={6} className="input" />
          </div>
        </div>

        {erro && <p className="text-sm text-rose-600">{erro}</p>}

        <div className="flex items-start gap-2 text-xs text-slate bg-navy-50/70 rounded-lg px-3 py-2.5">
          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-navy-500" />
          <span>
            Sua conta fica <strong>aguardando liberação</strong>. Um administrador define
            seu cargo e libera o acesso — até lá, o hub não abre.
          </span>
        </div>

        <button type="submit" className="btn-primary w-full">Criar conta</button>
      </form>
    </div>
  );
}
