'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, KanbanSquare, Users, Calendar, Megaphone,
  Share2, Wallet, Inbox, Sparkles, Bell, Target, Shield, LogOut
} from 'lucide-react';
import clsx from 'clsx';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/afazeres', label: 'Afazeres', icon: KanbanSquare },
  { href: '/influencers', label: 'Influencers', icon: Users },
  { href: '/campanhas', label: 'Campanhas', icon: Target, highlight: true },
  { href: '/calendario', label: 'Calendário', icon: Calendar },
  { href: '/anuncios', label: 'Anúncios', icon: Megaphone },
  { href: '/social', label: 'Social Media', icon: Share2 },
  { href: '/financeiro', label: 'Financeiro', icon: Wallet },
  { href: '/solicitacoes', label: 'Solicitações', icon: Inbox },
  { href: '/notificacoes', label: 'Notificações', icon: Bell },
  { href: '/usuarios', label: 'Usuários', icon: Shield },
];

export default function Sidebar({ user }: { user: { nome: string; cargo: string | null; role: string } }) {
  const pathname = usePathname();
  const initials = user.nome.split(' ').slice(0, 2).map(n => n[0]).join('');

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-navy-900 text-white flex flex-col z-30">
      <div className="px-5 py-5 border-b border-navy-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gold flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-navy-900" />
          </div>
          <div>
            <div className="text-base font-bold leading-none">LAM</div>
            <div className="text-[10px] text-navy-300 uppercase tracking-wider mt-0.5">
              Marketing Hub
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                active
                  ? 'bg-navy-800 text-white'
                  : 'text-navy-200 hover:bg-navy-800/60 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.highlight && !active && (
                <span className="w-1.5 h-1.5 bg-gold rounded-full" />
              )}
              {active && <span className="w-1 h-4 bg-gold rounded-full" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-2.5 py-3 border-t border-navy-800">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center
                          text-gold text-xs font-bold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{user.nome}</div>
            <div className="text-[10px] text-navy-300 truncate">{user.cargo ?? user.role}</div>
          </div>
          <form action="/api/logout" method="POST">
            <button title="Sair" className="text-navy-300 hover:text-white">
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
