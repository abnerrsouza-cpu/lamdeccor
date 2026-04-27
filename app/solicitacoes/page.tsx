import Topbar from '@/components/topbar';
import { getDb } from '@/lib/db';
import { criarSolicitacao } from './actions';
import SolicitacoesList from './solicitacoes-list';
import { Plus } from 'lucide-react';
import type { Loja, User } from '@/lib/types';

export default function SolicitacoesPage() {
  const db = getDb();
  const solicitacoes = db.prepare(`
    SELECT s.*, l.nome as loja_nome, u.nome as solicitante_nome, r.nome as responsavel_nome
    FROM solicitacoes s
    LEFT JOIN lojas l ON l.id = s.loja_id
    LEFT JOIN users u ON u.id = s.solicitante_id
    LEFT JOIN users r ON r.id = s.responsavel_id
    ORDER BY
      CASE s.status WHEN 'aberta' THEN 1 WHEN 'em_analise' THEN 2 WHEN 'em_execucao' THEN 3 ELSE 4 END,
      CASE s.prioridade WHEN 'urgente' THEN 1 WHEN 'alta' THEN 2 WHEN 'media' THEN 3 ELSE 4 END
  `).all() as any[];

  const lojas = db.prepare('SELECT * FROM lojas ORDER BY nome').all() as Loja[];
  const usersTime = db.prepare(`SELECT * FROM users WHERE role IN ('admin','coordenador','social_media','designer','gestor_trafego') AND ativo=1 ORDER BY nome`).all() as User[];

  return (
    <>
      <Topbar
        title="Solicitações de loja"
        subtitle="Pedidos dos gerentes ao time de marketing - posts, anúncios, vídeos, panfletos, artes e mais."
      />
      <main className="p-6 space-y-6">
        <details className="card p-5">
          <summary className="cursor-pointer flex items-center gap-2 h2">
            <Plus className="w-4 h-4" /> Nova solicitação
          </summary>
          <form action={criarSolicitacao} className="mt-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Tipo de pedido</label>
                <select name="tipo" required className="input">
                  <option value="post">📸 Post</option>
                  <option value="anuncio">📢 Anúncio</option>
                  <option value="video">🎬 Vídeo</option>
                  <option value="panfleto">📄 Panfleto</option>
                  <option value="arte">🎨 Arte (banner, etc)</option>
                  <option value="evento">✨ Evento</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="label">Loja</label>
                <select name="loja_id" required className="input">
                  {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Prioridade</label>
                <select name="prioridade" className="input">
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Título</label>
              <input name="titulo" required className="input" />
            </div>
            <div>
              <label className="label">Descrição detalhada</label>
              <textarea name="descricao" rows={3} required className="input" />
            </div>
            <div>
              <label className="label">Prazo desejado</label>
              <input type="date" name="prazo" className="input" />
            </div>
            <button type="submit" className="btn-primary">Abrir solicitação</button>
          </form>
        </details>

        <SolicitacoesList solicitacoes={solicitacoes} usersTime={usersTime} />
      </main>
    </>
  );
}
