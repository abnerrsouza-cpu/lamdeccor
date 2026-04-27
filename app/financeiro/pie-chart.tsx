'use client';

const COLORS = ['#143C6B', '#2D5F97', '#7A9DC4', '#C49F5B', '#A8853F', '#DCE7F2', '#555E6B'];

export default function PieChart({ data }: { data: Array<{ nome: string; valor: number }> }) {
  const total = data.reduce((s, d) => s + d.valor, 0);
  if (total === 0) return <p className="text-sm text-slate-muted">Sem dados.</p>;

  let acumulado = 0;
  const slices = data.map((d, i) => {
    const pct = d.valor / total;
    const startAngle = acumulado * 2 * Math.PI;
    acumulado += pct;
    const endAngle = acumulado * 2 * Math.PI;
    const x1 = 100 + 90 * Math.sin(startAngle);
    const y1 = 100 - 90 * Math.cos(startAngle);
    const x2 = 100 + 90 * Math.sin(endAngle);
    const y2 = 100 - 90 * Math.cos(endAngle);
    const largeArc = pct > 0.5 ? 1 : 0;
    const path = `M 100,100 L ${x1},${y1} A 90,90 0 ${largeArc},1 ${x2},${y2} Z`;
    return { ...d, pct, path, color: COLORS[i % COLORS.length] };
  });

  const fmtBRL = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 200 200" className="w-44 h-44 shrink-0">
        {slices.map((s, i) => (
          <path
            key={i}
            d={s.path}
            fill={s.color}
            stroke="white"
            strokeWidth="1.5"
          />
        ))}
        <circle cx="100" cy="100" r="40" fill="white" />
        <text x="100" y="98" textAnchor="middle" className="text-[11px] fill-slate-500 font-semibold">
          TOTAL
        </text>
        <text x="100" y="115" textAnchor="middle" className="text-[12px] fill-navy-900 font-bold">
          {fmtBRL(total)}
        </text>
      </svg>
      <div className="flex-1 space-y-2">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-slate font-medium truncate">{s.nome}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-slate-muted">{(s.pct * 100).toFixed(0)}%</span>
              <span className="font-bold text-navy-900">{fmtBRL(s.valor)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
