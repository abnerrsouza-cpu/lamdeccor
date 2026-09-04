'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import clsx from 'clsx';
import { trocarEmpresa, type Empresa } from '@/lib/empresa';

function Logo({ empresa, size = 'w-10 h-10' }: { empresa: Empresa; size?: string }) {
  if (empresa.logo_url) {
    return (
      <div className={clsx(size, 'rounded-full overflow-hidden bg-white shrink-0 ring-1 ring-navy-700')}>
        <Image
          src={empresa.logo_url}
          alt={empresa.nome}
          width={80}
          height={80}
          className="w-full h-full object-cover"
          priority
        />
      </div>
    );
  }
  const iniciais = empresa.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  return (
    <div
      className={clsx(size, 'rounded-full shrink-0 ring-1 ring-navy-700 flex items-center justify-center text-white text-xs font-bold')}
      style={{ backgroundColor: empresa.cor }}
    >
      {iniciais}
    </div>
  );
}

export default function EmpresaSwitcher({ ativa, empresas }: { ativa: Empresa; empresas: Empresa[] }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const podeTrocar = empresas.length > 1;

  // Depois da troca o componente é reidratado com o estado antigo: fecha o menu
  useEffect(() => { setAberto(false); }, [ativa.id]);

  useEffect(() => {
    if (!aberto) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [aberto]);

  const identidade = (
    <>
      <Logo empresa={ativa} />
      <div className="min-w-0 text-left">
        <div className="text-base font-bold leading-none truncate">{ativa.nome}</div>
        <div className="text-[10px] text-navy-300 uppercase tracking-wide mt-1 truncate">
          {ativa.subtitulo ?? 'Marketing Hub'}
        </div>
      </div>
    </>
  );

  if (!podeTrocar) {
    return <div className="flex items-center gap-3 min-w-0">{identidade}</div>;
  }

  return (
    <div className="relative min-w-0 flex-1" ref={ref}>
      <button
        type="button"
        onClick={() => setAberto(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        className="flex items-center gap-2.5 w-full min-w-0 rounded-lg px-1.5 py-1 -mx-1.5
                   hover:bg-navy-800/70 transition-colors"
      >
        {identidade}
        <ChevronsUpDown className="w-3.5 h-3.5 text-navy-300 shrink-0 ml-auto" />
      </button>

      {aberto && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 z-50 bg-navy-800 border border-navy-700
                     rounded-xl shadow-xl overflow-hidden py-1"
        >
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-navy-300">
            Trocar de empresa
          </div>
          {empresas.map((e) => {
            const atual = e.id === ativa.id;
            return (
              <form key={e.id} action={trocarEmpresa}>
                <input type="hidden" name="empresa_id" value={e.id} />
                <button
                  type="submit"
                  role="option"
                  aria-selected={atual}
                  className={clsx(
                    'flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors',
                    atual ? 'bg-navy-700/60' : 'hover:bg-navy-700/40'
                  )}
                >
                  <Logo empresa={e} size="w-7 h-7" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-white truncate">{e.nome}</div>
                    <div className="text-[10px] text-navy-300 truncate">{e.subtitulo}</div>
                  </div>
                  {atual && <Check className="w-4 h-4 text-gold shrink-0" />}
                </button>
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}
