import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC = ['/login', '/cadastro', '/api'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // O x-pathname precisa ir em TODA resposta: o layout usa a rota para
  // saber se a página é pública. Sem ele nas rotas públicas, o layout
  // achava que /login era página protegida sem sessão e redirecionava
  // para /login — um loop infinito.
  const headers = new Headers(req.headers);
  headers.set('x-pathname', pathname);
  const segue = () => NextResponse.next({ request: { headers } });

  if (PUBLIC.some(p => pathname.startsWith(p))) return segue();
  if (pathname.startsWith('/_next') || pathname.includes('.')) return segue();

  const session = req.cookies.get('lam_session')?.value;
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    if (pathname !== '/') url.searchParams.set('next', pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return segue();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
