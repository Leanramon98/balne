import { NextRequest, NextResponse } from 'next/server';

/**
 * Decode a JWT payload without verifying the signature.
 * Only reads the base64-encoded claims — safe for extracting user info server-side.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auto_insight_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Decode JWT claims to build user object.
    // TODO: Replace with a call to the backend /profile or /users/{id} endpoint
    // once those are implemented. For now, the JWT contains user_id, role, destination_id.
    const claims = decodeJwtPayload(token);
    if (!claims) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = {
      id: (claims.user_id as string) || (claims.sub as string),
      email: (claims.email as string) || '',
      name: (claims.full_name as string) || '',
      roles: [(claims.role as string) || ''],
    };

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('BFF Me Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
