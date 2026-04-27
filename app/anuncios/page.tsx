import Topbar from '@/components/topbar';
import { getDb } from '@/lib/db';
import Link from 'next/link';
import { Megaphone, MousePointerClick, TrendingUp, Eye, Plug } from 'lucide-react';
import StatCard from '@/components/stat-card';
import type { Anuncio, Integracao } from '@/lib/types';

const PLATAFORMA_LABEL: Record<string, { label: string; color: string }> = {
  meta: { label: 'Meta Ads', color: '#1877F2' },
  google: { label: 'Google', color: '#4285F4' },
  tiktok: { label: 'TikTok', color: '#FE2C55' },
  youtube: { label: 'YouTube', color: '#FF0000' },
};

export default function AnunciosPage() {
  const db = getDb();
  const anuncios = db.prepare(`
    SELECT * FROM anuncios ORDER BY status='ativo' DESC, investimento DESC
  `).all() as Anuncio[];

  const integ = db.prepare('SELECT * FROM integracoes').all() as Integracao[];
  const conectadas = integ.filter(i => i.conectado === 1).length;

  const ativos = anuncios.filter(a => a.status === 'ativo');
  const totalInvest = ativos.reduce((s, a) => s + a.investimento, 0);
  const totalImpr = ativos.reduce((s, a) => s + a.impressoes, 0);
  const totalCliq = ativos.reduce((s, a) => s + a.cliques, 0);
  const totalConv = ativos.reduce((s, a) => s + a.conversoes, 0);
  const ctrMedio = totalImpr > 0 ? (totalCliq / totalImpr) * 100 : 0;

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
      <main className="p-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Investimento ativo" value={fmtBRL(totalInvest)} icon={Megaphone} />
          <StatCard label="Impressões" value={fmtNum(totalImpr)} icon={Eye} />
          <StatCard label="Cliques" value={fmtNum(totalCliq)} icon={MousePointerClick} />
          <StatCard label="Conversões" value={String(totalConv)} icon={TrendingUp} highlight />
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="eyebrow">CTR médio (campanhas ativas)</span>
            <span className="text-2xl font-bold text-navy-900">{ctrMedio.toFixed(2)}%</span>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <h2 className="h2">Campanhas</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-navy-50 text-navy-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Campanha</th>
                <th className="px-4 py-3 text-left font-semibold">Plataforma</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Investido</th>
                <th className="px-4 py-3 text-right font-semibold">Impr.</th>
                <th className="px-4 py-3 text-right font-semibold">CTR</th>
                <th className="px-4 py-3 text-right font-semibold">Conv.</th>
                <th className="px-4 py-3 text-right font-semibold">CPC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {anuncios.map(a => {
                const plat = PLATAFORMA_LABEL[a.plataforma] ?? { label: a.plataforma, color: '#999' };
                return (
                  <tr key={a.id} className="hover:bg-navy-50/30">
                    <td className="px-4 py-3 font-semibold text-navy-900">{a.campanha}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: plat.color }} />
                        {plat.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={
                        a.status === 'ativo' ? 'badge-green' :
                        a.status === 'pausado' ? 'badge-gold' : 'badge-slate'
                      }>{a.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">{fmtBRL(a.investimento)}</td>
                    <td className="px-4 py-3 text-right">{fmtNum(a.impressoes)}</td>
                    <td className="px-4 py-3 text-right">{a.ctr.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{a.conversoes}</td>
                    <td className="px-4 py-3 text-right">{fmtBRL(a.cpc)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
