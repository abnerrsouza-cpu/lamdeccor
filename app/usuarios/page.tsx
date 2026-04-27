import Topbar from '@/components/topbar';
import { getDb } from '@/lib/db';
import { criarUsuario } from './actions';
import UsersTable from './users-table';
import { Plus, Eye, Clock } from 'lucide-react';
import type { User, Loja } from '@/lib/types';
import { format } from 'date-fns';

const HIERARQUIA_LABEL: Record<number, string> = {
  1: 'Admin',
  2: 'Coordenação',
  3: 'Gestão',
  4: 'Liderança',
  5: 'Operacional',
  6: 'Estagiário',
  9: 'Visualizador',
};

const ROLE_BADGE: Record<string, string> = {
  admin: 'badge-red',
  diretor: 'badge-gold',
  coordenador: 'badge-blue',
  gestor_trafego: 'badge-purple',
  social_media: 'badge-purple',
  designer: 'badge-purple',
  gerente_loja: 'badge-slate',
};

export default function UsuariosPage() {
  const db = getDb();
  const users = db.prepare(`
    SELECT u.*, l.nome as loja_nome
    FROM users u
    LEFT JOIN lojas l ON l.id = u.loja_id
    ORDER BY u.hierarquia ASC, u.nome ASC
  `).all() as (User & { loja_nome: string | null })[];

  const lojas = db.prepare('SELECT * FROM lojas ORDER BY nome').all() as Loja[];

  // Logs de acesso recentes
  const logs = db.prepare(`
    SELECT al.*, u.nome as user_nome
    FROM acessos_log al
    LEFT JOIN users u ON u.id = al.user_id
    ORDER BY al.created_at DESC
    LIMIT 10
  `).all() as any[];

  return (
    <>
      <Topbar
        title="Usuários e hierarquia"
        subtitle="Cadastro de usuários, controle de acesso e monitoramento."
      />
      <main className="p-6 space-y-6">
        <details className="card p-5">
          <summary className="cursor-pointer flex items-center gap-2 h2">
            <Plus className="w-4 h-4" /> Novo usuário
          </summary>
          <form action={criarUsuario} className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nome completo</label>
                <input name="nome" required className="input" />
              </div>
              <div>
                <label className="label">Cargo</label>
                <input name="cargo" className="input" placeholder="Ex: Coordenador de Marketing" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Usuário (login)</label>
                <input name="usuario" required className="input" placeholder="ex: maria" />
              </div>
              <div>
                <label className="label">Email</label>
                <input name="email" required type="email" className="input" />
              </div>
              <div>
                <label className="label">Senha</label>
                <input name="senha" type="text" className="input" placeholder="123456" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Função (role)</label>
                <select name="role" className="input">
                  <option value="admin">Admin</option>
                  <option value="diretor">Diretor</option>
                  <option value="coordenador">Coordenador</option>
                  <option value="gestor_trafego">Gestor de tráfego</option>
                  <option value="social_media">Social media</option>
                  <option value="designer">Designer</option>
                  <option value="gerente_loja">Gerente de loja</option>
                </select>
              </div>
              <div>
                <label className="label">Nível hierárquico</label>
                <select name="hierarquia" className="input">
                  <option value="1">1 — Admin</option>
                  <option value="2">2 — Coordenação</option>
                  <option value="3">3 — Gestão</option>
                  <option value="4">4 — Liderança</option>
                  <option value="5">5 — Operacional</option>
                  <option value="6">6 — Estagiário</option>
                  <option value="9">9 — Visualizador</option>
                </select>
              </div>
              <div>
                <label className="label">Loja (se aplicável)</label>
                <select name="loja_id" className="input">
                  <option value="">— Nenhuma —</option>
                  {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary">Cadastrar usuário</button>
          </form>
        </details>

        <UsersTable users={users} />

        {/* Monitoramento de acesso */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="h2 flex items-center gap-2">
              <Eye className="w-4 h-4" /> Monitoramento de acesso
            </h2>
          </div>
          {logs.length === 0 ? (
            <p className="text-sm text-slate-muted">Nenhum acesso registrado ainda.</p>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="flex items-center justify-between text-sm py-2 border-b border-line last:border-b-0">
                  <div className="flex items-center gap-3">
                    <Clock className="w-3 h-3 text-slate-muted" />
                    <span className="font-medium text-navy-900">{log.user_nome}</span>
                    <code className="text-xs text-slate-muted">{log.ip}</code>
                  </div>
                  <span className="text-xs text-slate-muted">
                    {format(new Date(log.created_at), 'dd/MM HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
