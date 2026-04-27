import Topbar from '@/components/topbar';
import { getDb } from '@/lib/db';
import { criarPost } from '../actions';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { User } from '@/lib/types';

export default function NovoPostPage() {
  const db = getDb();
  const users = db.prepare('SELECT * FROM users WHERE ativo=1 ORDER BY nome').all() as User[];
  return (
    <>
      <Topbar title="Novo post" />
      <main className="p-6">
        <Link href="/social" className="text-sm text-navy-500 hover:underline flex items-center gap-1 mb-4">
          <ArrowLeft className="w-3 h-3" /> Voltar
        </Link>
        <form action={criarPost} className="card p-6 max-w-3xl space-y-4">
          <div>
            <label className="label">Título / referência interna</label>
            <input name="titulo" required className="input" />
          </div>
          <div>
            <label className="label">Texto / legenda</label>
            <textarea name="texto" rows={4} className="input" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Rede</label>
              <select name="rede" className="input">
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="linkedin">LinkedIn</option>
                <option value="facebook">Facebook</option>
              </select>
            </div>
            <div>
              <label className="label">Formato</label>
              <select name="formato" className="input">
                <option value="feed">Feed</option>
                <option value="reels">Reels</option>
                <option value="story">Story</option>
                <option value="video">Vídeo</option>
                <option value="carrossel">Carrossel</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" className="input">
                <option value="rascunho">Rascunho</option>
                <option value="agendado">Agendado</option>
                <option value="publicado">Publicado</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Data</label>
              <input type="date" name="data_publicacao" className="input" />
            </div>
            <div>
              <label className="label">Hora</label>
              <input type="time" name="hora" className="input" />
            </div>
            <div>
              <label className="label">Responsável</label>
              <select name="responsavel_id" className="input">
                <option value="">—</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Campanha (opcional)</label>
            <input name="campanha" className="input" />
          </div>
          <div>
            <label className="label">Hashtags</label>
            <input name="hashtags" className="input" placeholder="#sofalamdeccor #fabricapropria" />
          </div>
          <div>
            <label className="label">URL da mídia (foto / vídeo)</label>
            <input name="midia_url" type="url" className="input" />
          </div>
          <div>
            <label className="label">Observações internas</label>
            <textarea name="observacoes" rows={2} className="input" />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-line">
            <Link href="/social" className="btn-secondary">Cancelar</Link>
            <button type="submit" className="btn-primary">Criar post</button>
          </div>
        </form>
      </main>
    </>
  );
}
