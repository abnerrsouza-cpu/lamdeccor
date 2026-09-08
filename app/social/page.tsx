import Topbar from '@/components/topbar';
import { getDb } from '@/lib/db';
import { getEmpresaId } from '@/lib/empresa';
import Link from 'next/link';
import SocialViews from './social-views';
import { Plus, Upload } from 'lucide-react';
import type { PostSocial } from '@/lib/types';

export default async function SocialPage() {
  const db = getDb();
  const emp = await getEmpresaId();
  const posts = db.prepare(`
    SELECT p.*, u.nome as responsavel_nome
    FROM posts p
    LEFT JOIN users u ON u.id = p.responsavel_id
    WHERE p.empresa_id = ?
    ORDER BY p.data_publicacao DESC
  `).all(emp) as (PostSocial & { responsavel_nome: string | null })[];

  return (
    <>
      <Topbar
        title="Social Media"
        subtitle="Planejamento de posts em todas as redes - calendário, lista e cards."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/social/importar" className="btn-secondary">
              <Upload className="w-4 h-4" /> Importar PDF
            </Link>
            <Link href="/social/novo" className="btn-primary">
              <Plus className="w-4 h-4" /> Novo post
            </Link>
          </div>
        }
      />
      <main className="p-4 md:p-6">
        <SocialViews posts={posts} />
      </main>
    </>
  );
}
