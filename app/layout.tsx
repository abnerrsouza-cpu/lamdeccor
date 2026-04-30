import type { Metadata, Viewport } from 'next';
import './globals.css';
import Sidebar from '@/components/sidebar';
import { seedIfEmpty } from '@/lib/seed';
import { getCurrentUser } from '@/lib/auth';
import { headers } from 'next/headers';

seedIfEmpty();

export const metadata: Metadata = {
  title: 'LAM Marketing Hub',
  description: 'Painel interno de marketing da LAM Deccor',
  applicationName: 'LAM Hub',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LAM Hub',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#0F2A4A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = headers();
  const path = h.get('x-pathname') ?? '';
  const user = await getCurrentUser();
  const isLogin = path.startsWith('/login') || !user;

  return (
    <html lang="pt-BR">
      <body>
        {isLogin ? (
          <div className="min-h-screen bg-cream">{children}</div>
        ) : (
          <div className="min-h-screen bg-cream">
            <Sidebar user={{ nome: user.nome, cargo: user.cargo, role: user.role }} />
            <div className="md:ml-60">{children}</div>
          </div>
        )}
      </body>
    </html>
  );
}
