import Topbar from '@/components/topbar';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { podeEditar } from '@/lib/permissions';
import CalendarioGrid from './calendario-grid';
import Link from 'next/link';
import { Plus, CalendarClock, MapPin, Users, Eye } from 'lucide-react';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Evento } from '@/lib/types';

export default async function CalendarioPage({ searchParams }: { searchParams: { mes?: string; ano?: string } }) {
  const user = await getCurrentUser();
  const editar = podeEditar(user?.role);
  const db = getDb();
  const hoje = new Date();
  const ano = Number(searchParams.ano ?? hoje.getFullYear());
  const mes = Number(searchParams.mes ?? hoje.getMonth() + 1);

  const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const proximoMes = mes === 12 ? 1 : mes + 1;
  const proximoAno = mes === 12 ? ano + 1 : ano;
  const fim = `${proximoAno}-${String(proximoMes).padStart(2, '0')}-01`;

  const eventos = db.prepare(`
    SELECT * FROM eventos WHERE data >= ? AND data < ? ORDER BY data, hora_inicio
  `).all(inicio, fim) as Evento[];

  // Próximos 6 eventos a partir de hoje (qualquer mês)
  const proximos = db.prepare(`
    SELECT e.*, l.nome as loja_nome, u.nome as organizador_nome,
      (SELECT COUNT(*) FROM evento_convidados WHERE evento_id = e.id) as total_convidados
    FROM eventos e
    LEFT JOIN lojas l ON l.id = e.loja_id
    LEFT JOIN users u ON u.id = e.organizador_id
    WHERE e.data >= date('now')
    ORDER BY e.data ASC, e.hora_inicio ASC
    LIMIT 6
  `).all() as (Evento & { loja_nome: string | null; organizador_nome: string | null; total_convidados: number })[];

  const fmtRelativo = (data: string) => {
    const d = new Date(data);
    if (isToday(d)) return 'Hoje';
    if (isTomorrow(d)) return 'Amanhã';
    const dias = differenceInDays(d, new Date());
    if (dias > 0 && dias <= 7) return `Em ${dias} dias`;
    return format(d, "dd 'de' MMM", { locale: ptBR });
  };

  return (
    <>
      <Topbar
        title="Calendário"
        subtitle={
          editar
            ? 'Eventos, reuniões, lançamentos e campanhas — estilo Google Agenda.'
            : 'Visualização dos eventos. Para criar/editar, fale com o time de marketing.'
        }
        action={
          editar ? (
            <Link href="/calendario/novo" className="btn-primary">
              <Plus className="w-4 h-4" /> Novo evento
            </Link>
          ) : (
            <span className="badge-blue flex items-center gap-1">
              <Eye className="w-3 h-3" /> Modo visualização
            </span>
          )
        }
      />
      <main className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Próximos eventos */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-navy-500" />
              <h2 className="h2">Próximos eventos</h2>
              <span className="text-xs text-slate-muted">{proximos.length} agendados</span>
            </div>
          </div>

          {proximos.length === 0 ? (
            <div className="card p-6 text-center text-slate-muted text-sm">
              Nenhum evento futuro. Crie um novo para começar.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {proximos.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/calendario/${ev.id}`}
                  className="card-hover p-4 flex gap-3"
                >
                  {/* Bloco de data */}
                  <div
                    className="w-14 rounded-lg flex flex-col items-center justify-center shrink-0 py-1"
                    style={{ backgroundColor: ev.cor + '15', borderLeft: `3px solid ${ev.cor}` }}
                  >
                    <span className="text-[10px] uppercase font-bold" style={{ color: ev.cor }}>
                      {format(new Date(ev.data), 'MMM', { locale: ptBR })}
                    </span>
                    <span className="text-xl font-bold text-navy-900 leading-none">
                      {format(new Date(ev.data), 'dd')}
                    </span>
                    <span className="text-[10px] text-slate-muted mt-0.5">
                      {format(new Date(ev.data), 'EEE', { locale: ptBR })}
                    </span>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wider"
                        style={{ backgroundColor: ev.cor + '20', color: ev.cor }}
                      >
                        {fmtRelativo(ev.data)}
                      </span>
                      <span className="badge-slate text-[10px]">{ev.tipo.replace('_', ' ')}</span>
                    </div>
                    <h4 className="text-sm font-bold text-navy-900 truncate">{ev.titulo}</h4>
                    <div className="mt-1 space-y-0.5 text-[11px] text-slate-muted">
                      {ev.hora_inicio && (
                        <div>
                          ⏰ {ev.hora_inicio}{ev.hora_fim && ` — ${ev.hora_fim}`}
                        </div>
                      )}
                      {ev.local && (
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="w-2.5 h-2.5 shrink-0" /> {ev.local}
                        </div>
                      )}
                      {ev.total_convidados > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="w-2.5 h-2.5" /> {ev.total_convidados} convidado{ev.total_convidados > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Calendário em grid */}
        <CalendarioGrid ano={ano} mes={mes} eventos={eventos} />
      </main>
    </>
  );
}
