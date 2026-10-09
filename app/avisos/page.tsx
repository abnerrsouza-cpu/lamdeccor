import Topbar from '@/components/topbar';
import { redirect } from 'next/navigation';
import { Megaphone, AlertTriangle, Plus, Archive, Check, Star } from 'lucide-react';
import { getDb } from '@/lib/db';
import { getEmpresaId } from '@/lib/empresa';
import { getCurrentUser } from '@/lib/auth';
import { ehAdmin } from '@/lib/permissions';
import FormRascunho from '@/components/form-rascunho';
import { criarAviso, arquivarAviso } from './actions';
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
                    <div className="text-xs text-slate-muted mt-2">
                      {a.autor_nome && `${a.autor_nome} · `}
                      {new Date(a.created_at).toLocaleDateString('pt-BR')}
                      {admin && a.importante === 1 && (
                        <span className="ml-2 text-emerald-700 font-semibold">
                          <Check className="w-3 h-3 inline" /> {a.confirmados} confirmaram
                        </span>
                      )}
                    </div>
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
