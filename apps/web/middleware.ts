import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from './lib/session';

export function middleware(req: NextRequest) {
  if (!req.cookies.has(SESSION_COOKIE)) return NextResponse.redirect(new URL('/login', req.url));
}

export const config = { matcher: ['/((?!login|_next|favicon.ico).*)'] };
