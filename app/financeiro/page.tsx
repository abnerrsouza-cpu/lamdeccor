import Topbar from '@/components/topbar';
import { getDb } from '@/lib/db';
import { getEmpresaId } from '@/lib/empresa';
import Link from 'next/link';
import StatCard from '@/components/stat-card';
import PieChart from './pie-chart';
import MovimentosTable from './movimentos-table';
import { Plus, Wallet, TrendingUp, ArrowDownRight, ArrowUpRight, FileText } from 'lucide-react';
import type { MovimentoFinanceiro } from '@/lib/types';

export default async function FinanceiroPage() {
  const db = getDb();
  const emp = await getEmpresaId();
  const movs = db.prepare(`
    SELECT f.*, l.nome as loja_nome
    FROM financeiro f
    LEFT JOIN lojas l ON l.id = f.loja_id
    WHERE f.empresa_id = ?
    ORDER BY f.data DESC
  `).all(emp) as (MovimentoFinanceiro & { loja_nome: string | null })[];

  const totalSaida = movs.filter(m => m.tipo === 'saida').reduce((s, m) => s + m.valor, 0);
  const totalEntrada = movs.filter(m => m.tipo === 'entrada').reduce((s, m) => s + m.valor, 0);
  const saldo = totalEntrada - totalSaida;
  const roi = totalSaida > 0 ? ((totalEntrada / totalSaida - 1) * 100) : 0;

  // Por categoria (saída)
  const porCategoria: Record<string, number> = {};
  movs.filter(m => m.tipo === 'saida').forEach(m => {
    const k = m.categoria || 'Sem categoria';
    porCategoria[k] = (porCategoria[k] ?? 0) + m.valor;
  });
  const piePorCategoria = Object.entries(porCategoria)
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor);

  // Por campanha
  const porCampanha: Record<string, { saida: number; entrada: number }> = {};
  movs.forEach(m => {
    const k = m.campanha ?? 'Always-on';
    if (!porCampanha[k]) porCampanha[k] = { saida: 0, entrada: 0 };
    if (m.tipo === 'saida') porCampanha[k].saida += m.valor;
    else porCampanha[k].entrada += m.valor;
  });

  const fmtBRL = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  // Mês atual fechamento
  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  const mesMovs = movs.filter(m => m.data?.startsWith(mesAtual));
  const mesSaida = mesMovs.filter(m => m.tipo === 'saida').reduce((s, m) => s + m.valor, 0);
  const mesEntrada = mesMovs.filter(m => m.tipo === 'entrada').reduce((s, m) => s + m.valor, 0);

  return (
    <>
      <Topbar
        title="Financeiro de marketing"
        subtitle="Investimento, ROI por campanha e fechamento mensal."
        action={
          <Link href="/financeiro/novo" className="btn-primary">
            <Plus className="w-4 h-4" /> Novo lançamento
          </Link>
        }
      />
      <main className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard label="Saídas (acumulado)" value={fmtBRL(totalSaida)} icon={ArrowDownRight} />
          <StatCard label="Entradas atribuídas" value={fmtBRL(totalEntrada)} icon={ArrowUpRight} />
          <StatCard label="Saldo líquido" value={fmtBRL(saldo)} icon={Wallet} highlight={saldo > 0} />
          <StatCard label="ROI estimado" value={`${roi.toFixed(0)}%`} icon={TrendingUp}
            helper={roi > 100 ? 'Investimento se pagou' : 'Avaliar atribuição'}
            highlight={roi > 100} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {/* Pizza de saída */}
          <div className="card p-5">
            <h3 className="h2 mb-4">Saídas por categoria</h3>
            <PieChart data={piePorCategoria} />
          </div>

          {/* Fechamento do mês */}
          <div className="card p-5">
            <h3 className="h2 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Fechamento do mês
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-rose-50 border border-rose-100">
                <span className="text-sm text-rose-700 font-semibold">Saídas no mês</span>
                <span className="text-lg font-bold text-rose-700">{fmtBRL(mesSaida)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <span className="text-sm text-emerald-700 font-semibold">Entradas no mês</span>
                <span className="text-lg font-bold text-emerald-700">{fmtBRL(mesEntrada)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-navy-50 border border-navy-100">
                <span className="text-sm text-navy-700 font-semibold">Saldo do mês</span>
                <span className="text-lg font-bold text-navy-700">{fmtBRL(mesEntrada - mesSaida)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                <span className="text-sm text-amber-700 font-semibold">ROI mensal</span>
                <span className="text-lg font-bold text-amber-700">
                  {mesSaida > 0 ? `${(((mesEntrada / mesSaida) - 1) * 100).toFixed(0)}%` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ROI por campanha */}
        <div className="card p-5">
          <h3 className="h2 mb-4">ROI por campanha</h3>
          <div className="space-y-3">
            {Object.entries(porCampanha).map(([camp, vals]) => {
              const r = vals.saida > 0 ? ((vals.entrada / vals.saida - 1) * 100) : null;
              return (
                <div key={camp} className="flex items-center justify-between border-b border-line pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <div className="font-semibold text-navy-900">{camp}</div>
                    <div className="text-xs text-slate-muted mt-0.5">
                      Investido: {fmtBRL(vals.saida)} · Vendas: {fmtBRL(vals.entrada)}
                    </div>
                  </div>
                  <div className={
                    'text-lg font-bold ' +
                    (r === null ? 'text-slate-muted' :
                      r > 100 ? 'text-emerald-700' :
                      r > 0 ? 'text-navy-700' : 'text-rose-600')
                  }>
                    {r === null ? '—' : `${r.toFixed(0)}%`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <MovimentosTable movs={movs} />
      </main>
    </>
  );
}
