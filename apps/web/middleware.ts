import { NextResponse, type NextRequest } from 'next/server';
import { LOGIN_PATH, SESSION_COOKIE } from './lib/session';

/** Sem cookie de sessão, qualquer tela do painel redireciona para o login. */
export function middleware(request: NextRequest): NextResponse | undefined {
  if (!request.cookies.has(SESSION_COOKIE))
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
}

/** Telas protegidas: tudo, menos o login, os arquivos do Next e as imagens estáticas. */
export const config = {
  matcher: ['/((?!login(?:/|$)|_next/|favicon\\.ico$|.*\\.(?:svg|png|webp)$).*)'],
};
