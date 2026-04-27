'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import type { Evento } from '@/lib/types';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function CalendarioGrid({ ano, mes, eventos }: {
  ano: number; mes: number; eventos: Evento[];
}) {
  const router = useRouter();
  const navMonth = (delta: number) => {
    let novoMes = mes + delta;
    let novoAno = ano;
    if (novoMes < 1) { novoMes = 12; novoAno -= 1; }
    if (novoMes > 12) { novoMes = 1; novoAno += 1; }
    router.push(`/calendario?ano=${novoAno}&mes=${novoMes}`);
  };

  // Construir grid - primeiro dia da semana e total de dias
  const primeiroDia = new Date(ano, mes - 1, 1);
  const totalDias = new Date(ano, mes, 0).getDate();
  const diaInicial = primeiroDia.getDay();

  // Evento por dia
  const eventosPorDia: Record<number, Evento[]> = {};
  eventos.forEach(ev => {
    const dia = Number(ev.data.split('-')[2]);
    if (!eventosPorDia[dia]) eventosPorDia[dia] = [];
    eventosPorDia[dia].push(ev);
  });

  const cells: Array<{ dia: number | null }> = [];
  for (let i = 0; i < diaInicial; i++) cells.push({ dia: null });
  for (let d = 1; d <= totalDias; d++) cells.push({ dia: d });
  while (cells.length % 7 !== 0) cells.push({ dia: null });

  const hoje = new Date();
  const hojeMatch = hoje.getFullYear() === ano && hoje.getMonth() + 1 === mes;

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navMonth(-1)} className="btn-secondary !px-2"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => navMonth(1)} className="btn-secondary !px-2"><ChevronRight className="w-4 h-4" /></button>
          <h2 className="text-xl font-bold text-navy-900 capitalize">
            {MESES[mes - 1]} {ano}
          </h2>
        </div>
        <button
          onClick={() => router.push(`/calendario?ano=${hoje.getFullYear()}&mes=${hoje.getMonth() + 1}`)}
          className="btn-secondary"
        >
          Hoje
        </button>
      </div>

      {/* Cabeçalho dos dias */}
      <div className="grid grid-cols-7 border-b border-line bg-navy-50/50">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="px-2 py-2 text-xs font-bold uppercase text-navy-700 text-center tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7">
        {cells.map((cell, idx) => {
          const isHoje = hojeMatch && cell.dia === hoje.getDate();
          const evs = cell.dia ? eventosPorDia[cell.dia] ?? [] : [];
          return (
            <div
              key={idx}
              className={clsx(
                'min-h-[110px] p-2 border-b border-r border-line',
                !cell.dia && 'bg-navy-50/30',
                idx % 7 === 0 && 'border-l-0'
              )}
            >
              {cell.dia && (
                <div className="flex items-start justify-between mb-1">
                  <span className={clsx(
                    'text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full',
                    isHoje ? 'bg-navy-800 text-white' : 'text-navy-700'
                  )}>
                    {cell.dia}
                  </span>
                </div>
              )}
              <div className="space-y-1">
                {evs.slice(0, 3).map(ev => (
                  <Link
                    key={ev.id}
                    href={`/calendario/${ev.id}`}
                    className="block text-[11px] px-1.5 py-0.5 rounded truncate hover:opacity-80"
                    style={{
                      backgroundColor: ev.cor + '22',
                      borderLeft: `3px solid ${ev.cor}`,
                      color: '#0A1F3D'
                    }}
                    title={ev.titulo}
                  >
                    {ev.hora_inicio && <span className="font-bold">{ev.hora_inicio} </span>}
                    {ev.titulo}
                  </Link>
                ))}
                {evs.length > 3 && (
                  <div className="text-[10px] text-slate-muted px-1">
                    + {evs.length - 3} eventos
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
