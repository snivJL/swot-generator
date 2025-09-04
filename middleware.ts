import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  guestRegex,
  isDevelopmentEnvironment,
  isTestEnvironment,
} from './lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  // If no session token: only auto-auth as guest during tests; otherwise go to login
  if (!token) {
    const redirectUrl = encodeURIComponent(request.url);

    if (isTestEnvironment) {
      return NextResponse.redirect(
        new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url),
      );
    }

    return NextResponse.redirect(new URL(`/login`, request.url));
  }

  const isGuest =
    (token as any)?.type === 'guest' || guestRegex.test(token?.email ?? '');

  // Block guest users from protected app routes (e.g., home, chat)
  const isProtectedAppPath = pathname === '/' || pathname.startsWith('/chat');

  if (!isTestEnvironment && isGuest && isProtectedAppPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && !isGuest && ['/login', '/register'].includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/chat/:id',
    '/api/:path*',
    '/login',
    '/register',

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
