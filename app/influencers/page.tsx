import Topbar from '@/components/topbar';
import { getDb } from '@/lib/db';
import Link from 'next/link';
import { Plus, Eye, Users, Heart } from 'lucide-react';
import InfluencersList from './influencers-list';
import type { Influencer, InfluencerRede } from '@/lib/types';

export default function InfluencersPage() {
  const db = getDb();
  const influencers = db.prepare(`
    SELECT i.*, l.nome as loja_nome
    FROM influencers i
    LEFT JOIN lojas l ON l.id = i.loja_id
    ORDER BY i.status = 'ativo' DESC, i.alcance_medio DESC
  `).all() as (Influencer & { loja_nome: string | null })[];

  const redesAll = db.prepare(`SELECT * FROM influencer_redes`).all() as InfluencerRede[];
  const redesByInf: Record<number, InfluencerRede[]> = {};
  redesAll.forEach(r => {
    if (!redesByInf[r.influencer_id]) redesByInf[r.influencer_id] = [];
    redesByInf[r.influencer_id].push(r);
  });

  const totalAtivos = influencers.filter(i => i.status === 'ativo').length;
  const valorAcordoTotal = influencers
    .filter(i => i.status === 'ativo')
    .reduce((sum, i) => sum + i.valor_acordo, 0);

  const fmtNum = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
  const fmtBRL = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  return (
    <>
      <Topbar
        title="Central de Influencers"
        subtitle="Rede de influencers regionais da LAM Deccor."
        action={
          <Link href="/influencers/novo" className="btn-primary">
            <Plus className="w-4 h-4" /> Novo
          </Link>
        }
      />
      <main className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-navy-500" />
            </div>
            <div>
              <div className="text-xs text-slate-muted">Influencers ativos</div>
              <div className="h2">{totalAtivos}</div>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center">
              <Eye className="w-5 h-5 text-navy-500" />
            </div>
            <div>
              <div className="text-xs text-slate-muted">Alcance somado (IG)</div>
              <div className="h2">
                {fmtNum(influencers.filter(i => i.status === 'ativo').reduce((s, i) => s + i.alcance_medio, 0))}
              </div>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center">
              <Heart className="w-5 h-5 text-navy-500" />
            </div>
            <div>
              <div className="text-xs text-slate-muted">Valor de acordos vigentes</div>
              <div className="h2">{fmtBRL(valorAcordoTotal)}</div>
            </div>
          </div>
        </div>

        <InfluencersList influencers={influencers} redesByInf={redesByInf} />
      </main>
    </>
  );
}
