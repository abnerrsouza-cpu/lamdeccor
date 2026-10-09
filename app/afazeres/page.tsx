import Topbar from '@/components/topbar';
import { getCurrentUser } from '@/lib/auth';
import { ehGerente } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getEmpresaId } from '@/lib/empresa';
import KanbanBoard from './kanban-board';
import type { Afazer, User } from '@/lib/types';

export default async function AfazeresPage() {
  // Esconder do menu não basta: sem isto o gerente entra digitando a URL
  const _atual = await getCurrentUser();
  if (ehGerente(_atual?.role)) redirect('/');

  const db = getDb();
  const emp = await getEmpresaId();
  const afazeres = db.prepare(`
    SELECT a.*, u.nome as responsavel_nome
    FROM afazeres a
    LEFT JOIN users u ON u.id = a.responsavel_id
    WHERE a.empresa_id = ?
    ORDER BY a.ordem ASC
  `).all(emp) as (Afazer & { responsavel_nome: string | null })[];

  const users = db.prepare(`SELECT * FROM users WHERE ativo = 1 AND empresa_id = ? ORDER BY nome`).all(emp) as User[];

  return (
    <>
      <Topbar
        title="Afazeres"
        subtitle="Kanban do time de marketing - tudo o que está em andamento."
      />
      <main className="p-6">
        <KanbanBoard afazeres={afazeres} users={users} />
      </main>
    </>
  );
}
