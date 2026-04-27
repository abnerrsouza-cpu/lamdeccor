import Topbar from '@/components/topbar';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { marcarLida, marcarTodasLidas } from './actions';
import Link from 'next/link';
import { Bell, AlertCircle, CheckCircle2, AlertTriangle, Info, CheckCheck } from 'lucide-react';
import type { Notificacao } from '@/lib/types';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TIPO_ICON: Record<string, any> = {
  urgent: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};
const TIPO_COLOR: Record<string, string> = {
  urgent: 'text-rose-600 bg-rose-50',
  warning: 'text-amber-600 bg-amber-50',
  success: 'text-emerald-600 bg-emerald-50',
  info: 'text-navy-600 bg-navy-50',
};

export default async function NotificacoesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const db = getDb();
  const lista = db.prepare(`
    SELECT * FROM notificacoes WHERE user_id = ? ORDER BY lida ASC, created_at DESC
  `).all(user.id) as Notificacao[];

  return (
    <>
      <Topbar
        title="Notificações"
        subtitle="Tudo o que precisa da sua atenção."
        action={
          <form action={marcarTodasLidas}>
            <button className="btn-secondary">
              <CheckCheck className="w-4 h-4" /> Marcar todas
            </button>
          </form>
        }
      />
      <main className="p-6">
        <div className="card divide-y divide-line">
          {lista.length === 0 && (
            <div className="p-8 text-center text-slate-muted">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Nenhuma notificação no momento.
            </div>
          )}
          {lista.map((n) => {
            const Icon = TIPO_ICON[n.tipo] ?? Info;
            const color = TIPO_COLOR[n.tipo];
            return (
              <div key={n.id} className={'p-5 flex items-start gap-4 ' + (n.lida ? 'opacity-60' : '')}>
                <div className={'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ' + color}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="h3">{n.titulo}</h3>
                    {!n.lida && <span className="w-2 h-2 bg-rose-500 rounded-full mt-1.5 shrink-0" />}
                  </div>
                  <p className="text-sm text-slate mt-1">{n.mensagem}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-muted">
                    <span>{formatDistanceToNow(new Date(n.created_at), { locale: ptBR, addSuffix: true })}</span>
                    {n.link && (
                      <Link href={n.link} className="text-navy-500 hover:underline font-semibold">
                        ver detalhes →
                      </Link>
                    )}
                    {!n.lida && (
                      <form action={marcarLida.bind(null, n.id)}>
                        <button className="text-navy-500 hover:underline">marcar como lida</button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
