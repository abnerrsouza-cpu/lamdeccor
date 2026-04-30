import { Bell, Search } from 'lucide-react';
import Link from 'next/link';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export default async function Topbar({ title, subtitle, action }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const db = getDb();
  const naoLidas = user
    ? (db.prepare('SELECT COUNT(*) as c FROM notificacoes WHERE user_id = ? AND lida = 0').get(user.id) as { c: number }).c
    : 0;

  return (
    <header className="bg-cream border-b border-line sticky top-0 z-20">
      <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-2 md:gap-4">
        {/* Espaço pro botão hamburger no mobile */}
        <div className="min-w-0 flex-1 ml-12 md:ml-0">
          <h1 className="h1 truncate text-lg md:text-2xl">{title}</h1>
          {subtitle && (
            <p className="text-xs md:text-sm text-slate mt-0.5 line-clamp-1 md:line-clamp-none">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {action}
          <div className="relative hidden lg:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-muted" />
            <input
              placeholder="Buscar..."
              className="input pl-9 w-56"
            />
          </div>
          <Link href="/notificacoes" className="btn-secondary !px-2.5 relative">
            <Bell className="w-4 h-4" />
            {naoLidas > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {naoLidas}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
