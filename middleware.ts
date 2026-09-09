import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC = ['/login', '/api'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.startsWith('/_next') || pathname.includes('.')) return NextResponse.next();

  const session = req.cookies.get('lam_session')?.value;
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    // Guarda o destino para devolver a pessoa ao link que ela abriu
    if (pathname !== '/') url.searchParams.set('next', pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // O layout precisa saber a rota para distinguir "tela de login" de
  // "sessão inválida" — sem isso ele desenhava a casca deslogada por cima
  // de uma página logada (menu sumia e ficava só o "Bom dia,").
  // Middleware roda no edge e não acessa o SQLite, então quem valida a
  // sessão de fato é o layout.
  const headers = new Headers(req.headers);
  headers.set('x-pathname', pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
