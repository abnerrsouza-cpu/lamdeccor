import Topbar from '@/components/topbar';
import { getDb } from '@/lib/db';
import { getEmpresaId } from '@/lib/empresa';
import { adicionarCampanha, atualizarInfluencer, adicionarRede, removerRede } from '../actions';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, MapPin, TrendingUp, Plus, Eye, Heart, DollarSign,
  Instagram, Youtube, Music2, ExternalLink, Trash2, Calendar
} from 'lucide-react';
import type { Influencer, InfluencerCampanha, InfluencerRede, Loja } from '@/lib/types';

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  ativo: { label: 'Ativo', className: 'badge-green' },
  em_negociacao: { label: 'Em negociação', className: 'badge-gold' },
  prospeccao: { label: 'Prospecção', className: 'badge-slate' },
  pausado: { label: 'Pausado', className: 'badge-red' },
};

const REDE_ICON: Record<string, any> = {
  instagram: Instagram,
  tiktok: Music2,
  youtube: Youtube,
  kwai: Music2,
  twitter: ExternalLink,
  linkedin: ExternalLink,
};

export default async function InfluencerDetailPage({ params }: { params: { id: string } }) {
  const db = getDb();
  const emp = await getEmpresaId();
  const id = Number(params.id);

  const inf = db.prepare(`
    SELECT i.*, l.nome as loja_nome
    FROM influencers i
    LEFT JOIN lojas l ON l.id = i.loja_id
    WHERE i.id = ? AND i.empresa_id = ?
  `).get(id, emp) as (Influencer & { loja_nome: string | null }) | undefined;

  if (!inf) notFound();

  const lojas = db.prepare('SELECT * FROM lojas WHERE empresa_id = ? ORDER BY nome').all(emp) as Loja[];
  const redes = db.prepare(`SELECT * FROM influencer_redes WHERE influencer_id = ?`).all(id) as InfluencerRede[];
  const campanhas = db.prepare(`
    SELECT * FROM influencer_campanhas WHERE influencer_id = ? ORDER BY data_inicio DESC
  `).all(id) as InfluencerCampanha[];

  const totalInvestido = campanhas.reduce((s, c) => s + c.investimento, 0);
  const totalVendas = campanhas.reduce((s, c) => s + c.vendas_atribuidas, 0);
  const roi = totalInvestido > 0 ? ((totalVendas / totalInvestido - 1) * 100) : 0;

  const status = STATUS_LABEL[inf.status] ?? STATUS_LABEL.prospeccao;
  const initials = inf.nome.split(' ').slice(0, 2).map(n => n[0]).join('');

  const fmtNum = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
  const fmtBRL = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  return (
    <>
      <Topbar title={inf.nome} subtitle={inf.handle ?? '—'} />
      <main className="p-6 space-y-6">
        <Link href="/influencers" className="text-sm text-navy-500 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Voltar para a Central
        </Link>

        <div className="card p-6">
          <div className="flex items-start gap-5">
            {inf.avatar_url ? (
              <img src={inf.avatar_url} alt={inf.nome}
                className="w-24 h-24 rounded-full object-cover border-2 border-line shrink-0" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-navy-100 flex items-center justify-center
                              text-navy-700 font-bold text-3xl shrink-0">{initials}</div>
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-navy-900">{inf.nome}</h2>
                  <p className="text-navy-500 font-semibold">{inf.handle}</p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate">
                    <MapPin className="w-3 h-3" /> {inf.cidade}
                    {inf.loja_nome && <span>· {inf.loja_nome}</span>}
                  </div>
                </div>
                <span className={status.className}>{status.label}</span>
              </div>
              <p className="mt-3 text-sm text-slate">{inf.perfil}</p>
              {(inf.valor_acordo > 0 || inf.acordo_inicio || inf.acordo_fim) && (
                <div className="mt-4 pt-4 border-t border-line grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-slate-muted">Valor do acordo</div>
                    <div className="font-bold text-navy-900">{fmtBRL(inf.valor_acordo)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-muted">Vigência início</div>
                    <div className="font-semibold text-navy-700">{inf.acordo_inicio ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-muted">Vigência fim</div>
                    <div className="font-semibold text-navy-700">{inf.acordo_fim ?? '—'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="grid grid-cols-4 gap-4">
          <StatBox icon={Eye} label="Alcance médio (IG)" value={fmtNum(inf.alcance_medio)} />
          <StatBox icon={Heart} label="Engajamento" value={`${inf.engajamento.toFixed(1)}%`} />
          <StatBox icon={DollarSign} label="Investido (campanhas)" value={fmtBRL(totalInvestido)} />
          <StatBox icon={TrendingUp} label="ROI estimado"
                   value={totalInvestido > 0 ? `${roi.toFixed(0)}%` : '—'}
                   sub={`${fmtBRL(totalVendas)} em vendas`} />
        </div>

        {/* Aba Redes Sociais */}
        <div className="card p-6">
          <h3 className="h2 mb-4">Redes sociais</h3>
          {redes.length === 0 ? (
            <p className="text-sm text-slate-muted mb-4">Nenhuma rede cadastrada ainda.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {redes.map(r => {
                const Icon = REDE_ICON[r.rede] ?? ExternalLink;
                return (
                  <div key={r.id} className="border border-line rounded-lg p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-navy-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-muted capitalize">{r.rede}</div>
                      <div className="text-sm font-bold text-navy-900">{fmtNum(r.seguidores)}</div>
                      <div className="text-[11px] text-slate-muted">{r.engajamento.toFixed(1)}% engaj.</div>
                    </div>
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noopener" className="text-navy-500 hover:text-navy-700">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <form action={removerRede.bind(null, r.id, id)}>
                      <button className="text-rose-400 hover:text-rose-600">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
          <details>
            <summary className="btn-secondary cursor-pointer w-fit">
              <Plus className="w-4 h-4" /> Adicionar rede social
            </summary>
            <form action={adicionarRede.bind(null, id)} className="mt-4 grid grid-cols-4 gap-3 p-4 bg-navy-50/50 rounded-lg">
              <div>
                <label className="label">Rede</label>
                <select name="rede" className="input">
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="kwai">Kwai</option>
                  <option value="twitter">Twitter / X</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">URL do perfil</label>
                <input name="url" className="input" placeholder="https://..." />
              </div>
              <div>
                <label className="label">Seguidores</label>
                <input type="number" name="seguidores" className="input" />
              </div>
              <div className="col-span-3">
                <label className="label">Engajamento %</label>
                <input type="number" step="0.1" name="engajamento" className="input" />
              </div>
              <div className="flex items-end">
                <button type="submit" className="btn-primary w-full">Adicionar</button>
              </div>
            </form>
          </details>
        </div>

        {/* Campanhas */}
        <div className="card p-6">
          <h3 className="h2 mb-4">Campanhas e performance</h3>
          {campanhas.length === 0 ? (
            <p className="text-sm text-slate-muted py-3">Nenhuma campanha registrada.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead className="bg-navy-50 text-navy-700">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Campanha</th>
                    <th className="px-4 py-2 text-left font-semibold">Período</th>
                    <th className="px-4 py-2 text-right font-semibold">Investido</th>
                    <th className="px-4 py-2 text-right font-semibold">Vendas</th>
                    <th className="px-4 py-2 text-right font-semibold">Views</th>
                    <th className="px-4 py-2 text-right font-semibold">Engaj.</th>
                  </tr>
                </thead>
                <tbody>
                  {campanhas.map((c, i) => (
                    <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-navy-50/30'}>
                      <td className="px-4 py-3 font-semibold text-navy-900">{c.campanha_nome}</td>
                      <td className="px-4 py-3 text-slate text-xs">{c.data_inicio} → {c.data_fim}</td>
                      <td className="px-4 py-3 text-right">{fmtBRL(c.investimento)}</td>
                      <td className="px-4 py-3 text-right text-emerald-700 font-semibold">
                        {c.vendas_atribuidas > 0 ? fmtBRL(c.vendas_atribuidas) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">{fmtNum(c.views)}</td>
                      <td className="px-4 py-3 text-right">{fmtNum(c.engajamentos)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <details className="mt-5">
            <summary className="btn-secondary cursor-pointer w-fit">
              <Plus className="w-4 h-4" /> Adicionar campanha / dados
            </summary>
            <form action={adicionarCampanha.bind(null, id)} className="mt-4 space-y-4 p-4 bg-navy-50/50 rounded-lg">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Campanha</label>
                  <input name="campanha_nome" required className="input" />
                </div>
                <div>
                  <label className="label">Início</label>
                  <input type="date" name="data_inicio" className="input" />
                </div>
                <div>
                  <label className="label">Fim</label>
                  <input type="date" name="data_fim" className="input" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="label">Investimento</label>
                  <input type="number" name="investimento" className="input" />
                </div>
                <div>
                  <label className="label">Vendas atribuídas</label>
                  <input type="number" name="vendas_atribuidas" className="input" />
                </div>
                <div>
                  <label className="label">Views</label>
                  <input type="number" name="views" className="input" />
                </div>
                <div>
                  <label className="label">Engajamentos</label>
                  <input type="number" name="engajamentos" className="input" />
                </div>
              </div>
              <button type="submit" className="btn-primary">Salvar campanha</button>
            </form>
          </details>
        </div>

        {/* Edição */}
        <details className="card p-6">
          <summary className="cursor-pointer h2">Editar dados do influencer</summary>
          <form action={atualizarInfluencer.bind(null, id)} className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nome</label>
                <input name="nome" defaultValue={inf.nome} className="input" />
              </div>
              <div>
                <label className="label">Handle</label>
                <input name="handle" defaultValue={inf.handle} className="input" />
              </div>
            </div>
            <div>
              <label className="label">URL da foto</label>
              <input name="avatar_url" defaultValue={inf.avatar_url ?? ''} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Cidade</label>
                <input name="cidade" defaultValue={inf.cidade} className="input" />
              </div>
              <div>
                <label className="label">Loja</label>
                <select name="loja_id" defaultValue={inf.loja_id ?? ''} className="input">
                  <option value="">— Nenhuma —</option>
                  {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Perfil</label>
              <textarea name="perfil" defaultValue={inf.perfil} rows={2} className="input" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Valor do acordo</label>
                <input type="number" name="valor_acordo" defaultValue={inf.valor_acordo} className="input" />
              </div>
              <div>
                <label className="label">Vigência início</label>
                <input type="date" name="acordo_inicio" defaultValue={inf.acordo_inicio ?? ''} className="input" />
              </div>
              <div>
                <label className="label">Vigência fim</label>
                <input type="date" name="acordo_fim" defaultValue={inf.acordo_fim ?? ''} className="input" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="label">Alcance</label>
                <input type="number" name="alcance_medio" defaultValue={inf.alcance_medio} className="input" />
              </div>
              <div>
                <label className="label">Engajamento %</label>
                <input type="number" step="0.1" name="engajamento" defaultValue={inf.engajamento} className="input" />
              </div>
              <div>
                <label className="label">Cachê mensal</label>
                <input type="number" name="cache_mensal" defaultValue={inf.cache_mensal} className="input" />
              </div>
              <div>
                <label className="label">Bônus %</label>
                <input type="number" step="0.1" name="bonus_pct" defaultValue={inf.bonus_pct} className="input" />
              </div>
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" defaultValue={inf.status} className="input">
                <option value="prospeccao">Prospecção</option>
                <option value="em_negociacao">Em negociação</option>
                <option value="ativo">Ativo</option>
                <option value="pausado">Pausado</option>
              </select>
            </div>
            <div>
              <label className="label">Observações</label>
              <textarea name="observacoes" defaultValue={inf.observacoes} rows={3} className="input" />
            </div>
            <button type="submit" className="btn-primary">Salvar alterações</button>
          </form>
        </details>
      </main>
    </>
  );
}

function StatBox({ icon: Icon, label, value, sub }: any) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-xs text-slate-muted">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="text-2xl font-bold text-navy-900 mt-1">{value}</div>
      {sub && <div className="text-xs text-slate-muted mt-0.5">{sub}</div>}
    </div>
  );
}
