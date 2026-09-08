import Topbar from '@/components/topbar';
import { getDb } from '@/lib/db';
import { getEmpresaId } from '@/lib/empresa';
import Link from 'next/link';
import {
  Megaphone, MousePointerClick, TrendingUp, Eye, Plug,
  ArrowDownRight, ArrowUpRight
} from 'lucide-react';
import StatCard from '@/components/stat-card';
import PieChart from '../financeiro/pie-chart';
import type { Anuncio, Integracao } from '@/lib/types';

const PLATAFORMAS = [
  { id: 'meta',    label: 'Meta Ads',     color: '#1877F2', icon: '📊' },
  { id: 'google',  label: 'Google Ads',   color: '#4285F4', icon: '🔍' },
  { id: 'youtube', label: 'YouTube Ads',  color: '#FF0000', icon: '▶️' },
  { id: 'tiktok',  label: 'TikTok Ads',   color: '#FE2C55', icon: '🎵' },
];

// Ticket médio LAM (estimativa do plano de marketing) para cálculo de retorno
const TICKET_MEDIO = 3200;

export default async function AnunciosPage({ searchParams }: { searchParams: { plataforma?: string } }) {
  const db = getDb();
  const emp = await getEmpresaId();
  const plataforma = PLATAFORMAS.find(p => p.id === searchParams.plataforma) ?? PLATAFORMAS[0];

  const anuncios = db.prepare(`
    SELECT * FROM anuncios WHERE plataforma = ? AND empresa_id = ?
    ORDER BY status='ativo' DESC, investimento DESC
  `).all(plataforma.id, emp) as Anuncio[];

  // Contagens para mostrar nas abas
  const counts: Record<string, number> = {};
  PLATAFORMAS.forEach(p => {
    counts[p.id] = (db.prepare('SELECT COUNT(*) as c FROM anuncios WHERE plataforma = ? AND empresa_id = ?')
      .get(p.id, emp) as { c: number }).c;
  });

  const integ = db.prepare('SELECT * FROM integracoes WHERE empresa_id = ?').all(emp) as Integracao[];
  const conectadas = integ.filter(i => i.conectado === 1).length;
  const integPlat = integ.find(i =>
    i.plataforma === `${plataforma.id}_ads` ||
    i.plataforma === plataforma.id
  );
  const ehConectada = integPlat?.conectado === 1;

  const ativos = anuncios.filter(a => a.status === 'ativo');
  const totalInvest = ativos.reduce((s, a) => s + a.investimento, 0);
  const totalImpr = ativos.reduce((s, a) => s + a.impressoes, 0);
  const totalCliq = ativos.reduce((s, a) => s + a.cliques, 0);
  const totalConv = ativos.reduce((s, a) => s + a.conversoes, 0);
  const ctrMedio = totalImpr > 0 ? (totalCliq / totalImpr) * 100 : 0;

  // Estimativa de retorno
  const retornoEstimado = totalConv * TICKET_MEDIO;
  const lucroEstimado = retornoEstimado - totalInvest;
  const roi = totalInvest > 0 ? (lucroEstimado / totalInvest) * 100 : 0;

  // Pizza: distribuição de investimento por campanha
  const piePorCampanha = ativos
    .map(a => ({ nome: a.campanha, valor: a.investimento }))
    .sort((a, b) => b.valor - a.valor);

  const fmtBRL = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const fmtNum = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);

  return (
    <>
      <Topbar
        title="Anúncios"
        subtitle="Dashboard de campanhas pagas - Meta, Google, TikTok e YouTube."
        action={
          <Link href="/anuncios/integracoes" className="btn-primary">
            <Plug className="w-4 h-4" /> Integrações
            {conectadas > 0 && (
              <span className="ml-1 bg-emerald-400 text-emerald-900 text-[10px] font-bold px-1.5 rounded-full">
                {conectadas} ativa{conectadas > 1 ? 's' : ''}
              </span>
            )}
          </Link>
        }
      />
      <main className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Abas de plataforma */}
        <div className="flex items-center gap-1 md:gap-2 border-b border-line overflow-x-auto">
          {PLATAFORMAS.map(p => {
            const active = p.id === plataforma.id;
            return (
              <Link
                key={p.id}
                href={`/anuncios?plataforma=${p.id}`}
                className={
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ' +
                  (active
                    ? 'border-navy-800 text-navy-900'
                    : 'border-transparent text-slate hover:text-navy-700')
                }
                style={active ? { borderColor: p.color } : {}}
              >
                <span className="text-base">{p.icon}</span>
                {p.label}
                <span className="text-xs text-slate-muted">
                  ({counts[p.id]})
                </span>
              </Link>
            );
          })}
        </div>

        {/* Status da integração */}
        <div className={
          'card p-4 flex items-center justify-between ' +
          (ehConectada
            ? 'border-emerald-200 bg-emerald-50/40'
            : 'border-amber-200 bg-amber-50/40')
        }>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ backgroundColor: plataforma.color + '15', color: plataforma.color }}
            >
              {plataforma.icon}
            </div>
            <div>
              <h3 className="h3">{plataforma.label}</h3>
              <p className="text-xs text-slate">
                {ehConectada
                  ? <>Sincronização <strong className="text-emerald-700">ativa</strong> · conta {integPlat?.nome_conta}</>
                  : <>Integração <strong className="text-amber-700">desconectada</strong> · dados manuais até a integração ser ligada</>}
              </p>
            </div>
          </div>
          <Link href="/anuncios/integracoes" className="btn-secondary">
            <Plug className="w-3 h-3" /> {ehConectada ? 'Gerenciar' : 'Conectar'}
          </Link>
        </div>

        {/* KPIs principais */}
        <div>
          <span className="eyebrow">Métricas principais (campanhas ativas)</span>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-2">
            <StatCard label="Investimento" value={fmtBRL(totalInvest)} icon={Megaphone} />
            <StatCard label="Impressões" value={fmtNum(totalImpr)} icon={Eye} />
            <StatCard label="Cliques" value={fmtNum(totalCliq)} icon={MousePointerClick} />
            <StatCard label="Conversões" value={String(totalConv)} icon={TrendingUp} highlight />
            <StatCard label="CTR médio" value={`${ctrMedio.toFixed(2)}%`} icon={TrendingUp} />
          </div>
        </div>

        {/* Pizza + Investimento vs Retorno */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          <div className="card p-5">
            <h3 className="h2 mb-4">Distribuição de investimento</h3>
            {piePorCampanha.length > 0 ? (
              <PieChart data={piePorCampanha} />
            ) : (
              <p className="text-sm text-slate-muted italic">
                Nenhuma campanha ativa nesta plataforma.
              </p>
            )}
          </div>

          <div className="card p-5">
            <h3 className="h2 mb-4">Investimento × Retorno estimado</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-rose-50 border border-rose-100">
                <span className="text-sm text-rose-700 font-semibold flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3" /> Investimento
                </span>
                <span className="text-lg font-bold text-rose-700">{fmtBRL(totalInvest)}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <span className="text-sm text-emerald-700 font-semibold flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> Retorno estimado
                </span>
                <span className="text-lg font-bold text-emerald-700">{fmtBRL(retornoEstimado)}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-navy-50 border border-navy-100">
                <span className="text-sm text-navy-700 font-semibold">Lucro estimado</span>
                <span className={'text-lg font-bold ' + (lucroEstimado >= 0 ? 'text-navy-800' : 'text-rose-700')}>
                  {fmtBRL(lucroEstimado)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                <span className="text-sm text-amber-700 font-semibold">ROI</span>
                <span className="text-lg font-bold text-amber-700">
                  {totalInvest > 0 ? `${roi.toFixed(0)}%` : '—'}
                </span>
              </div>

              <p className="text-xs text-slate-muted italic pt-2 border-t border-line">
                Retorno calculado com ticket médio LAM de <strong>{fmtBRL(TICKET_MEDIO)}</strong> ×
                {' '}{totalConv} conversão(ões). Edite o ticket no código (`TICKET_MEDIO`) ou conecte o
                financeiro para retorno real.
              </p>
            </div>
          </div>
        </div>

        {/* Tabela de campanhas */}
        <div className="card overflow-x-auto">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <h2 className="h2">Campanhas em {plataforma.label}</h2>
            <span className="text-xs text-slate-muted">{anuncios.length} no total</span>
          </div>
          {anuncios.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-muted italic">
              Sem campanhas em {plataforma.label}.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-navy-50 text-navy-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Campanha</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Investido</th>
                  <th className="px-4 py-3 text-right font-semibold">Impressões</th>
                  <th className="px-4 py-3 text-right font-semibold">Cliques</th>
                  <th className="px-4 py-3 text-right font-semibold">CTR</th>
                  <th className="px-4 py-3 text-right font-semibold">Conv.</th>
                  <th className="px-4 py-3 text-right font-semibold">CPC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {anuncios.map(a => (
                  <tr key={a.id} className="hover:bg-navy-50/30">
                    <td className="px-4 py-3 font-semibold text-navy-900">{a.campanha}</td>
                    <td className="px-4 py-3">
                      <span className={
                        a.status === 'ativo' ? 'badge-green' :
                        a.status === 'pausado' ? 'badge-gold' : 'badge-slate'
                      }>{a.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">{fmtBRL(a.investimento)}</td>
                    <td className="px-4 py-3 text-right">{fmtNum(a.impressoes)}</td>
                    <td className="px-4 py-3 text-right">{fmtNum(a.cliques)}</td>
                    <td className="px-4 py-3 text-right">{a.ctr.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{a.conversoes}</td>
                    <td className="px-4 py-3 text-right">{fmtBRL(a.cpc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  );
}
