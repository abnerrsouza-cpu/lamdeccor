import Topbar from '@/components/topbar';
import { getDb } from '@/lib/db';
import { criarEvento } from '../actions';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Loja, User } from '@/lib/types';

export default function NovoEventoPage() {
  const db = getDb();
  const lojas = db.prepare('SELECT * FROM lojas ORDER BY nome').all() as Loja[];
  const users = db.prepare('SELECT * FROM users WHERE ativo = 1 ORDER BY nome').all() as User[];

  return (
    <>
      <Topbar title="Novo evento" subtitle="Crie um evento e convide os participantes." />
      <main className="p-6">
        <Link href="/calendario" className="text-sm text-navy-500 hover:underline flex items-center gap-1 mb-4">
          <ArrowLeft className="w-3 h-3" /> Voltar
        </Link>
        <form action={criarEvento} className="card p-6 max-w-3xl space-y-4">
          <div>
            <label className="label">Título do evento</label>
            <input name="titulo" required className="input" placeholder="Ex: Briefing comercial Mães" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Data</label>
              <input type="date" name="data" required className="input" />
            </div>
            <div>
              <label className="label">Início</label>
              <input type="time" name="hora_inicio" className="input" />
            </div>
            <div>
              <label className="label">Fim</label>
              <input type="time" name="hora_fim" className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo</label>
              <select name="tipo" className="input">
                <option value="reuniao">Reunião</option>
                <option value="campanha">Campanha</option>
                <option value="lancamento">Lançamento</option>
                <option value="evento_loja">Evento de loja</option>
                <option value="feira">Feira</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="label">Cor (hex)</label>
              <input name="cor" defaultValue="#2D5F97" className="input" />
            </div>
          </div>
          <div>
            <label className="label">Local</label>
            <input name="local" className="input" placeholder="Ex: Sala de reuniões fábrica / Online (Google Meet)" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Loja (se aplicável)</label>
              <select name="loja_id" className="input">
                <option value="">— Nenhuma —</option>
                {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Organizador</label>
              <select name="organizador_id" className="input">
                <option value="">— Nenhum —</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Convidados (Ctrl/Cmd + clique para selecionar vários)</label>
            <select name="convidados" multiple className="input min-h-[120px]">
              {users.map(u => <option key={u.id} value={u.id}>{u.nome} — {u.cargo}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Descrição / pauta</label>
            <textarea name="descricao" rows={3} className="input" />
          </div>
          <div>
            <label className="label">Ata da reunião (opcional, preencher depois)</label>
            <textarea name="ata" rows={4} className="input"
              placeholder="Decisões, encaminhamentos, próximos passos..." />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-line">
            <Link href="/calendario" className="btn-secondary">Cancelar</Link>
            <button type="submit" className="btn-primary">Criar evento</button>
          </div>
        </form>
      </main>
    </>
  );
}
