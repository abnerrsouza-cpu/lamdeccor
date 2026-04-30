import Topbar from '@/components/topbar';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { podeEditar } from '@/lib/permissions';
import { atualizarCampanha, deletarCampanha, adicionarCanal } from '../actions';
import CanalEditor from './canal-editor';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Trash2, Calendar, DollarSign, Plus, Eye } from 'lucide-react';
import type { Campanha, CampanhaCanal } from '@/lib/types';

export default async function CampanhaDetail({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const editar = podeEditar(user?.role);
  const db = getDb();
  const id = Number(params.id);
  const c = db.prepare('SELECT * FROM campanhas WHERE id = ?').get(id) as Campanha | undefined;
  if (!c) notFound();
  const canais = db.prepare(
    `SELECT * FROM campanha_canais WHERE campanha_id = ? ORDER BY ordem ASC`
  ).all(id) as CampanhaCanal[];

  const fmtBRL = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  return (
    <>
      <Topbar title={c.nome} subtitle={c.slogan} />
      <main className="p-6 space-y-6">
        <Link href="/campanhas" className="text-sm text-navy-500 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Voltar
        </Link>

        {/* Header colorido (estilo capa) */}
        <div className="card overflow-hidden">
          <div className="h-3" style={{ backgroundColor: c.capa_cor }} />
          <div className="p-6 grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-slate-muted">Período</div>
              <div className="font-bold text-navy-900 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {c.data_inicio} → {c.data_fim}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-muted">Orçamento</div>
              <div className="font-bold text-navy-900 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> {fmtBRL(c.orcamento)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-muted">Status</div>
              <div className="font-bold text-navy-900 capitalize">{c.status.replace('_', ' ')}</div>
            </div>
            {c.kpi_base && (
              <div className="col-span-3 text-sm italic text-slate border-t border-line pt-4">
                <strong className="text-navy-700 not-italic">KPI base: </strong>
                {c.kpi_base}
              </div>
            )}
          </div>
        </div>

        {/* Grid de canais (estilo briefing) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {canais.map(canal => (
            <CanalEditor key={canal.id} canal={canal} editar={editar} />
          ))}

          {/* Botão de adicionar novo card - só pra staff */}
          {editar && (
            <form action={async () => {
              'use server';
              await adicionarCanal(id, 'NOVO CANAL');
            }}>
              <button
                type="submit"
                className="w-full h-full min-h-[200px] rounded-xl border-2 border-dashed border-line
                           hover:border-navy-400 hover:bg-navy-50/30 text-slate-muted hover:text-navy-700
                           transition-all flex flex-col items-center justify-center gap-2 p-4 group"
              >
                <div className="w-10 h-10 rounded-full bg-navy-50 group-hover:bg-navy-100 flex items-center justify-center transition-colors">
                  <Plus className="w-5 h-5 text-navy-500" />
                </div>
                <span className="text-sm font-bold uppercase tracking-wider">Adicionar card</span>
                <span className="text-xs italic">novo canal de comunicação</span>
              </button>
            </form>
          )}
        </div>

        {/* Edição da campanha - só staff */}
        {editar && (
        <details className="card p-6">
          <summary className="cursor-pointer h2">Editar campanha</summary>
          <form action={atualizarCampanha.bind(null, id)} className="mt-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nome</label>
                <input name="nome" defaultValue={c.nome} required className="input" />
              </div>
              <div>
                <label className="label">Slogan</label>
                <input name="slogan" defaultValue={c.slogan} className="input" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="label">Início</label>
                <input type="date" name="data_inicio" defaultValue={c.data_inicio} className="input" />
              </div>
              <div>
                <label className="label">Fim</label>
                <input type="date" name="data_fim" defaultValue={c.data_fim} className="input" />
              </div>
              <div>
                <label className="label">Orçamento</label>
                <input type="number" name="orcamento" defaultValue={c.orcamento} className="input" />
              </div>
              <div>
                <label className="label">Cor</label>
                <input name="capa_cor" defaultValue={c.capa_cor} className="input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Status</label>
                <select name="status" defaultValue={c.status} className="input">
                  <option value="planejamento">Planejamento</option>
                  <option value="em_execucao">Em execução</option>
                  <option value="finalizada">Finalizada</option>
                  <option value="pausada">Pausada</option>
                </select>
              </div>
              <div>
                <label className="label">KPI base</label>
                <input name="kpi_base" defaultValue={c.kpi_base} className="input" />
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t border-line">
              <button type="submit" className="btn-primary">Salvar</button>
            </div>
          </form>
          {/* Form de exclusão fora do form de edição (HTML não permite aninhar) */}
          <form action={deletarCampanha.bind(null, id)} className="mt-3">
            <button className="btn-danger"><Trash2 className="w-4 h-4" /> Excluir campanha</button>
          </form>
        </details>
        )}
      </main>
    </>
  );
}
