import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function handler(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  const path = params.path.join('/');
  const gatewayUrl = process.env.INTERNAL_GATEWAY_URL || 'http://localhost:8080';
  // The gateway expects paths under /api/* (e.g. /api/users/users, /api/evaluations/scopes).
  // Next.js route group /api/[...path] strips the /api prefix, so we add it back here.
  const url = `${gatewayUrl}/api/${path}${req.nextUrl.search}`;

  const token = req.cookies.get('auto_insight_token')?.value;
  const tenantId = req.cookies.get('auto_insight_tenant_id')?.value;

  const headers = new Headers(req.headers);

  // Strip hop-by-hop headers (must not be forwarded by proxies)
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Connection
  headers.delete('connection');
  headers.delete('keep-alive');
  headers.delete('transfer-encoding');
  headers.delete('te');
  headers.delete('trailer');
  headers.delete('upgrade');
  headers.delete('proxy-authorization');
  headers.delete('proxy-authenticate');

  // Security: do not forward sensitive cookies to the backend if we are injecting them as headers
  headers.delete('cookie');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (tenantId) {
    headers.set('X-Tenant-ID', tenantId);
  }

  headers.set('X-Correlation-ID', crypto.randomUUID());

  try {
    // Clone request to allow reading body multiple times
    const reqBody = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined;

    const res = await fetch(url, {
      method: req.method,
      headers,
      body: reqBody,
      cache: 'no-store',
    });

    // Extract headers to forward, but filter out some that might cause issues
    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    // 204 No Content — cannot construct NextResponse with empty body
    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    const body = await res.blob();
    return new NextResponse(body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('BFF Proxy Error:', error);
    return NextResponse.json(
      { error: 'Internal Gateway Connection Failed', message: error.message },
      { status: 502 }
    );
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
