import { NextRequest, NextResponse } from 'next/server';
import type { NextRequest as NextRequestType } from 'next/server';
import { locales, defaultLocale, cookieName } from '@/i18n/routing';
import { isLocalDemoEnabled } from '@/lib/local-demo';

const PUBLIC_ROUTES = [
  '/login',
  '/recuperar',
  '/auth/reset-password',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/users/auth/forgot-password',
  '/api/users/auth/reset-password',
  '/api/public',
  '/api/help-center',
];

// Routes that require a valid token but NOT a completed first-login.
// The user just authenticated but hasn't set their password yet.
const AUTH_ONLY_ROUTES = [
  '/cambiar-contrasena',
  '/api/auth/complete-onboarding',
];

// Build an absolute URL for redirects that survives reverse-proxy deployments.
// The standalone Next.js server derives request.url from its own HOSTNAME/PORT
// env (e.g. http://localhost:3000) and ignores the Host header, so redirects
// built from request.url would send users to the proxy's internal origin.
// nginx sets X-Forwarded-Host to the canonical host (client-supplied values
// are overwritten), so it is trusted when present.
function redirectUrl(request: NextRequestType, pathname: string): URL {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  const origin = host ? `${proto}://${host}` : request.url;
  return new URL(pathname, origin);
}

export function middleware(request: NextRequestType) {
  const { pathname } = request.nextUrl;

  // ── Locale detection ──────────────────────────────────────────────
  const rawLocale = request.cookies.get(cookieName)?.value;
  const locale = rawLocale && (locales as readonly string[]).includes(rawLocale) ? rawLocale : defaultLocale;

  // Marketing and future venue slugs are public. Only the application area
  // requires a session; auth and API allowlists keep their existing behavior.
  const requiresAuth =
    pathname === '/app' ||
    pathname.startsWith('/app/') ||
    AUTH_ONLY_ROUTES.some(route => pathname.startsWith(route));

  // Allow public routes (no token required)
  if (pathname === '/' || PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    const response = NextResponse.next();
    response.headers.set('x-next-intl-locale', locale);
    return response;
  }

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico')
  ) {
    const response = NextResponse.next();
    response.headers.set('x-next-intl-locale', locale);
    return response;
  }

  if (!requiresAuth) {
    const response = NextResponse.next();
    response.headers.set('x-next-intl-locale', locale);
    return response;
  }

  // Check for auth token in httpOnly cookie
  const token = request.cookies.get('auto_insight_token')?.value;
  const localDemoSession = isLocalDemoEnabled()
    && request.cookies.get('balne_local_demo_session')?.value === '1';

  if (!token && !localDemoSession) {
    const loginUrl = redirectUrl(request, '/login');
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // AUTH_ONLY_ROUTES: token required but no first-login enforcement.
  // These are the onboarding pages themselves — allow them through.
  if (AUTH_ONLY_ROUTES.some(route => pathname.startsWith(route))) {
    const response = NextResponse.next();
    response.headers.set('x-next-intl-locale', locale);
    return response;
  }

  // First-login guard: if the first_login cookie is set to '1', redirect
  // to the onboarding form before the user can access any app page.
  const firstLogin = request.cookies.get('auto_insight_first_login')?.value;
  if (firstLogin === '1') {
    return NextResponse.redirect(redirectUrl(request, '/cambiar-contrasena'));
  }

  // Authenticated request: set locale header and continue
  const response = NextResponse.next();
  response.headers.set('x-next-intl-locale', locale);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
