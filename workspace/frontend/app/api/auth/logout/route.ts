import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out' });

  const cookieOptions = {
    httpOnly: true,
    secure: false, // Set to false to support local HTTP development/testing
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 0, // Expire immediately
  };

  response.cookies.set('auto_insight_token', '', cookieOptions);
  response.cookies.set('auto_insight_tenant_id', '', cookieOptions);
  response.cookies.set('auto_insight_role', '', cookieOptions);
  response.cookies.set('auto_insight_first_login', '', cookieOptions);

  // Clear neutral session cookies
  response.cookies.set('auto_insight_organization_id', '', cookieOptions);
  response.cookies.set('auto_insight_membership_id', '', cookieOptions);
  response.cookies.set('auto_insight_deployment_mode', '', cookieOptions);

  return response;
}
