'use client';

import Image from 'next/image';
import { useState } from 'react';
import clsx from 'clsx';
import { login } from '@/lib/auth';
import type { Empresa } from '@/lib/empresa';

export default function LoginForm({ empresas, erro, proximo }: {
  empresas: Empresa[];
  erro?: string;
  /** Rota que a pessoa tentou abrir antes de logar */
  proximo?: string;
}) {
  const [empresaId, setEmpresaId] = useState(empresas[0]?.id);
  const empresa = empresas.find(e => e.id === empresaId) ?? empresas[0];

  return (
    <div className="card w-full max-w-md p-8">
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 rounded-full overflow-hidden shadow-card mb-4">
          {empresa?.logo_url ? (
            <Image
              src={empresa.logo_url}
              alt={empresa.nome}
              width={200}
              height={200}
              className="w-full h-full object-cover"
              priority
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: empresa?.cor ?? '#0F2A4A' }}
            >
              {(empresa?.nome ?? '').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
            </div>
          )}
        </div>
        <p className="text-base font-bold text-navy-900 leading-none">{empresa?.nome}</p>
        <p className="mt-1 text-[11px] text-slate-muted uppercase tracking-widest font-bold">
          {empresa?.subtitulo ?? 'Marketing Hub'}
        </p>
      </div>

      <h2 className="text-xl font-bold text-navy-900 mb-1 text-center">Entre na sua conta</h2>
      <p className="text-sm text-slate mb-6 text-center">Acesse o painel de marketing.</p>

      <form action={login} className="space-y-4">
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
        {proximo && <input type="hidden" name="next" value={proximo} />}

        <div>
          <label className="label">Usuário ou email</label>
          <input name="email" required className="input" placeholder="admin" defaultValue="admin" />
        </div>
        <div>
          <label className="label">Senha</label>
          <input type="password" name="senha" required className="input" placeholder="••••••••" />
        </div>
        {erro && <p className="text-sm text-rose-600">{erro}</p>}
        <button type="submit" className="btn-primary w-full">Entrar</button>
      </form>
    </div>
  );
}
