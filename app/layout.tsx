import type { Metadata, Viewport } from 'next';
import './globals.css';
import Sidebar from '@/components/sidebar';
import { seedIfEmpty } from '@/lib/seed';
import { getCurrentUser } from '@/lib/auth';
import { getEmpresaAtiva, listEmpresasDoUsuario } from '@/lib/empresa';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
seedIfEmpty();

export async function generateMetadata(): Promise<Metadata> {
  const user = await getCurrentUser();
  const empresa = user ? await getEmpresaAtiva() : null;
  const nome = empresa?.nome ?? 'LAM Deccor';
  const curto = nome.split(' ')[0];
  return {
    title: `${nome} · Marketing Hub`,
    description: `Painel interno de marketing da ${nome}`,
    applicationName: `${curto} Hub`,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: `${curto} Hub`,
    },
    formatDetection: {
      telephone: false,
    },
  };
}

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
  // Rotas que existem justamente para quem não tem sessão
  const publica = ['/login', '/cadastro'].some(p => path.startsWith(p));

  // Cookie de sessão apontando para usuário inexistente ou desativado:
  // manda para o login em vez de renderizar uma página quebrada.
  if (!publica && !user) {
    const destino = path && path !== '/' ? `&next=${encodeURIComponent(path)}` : '';
    redirect(`/login?error=${encodeURIComponent('Sua sessão expirou. Entre novamente.')}${destino}`);
  }

  const empresaAtiva = publica ? null : await getEmpresaAtiva();
  const empresas = publica ? [] : await listEmpresasDoUsuario();

  return (
    <html lang="pt-BR">
      <body>
        {publica ? (
          <div className="min-h-screen bg-cream">{children}</div>
        ) : (
          <div className="min-h-screen bg-cream">
            <Sidebar
              user={{ nome: user.nome, cargo: user.cargo, role: user.role }}
              empresaAtiva={empresaAtiva!}
              empresas={empresas}
            />
            <div className="md:ml-60">{children}</div>
          </div>
        )}
      </body>
    </html>
  );
}
