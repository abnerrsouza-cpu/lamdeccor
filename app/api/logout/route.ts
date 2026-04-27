import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  cookies().delete('lam_session');
  return NextResponse.redirect(new URL('/login', 'http://localhost:3000'), 302);
}
