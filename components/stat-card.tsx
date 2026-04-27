import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

export default function StatCard({
  label,
  value,
  change,
  helper,
  icon: Icon,
  highlight = false,
}: {
  label: string;
  value: string;
  change?: { pct: number; up: boolean };
  helper?: string;
  icon?: LucideIcon;
  highlight?: boolean;
}) {
  return (
    <div className={clsx(
      'card p-5',
      highlight && 'border-gold/40 bg-gradient-to-br from-white to-amber-50/30'
    )}>
      <div className="flex items-start justify-between">
        <span className="eyebrow">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-navy-300" />}
      </div>
      <div className="mt-2 font-serif text-3xl font-bold text-navy-900">
        {value}
      </div>
      {change && (
        <div className={clsx(
          'mt-1 flex items-center gap-1 text-xs font-medium',
          change.up ? 'text-emerald-600' : 'text-rose-600'
        )}>
          {change.up
            ? <TrendingUp className="w-3 h-3" />
            : <TrendingDown className="w-3 h-3" />}
          {change.up ? '+' : '-'}{Math.abs(change.pct)}%
          <span className="text-slate-muted ml-1">vs mês anterior</span>
        </div>
      )}
      {helper && !change && (
        <div className="mt-1 text-xs text-slate-muted">{helper}</div>
      )}
    </div>
  );
}
