'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { atualizarStatusIndicacao, removerIndicacao } from '../actions';
import { STATUS_INDICACAO, fmtBRL } from '../constantes';
import type { ParceiroIndicacao } from '@/lib/types';

export default function IndicacaoLinha({
  indicacao, parceiroId, editar, zebra,
}: {
  indicacao: ParceiroIndicacao;
  parceiroId: number;
  editar: boolean;
  zebra: boolean;
}) {
  const [pending, start] = useTransition();
  const i = indicacao;
  const badge = STATUS_INDICACAO[i.status] ?? STATUS_INDICACAO.nova;

  return (
    <tr className={`${zebra ? 'bg-navy-50/30' : 'bg-white'} ${pending ? 'opacity-50' : ''}`}>
      <td className="px-4 py-3">
        <div className="font-semibold text-navy-900">{i.cliente_nome}</div>
        {i.cliente_contato && (
          <div className="text-xs text-slate-muted">{i.cliente_contato}</div>
        )}
      </td>
      <td className="px-4 py-3 text-slate text-xs">{i.servico ?? '—'}</td>
      <td className="px-4 py-3 text-slate text-xs whitespace-nowrap">
        {new Date(i.data + 'T00:00:00').toLocaleDateString('pt-BR')}
      </td>
      <td className="px-4 py-3">
        {editar ? (
          <select
            defaultValue={i.status}
            disabled={pending}
            onChange={e => {
              const novo = e.target.value;
              start(async () => { await atualizarStatusIndicacao(i.id, parceiroId, novo); });
            }}
            className="input !py-1 !text-xs !w-auto"
          >
            {Object.entries(STATUS_INDICACAO).map(([v, s]) => (
              <option key={v} value={v}>{s.label}</option>
            ))}
          </select>
        ) : (
          <span className={badge.className}>{badge.label}</span>
        )}
      </td>
      <td className="px-4 py-3 text-right font-semibold text-navy-900 whitespace-nowrap">
        {i.valor > 0 ? fmtBRL(i.valor) : '—'}
      </td>
      {editar && (
        <td className="px-2 py-3 text-right">
          <button
            type="button"
            title="Remover indicação"
            onClick={() => {
              if (!confirm(`Remover a indicação de "${i.cliente_nome}"?`)) return;
              start(async () => { await removerIndicacao(i.id, parceiroId); });
            }}
            className="p-1.5 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </td>
      )}
    </tr>
  );
}
