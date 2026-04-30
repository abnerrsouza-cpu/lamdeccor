import Topbar from '@/components/topbar';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { podeEditar } from '@/lib/permissions';
import { criarCampanha } from './actions';
import Link from 'next/link';
import { Plus, Eye } from 'lucide-react';
import CampanhasList from './campanhas-list';
import type { Campanha } from '@/lib/types';

export default async function CampanhasPage({ searchParams }: { searchParams: { aba?: string } }) {
  const user = await getCurrentUser();
  const editar = podeEditar(user?.role);
  const db = getDb();
  const aba = searchParams.aba === 'arquivadas' ? 'arquivadas' : 'ativas';

  const campanhas = db.prepare(`
    SELECT * FROM campanhas WHERE arquivada = ? ORDER BY data_inicio DESC
  `).all(aba === 'arquivadas' ? 1 : 0) as Campanha[];

  const totalAtivas = (db.prepare(`SELECT COUNT(*) as c FROM campanhas WHERE arquivada = 0`).get() as { c: number }).c;
  const totalArq = (db.prepare(`SELECT COUNT(*) as c FROM campanhas WHERE arquivada = 1`).get() as { c: number }).c;

  return (
    <>
      <Topbar
        title="Campanhas publicitárias"
        subtitle={
          editar
            ? 'Briefing por canal: Instagram, Meta Ads, Google, WhatsApp, RA, Influencers, GMN, Mídia OFF, Designer, Audiovisual e Dados.'
            : 'Acompanhe as campanhas em andamento. Para edições, fale com o time de marketing.'
        }
        action={
          editar ? (
          <details className="relative">
            <summary className="btn-primary list-none cursor-pointer">
              <Plus className="w-4 h-4" /> Nova campanha
            </summary>
            <form action={criarCampanha} className="absolute right-0 mt-2 w-[480px] card p-5 z-30 space-y-3">
              <div>
                <label className="label">Nome da campanha</label>
                <input name="nome" required className="input" placeholder="Ex: Hora da mãe descansar" />
              </div>
              <div>
                <label className="label">Slogan / subtítulo</label>
                <input name="slogan" className="input" placeholder="Maio 2026 - Dia das Mães" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Início</label>
                  <input type="date" name="data_inicio" className="input" />
                </div>
                <div>
                  <label className="label">Fim</label>
                  <input type="date" name="data_fim" className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Orçamento</label>
                  <input type="number" name="orcamento" className="input" />
                </div>
                <div>
                  <label className="label">Cor de capa</label>
                  <input name="capa_cor" defaultValue="#2D5F97" className="input" />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full">Criar e abrir briefing</button>
            </form>
          </details>
          ) : (
            <span className="badge-blue flex items-center gap-1">
              <Eye className="w-3 h-3" /> Modo visualização
            </span>
          )
        }
      />
      <main className="p-4 md:p-6 space-y-4 md:space-y-5">
        {/* Sub-abas */}
        <div className="inline-flex bg-navy-50 rounded-lg p-1">
          <Link
            href="/campanhas?aba=ativas"
            className={`px-4 py-1.5 text-sm font-semibold rounded transition-colors flex items-center gap-2 ${
              aba === 'ativas' ? 'bg-white shadow-sm text-navy-900' : 'text-slate hover:text-navy-900'
            }`}
          >
            Ativas
            <span className="text-xs text-slate-muted">{totalAtivas}</span>
          </Link>
          <Link
            href="/campanhas?aba=arquivadas"
            className={`px-4 py-1.5 text-sm font-semibold rounded transition-colors flex items-center gap-2 ${
              aba === 'arquivadas' ? 'bg-white shadow-sm text-navy-900' : 'text-slate hover:text-navy-900'
            }`}
          >
            Arquivadas
            <span className="text-xs text-slate-muted">{totalArq}</span>
          </Link>
        </div>

        <CampanhasList campanhas={campanhas} arquivadas={aba === 'arquivadas'} editar={editar} />
      </main>
    </>
  );
}
