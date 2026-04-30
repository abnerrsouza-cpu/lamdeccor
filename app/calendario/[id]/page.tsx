import Topbar from '@/components/topbar';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { podeEditar } from '@/lib/permissions';
import { atualizarEvento, deletarEvento } from '../actions';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Clock, Users, FileText, Trash2 } from 'lucide-react';
import type { Evento, EventoConvidado, Loja, User } from '@/lib/types';

export default async function EventoDetail({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const editar = podeEditar(user?.role);
  const db = getDb();
  const id = Number(params.id);
  const ev = db.prepare(`
    SELECT e.*, l.nome as loja_nome, u.nome as organizador_nome
    FROM eventos e
    LEFT JOIN lojas l ON l.id = e.loja_id
    LEFT JOIN users u ON u.id = e.organizador_id
    WHERE e.id = ?
  `).get(id) as (Evento & { loja_nome: string | null; organizador_nome: string | null }) | undefined;
  if (!ev) notFound();

  const convidados = db.prepare(`
    SELECT ec.*, u.nome, u.cargo
    FROM evento_convidados ec
    JOIN users u ON u.id = ec.user_id
    WHERE ec.evento_id = ?
  `).all(id) as any[];

  const lojas = db.prepare('SELECT * FROM lojas ORDER BY nome').all() as Loja[];
  const users = db.prepare('SELECT * FROM users WHERE ativo = 1 ORDER BY nome').all() as User[];

  return (
    <>
      <Topbar title={ev.titulo} subtitle={`${ev.data} ${ev.hora_inicio ?? ''}`} />
      <main className="p-6 space-y-6">
        <Link href="/calendario" className="text-sm text-navy-500 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Voltar
        </Link>

        <div className="card p-6">
          <div className="h-2 -m-6 mb-6 rounded-t-xl" style={{ backgroundColor: ev.cor }} />
          <h2 className="text-xl font-bold text-navy-900">{ev.titulo}</h2>
          <div className="mt-2 flex items-center gap-4 text-sm text-slate flex-wrap">
            {ev.hora_inicio && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {ev.data} · {ev.hora_inicio}{ev.hora_fim && ` — ${ev.hora_fim}`}
              </span>
            )}
            {ev.local && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {ev.local}
              </span>
            )}
            {ev.organizador_nome && (
              <span>Organizador: <strong>{ev.organizador_nome}</strong></span>
            )}
          </div>
          {ev.descricao && (
            <div className="mt-4 pt-4 border-t border-line">
              <h3 className="label">Pauta / descrição</h3>
              <p className="text-sm text-slate whitespace-pre-line">{ev.descricao}</p>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="h2 mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> Convidados</h3>
          {convidados.length === 0 ? (
            <p className="text-sm text-slate-muted">Nenhum convidado.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {convidados.map(c => (
                <div key={c.id} className="border border-line rounded-lg p-3">
                  <div className="font-semibold text-sm text-navy-900">{c.nome}</div>
                  <div className="text-xs text-slate-muted">{c.cargo}</div>
                  <span className={
                    c.status === 'confirmado' ? 'badge-green mt-2' :
                    c.status === 'recusou' ? 'badge-red mt-2' :
                    c.status === 'talvez' ? 'badge-gold mt-2' : 'badge-slate mt-2'
                  }>{c.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="h2 mb-4 flex items-center gap-2"><FileText className="w-4 h-4" /> Ata da reunião</h3>
          {editar ? (
            <form action={atualizarEvento.bind(null, id)} className="space-y-3">
              <input type="hidden" name="titulo" value={ev.titulo} />
              <input type="hidden" name="data" value={ev.data} />
              <input type="hidden" name="hora_inicio" value={ev.hora_inicio ?? ''} />
              <input type="hidden" name="hora_fim" value={ev.hora_fim ?? ''} />
              <input type="hidden" name="tipo" value={ev.tipo} />
              <input type="hidden" name="local" value={ev.local ?? ''} />
              <input type="hidden" name="loja_id" value={ev.loja_id ?? ''} />
              <input type="hidden" name="organizador_id" value={ev.organizador_id ?? ''} />
              <input type="hidden" name="descricao" value={ev.descricao ?? ''} />
              <input type="hidden" name="cor" value={ev.cor} />
              <textarea
                name="ata"
                defaultValue={ev.ata}
                rows={10}
                className="input"
                placeholder="Decisões, encaminhamentos, próximos passos..."
              />
              <button type="submit" className="btn-primary">Salvar ata</button>
            </form>
          ) : (
            <div className="text-sm text-slate whitespace-pre-line bg-navy-50/30 p-4 rounded-lg">
              {ev.ata || <span className="italic text-slate-muted">Ata ainda não preenchida.</span>}
            </div>
          )}
        </div>

        {editar && (
          <div className="flex justify-end">
            <form action={deletarEvento.bind(null, id)}>
              <button className="btn-danger"><Trash2 className="w-4 h-4" /> Excluir evento</button>
            </form>
          </div>
        )}
      </main>
    </>
  );
}
