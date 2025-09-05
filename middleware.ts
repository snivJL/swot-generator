import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isDevelopmentEnvironment } from './lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  // Always allow NextAuth endpoints
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Let API routes handle their own auth (they already return 401 JSON)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  const isGuest = (token as any)?.type === 'guest';

  // Redirect authenticated users away from auth pages
  if (token && !isGuest && ['/login', '/register'].includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If no token or guest session, only allow login/register
  if (!token || isGuest) {
    if (['/login', '/register'].includes(pathname)) {
      return NextResponse.next();
    }

    const redirectUrl = encodeURIComponent(request.url);
    return NextResponse.redirect(
      new URL(`/login?redirectUrl=${redirectUrl}`, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * - files with an extension (e.g. .svg, .png, .js, .css, etc.)
     * - Next.js internals (_next/static, _next/image)
     * - favicon
     */
    '/((?!.+\\.[\\w]+$|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
