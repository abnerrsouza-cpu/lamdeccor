import Topbar from '@/components/topbar';
import { getDb } from '@/lib/db';
import { atualizarPost, deletarPost } from '../actions';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Trash2, Calendar, Clock, User as UserIcon, Hash } from 'lucide-react';
import type { PostSocial, User } from '@/lib/types';

export default function PostDetail({ params }: { params: { id: string } }) {
  const db = getDb();
  const id = Number(params.id);
  const post = db.prepare(`
    SELECT p.*, u.nome as responsavel_nome
    FROM posts p
    LEFT JOIN users u ON u.id = p.responsavel_id
    WHERE p.id = ?
  `).get(id) as (PostSocial & { responsavel_nome: string | null }) | undefined;
  if (!post) notFound();
  const users = db.prepare('SELECT * FROM users WHERE ativo=1 ORDER BY nome').all() as User[];

  return (
    <>
      <Topbar title={post.titulo} subtitle={`${post.rede} · ${post.formato}`} />
      <main className="p-6 space-y-6">
        <Link href="/social" className="text-sm text-navy-500 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Voltar
        </Link>

        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="badge-blue uppercase">{post.rede}</span>
              <span className="badge-slate ml-1">{post.formato}</span>
            </div>
            <span className={
              post.status === 'publicado' ? 'badge-green' :
              post.status === 'agendado' ? 'badge-gold' : 'badge-slate'
            }>{post.status}</span>
          </div>

          {post.midia_url && (
            <div className="mb-4">
              <img src={post.midia_url} alt={post.titulo}
                className="rounded-lg max-h-96 object-cover" />
            </div>
          )}

          <h2 className="text-xl font-bold text-navy-900">{post.titulo}</h2>
          {post.texto && (
            <p className="text-sm text-slate mt-3 whitespace-pre-line">{post.texto}</p>
          )}
          {post.hashtags && (
            <p className="text-sm text-navy-500 mt-3 font-semibold">{post.hashtags}</p>
          )}

          <div className="mt-5 pt-5 border-t border-line grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-muted">Data</div>
              <div className="font-bold text-navy-900 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {post.data_publicacao ?? '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-muted">Hora</div>
              <div className="font-bold text-navy-900 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {post.hora ?? '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-muted">Responsável</div>
              <div className="font-bold text-navy-900 flex items-center gap-1">
                <UserIcon className="w-3 h-3" /> {post.responsavel_nome ?? '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-muted">Campanha</div>
              <div className="font-bold text-navy-900 flex items-center gap-1">
                <Hash className="w-3 h-3" /> {post.campanha ?? '—'}
              </div>
            </div>
          </div>

          {post.observacoes && (
            <div className="mt-5 pt-5 border-t border-line">
              <div className="label">Observações</div>
              <p className="text-sm text-slate">{post.observacoes}</p>
            </div>
          )}
        </div>

        {/* Edição */}
        <details className="card p-6">
          <summary className="cursor-pointer h2">Editar post</summary>
          <form action={atualizarPost.bind(null, id)} className="mt-5 space-y-4">
            <div>
              <label className="label">Título</label>
              <input name="titulo" defaultValue={post.titulo} required className="input" />
            </div>
            <div>
              <label className="label">Texto</label>
              <textarea name="texto" defaultValue={post.texto} rows={4} className="input" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Rede</label>
                <select name="rede" defaultValue={post.rede} className="input">
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="facebook">Facebook</option>
                </select>
              </div>
              <div>
                <label className="label">Formato</label>
                <select name="formato" defaultValue={post.formato} className="input">
                  <option value="feed">Feed</option>
                  <option value="reels">Reels</option>
                  <option value="story">Story</option>
                  <option value="video">Vídeo</option>
                  <option value="carrossel">Carrossel</option>
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select name="status" defaultValue={post.status} className="input">
                  <option value="rascunho">Rascunho</option>
                  <option value="agendado">Agendado</option>
                  <option value="publicado">Publicado</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Data</label>
                <input type="date" name="data_publicacao" defaultValue={post.data_publicacao} className="input" />
              </div>
              <div>
                <label className="label">Hora</label>
                <input type="time" name="hora" defaultValue={post.hora} className="input" />
              </div>
              <div>
                <label className="label">Responsável</label>
                <select name="responsavel_id" defaultValue={post.responsavel_id ?? ''} className="input">
                  <option value="">—</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Campanha</label>
              <input name="campanha" defaultValue={post.campanha ?? ''} className="input" />
            </div>
            <div>
              <label className="label">Hashtags</label>
              <input name="hashtags" defaultValue={post.hashtags} className="input" />
            </div>
            <div>
              <label className="label">URL da mídia</label>
              <input name="midia_url" defaultValue={post.midia_url} className="input" />
            </div>
            <div>
              <label className="label">Observações</label>
              <textarea name="observacoes" defaultValue={post.observacoes} rows={2} className="input" />
            </div>
            <div className="flex justify-between pt-3 border-t border-line">
              <form action={deletarPost.bind(null, id)}>
                <button className="btn-danger"><Trash2 className="w-4 h-4" /> Excluir</button>
              </form>
              <button type="submit" className="btn-primary">Salvar</button>
            </div>
          </form>
        </details>
      </main>
    </>
  );
}
