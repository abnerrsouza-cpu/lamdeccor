import Topbar from '@/components/topbar';
import { redirect } from 'next/navigation';
import { Megaphone, AlertTriangle, Plus, Archive, Check, Star } from 'lucide-react';
import { getDb } from '@/lib/db';
import { getEmpresaId } from '@/lib/empresa';
import { getCurrentUser } from '@/lib/auth';
import { ehAdmin } from '@/lib/permissions';
import FormRascunho from '@/components/form-rascunho';
import { ListaAnexos, CampoAnexo } from '@/components/anexos';
import { listarAnexos } from '@/lib/anexos';
import { criarAviso, arquivarAviso, removerAnexoAviso } from './actions';
import type { Loja } from '@/lib/types';

export default async function AvisosPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const db = getDb();
  const emp = await getEmpresaId();
  const admin = ehAdmin(user.role);

  const avisos = db.prepare(`
    SELECT a.*, u.nome AS autor_nome, l.nome AS loja_nome,
      (SELECT COUNT(*) FROM aviso_confirmacoes c WHERE c.aviso_id = a.id) AS confirmados
    FROM avisos a
    LEFT JOIN users u ON u.id = a.autor_id
    LEFT JOIN lojas l ON l.id = a.loja_id
    WHERE a.empresa_id = ? AND a.ativo = 1
      AND (a.loja_id IS NULL OR a.loja_id = ? OR ?)
    ORDER BY a.importante DESC, a.created_at DESC
  `).all(emp, user.loja_id ?? -1, admin ? 1 : 0) as any[];

  /*
   * Para cada aviso importante: quem já confirmou e quem ainda falta.
   * "Falta" = quem recebe o aviso (empresa toda ou aquela loja) e está ativo.
   */
  const confirmacoes = admin ? db.prepare(`
    SELECT c.aviso_id, u.nome, u.loja_id, l.nome AS loja_nome, c.confirmado_em
    FROM aviso_confirmacoes c
    JOIN users u ON u.id = c.user_id
    LEFT JOIN lojas l ON l.id = u.loja_id
    JOIN avisos a ON a.id = c.aviso_id
    WHERE a.empresa_id = ?
    ORDER BY c.confirmado_em
  `).all(emp) as any[] : [];

  const destinatarios = admin ? db.prepare(`
    SELECT u.id, u.nome, u.loja_id, l.nome AS loja_nome
    FROM users u LEFT JOIN lojas l ON l.id = u.loja_id
    WHERE u.empresa_id = ? AND u.ativo = 1 AND u.role = 'gerente_loja'
  `).all(emp) as any[] : [];

  const anexosPorAviso: Record<number, ReturnType<typeof listarAnexos>> = {};
  for (const a of avisos) anexosPorAviso[a.id] = listarAnexos('aviso', a.id, emp);

  const lojas = admin
    ? db.prepare('SELECT * FROM lojas WHERE empresa_id = ? ORDER BY nome').all(emp) as Loja[]
    : [];

  // Resultado da pesquisa, só para quem administra
  const pesquisas = admin ? db.prepare(`
    SELECT p.referencia, COUNT(*) AS respostas, ROUND(AVG(p.nota), 1) AS media
    FROM pesquisa_respostas p
    WHERE p.empresa_id = ?
    GROUP BY p.referencia ORDER BY p.referencia DESC LIMIT 6
  `).all(emp) as { referencia: string; respostas: number; media: number }[] : [];

  const respostasDetalhe = admin ? db.prepare(`
    SELECT p.*, u.nome AS autor, l.nome AS loja_nome
    FROM pesquisa_respostas p
    LEFT JOIN users u ON u.id = p.user_id
    LEFT JOIN lojas l ON l.id = p.loja_id
    WHERE p.empresa_id = ?
    ORDER BY p.referencia DESC, p.nota
    LIMIT 40
  `).all(emp) as any[] : [];

  return (
    <>
      <Topbar title="Mural de avisos" subtitle="Comunicados do time de marketing." />

      <main className="p-4 md:p-6 space-y-4 md:space-y-6">
        {admin && (
          <details className="card p-5">
            <summary className="cursor-pointer flex items-center gap-2 h2">
              <Plus className="w-4 h-4" /> Publicar aviso
            </summary>
            <FormRascunho chave="aviso-novo" action={criarAviso} className="mt-5 space-y-4">
              <div>
                <label className="label">Título</label>
                <input name="titulo" required className="input"
                  placeholder="Ex: Nova política de trocas a partir de 01/11" />
              </div>
              <div>
                <label className="label">Mensagem</label>
                <textarea name="corpo" rows={4} className="input"
                  placeholder="O que a equipe precisa saber" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">Para qual loja</label>
                  <select name="loja_id" className="input" defaultValue="">
                    <option value="">Todas as lojas</option>
                    {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                  </select>
                </div>
                <label className="flex items-start gap-2 text-sm text-slate md:pt-7">
                  <input type="checkbox" name="importante" value="1" className="w-4 h-4 mt-0.5" />
                  <span>
                    <strong>Marcar como importante</strong><br />
                    <span className="text-xs text-slate-muted">
                      Trava a tela de quem ainda não confirmou que leu.
                    </span>
                  </span>
                </label>
              </div>
              <CampoAnexo ajuda="Imagem ou PDF, até 10 MB. Ex: a arte da campanha ou o manual da promoção." />
              <button type="submit" className="btn-primary">Publicar</button>
            </FormRascunho>
          </details>
        )}

        {admin && pesquisas.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-navy-500" />
              <h2 className="h2">Pesquisa de satisfação</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {pesquisas.map(p => (
                <div key={p.referencia} className="p-3 rounded-lg border border-line text-center">
                  <div className="text-[11px] text-slate-muted uppercase tracking-wide">{p.referencia}</div>
                  <div className="text-xl font-extrabold text-navy-900">{p.media}</div>
                  <div className="text-[11px] text-slate-muted">{p.respostas} resposta{p.respostas === 1 ? '' : 's'}</div>
                </div>
              ))}
            </div>

            {respostasDetalhe.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-navy-700">
                  Ver o que cada gerente respondeu
                </summary>
                <div className="mt-3 space-y-2">
                  {respostasDetalhe.map(r => (
                    <div key={r.id} className="p-3 rounded-lg border border-line">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-bold ${
                          r.nota >= 4 ? 'text-emerald-700' : r.nota === 3 ? 'text-gold-deep' : 'text-rose-600'
                        }`}>
                          {r.nota}/5
                        </span>
                        <span className="text-sm font-semibold text-navy-900">{r.autor ?? '—'}</span>
                        {r.loja_nome && <span className="badge-slate">{r.loja_nome}</span>}
                        <span className="text-xs text-slate-muted">{r.referencia}</span>
                        {r.materiais_no_prazo && (
                          <span className="badge-blue">
                            materiais: {r.materiais_no_prazo.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      {r.faltou && (
                        <p className="text-sm text-slate mt-1.5">
                          <strong className="text-navy-700">Faltou:</strong> {r.faltou}
                        </p>
                      )}
                      {r.sugestoes && (
                        <p className="text-sm text-slate mt-1">
                          <strong className="text-navy-700">Sugestão:</strong> {r.sugestoes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {avisos.length === 0 ? (
          <div className="card p-10 text-center">
            <Megaphone className="w-8 h-8 text-slate-muted mx-auto mb-3" />
            <p className="text-sm text-slate">Nenhum aviso publicado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {avisos.map(a => (
              <div
                key={a.id}
                className={`card p-5 ${a.importante ? 'border-amber-200 bg-amber-50/40' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    a.importante ? 'bg-amber-100' : 'bg-navy-50'
                  }`}>
                    {a.importante
                      ? <AlertTriangle className="w-4 h-4 text-amber-700" />
                      : <Megaphone className="w-4 h-4 text-navy-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.importante === 1 && <span className="badge-gold">importante</span>}
                      {a.loja_nome && <span className="badge-slate">{a.loja_nome}</span>}
                    </div>
                    <h3 className="h3 mt-1">{a.titulo}</h3>
                    {a.corpo && <p className="text-sm text-slate mt-1 whitespace-pre-wrap">{a.corpo}</p>}

                    {anexosPorAviso[a.id]?.length > 0 && (
                      <div className="mt-3">
                        <ListaAnexos
                          anexos={anexosPorAviso[a.id]}
                          podeRemover={admin}
                          onRemover={admin ? removerAnexoAviso : undefined}
                        />
                      </div>
                    )}
                    <div className="text-xs text-slate-muted mt-2">
                      {a.autor_nome && `${a.autor_nome} · `}
                      {new Date(a.created_at).toLocaleDateString('pt-BR')}
                    </div>

                    {admin && a.importante === 1 && (() => {
                      const leram = confirmacoes.filter(c => c.aviso_id === a.id);
                      const idsQueLeram = new Set(leram.map(c => c.nome));
                      const faltam = destinatarios
                        .filter(d => a.loja_id === null || d.loja_id === a.loja_id)
                        .filter(d => !idsQueLeram.has(d.nome));
                      return (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs font-semibold text-navy-700">
                            <Check className="w-3 h-3 inline" /> {leram.length} confirmaram
                            {faltam.length > 0 && (
                              <span className="text-amber-700"> · {faltam.length} ainda não</span>
                            )}
                          </summary>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <div className="font-semibold text-emerald-700 mb-1">Confirmaram</div>
                              {leram.length === 0 ? (
                                <p className="text-slate-muted">Ninguém ainda.</p>
                              ) : (
                                <ul className="space-y-0.5">
                                  {leram.map((c, i) => (
                                    <li key={i} className="text-slate">
                                      {c.nome}
                                      {c.loja_nome && <span className="text-slate-muted"> · {c.loja_nome}</span>}
                                      <span className="text-slate-muted">
                                        {' · '}{new Date(c.confirmado_em).toLocaleDateString('pt-BR')}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-amber-700 mb-1">Ainda não leram</div>
                              {faltam.length === 0 ? (
                                <p className="text-slate-muted">Todos confirmaram.</p>
                              ) : (
                                <ul className="space-y-0.5">
                                  {faltam.map(d => (
                                    <li key={d.id} className="text-slate">
                                      {d.nome}
                                      {d.loja_nome && <span className="text-slate-muted"> · {d.loja_nome}</span>}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </details>
                      );
                    })()}
                  </div>
                  {admin && (
                    <form action={arquivarAviso.bind(null, a.id)}>
                      <button title="Arquivar aviso"
                        className="p-1.5 rounded text-slate-muted hover:text-navy-900 hover:bg-navy-50">
                        <Archive className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
