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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const gatewayUrl = process.env.INTERNAL_GATEWAY_URL || 'http://localhost:8080';

    const res = await fetch(`${gatewayUrl}/api/users/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Invalid credentials' },
        { status: res.status }
      );
    }

    const data = await res.json();

    // DEBUG: log backend response shape to help adapt BFF (TODO: remove before prod)
    console.debug('BFF login - backend response:', data);

    // Normalize token/location: some services return { token }, others { Item: { token } } or { item: { token } }
    const token = data?.token || data?.Token || data?.Item?.token || data?.item?.token || data?.access_token || data?.data?.token;
    const destinationId = data?.destination_id || data?.DestinationID || data?.Item?.destination_id || data?.item?.destination_id || data?.destinationId || (data?.Item && data.Item.destination_id) || (data?.item && data.item.destination_id);
    const role = data?.role || data?.Role || data?.Item?.role || data?.item?.role || data?.role_name;
    const firstLogin = data?.first_login ?? data?.FirstLogin ?? data?.Item?.first_login ?? data?.item?.first_login ?? false;

    // Decode JWT to build user object — the backend LoginResponse.User is just a UUID,
    // but the frontend AuthContext expects { id, email, roles }.
    const claims = token ? decodeJwtPayload(token) : null;
    const user = claims
      ? {
          id: (claims.user_id as string) || (claims.sub as string),
          email: (claims.user_id as string) || '',  // placeholder until backend /me is implemented
          roles: [(claims.role as string) || role || ''],
        }
      : null;

    // Extract neutral session claims from JWT (org_id, mem_id, deployment_mode).
    // These come from the users-service LoginClaims and carry tenant context.
    const orgId = claims?.org_id as string | undefined;
    const membershipId = claims?.mem_id as string | undefined;
    const deploymentMode = claims?.deployment_mode as string | undefined;
    const hasSession = !!(orgId && membershipId);
    const session = hasSession
      ? { organization_id: orgId, membership_id: membershipId, deployment_mode: deploymentMode || '' }
      : null;

    // Create response and set httpOnly cookies.
    // Token is also returned in body so the client can store it in localStorage
    // for client-side RBAC guards (RoleGuard reads from localStorage 'auth_token').
    // TODO: Remove token from body once RoleGuard is migrated to AuthContext.
    const response = NextResponse.json({
      user,
      token,
      role: role || null,
      first_login: firstLogin,
      session,
      message: 'Login successful'
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    };

    // Set cookies when token/role/destination found. This is a pragmatic adaptation layer —
    // TODO: Fix users-service to return a consistent LoginResponse { token, user, role, destination_id }
    if (token) {
      response.cookies.set('auto_insight_token', token, cookieOptions);
    }

    if (destinationId) {
      response.cookies.set('auto_insight_tenant_id', destinationId, cookieOptions);
    }

    if (role) {
      response.cookies.set('auto_insight_role', role, cookieOptions);
    }

    // Set first_login cookie so middleware can enforce the onboarding redirect
    // without having to decode the JWT on every request.
    // Deleted (maxAge=0) once CompleteOnboarding clears it server-side.
    response.cookies.set('auto_insight_first_login', firstLogin ? '1' : '0', cookieOptions);

    // Set neutral session cookies when JWT contains neutral claims (dual mode).
    // These cookies carry tenant context across the BFF and proxy layers.
    // HttpOnly prevents client-side JavaScript from reading them.
    if (orgId) {
      response.cookies.set('auto_insight_organization_id', orgId, cookieOptions);
    }
    if (membershipId) {
      response.cookies.set('auto_insight_membership_id', membershipId, cookieOptions);
    }
    if (deploymentMode) {
      response.cookies.set('auto_insight_deployment_mode', deploymentMode, cookieOptions);
    }

    return response;
  } catch (error: any) {
    console.error('BFF Login Error:', error);
    return NextResponse.json(
      { error: 'Authentication service unavailable', message: error.message },
      { status: 503 }
    );
  }
}
