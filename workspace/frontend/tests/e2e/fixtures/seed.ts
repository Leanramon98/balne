/**
 * Idempotent seed script for E2E tests.
 *
 * Creates test data via API calls through the api-gateway.
 * Uses Node.js native fetch (Node 18+).
 *
 * Usage:
 *   npx tsx tests/e2e/fixtures/seed.ts
 *
 * Environment:
 *   API_URL — base URL of the api-gateway (default: http://localhost:8080)
 */

const API_URL = process.env.API_URL || 'http://localhost:8080';

/**
 * Test roles used by the E2E suite.
 *
 * Note: the application only supports a fixed set of user roles.  `evaluador`
 * and `carga` are evaluation access levels, not user roles, so they are mapped
 * to the closest existing system role for authentication purposes.
 */
export type TestRole = 'admin' | 'admin_destino' | 'evaluador' | 'carga';

const ROLE_CREDENTIALS: Record<TestRole, { email: string; password: string; fullName: string }> = {
  admin: { email: 'admin@test.com', password: 'Admin123!', fullName: 'Admin Test' },
  admin_destino: { email: 'admin_destino@test.com', password: 'Test123!', fullName: 'Admin Destino Test' },
  evaluador: { email: 'evaluador@test.com', password: 'Test123!', fullName: 'Evaluador Test' },
  carga: { email: 'carga@test.com', password: 'Test123!', fullName: 'Carga Test' },
};

/**
 * Maps the E2E TestRole to an existing system role name.
 */
const TEST_ROLE_TO_SYSTEM_ROLE: Record<TestRole, string> = {
  admin: 'admin',
  admin_destino: 'admin_destino',
  // `evaluador` and `carga` are access levels, not user roles.
  // Map them to existing roles so they can authenticate and be granted
  // evaluation-level access as needed.
  evaluador: 'consultor',
  carga: 'gestor_destino',
};

export interface SeededUser {
  id: string;
  email: string;
  role: TestRole;
  systemRole: string;
  token: string;
}

export interface SeedResult {
  adminToken: string;
  usersByRole: Record<TestRole, SeededUser>;
  testDestinationId: string;
  existingEvaluations: number;
}

interface ApiRole {
  id?: string;
  ID?: string;
  name?: string;
  Name?: string;
}

async function request(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // 409 means the resource already exists — not an error for idempotent seed
    if (res.status === 409) {
      return { ...data, _conflict: true };
    }
    throw new Error(`${method} ${path} failed (${res.status}): ${data.error || data.message || res.statusText}`);
  }

  return data;
}

/**
 * Login a user and return token + user id.
 */
async function loginUser(email: string, password: string): Promise<{ token: string; userId: string; role: string } | null> {
  try {
    const loginRes = await request('POST', '/api/users/auth/login', {
      Email: email,
      Password: password,
    });

    if (!loginRes.token) return null;

    return {
      token: loginRes.token,
      userId: loginRes.user || loginRes.User,
      role: loginRes.role || loginRes.Role,
    };
  } catch {
    return null;
  }
}

/**
 * Ensure the admin user exists and return auth token.
 */
async function ensureAdminUser(): Promise<{ token: string; userId: string }> {
  const { email, password } = ROLE_CREDENTIALS.admin;

  // Try to login first
  const login = await loginUser(email, password);
  if (login) {
    console.log('✓ Admin user logged in successfully');
    return { token: login.token, userId: login.userId };
  }

  throw new Error('Could not login admin user. Ensure the users-service is running and the admin user exists.');
}

/**
 * Fetch the system role ID for a given role name.
 */
async function getRoleIdByName(token: string, roleName: string): Promise<string> {
  const rolesRes = await request('GET', '/api/users/roles', undefined, token);
  const roles: ApiRole[] = Array.isArray(rolesRes)
    ? rolesRes
    : rolesRes?.items || rolesRes?.Items || [];

  const role = roles.find((r) => (r.name || r.Name) === roleName);
  if (!role) {
    throw new Error(`Role "${roleName}" not found. Available roles: ${roles.map((r) => r.name || r.Name).join(', ')}`);
  }
  const roleId = role.id || role.ID;
  if (!roleId) {
    throw new Error(`Role "${roleName}" has no ID`);
  }
  return roleId;
}

/**
 * List all users (admin only).
 */
async function listUsers(token: string): Promise<Array<{ id: string; email: string; role_id?: string; role?: string }>> {
  const usersRes = await request('GET', '/api/users/users', undefined, token);
  const list = Array.isArray(usersRes)
    ? usersRes
    : usersRes?.items || usersRes?.Items || [];
  return list || [];
}

/**
 * Create a user via the admin API.
 */
async function createUser(
  token: string,
  data: { email: string; password: string; fullName: string; roleId: string; destinationId?: string },
): Promise<{ id: string; email: string }> {
  const body: Record<string, unknown> = {
    email: data.email,
    full_name: data.fullName,
    password: data.password,
    role_id: data.roleId,
    is_active: true,
  };
  if (data.destinationId) {
    body.destination_id = data.destinationId;
  }

  const res = await request('POST', '/api/users/users', body, token);

  const user = res?.item || res?.Item || res;
  return {
    id: user?.id || user?.ID,
    email: user?.email || user?.Email,
  };
}

/**
 * Ensure a test user exists for the given TestRole.
 * If the user does not exist, creates it using the admin token.
 */
async function ensureRoleUser(role: TestRole, adminToken: string, destinationId?: string): Promise<SeededUser> {
  const creds = ROLE_CREDENTIALS[role];
  const systemRoleName = TEST_ROLE_TO_SYSTEM_ROLE[role];

  // Check if user already exists
  const users = await listUsers(adminToken);
  const existing = users.find((u) => u.email === creds.email);

  let userId: string;

  if (existing?.id) {
    console.log(`✓ ${role} user already exists`);
    userId = existing.id;
  } else {
    const roleId = await getRoleIdByName(adminToken, systemRoleName);
    const created = await createUser(adminToken, {
      email: creds.email,
      password: creds.password,
      fullName: creds.fullName,
      roleId,
      destinationId,
    });
    console.log(`✓ ${role} user created`);
    userId = created.id;
  }

  // Login to obtain a fresh token for the role
  const login = await loginUser(creds.email, creds.password);
  if (!login) {
    throw new Error(`Could not login ${role} user after creation`);
  }

  return {
    id: userId,
    email: creds.email,
    role,
    systemRole: login.role || systemRoleName,
    token: login.token,
  };
}

/**
 * Ensure a test destination exists.
 */
async function ensureTestDestination(token: string): Promise<{ id: string; name: string }> {
  const destName = 'Destino Test E2E';

  // Check if destination already exists
  try {
    const destinations = await request('GET', '/api/evaluations/destinations', undefined, token);
    const list = Array.isArray(destinations)
      ? destinations
      : destinations?.items || destinations?.Items || [];

    const existing = list.find(
      (d: any) => d.name === destName || d.Name === destName,
    );
    if (existing) {
      console.log('✓ Test destination already exists');
      return { id: existing.id || existing.ID, name: destName };
    }
  } catch {
    // Continue to create
  }

  // Create test destination
  try {
    const created = await request('POST', '/api/evaluations/destinations', {
      name: destName,
      country: 'Argentina',
      is_adhered: true,
    }, token);

    const id = created.id || created.ID || created.Item?.id || created.item?.id;
    if (id) {
      console.log('✓ Test destination created');
      return { id, name: destName };
    }
  } catch (err: any) {
    console.log('Could not create destination:', err.message.slice(0, 100));
  }

  // If we can't create one, return a placeholder
  console.log('⚠ Using placeholder destination — tests may fail if no destination exists');
  return { id: '', name: destName };
}

/**
 * Verify that the evaluations catalog (scopes and indicators) is seeded.
 * If empty, logs a warning — the migrations are expected to provide the base catalog.
 */
async function ensureCatalogData(token: string): Promise<{ scopeCount: number; indicatorCount: number }> {
  let scopeCount = 0;
  let indicatorCount = 0;

  try {
    const scopesRes = await request('GET', '/api/evaluations/admin/scopes', undefined, token);
    const scopes = Array.isArray(scopesRes)
      ? scopesRes
      : scopesRes?.items || scopesRes?.Items || [];
    scopeCount = scopes.length;
    console.log(`ℹ Scopes available: ${scopeCount}`);
  } catch (err: any) {
    console.log('ℹ Could not list scopes:', err.message.slice(0, 100));
  }

  try {
    const indicatorsRes = await request('GET', '/api/evaluations/admin/indicators', undefined, token);
    const indicators = Array.isArray(indicatorsRes)
      ? indicatorsRes
      : indicatorsRes?.items || indicatorsRes?.Items || [];
    indicatorCount = indicators.length;
    console.log(`ℹ Indicators available: ${indicatorCount}`);
  } catch (err: any) {
    console.log('ℹ Could not list indicators:', err.message.slice(0, 100));
  }

  if (scopeCount === 0 || indicatorCount === 0) {
    console.log('⚠ Evaluations catalog appears empty. Ensure migrations have seeded scopes and indicators.');
  }

  return { scopeCount, indicatorCount };
}

/**
 * Main seed function. Idempotent — safe to run multiple times.
 */
export async function seed(): Promise<SeedResult> {
  console.log('\n🔧 Seeding E2E test data...\n');

  // 1. Admin user
  const { token: adminToken, userId: adminUserId } = await ensureAdminUser();

  // 2. Test destination (needed as destination_id for destination-scoped users)
  const destination = await ensureTestDestination(adminToken);

  // 3. Multi-role users
  const roles: TestRole[] = ['admin', 'admin_destino', 'evaluador', 'carga'];
  const usersByRole: Partial<Record<TestRole, SeededUser>> = {};

  for (const role of roles) {
    // For admin, reuse the already-logged-in admin user
    if (role === 'admin') {
      usersByRole.admin = {
        id: adminUserId,
        email: ROLE_CREDENTIALS.admin.email,
        role: 'admin',
        systemRole: 'admin',
        token: adminToken,
      };
      continue;
    }

    usersByRole[role] = await ensureRoleUser(role, adminToken, destination.id || undefined);
  }

  // 4. Catalog data sanity check
  await ensureCatalogData(adminToken);

  // 5. Count existing evaluations (for reference)
  let existingEvaluations = 0;
  try {
    const evals = await request('GET', '/api/evaluations/evaluations', undefined, adminToken);
    const list = evals?.data || evals?.Items || evals?.items || [];
    existingEvaluations = Array.isArray(list) ? list.length : 0;
    console.log(`ℹ Existing evaluations: ${existingEvaluations}`);
  } catch {
    // Evaluations list may not work without filters
    console.log('ℹ Could not count existing evaluations');
  }

  console.log('\n✅ Seeding complete!\n');

  return {
    adminToken,
    usersByRole: usersByRole as Record<TestRole, SeededUser>,
    testDestinationId: destination.id || '',
    existingEvaluations,
  };
}

// Run directly if called as a script
const isMainModule =
  typeof process !== 'undefined' &&
  process.argv?.[1]?.endsWith?.('seed.ts');

if (isMainModule) {
  seed()
    .then((result) => {
      console.log('Seed result:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
