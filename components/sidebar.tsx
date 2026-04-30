'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, KanbanSquare, Users, Calendar, Megaphone,
  Share2, Wallet, Inbox, Bell, Target, Shield, LogOut, FileText,
  Menu, X
} from 'lucide-react';
import clsx from 'clsx';

type RoleAccess = 'todos' | 'staff' | 'admin';

const NAV: Array<{
  href: string;
  label: string;
  icon: any;
  highlight?: boolean;
  acesso: RoleAccess;
}> = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, acesso: 'todos' },
  { href: '/afazeres', label: 'Afazeres', icon: KanbanSquare, acesso: 'staff' },
  { href: '/influencers', label: 'Influencers', icon: Users, acesso: 'staff' },
  { href: '/campanhas', label: 'Campanhas', icon: Target, highlight: true, acesso: 'todos' },
  { href: '/calendario', label: 'Calendário', icon: Calendar, acesso: 'todos' },
  { href: '/anuncios', label: 'Anúncios', icon: Megaphone, acesso: 'staff' },
  { href: '/social', label: 'Social Media', icon: Share2, acesso: 'staff' },
  { href: '/financeiro', label: 'Financeiro', icon: Wallet, acesso: 'staff' },
  { href: '/solicitacoes', label: 'Solicitações', icon: Inbox, acesso: 'todos' },
  { href: '/notificacoes', label: 'Notificações', icon: Bell, acesso: 'todos' },
  { href: '/relatorios', label: 'Relatórios', icon: FileText, acesso: 'staff' },
  { href: '/usuarios', label: 'Usuários', icon: Shield, acesso: 'admin' },
];

function podeVer(acesso: RoleAccess, role: string) {
  if (acesso === 'todos') return true;
  if (acesso === 'admin') return role === 'admin' || role === 'diretor';
  if (acesso === 'staff') return role !== 'gerente_loja';
  return true;
}

export default function Sidebar({ user }: { user: { nome: string; cargo: string | null; role: string } }) {
  const pathname = usePathname();
  const [openMobile, setOpenMobile] = useState(false);
  const initials = user.nome.split(' ').slice(0, 2).map(n => n[0]).join('');
  const items = NAV.filter(item => podeVer(item.acesso, user.role));

  // Fecha o drawer ao trocar de rota
  useEffect(() => { setOpenMobile(false); }, [pathname]);

  // Bloqueia scroll do body quando o drawer está aberto no mobile
  useEffect(() => {
    if (openMobile) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [openMobile]);

  return (
    <>
      {/* Botão hamburger - aparece apenas no mobile */}
      <button
        onClick={() => setOpenMobile(true)}
        className="fixed top-3 left-3 z-40 md:hidden bg-navy-900 text-white p-2.5 rounded-lg shadow-lg"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop mobile */}
      {openMobile && (
        <div
          onClick={() => setOpenMobile(false)}
          className="fixed inset-0 bg-navy-900/60 z-40 md:hidden"
        />
      )}

      {/* Sidebar - drawer no mobile, fixo no desktop */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 w-64 md:w-60 bg-navy-900 text-white flex flex-col z-50 transition-transform duration-300',
          openMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="px-5 py-5 border-b border-navy-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white shrink-0 ring-1 ring-navy-700">
              <Image
                src="/logo.jpg"
                alt="LAM Deccor"
                width={80}
                height={80}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div>
              <div className="text-base font-bold leading-none">LAM Deccor</div>
              <div className="text-[10px] text-navy-300 uppercase tracking-wider mt-1">
                Marketing Hub
              </div>
            </div>
          </div>
          {/* Botão fechar no mobile */}
          <button
            onClick={() => setOpenMobile(false)}
            className="md:hidden text-navy-300 hover:text-white p-1"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-lg text-sm md:text-[13px] font-medium transition-colors',
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
    </>
  );
}
