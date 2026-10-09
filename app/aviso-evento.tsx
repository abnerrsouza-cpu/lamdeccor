'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { PartyPopper, Check, Truck } from 'lucide-react';
import { soltarConfete } from '@/components/confete';
import { confirmarCiencia } from './calendario/actions';

export type AvisoEvento = {
  id: number;
  titulo: string;
  data: string;
  data_fim: string | null;
  cor: string;
  dias: number;
  confirmado: number;
};

export default function AvisoEvento({ evento }: { evento: AvisoEvento }) {
  const [confirmado, setConfirmado] = useState(evento.confirmado === 1);
  const [pending, start] = useTransition();

  const dia = Number(evento.data.split('-')[2]);
  const quando =
    evento.dias === 0 ? 'HOJE' : evento.dias === 1 ? 'AMANHÃ' : `DIA ${dia}`;

  const confirmar = () => {
    soltarConfete();
    setConfirmado(true);

    // Só grava depois do confete: ao gravar, o servidor revalida e o aviso
    // sai da tela. Sem a pausa, ele sumia antes de a pessoa ver o "Ciente!".
    setTimeout(() => {
      start(async () => { await confirmarCiencia(evento.id); });
    }, 1600);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-5 transition-colors ${
        confirmado
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-gold/50 bg-gradient-to-r from-gold/15 via-gold/5 to-transparent'
      }`}
    >
      {/* Brilho que atravessa o aviso enquanto não confirmado */}
      {!confirmado && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full animate-[brilho_3s_ease-in-out_infinite]
                     bg-gradient-to-r from-transparent via-white/45 to-transparent"
        />
      )}

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            confirmado ? 'bg-emerald-100' : 'bg-gold/25 animate-pulse'
          }`}
        >
          {confirmado
            ? <Check className="w-6 h-6 text-emerald-700" strokeWidth={3} />
            : <Truck className="w-6 h-6 text-gold-deep" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gold-deep">
            {confirmado ? 'Confirmado' : 'Chegando'}
          </div>
          <Link href={`/calendario/${evento.id}`} className="block group">
            <div className="text-lg md:text-xl font-extrabold text-navy-900 leading-tight group-hover:underline">
              {quando} {evento.titulo.toUpperCase()}
            </div>
          </Link>
          {evento.data_fim && (
            <div className="text-xs text-slate mt-0.5">
              até {new Date(evento.data_fim + 'T12:00:00').toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>

        {confirmado ? (
          <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5 shrink-0">
            <PartyPopper className="w-4 h-4" /> Ciente!
          </span>
        ) : (
          <button
            type="button"
            onClick={confirmar}
            disabled={pending}
            className="btn-primary shrink-0 !bg-gold-deep !border-gold-deep hover:!bg-gold"
          >
            <Check className="w-4 h-4" /> Confirmar
          </button>
        )}
      </div>
    </div>
  );
}
