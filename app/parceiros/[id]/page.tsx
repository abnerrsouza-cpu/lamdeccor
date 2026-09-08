import Topbar from '@/components/topbar';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  ArrowLeft, MapPin, Phone, Mail, Instagram, Plus, MessageCircle,
  Zap, Percent, Trash2, Building2,
} from 'lucide-react';
import { getDb } from '@/lib/db';
import { getEmpresaAtiva } from '@/lib/empresa';
import { getCurrentUser } from '@/lib/auth';
import { podeEditar } from '@/lib/permissions';
import { moduloVisivel } from '@/lib/modulos';
import {
  adicionarIndicacao, registrarConversa, removerConversa,
  atualizarParceiro, deletarParceiro,
} from '../actions';
import ParceiroCampos from '../parceiro-form';
import IndicacaoLinha from './indicacao-linha';
import {
  STATUS_PARCEIRO, CANAIS, canalLabel, diasDesde, rotuloDias, fmtBRL, LIMITE_SEM_CONTATO,
} from '../constantes';
import type { Parceiro, ParceiroIndicacao, ParceiroConversa } from '@/lib/types';

function soDigitos(tel: string) {
  return tel.replace(/\D/g, '');
}

export default async function ParceiroDetailPage({ params }: { params: { id: string } }) {
  const empresa = await getEmpresaAtiva();
  if (!moduloVisivel('/parceiros', empresa.slug)) redirect('/');

  const db = getDb();
  const id = Number(params.id);
  const user = await getCurrentUser();
  const editar = podeEditar(user?.role);

  const p = db.prepare('SELECT * FROM parceiros WHERE id = ? AND empresa_id = ?')
    .get(id, empresa.id) as Parceiro | undefined;
  if (!p) notFound();

  const indicacoes = db.prepare(`
    SELECT * FROM parceiro_indicacoes WHERE parceiro_id = ? ORDER BY data DESC, id DESC
  `).all(id) as ParceiroIndicacao[];

  const conversas = db.prepare(`
    SELECT c.*, u.nome as autor_nome
    FROM parceiro_conversas c
    LEFT JOIN users u ON u.id = c.autor_id
    WHERE c.parceiro_id = ?
    ORDER BY c.data DESC, c.id DESC
  `).all(id) as (ParceiroConversa & { autor_nome: string | null })[];

  const fechadas = indicacoes.filter(i => i.status === 'fechada');
  const valorFechado = fechadas.reduce((s, i) => s + i.valor, 0);
  const conversao = indicacoes.length > 0
    ? Math.round((fechadas.length / indicacoes.length) * 100)
    : null;
  const comissaoEstimada = valorFechado * (p.comissao_pct / 100);

  const ultimaConversa = conversas[0]?.data ?? null;
  const diasConversa = diasDesde(ultimaConversa);
  const frio = p.status === 'ativo' && (diasConversa === null || diasConversa > LIMITE_SEM_CONTATO);
  const status = STATUS_PARCEIRO[p.status] ?? STATUS_PARCEIRO.prospeccao;
  const iniciais = p.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Topbar title={p.nome} subtitle={p.tipo ?? 'Parceiro'} />
      <main className="p-4 md:p-6 space-y-4 md:space-y-6">
        <Link href="/parceiros" className="text-sm text-navy-500 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Voltar
        </Link>

        {/* Cartão do parceiro */}
        <div className="card p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-5">
            <div className="w-16 h-16 rounded-xl bg-navy-100 flex items-center justify-center
                            text-navy-700 font-bold text-xl shrink-0">
              {iniciais}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-navy-900">{p.nome}</h2>
                <span className={status.className}>{status.label}</span>
              </div>
              {p.tipo && <p className="text-sm text-navy-500 font-semibold mt-0.5">{p.tipo}</p>}

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {p.responsavel && (
                  <div className="flex items-center gap-2 text-slate">
                    <Building2 className="w-4 h-4 text-slate-muted shrink-0" /> {p.responsavel}
                  </div>
                )}
                {p.telefone && (
                  <a
                    href={`https://wa.me/55${soDigitos(p.telefone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate hover:text-emerald-700"
                  >
                    <Phone className="w-4 h-4 text-slate-muted shrink-0" /> {p.telefone}
                    <span className="text-[10px] text-emerald-700 font-semibold">WhatsApp</span>
                  </a>
                )}
                {p.email && (
                  <a href={`mailto:${p.email}`} className="flex items-center gap-2 text-slate hover:text-navy-700 truncate">
                    <Mail className="w-4 h-4 text-slate-muted shrink-0" /> {p.email}
                  </a>
                )}
                {p.instagram && (
                  <div className="flex items-center gap-2 text-slate">
                    <Instagram className="w-4 h-4 text-slate-muted shrink-0" /> {p.instagram}
                  </div>
                )}
                {(p.cidade || p.endereco) && (
                  <div className="flex items-center gap-2 text-slate">
                    <MapPin className="w-4 h-4 text-slate-muted shrink-0" />
                    {[p.cidade, p.endereco].filter(Boolean).join(' · ')}
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate">
                  <Zap className="w-4 h-4 text-slate-muted shrink-0" />
                  Ativação:{' '}
                  {p.data_ativacao
                    ? new Date(p.data_ativacao + 'T00:00:00').toLocaleDateString('pt-BR')
                    : '—'}
                </div>
                <div className={`flex items-center gap-2 ${frio ? 'text-amber-700 font-semibold' : 'text-slate'}`}>
                  <MessageCircle className="w-4 h-4 text-slate-muted shrink-0" />
                  Última conversa: {ultimaConversa ? rotuloDias(diasConversa) : 'nunca'}
                </div>
                {p.comissao_pct > 0 && (
                  <div className="flex items-center gap-2 text-slate">
                    <Percent className="w-4 h-4 text-slate-muted shrink-0" />
                    Comissão: {p.comissao_pct}%
                  </div>
                )}
              </div>

              {p.observacoes && (
                <p className="mt-3 text-sm text-slate bg-navy-50/60 rounded-lg p-3">{p.observacoes}</p>
              )}
            </div>
          </div>

          {frio && (
            <div className="mt-5 flex items-start gap-2 text-sm text-amber-800 bg-amber-50
                            border border-amber-200 rounded-lg px-3 py-2">
              <MessageCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Parceiro ativo sem conversa registrada
                {diasConversa !== null ? ` há ${diasConversa} dias` : ' até agora'}.
                Registre um contato abaixo para reativar o relacionamento.
              </span>
            </div>
          )}

          <div className="mt-5 pt-5 border-t border-line grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-slate-muted uppercase tracking-wide">Indicações</div>
              <div className="h2">{indicacoes.length}</div>
            </div>
            <div>
              <div className="text-xs text-slate-muted uppercase tracking-wide">Fechadas</div>
              <div className="h2 text-emerald-700">
                {fechadas.length}
                {conversao !== null && (
                  <span className="text-sm font-semibold text-slate-muted"> · {conversao}%</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-muted uppercase tracking-wide">Valor gerado</div>
              <div className="h2">{fmtBRL(valorFechado)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-muted uppercase tracking-wide">Comissão estimada</div>
              <div className="h2">{p.comissao_pct > 0 ? fmtBRL(comissaoEstimada) : '—'}</div>
            </div>
          </div>
        </div>

        {/* Indicações */}
        <div className="card p-6">
          <h3 className="h2 mb-4">Indicações</h3>
          {indicacoes.length === 0 ? (
            <p className="text-sm text-slate-muted py-3">Nenhuma indicação registrada ainda.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-navy-50 text-navy-700">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Cliente</th>
                    <th className="px-4 py-2 text-left font-semibold">Serviço</th>
                    <th className="px-4 py-2 text-left font-semibold">Data</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                    <th className="px-4 py-2 text-right font-semibold">Valor</th>
                    {editar && <th className="px-2 py-2" />}
                  </tr>
                </thead>
                <tbody>
                  {indicacoes.map((i, idx) => (
                    <IndicacaoLinha
                      key={i.id}
                      indicacao={i}
                      parceiroId={id}
                      editar={editar}
                      zebra={idx % 2 === 1}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {editar && (
            <details className="mt-5">
              <summary className="btn-secondary cursor-pointer w-fit">
                <Plus className="w-4 h-4" /> Registrar indicação
              </summary>
              <form
                action={adicionarIndicacao.bind(null, id)}
                className="mt-4 space-y-4 p-4 bg-navy-50/50 rounded-lg"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="label">Cliente indicado</label>
                    <input name="cliente_nome" required className="input" placeholder="Ex: Ana Paula" />
                  </div>
                  <div>
                    <label className="label">Contato do cliente</label>
                    <input name="cliente_contato" className="input" placeholder="(12) 99999-0000" />
                  </div>
                  <div>
                    <label className="label">Serviço</label>
                    <input name="servico" className="input" placeholder="Ex: Lavagem de sofá 3 lugares" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="label">Data da indicação</label>
                    <input type="date" name="data" defaultValue={hoje} className="input" />
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select name="status" className="input">
                      <option value="nova">Nova</option>
                      <option value="em_contato">Em contato</option>
                      <option value="agendada">Agendada</option>
                      <option value="fechada">Fechada</option>
                      <option value="perdida">Perdida</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Valor (R$)</label>
                    <input type="number" step="0.01" min="0" name="valor" className="input" placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className="label">Observações</label>
                  <input name="observacoes" className="input" />
                </div>
                <button type="submit" className="btn-primary">Salvar indicação</button>
              </form>
            </details>
          )}
        </div>

        {/* Conversas */}
        <div className="card p-6">
          <h3 className="h2 mb-4">Histórico de conversas</h3>
          {conversas.length === 0 ? (
            <p className="text-sm text-slate-muted py-3">Nenhuma conversa registrada ainda.</p>
          ) : (
            <ol className="space-y-3">
              {conversas.map(c => (
                <li key={c.id} className="flex gap-3 group">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-8 h-8 rounded-full bg-navy-50 flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-navy-500" />
                    </div>
                    <div className="flex-1 w-px bg-line mt-1" />
                  </div>
                  <div className="flex-1 min-w-0 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-navy-900">
                        {new Date(c.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      <span className="badge-slate">{canalLabel(c.canal)}</span>
                      {c.autor_nome && (
                        <span className="text-xs text-slate-muted">por {c.autor_nome}</span>
                      )}
                      {editar && (
                        <form action={removerConversa.bind(null, c.id, id)} className="ml-auto">
                          <button
                            title="Remover conversa"
                            className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50
                                       sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      )}
                    </div>
                    {c.resumo && <p className="text-sm text-slate mt-1 whitespace-pre-wrap">{c.resumo}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}

          {editar && (
            <details className="mt-5" open={conversas.length === 0}>
              <summary className="btn-secondary cursor-pointer w-fit">
                <Plus className="w-4 h-4" /> Registrar conversa
              </summary>
              <form
                action={registrarConversa.bind(null, id)}
                className="mt-4 space-y-4 p-4 bg-navy-50/50 rounded-lg"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Data</label>
                    <input type="date" name="data" defaultValue={hoje} className="input" />
                  </div>
                  <div>
                    <label className="label">Canal</label>
                    <select name="canal" className="input">
                      {CANAIS.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">O que foi conversado</label>
                  <textarea
                    name="resumo"
                    rows={3}
                    className="input"
                    placeholder="Ex: Passei a tabela nova, ficou de indicar dois clientes essa semana."
                  />
                </div>
                <button type="submit" className="btn-primary">Salvar conversa</button>
              </form>
            </details>
          )}
        </div>

        {/* Edição */}
        {editar && (
          <details className="card p-6">
            <summary className="cursor-pointer h2">Editar dados do parceiro</summary>
            <form action={atualizarParceiro.bind(null, id)} className="mt-5 space-y-4">
              <ParceiroCampos parceiro={p} />
              <div className="flex items-center gap-2">
                <button type="submit" className="btn-primary">Salvar alterações</button>
              </div>
            </form>
            <form action={deletarParceiro.bind(null, id)} className="mt-4 pt-4 border-t border-line">
              <button className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Excluir parceiro e todo o histórico
              </button>
            </form>
          </details>
        )}
      </main>
    </>
  );
}
