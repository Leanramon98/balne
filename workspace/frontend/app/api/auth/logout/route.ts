import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out' });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 0, // Expire immediately
  };

  response.cookies.set('auto_insight_token', '', cookieOptions);
  response.cookies.set('auto_insight_tenant_id', '', cookieOptions);
  response.cookies.set('auto_insight_role', '', cookieOptions);

  return response;
}
