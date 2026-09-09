'use client';

import { useState } from 'react';
import { Copy, Check, UserPlus } from 'lucide-react';

/**
 * O convite é o próprio endereço público de cadastro. Quem abre cria a
 * conta, que nasce aguardando liberação — por isso o link pode circular
 * livremente sem expor nada.
 */
export default function ConviteCard({ empresaNome, empresaId }: {
  empresaNome: string;
  empresaId: number;
}) {
  const [copiado, setCopiado] = useState(false);
  const [comEmpresa, setComEmpresa] = useState(true);

  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const link = `${base}/cadastro${comEmpresa ? `?empresa=${empresaId}` : ''}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* clipboard bloqueado: o link fica visível para copiar na mão */
    }
  };

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-1">
        <UserPlus className="w-4 h-4 text-navy-500" />
        <h2 className="h2">Convidar pessoas</h2>
      </div>
      <p className="text-sm text-slate mb-4">
        Envie este link para quem precisa de acesso. A pessoa cria a própria conta e
        ela aparece aqui como <strong>aguardando liberação</strong>, até você definir o cargo.
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          readOnly
          value={link}
          onFocus={e => e.currentTarget.select()}
          className="input flex-1 font-mono text-xs"
        />
        <button type="button" onClick={copiar} className="btn-primary shrink-0">
          {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copiado ? 'Copiado' : 'Copiar link'}
        </button>
      </div>

      <label className="mt-3 flex items-center gap-2 text-xs text-slate cursor-pointer">
        <input
          type="checkbox"
          checked={comEmpresa}
          onChange={e => setComEmpresa(e.target.checked)}
          className="cursor-pointer"
        />
        Já deixar <strong>{empresaNome}</strong> pré-selecionada no cadastro
      </label>
    </div>
  );
}
