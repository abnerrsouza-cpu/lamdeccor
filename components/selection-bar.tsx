'use client';

import { Trash2, X, CheckSquare, ListChecks } from 'lucide-react';
import { useRef, useEffect } from 'react';

export default function SelectionBar({
  count,
  onClear,
  onDelete,
  pending = false,
  label = 'item',
  total,
  onSelectAll,
}: {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  pending?: boolean;
  label?: string;
  /** Total disponível — com onSelectAll, habilita o "selecionar todos". */
  total?: number;
  onSelectAll?: () => void;
}) {
  if (count === 0) return null;
  const faltam = total !== undefined && count < total;
  return (
    <div className="sticky top-0 z-10 mb-4 card !p-3 flex items-center justify-between
                    bg-navy-800 border-navy-800 shadow-card">
      <div className="flex items-center gap-3 text-white">
        <CheckSquare className="w-4 h-4 text-gold" />
        <span className="text-sm font-semibold">
          {count} {count === 1 ? `${label} selecionado` : `${label}s selecionados`}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {onSelectAll && faltam && (
          <button
            onClick={onSelectAll}
            className="text-xs text-navy-200 hover:text-white px-3 py-1.5 rounded-lg hover:bg-navy-700 flex items-center gap-1"
          >
            <ListChecks className="w-3 h-3" /> Selecionar todos ({total})
          </button>
        )}
        <button
          onClick={onClear}
          className="text-xs text-navy-200 hover:text-white px-3 py-1.5 rounded-lg hover:bg-navy-700 flex items-center gap-1"
        >
          <X className="w-3 h-3" /> Limpar
        </button>
        <button
          onClick={onDelete}
          disabled={pending}
          className="btn-danger !bg-rose-500 !text-white !border-rose-600 hover:!bg-rose-600"
        >
          <Trash2 className="w-4 h-4" /> Excluir selecionados
        </button>
      </div>
    </div>
  );
}

export function CheckboxOverlay({
  checked,
  onChange,
  className = '',
}: {
  checked: boolean;
  onChange: () => void;
  className?: string;
}) {
  return (
    <label
      data-no-card-click
      onClick={(e) => e.stopPropagation()}
      className={`absolute top-2 left-2 z-10 cursor-pointer transition-opacity ${
        checked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      } ${className}`}
    >
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <span
        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
          checked
            ? 'bg-navy-700 border-navy-700'
            : 'bg-white border-slate-300 hover:border-navy-500'
        }`}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
    </label>
  );
}

/**
 * Checkbox "selecionar todos" com estado parcial (traço), para ficar acima das
 * grades de cards — as tabelas usam o mesmo controle na primeira coluna do
 * cabeçalho. Some quando não há nada para selecionar.
 */
export function SelectAllToggle({
  total,
  selecionados,
  onToggle,
  className = '',
}: {
  total: number;
  selecionados: number;
  onToggle: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const todos = total > 0 && selecionados === total;
  const parcial = selecionados > 0 && !todos;

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = parcial;
  }, [parcial]);

  if (total === 0) return null;

  return (
    <label
      className={`inline-flex items-center gap-2 text-xs text-slate hover:text-navy-900
                  cursor-pointer select-none ${className}`}
    >
      <input
        ref={ref}
        type="checkbox"
        checked={todos}
        onChange={onToggle}
        className="cursor-pointer"
      />
      {todos ? 'Limpar seleção' : `Selecionar todos (${total})`}
    </label>
  );
}
