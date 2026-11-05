import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Saída pela rota. O caminho normal é a server action em lib/auth, que
 * redireciona por caminho relativo; esta rota fica para quem tiver o
 * endereço salvo.
 *
 * O endereço de destino é montado a partir do pedido: atrás do proxy do
 * Railway, cravar o host no código mandava todo mundo para localhost.
 */
export async function POST(request: Request) {
  cookies().delete('lam_session');
  cookies().delete('lam_empresa');

  const h = request.headers;
  const proto = h.get('x-forwarded-proto') ?? new URL(request.url).protocol.replace(':', '');
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const base = host ? `${proto}://${host}` : request.url;

  return NextResponse.redirect(new URL('/login', base), 302);
}

/** Alguns navegadores e atalhos de PWA chamam por GET. */
export async function GET(request: Request) {
  return POST(request);
}
