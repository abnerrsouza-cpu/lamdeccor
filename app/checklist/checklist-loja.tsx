'use client';

import { useTransition } from 'react';
import { Trash2, Check } from 'lucide-react';
import { marcarItem, removerItem } from './actions';

export type ItemChecklist = {
  id: number;
  titulo: string;
  descricao: string | null;
  loja_id: number | null;
  feito: number;
  feito_por_nome: string | null;
};

export default function ChecklistLoja({ itens, lojaId, admin }: {
  itens: ItemChecklist[];
  lojaId: number;
  /** Admin remove qualquer item; o gerente só os extras da própria loja. */
  admin: boolean;
}) {
  const [pending, start] = useTransition();

  const podeRemover = (item: ItemChecklist) =>
    admin || (item.loja_id !== null && item.loja_id === lojaId);

  const feitos = itens.filter(i => i.feito).length;
  const pct = itens.length ? Math.round((feitos / itens.length) * 100) : 0;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 className="h2">Rotina de hoje</h2>
        <span className={`text-sm font-bold ${pct === 100 ? 'text-emerald-700' : 'text-navy-900'}`}>
          {feitos} de {itens.length}
        </span>
      </div>

      <div className="h-2 bg-navy-50 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-navy-700'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {itens.length === 0 ? (
        <p className="text-sm text-slate-muted py-4">
          Nenhum item na rotina ainda. Adicione o primeiro abaixo.
        </p>
      ) : (
        <ul className="space-y-1">
          {itens.map(item => (
            <li key={item.id} className="group">
              <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                item.feito ? 'bg-emerald-50/60' : 'hover:bg-navy-50/50'
              }`}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => start(async () => {
                    await marcarItem(item.id, lojaId, !item.feito);
                  })}
                  aria-pressed={!!item.feito}
                  aria-label={item.feito ? `Desmarcar ${item.titulo}` : `Marcar ${item.titulo}`}
                  className={`mt-0.5 w-6 h-6 rounded-md border-2 shrink-0 flex items-center justify-center
                              transition-colors ${
                    item.feito
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-300 hover:border-navy-500 bg-white'
                  }`}
                >
                  {item.feito === 1 && <Check className="w-4 h-4" strokeWidth={3} />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${
                    item.feito ? 'text-slate-muted line-through' : 'text-navy-900'
                  }`}>
                    {item.titulo}
                  </div>
                  {item.descricao && (
                    <div className="text-xs text-slate-muted mt-0.5">{item.descricao}</div>
                  )}
                  {item.feito === 1 && item.feito_por_nome && (
                    <div className="text-[11px] text-emerald-700 mt-1">
                      Feito por {item.feito_por_nome}
                    </div>
                  )}
                </div>

                {podeRemover(item) && (
                  <button
                    type="button"
                    title="Remover este item da rotina"
                    onClick={() => {
                      if (!confirm(`Remover "${item.titulo}" da rotina?`)) return;
                      start(async () => { await removerItem(item.id); });
                    }}
                    className="p-1.5 rounded text-rose-400 hover:text-rose-700 hover:bg-rose-50
                               sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
