import { NextRequest, NextResponse } from 'next/server';

/**
 * BFF proxy for POST /api/users/auth/complete-onboarding.
 *
 * Forwards the request to the api-gateway (which validates the JWT and
 * calls users-service), then clears the `auto_insight_first_login` cookie
 * so the middleware stops redirecting to /cambiar-contrasena.
 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get('auto_insight_token')?.value;

  const body = await req.json().catch(() => ({}));
  const gatewayUrl = process.env.INTERNAL_GATEWAY_URL || 'http://localhost:8080';

  const upstream = await fetch(`${gatewayUrl}/api/users/auth/complete-onboarding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }

  // Clear the first_login cookie so middleware stops redirecting.
  const response = NextResponse.json(data, { status: upstream.status });
  response.cookies.set('auto_insight_first_login', '0', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0, // delete immediately
  });
  return response;
}
