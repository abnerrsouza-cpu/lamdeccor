import Topbar from '@/components/topbar';
import { getDb } from '@/lib/db';
import { getEmpresaId } from '@/lib/empresa';
import { getCurrentUser } from '@/lib/auth';
import { ehGerente } from '@/lib/permissions';
import { criarSolicitacao } from './actions';
import SolicitacoesList from './solicitacoes-list';
import { Plus } from 'lucide-react';
import type { Loja, User } from '@/lib/types';

export default async function SolicitacoesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const db = getDb();
  const emp = await getEmpresaId();
  const gerente = ehGerente(user.role);

  // Gerentes veem só solicitações da loja deles
  const queryBase = `
    SELECT s.*, l.nome as loja_nome, u.nome as solicitante_nome, r.nome as responsavel_nome
    FROM solicitacoes s
    LEFT JOIN lojas l ON l.id = s.loja_id
    LEFT JOIN users u ON u.id = s.solicitante_id
    LEFT JOIN users r ON r.id = s.responsavel_id
  `;
  const orderBy = `
    ORDER BY
      CASE s.status WHEN 'aberta' THEN 1 WHEN 'em_analise' THEN 2 WHEN 'em_execucao' THEN 3 ELSE 4 END,
      CASE s.prioridade WHEN 'urgente' THEN 1 WHEN 'alta' THEN 2 WHEN 'media' THEN 3 ELSE 4 END
  `;
  const solicitacoes = gerente && user.loja_id
    ? db.prepare(`${queryBase} WHERE s.empresa_id = ? AND s.loja_id = ? ${orderBy}`)
        .all(emp, user.loja_id) as any[]
    : db.prepare(`${queryBase} WHERE s.empresa_id = ? ${orderBy}`).all(emp) as any[];

  const lojas = db.prepare('SELECT * FROM lojas WHERE empresa_id = ? ORDER BY nome').all(emp) as Loja[];
  const usersTime = db.prepare(
    `SELECT * FROM users
     WHERE role IN ('admin','coordenador','social_media','designer','gestor_trafego')
       AND ativo=1 AND empresa_id = ? ORDER BY nome`
  ).all(emp) as User[];

  // Loja pré-selecionada para gerente
  const lojaGerente = gerente ? lojas.find(l => l.id === user.loja_id) : null;

  return (
    <>
      <Topbar
        title="Solicitações"
        subtitle={
          gerente
            ? `Pedidos da loja ${lojaGerente?.nome ?? '—'} ao time de marketing.`
            : 'Pedidos dos gerentes ao time de marketing.'
        }
      />
      <main className="p-4 md:p-6 space-y-4 md:space-y-6">
        <details className="card p-5">
          <summary className="cursor-pointer flex items-center gap-2 h2">
            <Plus className="w-4 h-4" /> Nova solicitação
          </summary>
          <form action={criarSolicitacao} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                {gerente ? (
                  <>
                    {/* Travado: gerente só pode pedir pra própria loja */}
                    <input type="hidden" name="loja_id" value={user.loja_id ?? ''} />
                    <input
                      type="text"
                      readOnly
                      className="input bg-navy-50 cursor-not-allowed"
                      value={lojaGerente?.nome ?? '—'}
                    />
                  </>
                ) : (
                  <select name="loja_id" required className="input">
                    {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="label">Solicitante</label>
                {/* Travado: quem abre é sempre o usuário logado (lido da sessão) */}
                <input
                  type="text"
                  readOnly
                  className="input bg-navy-50 cursor-not-allowed"
                  value={user.nome}
                  title="Registrado automaticamente a partir do seu login"
                />
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

        <SolicitacoesList
          solicitacoes={solicitacoes}
          usersTime={usersTime}
          gerente={gerente}
        />
      </main>
    </>
  );
}
