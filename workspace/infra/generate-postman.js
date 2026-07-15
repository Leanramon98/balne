// ============================================================
// Auto-Insight DTI — Postman Collection Generator
// Generates a comprehensive collection covering ALL endpoints
// with assertions, role-based testing, and edge cases.
// ============================================================
// Usage: node generate-postman.js > auto-insight.postman_collection.json
// ============================================================

const COLLECTION_NAME = "Auto-Insight DTI";
const COLLECTION_DESC = `Complete API test collection for the DTI Evaluation System.

## Execution Flow
1. **Setup → Login [role]** — sets the token for that role
2. **Setup → Fetch Seed IDs** — populates entity IDs from the DB
3. **Run any folder** — all requests include assertions

## Test Users (password: admin123 for all)
| Role | Email |
|------|-------|
| Admin | admin@dti.org |
| Admin Destino (Bariloche) | bariloche@dti.org |
| Gestor Destino (Bariloche) | gestor.bariloche@dti.org |
| Admin Destino (Buenos Aires) | bsas@dti.org |
| Admin Destino (Barcelona) | barna@dti.org |
| Gestor Destino (Taxco) | gestor.taxco@dti.org |
| Consultor | consultor@dti.org |
| Auditor | auditor@dti.org |

## Collection Variables Set by Scripts
- {{token}}, {{token_admin_destino}}, {{token_gestor_destino}}, etc.
- {{destination_id}}, {{evaluation_id}}, {{indicator_id}}, etc.
- All entity IDs for CRUD testing`;

// ─── Test Users ───────────────────────────────────────────
const USERS = [
  { var: 'token_admin',           email: 'admin@dti.org',           pwd: 'admin123', role: 'admin' },
  { var: 'token_admin_destino',   email: 'bariloche@dti.org',       pwd: 'admin123', role: 'admin_destino' },
  { var: 'token_gestor_destino',  email: 'gestor.bariloche@dti.org',pwd: 'admin123', role: 'gestor_destino' },
  { var: 'token_consultor',       email: 'consultor@dti.org',       pwd: 'admin123', role: 'consultor' },
  { var: 'token_auditor',         email: 'auditor@dti.org',         pwd: 'admin123', role: 'auditor' },
];

// ─── Helpers ──────────────────────────────────────────────

const esc = (s) => JSON.stringify(s);

function url(raw, params = []) {
  const parts = raw.replace(/{{base_url}}/, '').split('/').filter(Boolean);
  return { raw, host: ['{{base_url}}'], path: ['api', ...parts.map(p => p.startsWith(':') ? `{{${p.slice(1)}}}` : p)] };
}

function simpleUrl(raw) {
  return { raw, host: ['{{base_url}}'], path: raw.replace(/{{base_url}}\/?/, '').split('/').filter(Boolean) };
}

function parseUrl(raw) {
  const path = raw.replace(/{{base_url}}/, '').split('/').filter(Boolean);
  return { raw, host: ['{{base_url}}'], path };
}

function jsonBody(obj) {
  return { mode: 'raw', raw: JSON.stringify(obj, null, 2) };
}

const noAuth = { type: 'noauth' };

function testScript(statusCodes, extra = '') {
  const codes = Array.isArray(statusCodes) ? statusCodes : [statusCodes];
  const assertion = codes.length === 1
    ? `pm.response.to.have.status(${codes[0]});`
    : `pm.expect(${JSON.stringify(codes)}).to.include(pm.response.code);`;
  const lines = [
    `pm.test("Status code is one of [${codes.join(',')}]", () => { ${assertion} });`,
    extra
  ].filter(Boolean);
  return { listen: 'test', script: { exec: lines, type: 'text/javascript' } };
}

function req(method, rawUrl, opts = {}) {
  const r = {
    method,
    header: [{ key: 'Content-Type', value: 'application/json' }],
    url: parseUrl(rawUrl),
  };
  if (opts.body) r.body = jsonBody(opts.body);
  if (opts.noAuth) r.auth = noAuth;
  const events = [];
  if (opts.test) events.push(testScript(opts.test.status || 200, opts.test.extra));
  if (opts.noContentType) r.header = [];
  return { name: opts.name || `${method} ${rawUrl}`, request: r, ...(events.length ? { event: events } : {}) };
}

const setVar = (varName, expr) =>
  `pm.collectionVariables.set(${esc(varName)}, ${expr});`;

const jsonVar = (varName, expr) =>
  `const ${varName} = pm.response.json();` +
  (expr ? `\n${expr}` : '');

const setIdFromResponse = (varName, field = 'id') => {
  // Support field expressions like 'user.id || user'
  const fieldAccess = field.includes('||') ? field : `json.${field}`;
  const check = field.includes('||')
    ? field.split('||').map(f => `json.${f.trim()}`).join(' || ')
    : `json.${field}`;
  return jsonVar('json',
    `try { if (json) { const val = ${check}; if (val) { ${setVar(varName, `val`)} } } } catch(e) { console.log('setId error:', e); }`
  );
};

const setIdFromList = (varName, field = 'id') =>
  jsonVar('json',
    `if (Array.isArray(json) && json.length > 0) { ${setVar(varName, `json[0].${field}`)} }`
  );

// ─── Auth Login Request (generates test script that sets token) ───
function loginRequest(userVar, email, password) {
  const extraSet = userVar === 'token_admin'
    ? `\npm.collectionVariables.set('token', json.token); // default auth token`
    : '';
  return {
    name: `Login - ${email.split('@')[0]} (sets ${userVar})`,
    event: [{
      listen: 'test',
      script: {
        exec: [
          `pm.test("Login successful", () => { pm.response.to.have.status(200); });`,
          `const json = pm.response.json();`,
          `pm.test("Token received", () => { pm.expect(json.token).to.not.be.empty; });`,
          `pm.collectionVariables.set(${esc(userVar)}, json.token);${extraSet}`,
          `const uid = typeof json.user === 'object' ? json.user.id : json.user;`,
          `if (uid) { pm.collectionVariables.set('current_user_id', uid); }`,
          `console.log(${esc(email.split('@')[0])} + ' token set');`,
        ],
        type: 'text/javascript'
      }
    }],
    request: {
      method: 'POST',
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: jsonBody({ email, password }),
      url: parseUrl('{{base_url}}/api/users/auth/login')
    }
  };
}

// ─── Edge Case Request ────────────────────────────────────
function edgeReq(name, method, rawUrl, body, expectedStatus = 400, opts = {}) {
  const extra = opts.testExtras || '';
  const r = {
    name,
    event: [testScript(expectedStatus, extra)],
    request: {
      method,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      url: parseUrl(rawUrl),
      ...(body ? { body: jsonBody(body) } : {})
    }
  };
  if (opts.noAuth) r.request.auth = noAuth;
  return r;
}

// ─── Folder Builder ───────────────────────────────────────
function folder(name, items, desc = '') {
  const f = { name, item: items };
  if (desc) f.description = desc;
  return f;
}

// ─── Edge Cases Folder ────────────────────────────────────
function edgeFolder(edges) {
  return folder('✕ Edge Cases', edges);
}

// ─── CRUD Entity Template ─────────────────────────────────
function crudEntity(name, path, sampleData, opts = {}) {
  const idVar = opts.idVar || `${name.toLowerCase().replace(/\s+/g, '_')}_id`;
  const items = [];

  // List
  items.push(req('GET', `{{base_url}}/api/evaluations${path}`, {
    name: `List ${name}`,
    test: { status: 200, extra: setIdFromList(idVar) }
  }));

  // Get by ID (needs the ID variable or a known seed ID)
  if (opts.seedId) {
    items.push(req('GET', `{{base_url}}/api/evaluations${path}/${opts.seedId}`, {
      name: `Get ${name} - by seed ID`,
      test: { status: 200 }
    }));
  } else {
    // Dynamic get using collection variable
    const varPath = `{{base_url}}/api/evaluations${path.replace(/:id/g, `{{${idVar}}}`)}`;
    items.push(req('GET', varPath, {
      name: `Get ${name} - by ID`,
      test: { status: 200 }
    }));
  }

  // Create
  items.push(req('POST', `{{base_url}}/api/evaluations${path}`, {
    name: `Create ${name}`,
    body: sampleData,
    test: { status: 201, extra: setIdFromResponse(idVar) }
  }));

  // Update
  if (opts.updateData) {
    const updPath = `{{base_url}}/api/evaluations${path.replace(/:id/g, `{{${idVar}}}`)}`;
    items.push(req('PUT', updPath, {
      name: `Update ${name}`,
      body: opts.updateData,
      test: { status: 200 }
    }));
  }

  // Edge Cases
  const edges = [];
  if (opts.seedId) {
    edges.push(edgeReq(`Get - Non-existent ID (404)`, 'GET',
      `{{base_url}}/api/evaluations${path}/{{non_existent_id}}`, null, 404, { noAuth: false }));
  }
  if (edges.length) items.push(edgeFolder(edges));

  return folder(name, items);
}

// ══════════════════════════════════════════════════════════════
// BUILD THE COLLECTION
// ══════════════════════════════════════════════════════════════

const collection = {
  info: {
    name: COLLECTION_NAME,
    description: COLLECTION_DESC,
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  variable: [
    { key: 'base_url', value: 'http://localhost:8080', type: 'string' },
    { key: 'token', value: '', type: 'string' },
    { key: 'token_admin_destino', value: '', type: 'string' },
    { key: 'token_gestor_destino', value: '', type: 'string' },
    { key: 'token_consultor', value: '', type: 'string' },
    { key: 'token_auditor', value: '', type: 'string' },
    { key: 'destination_id', value: '', type: 'string' },
    { key: 'destination_bsas_id', value: '', type: 'string' },
    { key: 'evaluation_id', value: '', type: 'string' },
    { key: 'evaluation_auto_id', value: '', type: 'string' },
    { key: 'evaluation_cerrada_id', value: '', type: 'string' },
    { key: 'evaluacion_auditoria_id', value: '', type: 'string' },
    { key: 'action_id', value: '', type: 'string' },
    { key: 'dti_plan_id', value: '', type: 'string' },
    { key: 'indicator_id', value: '', type: 'string' },
    { key: 'indicator_value_id', value: '', type: 'string' },
    { key: 'scope_id', value: '', type: 'string' },
    { key: 'requirement_id', value: '', type: 'string' },
    { key: 'evidence_id', value: '', type: 'string' },
    { key: 'goal_id', value: '', type: 'string' },
    { key: 'user_id', value: '', type: 'string' },
    { key: 'current_user_id', value: '', type: 'string' },
    { key: 'non_existent_id', value: '00000000-0000-0000-0000-000000000000', type: 'string' },
    { key: 'good_practice_id', value: '', type: 'string' },
    { key: 'informe_id', value: '', type: 'string' },
  ],
  auth: {
    type: 'bearer',
    bearer: [{ key: 'token', value: '{{token}}', type: 'string' }]
  },
  event: [{
    listen: 'prerequest',
    script: {
      type: 'text/javascript',
      exec: [
        '// Auto-add auth header from collection variable',
        'const token = pm.collectionVariables.get(\'token\');',
        'if (token) {',
        '  const authHeader = pm.request.headers.get(\'Authorization\');',
        '  if (!authHeader) {',
        '    pm.request.headers.add({key: \'Authorization\', value: \'Bearer \' + token});',
        '  }',
        '}',
      ]
    }
  }],
  item: [
    // ════════════════════════════════════════════
    // 0. SETUP
    // ════════════════════════════════════════════
    folder('0. Setup', [
      // Logins for all roles
      ...USERS.map(u => loginRequest(u.var, u.email, u.pwd)),

      // Fetch Seed IDs
      {
        name: 'Fetch Seed IDs (run after login)',
        event: [{
          listen: 'test',
          script: {
            exec: [
              `const base = pm.collectionVariables.get('base_url');`,
              `const token = pm.collectionVariables.get('token_admin');`,
              ``,
              `function fetchJSON(path) {`,
              `  return new Promise((resolve, reject) => {`,
              `    pm.sendRequest({`,
              `      url: base + path,`,
              `      method: 'GET',`,
              `      header: { 'Authorization': 'Bearer ' + token }`,
              `    }, (err, res) => {`,
              `      if (err) return reject(err);`,
              `      resolve(JSON.parse(res.stream.toString()));`,
              `    });`,
              `  });`,
              `}`,
              ``,
              `Promise.all([`,
              `  fetchJSON('/api/evaluations/destinations'),`,
              `  fetchJSON('/api/evaluations/evaluations'),`,
              `  fetchJSON('/api/evaluations/indicators?limit=1'),`,
              `  fetchJSON('/api/evaluations/scopes'),`,
              `  fetchJSON('/api/users/users'),`,
              `]).then(([dests, evals, inds, scopes, users]) => {`,
              `  // Destinations`,
              `  if (dests?.length) {`,
              `    pm.collectionVariables.set('destination_id', dests[0].id);`,
              `    const bariloche = dests.find(d => d.name?.includes('Bariloche'));`,
              `    if (bariloche) pm.collectionVariables.set('destination_id', bariloche.id);`,
              `    const bsas = dests.find(d => d.name?.includes('Buenos Aires'));`,
              `    if (bsas) pm.collectionVariables.set('destination_bsas_id', bsas.id);`,
              `  }`,
              `  // Evaluations`,
              `  if (evals?.length) {`,
              `    pm.collectionVariables.set('evaluation_id', evals[0].id);`,
              `    const auto = evals.find(e => e.type === 'autodiagnostico' && e.status !== 'cerrada');`,
              `    if (auto) pm.collectionVariables.set('evaluation_auto_id', auto.id);`,
              `    const cerrada = evals.find(e => e.status === 'cerrada');`,
              `    if (cerrada) pm.collectionVariables.set('evaluation_cerrada_id', cerrada.id);`,
              `    const audit = evals.find(e => e.type === 'auditoria');`,
              `    if (audit) pm.collectionVariables.set('evaluacion_auditoria_id', audit.id);`,
              `  }`,
              `  // Indicators`,
              `  if (inds?.length) {`,
              `    pm.collectionVariables.set('indicator_id', inds[0].id);`,
              `    if (inds[0].requirement_id) pm.collectionVariables.set('requirement_id', inds[0].requirement_id);`,
              `  }`,
              `  // Scopes`,
              `  if (scopes?.length) pm.collectionVariables.set('scope_id', scopes[0].id);`,
              `  // Users`,
              `  if (users?.length) {`,
              `    pm.collectionVariables.set('user_id', users[0].id);`,
              `    const admin = users.find(u => u.email === 'admin@dti.org');`,
              `    if (admin) pm.collectionVariables.set('user_id', admin.id);`,
              `  }`,
              `  console.log('Seed IDs fetched successfully');`,
              `}).catch(err => console.error('Fetch error:', err));`,
            ],
            type: 'text/javascript'
          }
        }],
        request: {
          method: 'GET',
          header: [{ key: 'Cache-Control', value: 'no-cache' }],
          url: parseUrl('{{base_url}}/api/evaluations/scopes')
        }
      }
    ], 'Run these FIRST: (1) Login for the role you need, (2) Fetch Seed IDs to populate entity variables'),

    // ════════════════════════════════════════════
    // 1. HEALTH
    // ════════════════════════════════════════════
    folder('1. Health', [
      req('GET', '{{base_url}}/health', {
        name: 'GET /health (no auth)',
        noAuth: true,
        test: { status: 200 }
      }),
      req('GET', '{{base_url}}/api/evaluations/health', {
        name: 'GET /api/evaluations/health',
        test: { status: 200 }
      }),
    ]),

    // ════════════════════════════════════════════
    // 2. AUTH
    // ════════════════════════════════════════════
    folder('2. Auth', [
      req('POST', '{{base_url}}/api/users/auth/login', {
        name: 'Login - any user',
        body: { email: 'admin@dti.org', password: 'admin123' },
        test: { status: 200, extra: setIdFromResponse('user_id', 'user?.id || user') }
      }),
      req('POST', '{{base_url}}/api/users/auth/register', {
        name: 'Register - new user',
        body: { email: 'test-new@dti.org', password: 'test123', full_name: 'Test User' },
        test: { status: 201, extra: setIdFromResponse('user_id', 'id') }
      }),
      req('POST', '{{base_url}}/api/users/auth/forgot-password', {
        name: 'Forgot Password',
        noAuth: true,
        body: { email: 'admin@dti.org' },
        test: { status: 200 }
      }),
      req('POST', '{{base_url}}/api/users/auth/reset-password', {
        name: 'Reset Password',
        noAuth: true,
        body: { token: 'test-reset-token', password: 'newpassword123' },
        test: { status: 200 }
      }),
      edgeFolder([
        edgeReq('Login - Wrong password (401)', 'POST', '{{base_url}}/api/users/auth/login',
          { email: 'admin@dti.org', password: 'wrongpassword' }, 401, { noAuth: true }),
        edgeReq('Login - Non-existent user (401)', 'POST', '{{base_url}}/api/users/auth/login',
          { email: 'noone@nowhere.com', password: 'test123' }, 401, { noAuth: true }),
        edgeReq('Register - Missing password (400)', 'POST', '{{base_url}}/api/users/auth/register',
          { email: 'incomplete@test.com' }, 400, { noAuth: true }),
        edgeReq('Register - Empty email (400)', 'POST', '{{base_url}}/api/users/auth/register',
          { email: '', password: 'test123', full_name: 'No Email' }, 400, { noAuth: true }),
        edgeReq('Access without token (401)', 'GET', '{{base_url}}/api/evaluations/scopes',
          null, 401, { noAuth: true }),
        edgeReq('Access with bad token (401)', 'GET', '{{base_url}}/api/evaluations/scopes',
          null, 401, { noAuth: true, testExtras: [
            '// Override auth header with bad token',
            'const hdr = pm.request.headers.one("Authorization"); if (hdr) pm.request.headers.remove(hdr);',
            'pm.request.headers.add({key: "Authorization", value: "Bearer invalid-jwt-token"});',
          ].join('\n') }),
      ]),
    ]),

    // ════════════════════════════════════════════
    // 3. USERS
    // ════════════════════════════════════════════
    folder('3. Users', [
      req('GET', '{{base_url}}/api/users/profile', {
        name: 'Profile - Get',
        test: { status: 200 }
      }),
      req('PUT', '{{base_url}}/api/users/profile', {
        name: 'Profile - Update',
        body: { full_name: 'Admin Actualizado' },
        test: { status: 200 }
      }),
      req('GET', '{{base_url}}/api/users/users', {
        name: 'Users - List',
        test: { status: 200, extra: setIdFromList('user_id') }
      }),
      req('GET', '{{base_url}}/api/users/users/{{user_id}}', {
        name: 'Users - Get by ID',
        test: { status: 200 }
      }),
      req('POST', '{{base_url}}/api/users/users', {
        name: 'Users - Create',
        body: { email: 'nuevo@dti.org', full_name: 'Nuevo Usuario', password: 'test123', role: 'gestor_destino' },
        test: { status: 201, extra: setIdFromResponse('user_id') }
      }),
      req('PUT', '{{base_url}}/api/users/users/{{user_id}}', {
        name: 'Users - Update',
        body: { full_name: 'Usuario Modificado' },
        test: { status: 200 }
      }),
      req('DELETE', '{{base_url}}/api/users/users/{{user_id}}', {
        name: 'Users - Delete',
        test: { status: [200, 204] }
      }),
      req('POST', '{{base_url}}/api/users/users/{{user_id}}/restore-password', {
        name: 'Users - Restore Password',
        test: { status: 200 }
      }),
      req('GET', '{{base_url}}/api/users/user/{{user_id}}/history', {
        name: 'Users - History',
        test: { status: 200 }
      }),
      edgeFolder([
        edgeReq('Get - Non-existent user (404)', 'GET',
          '{{base_url}}/api/users/users/{{non_existent_id}}', null, 404),
        edgeReq('Create - Duplicate email (409)', 'POST', '{{base_url}}/api/users/users',
          { email: 'admin@dti.org', full_name: 'Duplicate', password: 'test123' }, 409),
        edgeReq('Create - Missing email (400)', 'POST', '{{base_url}}/api/users/users',
          { full_name: 'No Email', password: 'test123' }, 400),
      ]),
    ]),

    // ════════════════════════════════════════════
    // 4. ROLES & AUDIT
    // ════════════════════════════════════════════
    folder('4. Roles & Audit', [
      req('GET', '{{base_url}}/api/users/roles', {
        name: 'Roles - List',
        test: { status: 200 }
      }),
      req('POST', '{{base_url}}/api/users/roles', {
        name: 'Roles - Create',
        body: { name: 'supervisor', description: 'Supervisor de evaluaciones' },
        test: { status: 201 }
      }),
      req('GET', '{{base_url}}/api/users/audit-logs', {
        name: 'Audit Logs - List',
        test: { status: 200 }
      }),
    ]),

    // ════════════════════════════════════════════
    // 5. ADMIN CATALOG — Full CRUD per entity
    // ════════════════════════════════════════════
    folder('5. Admin Catalog', [
      // Each entity: List, Get by ID, Create, Update, Edge Cases
      folder('Subnational Levels', [
        req('GET', '{{base_url}}/api/evaluations/admin/subnational-levels', {
          name: 'List', test: { status: 200, extra: setIdFromList('subnational_level_id') }
        }),
        req('GET', '{{base_url}}/api/evaluations/admin/subnational-levels/{{subnational_level_id}}', {
          name: 'Get by ID', test: { status: 200 }
        }),
        req('POST', '{{base_url}}/api/evaluations/admin/subnational-levels', {
          name: 'Create',
          body: { country: 'Argentina', name: 'Departamento' },
          test: { status: 201, extra: setIdFromResponse('subnational_level_id') }
        }),
        req('PUT', '{{base_url}}/api/evaluations/admin/subnational-levels/{{subnational_level_id}}', {
          name: 'Update',
          body: { name: 'Departamento Actualizado' },
          test: { status: 200 }
        }),
        req('DELETE', '{{base_url}}/api/evaluations/admin/subnational-levels/{{subnational_level_id}}', {
          name: 'Delete', test: { status: [200, 204] }
        }),
        edgeFolder([
          edgeReq('Get - Non-existent (404)', 'GET',
            '{{base_url}}/api/evaluations/admin/subnational-levels/{{non_existent_id}}', null, 404),
        ]),
      ]),
      folder('Typologies', [
        req('GET', '{{base_url}}/api/evaluations/admin/typologies', {
          name: 'List', test: { status: 200, extra: setIdFromList('typology_id') }
        }),
        req('GET', '{{base_url}}/api/evaluations/admin/typologies/{{typology_id}}', {
          name: 'Get by ID', test: { status: 200 }
        }),
        req('POST', '{{base_url}}/api/evaluations/admin/typologies', {
          name: 'Create',
          body: { name: 'Playa' },
          test: { status: 201, extra: setIdFromResponse('typology_id') }
        }),
        req('PUT', '{{base_url}}/api/evaluations/admin/typologies/{{typology_id}}', {
          name: 'Update',
          body: { name: 'Playa Actualizada' },
          test: { status: 200 }
        }),
        req('DELETE', '{{base_url}}/api/evaluations/admin/typologies/{{typology_id}}', {
          name: 'Delete', test: { status: [200, 204] }
        }),
      ]),
      folder('Population Ranges', [
        req('GET', '{{base_url}}/api/evaluations/admin/population-ranges', {
          name: 'List', test: { status: 200, extra: setIdFromList('pop_range_id') }
        }),
        req('GET', '{{base_url}}/api/evaluations/admin/population-ranges/{{pop_range_id}}', {
          name: 'Get by ID', test: { status: 200 }
        }),
        req('POST', '{{base_url}}/api/evaluations/admin/population-ranges', {
          name: 'Create',
          body: { name: 'Más de 1.000.000' },
          test: { status: 201, extra: setIdFromResponse('pop_range_id') }
        }),
        req('PUT', '{{base_url}}/api/evaluations/admin/population-ranges/{{pop_range_id}}', {
          name: 'Update',
          body: { name: 'Rango Actualizado' },
          test: { status: 200 }
        }),
        req('DELETE', '{{base_url}}/api/evaluations/admin/population-ranges/{{pop_range_id}}', {
          name: 'Delete', test: { status: [200, 204] }
        }),
      ]),
      folder('Regions', [
        req('GET', '{{base_url}}/api/evaluations/admin/regions', {
          name: 'List', test: { status: 200, extra: setIdFromList('region_id') }
        }),
        req('GET', '{{base_url}}/api/evaluations/admin/regions/{{region_id}}', {
          name: 'Get by ID', test: { status: 200 }
        }),
        req('POST', '{{base_url}}/api/evaluations/admin/regions', {
          name: 'Create',
          body: { name: 'Región Centro', description: 'Región centro del país' },
          test: { status: 201, extra: setIdFromResponse('region_id') }
        }),
        req('PUT', '{{base_url}}/api/evaluations/admin/regions/{{region_id}}', {
          name: 'Update',
          body: { name: 'Región Centro Actualizada' },
          test: { status: 200 }
        }),
        req('DELETE', '{{base_url}}/api/evaluations/admin/regions/{{region_id}}', {
          name: 'Delete', test: { status: [200, 204] }
        }),
      ]),
      folder('Member Types', [
        req('GET', '{{base_url}}/api/evaluations/admin/member-types', {
          name: 'List', test: { status: 200, extra: setIdFromList('member_type_id') }
        }),
        req('GET', '{{base_url}}/api/evaluations/admin/member-types/{{member_type_id}}', {
          name: 'Get by ID', test: { status: 200 }
        }),
        req('POST', '{{base_url}}/api/evaluations/admin/member-types', {
          name: 'Create',
          body: { name: 'Miembro Honorario' },
          test: { status: 201, extra: setIdFromResponse('member_type_id') }
        }),
        req('PUT', '{{base_url}}/api/evaluations/admin/member-types/{{member_type_id}}', {
          name: 'Update',
          body: { name: 'Miembro Honorario Actualizado' },
          test: { status: 200 }
        }),
        req('DELETE', '{{base_url}}/api/evaluations/admin/member-types/{{member_type_id}}', {
          name: 'Delete', test: { status: [200, 204] }
        }),
      ]),
      folder('Responsible Areas', [
        req('GET', '{{base_url}}/api/evaluations/admin/responsible-areas', {
          name: 'List', test: { status: 200, extra: setIdFromList('responsible_area_id') }
        }),
        req('GET', '{{base_url}}/api/evaluations/admin/responsible-areas/{{responsible_area_id}}', {
          name: 'Get by ID', test: { status: 200 }
        }),
        req('POST', '{{base_url}}/api/evaluations/admin/responsible-areas', {
          name: 'Create',
          body: { name: 'Secretaría de Turismo', description: 'Área responsable' },
          test: { status: 201, extra: setIdFromResponse('responsible_area_id') }
        }),
        req('PUT', '{{base_url}}/api/evaluations/admin/responsible-areas/{{responsible_area_id}}', {
          name: 'Update',
          body: { name: 'Área Actualizada' },
          test: { status: 200 }
        }),
        req('DELETE', '{{base_url}}/api/evaluations/admin/responsible-areas/{{responsible_area_id}}', {
          name: 'Delete', test: { status: [200, 204] }
        }),
      ]),
      folder('Axes', [
        req('GET', '{{base_url}}/api/evaluations/admin/axes', {
          name: 'List', test: { status: 200, extra: setIdFromList('axis_id') }
        }),
        req('GET', '{{base_url}}/api/evaluations/admin/axes/d0000000-0000-0000-0000-000000000001', {
          name: 'Get - GOB Axis by seed ID', test: { status: 200 }
        }),
        req('POST', '{{base_url}}/api/evaluations/admin/axes', {
          name: 'Create',
          body: { axis: 'inno', name: 'Innovación', objective_percent: 80.00, sort_order: 6 },
          test: { status: 201, extra: setIdFromResponse('axis_id') }
        }),
        req('PUT', '{{base_url}}/api/evaluations/admin/axes/{{axis_id}}', {
          name: 'Update',
          body: { objective_percent: 85.00 },
          test: { status: 200 }
        }),
        req('DELETE', '{{base_url}}/api/evaluations/admin/axes/{{axis_id}}', {
          name: 'Delete', test: { status: [200, 204] }
        }),
      ]),
      folder('Scopes', [
        req('GET', '{{base_url}}/api/evaluations/admin/scopes', {
          name: 'List', test: { status: 200, extra: setIdFromList('scope_id') }
        }),
        req('GET', '{{base_url}}/api/evaluations/admin/scopes/{{scope_id}}', {
          name: 'Get by ID', test: { status: 200 }
        }),
        req('POST', '{{base_url}}/api/evaluations/admin/scopes', {
          name: 'Create',
          body: { name: 'Nuevo Ámbito', acronym: 'NUE', description: 'Ámbito de prueba', axis: 'gob' },
          test: { status: 201, extra: setIdFromResponse('scope_id') }
        }),
        req('PUT', '{{base_url}}/api/evaluations/admin/scopes/{{scope_id}}', {
          name: 'Update',
          body: { name: 'Ámbito Actualizado' },
          test: { status: 200 }
        }),
      ]),
      folder('Requirements', [
        req('GET', '{{base_url}}/api/evaluations/requirements', {
          name: 'List', test: { status: 200, extra: setIdFromList('requirement_id') }
        }),
        req('GET', '{{base_url}}/api/evaluations/requirements?scope_id={{scope_id}}', {
          name: 'List - Filter by scope', test: { status: 200 }
        }),
        req('POST', '{{base_url}}/api/evaluations/admin/requirements', {
          name: 'Create',
          body: { scope_id: '{{scope_id}}', code: 'TEST_01', name: 'Requisito de prueba', description: 'Test' },
          test: { status: 201, extra: setIdFromResponse('requirement_id') }
        }),
        req('PUT', '{{base_url}}/api/evaluations/admin/requirements/{{requirement_id}}', {
          name: 'Update',
          body: { name: 'Requisito Actualizado' },
          test: { status: 200 }
        }),
      ]),
      folder('Indicators', [
        req('GET', '{{base_url}}/api/evaluations/indicators', {
          name: 'List',
          test: { status: 200, extra: [
            setIdFromList('indicator_id'),
            `const r0 = pm.response.json();`,
            `if (r0?.length && r0[0].requirement_id) pm.collectionVariables.set('requirement_id', r0[0].requirement_id);`,
          ].join('\n') }
        }),
        req('GET', '{{base_url}}/api/evaluations/indicators?scope_id={{scope_id}}', {
          name: 'List - Filter by scope', test: { status: 200 }
        }),
        req('GET', '{{base_url}}/api/evaluations/indicators?requirement_id={{requirement_id}}', {
          name: 'List - Filter by requirement', test: { status: 200 }
        }),
        req('POST', '{{base_url}}/api/evaluations/admin/indicators', {
          name: 'Create',
          body: { requirement_id: '{{requirement_id}}', code: 'TEST_01.NI1', name: 'Indicador de prueba', description: 'Test', type: 'boolean' },
          test: { status: 201, extra: setIdFromResponse('indicator_id') }
        }),
        req('PUT', '{{base_url}}/api/evaluations/admin/indicators/{{indicator_id}}', {
          name: 'Update',
          body: { name: 'Indicador Actualizado' },
          test: { status: 200 }
        }),
      ]),
    ], 'Full CRUD for admin catalog entities. Each entity has List, Get by ID, Create, Update, Delete (where applicable).'),

    // ════════════════════════════════════════════
    // 6. DESTINATIONS
    // ════════════════════════════════════════════
    folder('6. Destinations', [
      req('GET', '{{base_url}}/api/evaluations/destinations', {
        name: 'List',
        test: { status: 200, extra: setIdFromList('destination_id') }
      }),
      req('GET', '{{base_url}}/api/evaluations/destinations/{{destination_id}}', {
        name: 'Get by ID', test: { status: 200 }
      }),
      req('GET', '{{base_url}}/api/evaluations/destinations?country=Argentina', {
        name: 'List - Filter by country', test: { status: 200 }
      }),
      req('POST', '{{base_url}}/api/evaluations/destinations', {
        name: 'Create',
        body: { name: 'Nuevo Destino Testing', country: 'Argentina', is_adhered: true },
        test: { status: 201, extra: setIdFromResponse('destination_id') }
      }),
      req('PUT', '{{base_url}}/api/evaluations/destinations/{{destination_id}}', {
        name: 'Update',
        body: { name: 'Destino Actualizado', is_adhered: false },
        test: { status: 200 }
      }),
      req('DELETE', '{{base_url}}/api/evaluations/destinations/{{destination_id}}', {
        name: 'Delete', test: { status: [200, 204] }
      }),
      edgeFolder([
        edgeReq('Get - Non-existent ID (404)', 'GET',
          '{{base_url}}/api/evaluations/destinations/{{non_existent_id}}', null, 404),
        edgeReq('Create - Empty name (400)', 'POST', '{{base_url}}/api/evaluations/destinations',
          { name: '', country: 'Argentina' }, 400),
        edgeReq('Create - Missing name (400)', 'POST', '{{base_url}}/api/evaluations/destinations',
          { country: 'Argentina' }, 400),
      ]),
    ]),

    // ════════════════════════════════════════════
    // 7. EVALUATIONS CRUD
    // ════════════════════════════════════════════
    folder('7. Evaluations CRUD', [
      req('GET', '{{base_url}}/api/evaluations/evaluations', {
        name: 'List', test: { status: 200, extra: setIdFromList('evaluation_id') }
      }),
      req('GET', '{{base_url}}/api/evaluations/evaluations?type=autodiagnostico', {
        name: 'List - Filter by type', test: { status: 200 }
      }),
      req('GET', '{{base_url}}/api/evaluations/evaluations?status=borrador', {
        name: 'List - Filter by status', test: { status: 200 }
      }),
      req('GET', '{{base_url}}/api/evaluations/evaluations?destination_id={{destination_id}}', {
        name: 'List - Filter by destination', test: { status: 200 }
      }),
      req('POST', '{{base_url}}/api/evaluations/evaluations', {
        name: 'Create - Autodiagnóstico',
        body: { destination_id: '{{destination_id}}', name: 'Auto-test 2026', type: 'autodiagnostico', start_date: '2026-01-01', end_date: '2026-06-30' },
        test: { status: 201, extra: setIdFromResponse('evaluation_id') }
      }),
      req('GET', '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}', {
        name: 'Get by ID', test: { status: 200 }
      }),
      req('PUT', '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}', {
        name: 'Update',
        body: { name: 'Auto-test Actualizado', end_date: '2026-07-31' },
        test: { status: 200 }
      }),
      req('DELETE', '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}', {
        name: 'Delete (only borrador status)',
        test: { status: [200, 204] }
      }),
      edgeFolder([
        edgeReq('Create - Invalid type (400)', 'POST', '{{base_url}}/api/evaluations/evaluations',
          { destination_id: '{{destination_id}}', name: 'Invalid Eval', type: 'tipo_invalido' }, 400),
        edgeReq('Create - Missing destination (400)', 'POST', '{{base_url}}/api/evaluations/evaluations',
          { name: 'No Dest', type: 'autodiagnostico' }, 400),
        edgeReq('Get - Non-existent ID (404)', 'GET',
          '{{base_url}}/api/evaluations/evaluations/{{non_existent_id}}', null, 404),
      ]),
    ]),

    // ════════════════════════════════════════════
    // 8. STATE MACHINE
    // ════════════════════════════════════════════
    folder('8. Evaluation State Machine', [
      req('POST', '{{base_url}}/api/evaluations/evaluations/{{evaluation_auto_id}}/change-status', {
        name: 'Change Status → en_curso',
        body: { status: 'en_curso' },
        test: { status: 200 }
      }),
      req('POST', '{{base_url}}/api/evaluations/evaluations/{{evaluation_auto_id}}/change-status', {
        name: 'Change Status → carga_finalizada',
        body: { status: 'carga_finalizada' },
        test: { status: 200 }
      }),
      req('POST', '{{base_url}}/api/evaluations/evaluations/{{evaluation_auto_id}}/change-status', {
        name: 'Change Status → en_evaluacion',
        body: { status: 'en_evaluacion' },
        test: { status: 200 }
      }),
      req('POST', '{{base_url}}/api/evaluations/evaluations/{{evaluation_auto_id}}/change-status', {
        name: 'Change Status → cerrada',
        body: { status: 'cerrada' },
        test: { status: 200 }
      }),
      req('POST', '{{base_url}}/api/evaluations/evaluations/{{evaluation_cerrada_id}}/change-status', {
        name: 'Change Status → anulada (from cerrada)',
        body: { status: 'anulada' },
        test: { status: 200 }
      }),
      edgeFolder([
        edgeReq('Invalid transition (422)', 'POST',
          '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}/change-status',
          { status: 'cerrada' }, 422),
        edgeReq('Invalid status value (400)', 'POST',
          '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}/change-status',
          { status: 'estado_invalido' }, 400),
      ]),
    ]),

    // ════════════════════════════════════════════
    // 9. ACCESS & PROGRESS
    // ════════════════════════════════════════════
    folder('9. Evaluation Access & Progress', [
      req('GET', '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}/users', {
        name: 'Access - List Users', test: { status: 200 }
      }),
      req('POST', '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}/users', {
        name: 'Access - Assign User',
        body: { user_id: '{{user_id}}', access_level: 'evaluador' },
        test: { status: 201 }
      }),
      req('DELETE', '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}/users/{{user_id}}', {
        name: 'Access - Revoke User', test: { status: [200, 204] }
      }),
      req('GET', '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}/scopes', {
        name: 'Scope Progress', test: { status: 200 }
      }),
      req('GET', '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}/scopes/progress', {
        name: 'Scope Progress (alt endpoint)', test: { status: 200 }
      }),
      req('GET', '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}/scopes/{{scope_id}}/indicators', {
        name: 'Scope - List Indicators', test: { status: 200 }
      }),
      req('GET', '{{base_url}}/api/evaluations/results?evaluation_id={{evaluation_id}}', {
        name: 'Results - Get Score', test: { status: 200 }
      }),
      req('POST', '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}/notify-destination', {
        name: 'Notify Destination', test: { status: 200 }
      }),
    ]),

    // ════════════════════════════════════════════
    // 10. INDICATOR VALUES
    // ════════════════════════════════════════════
    folder('10. Indicator Values', [
      req('PUT', '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}/indicators/{{indicator_id}}/value', {
        name: 'Save Destination Value',
        body: { destination_value: 65, destination_observations: 'Avanzando en implementación' },
        test: { status: 200 }
      }),
      req('PUT', '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}/indicators/{{indicator_id}}/value', {
        name: 'Save - With target meta',
        body: { destination_value: 40, meta: 80, meta_date: '2026-12-31', destination_observations: 'Con meta' },
        test: { status: 200 }
      }),
      req('GET', '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}/indicators/{{indicator_id}}', {
        name: 'Get Indicator Detail',
        test: { status: 200, extra: setIdFromResponse('indicator_value_id', 'indicator_value?.id || id') }
      }),
      req('GET', '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}/indicators/{{indicator_id}}/value', {
        name: 'Get Indicator Value', test: { status: 200 }
      }),
      req('PUT', '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}/indicators/{{indicator_id}}/evaluator', {
        name: 'Save Evaluator Value',
        body: { evaluator_value: 72, evaluator_observations: 'Verificado en campo', is_verified: true },
        test: { status: 200 }
      }),
      req('PUT', '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}/indicators/{{indicator_id}}/ai', {
        name: 'Save AI Fields',
        body: { analisis_ia: 'El indicador muestra avance parcial', sugerencias_mejora_ia: 'Fortalecer el equipo' },
        test: { status: 200 }
      }),
      req('POST', '{{base_url}}/api/evaluations/indicators/{{indicator_id}}/analyze', {
        name: 'AI - Trigger Analysis', test: { status: 200 }
      }),
      req('DELETE', '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}/indicators/{{indicator_id}}/value', {
        name: 'Delete Destination Value', test: { status: [200, 204] }
      }),
      edgeFolder([
        edgeReq('Value > 100 (400)', 'PUT',
          '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}/indicators/{{indicator_id}}/value',
          { destination_value: 150 }, 400),
        edgeReq('Value < 0 (400)', 'PUT',
          '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}/indicators/{{indicator_id}}/value',
          { destination_value: -5 }, 400),
        edgeReq('Get - Non-existent indicator (404)', 'GET',
          '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}/indicators/{{non_existent_id}}', null, 404),
        edgeReq('Get - Non-existent value (404)', 'GET',
          '{{base_url}}/api/evaluations/evaluations/{{evaluation_id}}/indicators/{{non_existent_id}}/value', null, 404),
      ]),
    ]),

    // ════════════════════════════════════════════
    // 11. MESSAGES
    // ════════════════════════════════════════════
    folder('11. Indicator Messages', [
      req('POST', '{{base_url}}/api/evaluations/indicators/{{indicator_id}}/messages', {
        name: 'Create Message',
        body: { message: 'Revisar este indicador, hay datos nuevos' },
        test: { status: 201, extra: setIdFromResponse('message_id') }
      }),
      req('GET', '{{base_url}}/api/evaluations/indicators/{{indicator_id}}/messages', {
        name: 'List Messages', test: { status: 200 }
      }),
      edgeFolder([
        edgeReq('Create - Empty message (400)', 'POST',
          '{{base_url}}/api/evaluations/indicators/{{indicator_id}}/messages',
          { message: '' }, 400),
        edgeReq('Create - Missing message (400)', 'POST',
          '{{base_url}}/api/evaluations/indicators/{{indicator_id}}/messages',
          {}, 400),
      ]),
    ]),

    // ════════════════════════════════════════════
    // 12. ACTIONS
    // ════════════════════════════════════════════
    folder('12. Actions', [
      req('GET', '{{base_url}}/api/evaluations/actions?destination_id={{destination_id}}', {
        name: 'List (by destination)',
        test: { status: 200, extra: setIdFromList('action_id') }
      }),
      req('GET', '{{base_url}}/api/evaluations/actions?destination_id={{destination_id}}&status=en_ejecucion', {
        name: 'List - Filter by status', test: { status: 200 }
      }),
      req('POST', '{{base_url}}/api/evaluations/actions', {
        name: 'Create',
        body: {
          destination_id: '{{destination_id}}', name: 'Crear Observatorio Turístico',
          summary: 'Plataforma de datos turísticos en tiempo real', objective: 'Centralizar métricas',
          status: 'idea', axes: ['TEC', 'INN'], budget_amount: 50000, budget_currency: 'EUR'
        },
        test: { status: 201, extra: setIdFromResponse('action_id') }
      }),
      req('GET', '{{base_url}}/api/evaluations/actions/{{action_id}}', {
        name: 'Get by ID', test: { status: 200 }
      }),
      req('PUT', '{{base_url}}/api/evaluations/actions/{{action_id}}', {
        name: 'Update',
        body: { name: 'Acción Actualizada', status: 'en_planificacion' },
        test: { status: 200 }
      }),
      req('POST', '{{base_url}}/api/evaluations/actions/{{action_id}}/link-indicator', {
        name: 'Link Indicator',
        body: { indicator_id: '{{indicator_id}}', evaluation_id: '{{evaluation_id}}' },
        test: { status: 201 }
      }),
      req('DELETE', '{{base_url}}/api/evaluations/actions/{{action_id}}/unlink-indicator/{{indicator_id}}/{{evaluation_id}}', {
        name: 'Unlink Indicator', test: { status: [200, 204] }
      }),
      req('POST', '{{base_url}}/api/evaluations/actions/{{action_id}}/evidence', {
        name: 'Add Evidence - URL type',
        body: { evaluation_id: '{{evaluation_id}}', type: 'url', url: 'https://ejemplo.com/evidencia' },
        test: { status: 201, extra: setIdFromResponse('evidence_id') }
      }),
      {
        name: 'Evidence - Different types',
        item: [
          req('POST', '{{base_url}}/api/evaluations/actions/{{action_id}}/evidence', {
            name: 'Document type',
            body: { evaluation_id: '{{evaluation_id}}', type: 'document', file_path: '/evidencias/informe.pdf' },
            test: { status: 201 }
          }),
          req('POST', '{{base_url}}/api/evaluations/actions/{{action_id}}/evidence', {
            name: 'Press type',
            body: { evaluation_id: '{{evaluation_id}}', type: 'press', url: 'https://noticias.com/articulo' },
            test: { status: 201 }
          }),
          req('POST', '{{base_url}}/api/evaluations/actions/{{action_id}}/evidence', {
            name: 'Audiovisual type',
            body: { evaluation_id: '{{evaluation_id}}', type: 'audiovisual', url: 'https://youtube.com/watch?v=test' },
            test: { status: 201 }
          }),
        ]
      },
      req('GET', '{{base_url}}/api/evaluations/actions/{{action_id}}/evidence', {
        name: 'List Evidence', test: { status: 200 }
      }),
      req('GET', '{{base_url}}/api/evaluations/evidence/{{evidence_id}}', {
        name: 'Get Evidence by ID', test: { status: 200 }
      }),
      req('DELETE', '{{base_url}}/api/evaluations/actions/{{action_id}}/evidence/{{evidence_id}}', {
        name: 'Delete Evidence', test: { status: [200, 204] }
      }),
      req('PUT', '{{base_url}}/api/evaluations/actions/{{action_id}}/designate-good-practice', {
        name: 'Good Practice - Designate', test: { status: 200 }
      }),
      req('PUT', '{{base_url}}/api/evaluations/actions/{{action_id}}/approve-good-practice', {
        name: 'Good Practice - Approve',
        body: { action: 'approve' },
        test: { status: 200 }
      }),
      req('PUT', '{{base_url}}/api/evaluations/actions/{{action_id}}/approve-good-practice', {
        name: 'Good Practice - Reject',
        body: { action: 'reject' },
        test: { status: 200 }
      }),
      req('DELETE', '{{base_url}}/api/evaluations/actions/{{action_id}}', {
        name: 'Delete Action', test: { status: [200, 204] }
      }),
      edgeFolder([
        edgeReq('Create - Missing destination (400)', 'POST', '{{base_url}}/api/evaluations/actions',
          { name: 'Acción sin destino' }, 400),
        edgeReq('List - Missing destination filter (400)', 'GET',
          '{{base_url}}/api/evaluations/actions', null, 400),
        edgeReq('Link - Missing indicator_id (400)', 'POST',
          '{{base_url}}/api/evaluations/actions/{{action_id}}/link-indicator',
          { evaluation_id: '{{evaluation_id}}' }, 400),
        edgeReq('Get - Non-existent action (404)', 'GET',
          '{{base_url}}/api/evaluations/actions/{{non_existent_id}}', null, 404),
      ]),
    ]),

    // ════════════════════════════════════════════
    // 13. DTI PLANS
    // ════════════════════════════════════════════
    folder('13. DTI Plans', [
      req('GET', '{{base_url}}/api/evaluations/dti-plans?destination_id={{destination_id}}', {
        name: 'List (by destination)',
        test: { status: 200, extra: setIdFromList('dti_plan_id') }
      }),
      req('POST', '{{base_url}}/api/evaluations/dti-plans', {
        name: 'Create',
        body: { destination_id: '{{destination_id}}', name: 'Plan DTI Test 2026-2028', start_date: '2026-01-01', end_date: '2028-12-31' },
        test: { status: 201, extra: setIdFromResponse('dti_plan_id') }
      }),
      req('GET', '{{base_url}}/api/evaluations/dti-plans/{{dti_plan_id}}', {
        name: 'Get by ID (with goals)', test: { status: 200 }
      }),
      req('PUT', '{{base_url}}/api/evaluations/dti-plans/{{dti_plan_id}}', {
        name: 'Update',
        body: { name: 'Plan DTI Actualizado', end_date: '2030-12-31' },
        test: { status: 200 }
      }),
      req('POST', '{{base_url}}/api/evaluations/dti-plans/{{dti_plan_id}}/goals', {
        name: 'Add Goal',
        body: { indicator_id: '{{indicator_id}}', target_score: 80, target_date: '2028-06-30' },
        test: { status: 201, extra: setIdFromResponse('goal_id') }
      }),
      req('GET', '{{base_url}}/api/evaluations/dti-plans/{{dti_plan_id}}/goals', {
        name: 'List Goals', test: { status: 200 }
      }),
      req('PUT', '{{base_url}}/api/evaluations/dti-plans/{{dti_plan_id}}/goals/{{goal_id}}', {
        name: 'Update Goal',
        body: { target_score: 90, target_date: '2028-12-31' },
        test: { status: 200 }
      }),
      req('DELETE', '{{base_url}}/api/evaluations/dti-plans/{{dti_plan_id}}/goals/{{goal_id}}', {
        name: 'Delete Goal', test: { status: [200, 204] }
      }),
      req('PUT', '{{base_url}}/api/evaluations/dti-plans/{{dti_plan_id}}', {
        name: 'Close Plan',
        body: { status: 'cerrado' },
        test: { status: 200 }
      }),
      req('DELETE', '{{base_url}}/api/evaluations/dti-plans/{{dti_plan_id}}', {
        name: 'Delete (only if no goals)', test: { status: [200, 204] }
      }),
      edgeFolder([
        edgeReq('Create - Missing dates (400)', 'POST', '{{base_url}}/api/evaluations/dti-plans',
          { name: 'Plan sin fechas' }, 400),
        edgeReq('Add Goal - No indicator_id (400)', 'POST',
          '{{base_url}}/api/evaluations/dti-plans/{{dti_plan_id}}/goals',
          { target_score: 80 }, 400),
        edgeReq('Get - Non-existent plan (404)', 'GET',
          '{{base_url}}/api/evaluations/dti-plans/{{non_existent_id}}', null, 404),
      ]),
    ]),

    // ════════════════════════════════════════════
    // 14. INFORMES
    // ════════════════════════════════════════════
    folder('14. Informes', [
      req('GET', '{{base_url}}/api/evaluations/informes', {
        name: 'List',
        test: { status: 200, extra: setIdFromList('informe_id') }
      }),
      req('GET', '{{base_url}}/api/evaluations/informes/{{informe_id}}', {
        name: 'Get by ID', test: { status: 200 }
      }),
      edgeFolder([
        edgeReq('Get - Non-existent informe (404)', 'GET',
          '{{base_url}}/api/evaluations/informes/{{non_existent_id}}', null, 404),
      ]),
    ]),

    // ════════════════════════════════════════════
    // 15. PUBLIC (No Auth)
    // ════════════════════════════════════════════
    folder('15. Public (No Auth)', [
      req('GET', '{{base_url}}/api/evaluations/public/good-practices', {
        name: 'Good Practices - List',
        noAuth: true,
        test: { status: 200 }
      }),
      req('GET', '{{base_url}}/api/evaluations/public/good-practices?country=Argentina', {
        name: 'Good Practices - Filter by country',
        noAuth: true,
        test: { status: 200 }
      }),
      req('GET', '{{base_url}}/api/evaluations/public/good-practices?axis=TEC', {
        name: 'Good Practices - Filter by axis',
        noAuth: true,
        test: { status: 200 }
      }),
      req('GET', '{{base_url}}/api/evaluations/public/good-practices?search=digital', {
        name: 'Good Practices - Full text search',
        noAuth: true,
        test: { status: 200 }
      }),
      req('GET', '{{base_url}}/api/evaluations/public/good-practices/{{non_existent_id}}', {
        name: 'Good Practices - Get by ID (not found)',
        noAuth: true,
        test: { status: 404 }
      }),
      req('GET', '{{base_url}}/api/evaluations/public/scopes', {
        name: 'Scopes',
        noAuth: true,
        test: { status: 200 }
      }),
      req('GET', '{{base_url}}/api/evaluations/public/destinations', {
        name: 'Destinations',
        noAuth: true,
        test: { status: 200 }
      }),
      req('GET', '{{base_url}}/api/evaluations/public/subnational-levels', {
        name: 'Subnational Levels',
        noAuth: true,
        test: { status: 200 }
      }),
      req('GET', '{{base_url}}/api/evaluations/public/typologies', {
        name: 'Typologies',
        noAuth: true,
        test: { status: 200 }
      }),
    ], 'Public endpoints that do NOT require authentication. Verify these work without any token.'),

    // ════════════════════════════════════════════
    // 16. SECURITY & ROLES
    // ════════════════════════════════════════════
    folder('16. Security & Roles', [
      folder('Admin-only endpoints (expect 403 for non-admin)', [
        {
          name: 'Users: List as gestor_destino → 403',
          event: [testScript(403, [
            `const hdr = pm.request.headers.one('Authorization'); if (hdr) pm.request.headers.remove(hdr);`,
            `pm.request.headers.add({key: "Authorization", value: "Bearer " + pm.collectionVariables.get('token_gestor_destino')});`,
          ].join('\n'))],
          request: { method: 'GET', header: [], url: parseUrl('{{base_url}}/api/users/users') }
        },
        {
          name: 'Users: Create as gestor_destino → 403',
          event: [testScript(403, [
            `const hdr = pm.request.headers.one('Authorization'); if (hdr) pm.request.headers.remove(hdr);`,
            `pm.request.headers.add({key: "Authorization", value: "Bearer " + pm.collectionVariables.get('token_gestor_destino')});`,
          ].join('\n'))],
          request: { method: 'POST', header: [{ key: 'Content-Type', value: 'application/json' }], body: jsonBody({ email: 'test@test.com', full_name: 'Test' }), url: parseUrl('{{base_url}}/api/users/users') }
        },
        {
          name: 'Roles: List as gestor_destino → 403',
          event: [testScript(403, [
            `const hdr = pm.request.headers.one('Authorization'); if (hdr) pm.request.headers.remove(hdr);`,
            `pm.request.headers.add({key: "Authorization", value: "Bearer " + pm.collectionVariables.get('token_gestor_destino')});`,
          ].join('\n'))],
          request: { method: 'GET', header: [], url: parseUrl('{{base_url}}/api/users/roles') }
        },
        {
          name: 'Audit Logs: List as consultor → 403',
          event: [testScript(403, [
            `const hdr = pm.request.headers.one('Authorization'); if (hdr) pm.request.headers.remove(hdr);`,
            `pm.request.headers.add({key: "Authorization", value: "Bearer " + pm.collectionVariables.get('token_consultor')});`,
          ].join('\n'))],
          request: { method: 'GET', header: [], url: parseUrl('{{base_url}}/api/users/audit-logs') }
        },
        {
          name: 'Admin Catalog: Create region as auditor → 403',
          event: [testScript(403, [
            `const hdr = pm.request.headers.one('Authorization'); if (hdr) pm.request.headers.remove(hdr);`,
            `pm.request.headers.add({key: "Authorization", value: "Bearer " + pm.collectionVariables.get('token_auditor')});`,
          ].join('\n'))],
          request: { method: 'POST', header: [{ key: 'Content-Type', value: 'application/json' }], body: jsonBody({ name: 'Test' }), url: parseUrl('{{base_url}}/api/evaluations/admin/regions') }
        },
        {
          name: 'Admin Scopes: Create as gestor_destino → 403',
          event: [testScript(403, [
            `const hdr = pm.request.headers.one('Authorization'); if (hdr) pm.request.headers.remove(hdr);`,
            `pm.request.headers.add({key: "Authorization", value: "Bearer " + pm.collectionVariables.get('token_gestor_destino')});`,
          ].join('\n'))],
          request: { method: 'POST', header: [{ key: 'Content-Type', value: 'application/json' }], body: jsonBody({ name: 'Test' }), url: parseUrl('{{base_url}}/api/evaluations/admin/scopes') }
        },
        {
          name: 'Admin Indicators: Create as auditor → 403',
          event: [testScript(403, [
            `const hdr = pm.request.headers.one('Authorization'); if (hdr) pm.request.headers.remove(hdr);`,
            `pm.request.headers.add({key: "Authorization", value: "Bearer " + pm.collectionVariables.get('token_auditor')});`,
          ].join('\n'))],
          request: { method: 'POST', header: [{ key: 'Content-Type', value: 'application/json' }], body: jsonBody({ code: 'TEST', name: 'Test' }), url: parseUrl('{{base_url}}/api/evaluations/admin/indicators') }
        },
      ]),

      folder('Destination isolation (cross-destination access)', [
        {
          name: 'Bariloche admin tries to create eval for Buenos Aires → should be scoped',
          event: [testScript(403, [
            `const hdr = pm.request.headers.one('Authorization'); if (hdr) pm.request.headers.remove(hdr);`,
            `pm.request.headers.add({key: "Authorization", value: "Bearer " + pm.collectionVariables.get('token_admin_destino')});`,
          ].join('\n'))],
          request: { method: 'POST', header: [{ key: 'Content-Type', value: 'application/json' }], body: jsonBody({ destination_id: '{{destination_bsas_id}}', name: 'Cross-dest eval', type: 'autodiagnostico' }), url: parseUrl('{{base_url}}/api/evaluations/evaluations') }
        },
      ]),

      folder('Public endpoints still work without auth', [
        edgeReq('Good practices (no auth) → 200', 'GET',
          '{{base_url}}/api/evaluations/public/good-practices', null, 200, { noAuth: true }),
        edgeReq('Public scopes (no auth) → 200', 'GET',
          '{{base_url}}/api/evaluations/public/scopes', null, 200, { noAuth: true }),
      ]),

    ], 'Security tests verifying that role-based access control is enforced. Run these after Setup.'),

    // ══════════════════════════════════════════════════════════════
    // 17. EVALUACIÓN COMPLETA - AUTODIAGNÓSTICO BARILOCHE 2026
    // Flujo completo: crear → cargar valores → avanzar estados →
    //                 crear acciones → plan DTI → cerrar → informe
    // Destination: San Carlos de Bariloche (a0000000-0000-0000-0000-000000000100)
    // User: bariloche@dti.org (admin_destino)
    // Datos realistas: Bariloche tiene buen compromiso político y estructura DTI,
    // pero necesita mejorar financiación y colaboración público-privada.
    // ══════════════════════════════════════════════════════════════
    folder('17. Evaluación Completa', [
      // ── Login ─────────────────────────────────────────────────
      // Use loginRequest() which properly sets token_admin_destino AND token
      loginRequest('token_admin_destino', 'bariloche@dti.org', 'admin123'),

      // Override token for this flow (loginRequest only sets token for token_admin)
      {
        name: '1b. Set token for subsequent requests',
        event: [{
          listen: 'test',
          script: {
            exec: [
              `const json = pm.response.json();`,
              `if (json && json.token) {`,
              `  pm.collectionVariables.set('token', json.token);`,
              `  pm.collectionVariables.set('token_bariloche_full', json.token);`,
              `}`,
            ],
            type: 'text/javascript'
          }
        }],
        request: {
          method: 'POST',
          header: [{ key: 'Content-Type', value: 'application/json' }],
          body: { mode: 'raw', raw: JSON.stringify({ email: 'bariloche@dti.org', password: 'admin123' }, null, 2) },
          url: { raw: '{{base_url}}/api/users/auth/login', host: ['{{base_url}}'], path: ['api', 'users', 'auth', 'login'] }
        }
      },

      // ── Crear evaluación ───────────────────────────────────────
      req('POST', '{{base_url}}/api/evaluations/evaluations', {
        name: '2. Crear Autodiagnóstico Bariloche 2026',
        body: {
          destination_id: 'a0000000-0000-0000-0000-000000000100',
          name: 'Autodiagnóstico Integral Bariloche 2026',
          type: 'autodiagnostico',
          start_date: '2026-01-01',
          end_date: '2026-06-30',
          description: 'Evaluación integral del destino turístico inteligente San Carlos de Bariloche,，覆盖所有 los ejes DTI: Gobernanza, Innovación, Tecnología y Sostenibilidad.'
        },
        test: { status: 201, extra: setIdFromResponse('eval_bariloche_id') }
      }),

      // ── Avanzar a en_curso ────────────────────────────────────
      // NOTE: No self-assign needed — HandleCreateEvaluation auto-grants
      // administracion to the creator via GrantAccess()
      req('POST', '{{base_url}}/api/evaluations/evaluations/{{eval_bariloche_id}}/change-status', {
        name: '4. Avanzar a en_curso',
        body: { status: 'en_curso' },
        test: { status: 200 }
      }),

      // ── Cargar indicadores ORG (Organización) ─────────────────
      // Bariloche tiene buena estructura DTI: orgánica de gestión fuerte,
      // compromiso político alto, pero colaboración público-privada en desarrollo.
      req('PUT', '{{base_url}}/api/evaluations/evaluations/{{eval_bariloche_id}}/indicators/c0000000-0000-0000-0000-000000000001/value', {
        name: '5.1 [ORG] Órgano de gestión DTI - 80%',
        body: { destination_value: 80, destination_observations: 'Consejo Asesor DTI activo con participación de Municipio, Universidad Nacional del Comahue y CAAVT.', meta: 100, meta_date: '2026-12-31' },
        test: { status: 200 }
      }),
      req('PUT', '{{base_url}}/api/evaluations/evaluations/{{eval_bariloche_id}}/indicators/c0000000-0000-0000-0000-000000000002/value', {
        name: '5.2 [ORG] Personal DTI dedicado - 70%',
        body: { destination_value: 70, destination_observations: 'Equipo técnico de 4 personas dedicadas parcialmente al DTI desde la Secretaría de Turismo.', meta: 100, meta_date: '2027-06-30' },
        test: { status: 200 }
      }),
      req('PUT', '{{base_url}}/api/evaluations/evaluations/{{eval_bariloche_id}}/indicators/c0000000-0000-0000-0000-000000000003/value', {
        name: '5.3 [ORG] Compromiso político - 90%',
        body: { destination_value: 90, destination_observations: 'El Subsecretario de Turismo impulsa activamente la agenda DTI. Hay decreto municipal de adhesión.', meta: 100, meta_date: '2026-06-30' },
        test: { status: 200 }
      }),
      req('PUT', '{{base_url}}/api/evaluations/evaluations/{{eval_bariloche_id}}/indicators/c0000000-0000-0000-0000-000000000005/value', {
        name: '5.4 [ORG] Perfiles del equipo - 65%',
        body: { destination_value: 65, destination_observations: 'Equipo con perfiles en turismo y tecnología. Se requiere reforzar con especialistas en datos y experiencia de usuario.', meta: 85, meta_date: '2027-01-01' },
        test: { status: 200 }
      }),
      req('PUT', '{{base_url}}/api/evaluations/evaluations/{{eval_bariloche_id}}/indicators/c0000000-0000-0000-0000-000000000007/value', {
        name: '5.5 [ORG] Colaboración público-privada - 55%',
        body: { destination_value: 55, destination_observations: 'Convenio con CAAVT vigente. Se están firmando acuerdos con hoteles boutique y emitters turísticos.', meta: 80, meta_date: '2026-12-31' },
        test: { status: 200 }
      }),

      // ── Cargar indicadores FIN (Financiación) ──────────────────
      // Bariloche tiene presupuesto limitado y baja ejecución presupuestaria.
      req('PUT', '{{base_url}}/api/evaluations/evaluations/{{eval_bariloche_id}}/indicators/c0000000-0000-0000-0000-000000000011/value', {
        name: '5.6 [FIN] Presupuesto asignado - 55%',
        body: { destination_value: 55, destination_observations: 'Presupuesto 2026: $12M ARS asignados al área DTI. Inferior al 1% del presupuesto turístico total.', meta: 80, meta_date: '2027-01-01' },
        test: { status: 200 }
      }),
      req('PUT', '{{base_url}}/api/evaluations/evaluations/{{eval_bariloche_id}}/indicators/c0000000-0000-0000-0000-000000000012/value', {
        name: '5.7 [FIN] Ejecución presupuestaria - 45%',
        body: { destination_value: 45, destination_observations: 'Ejecución a Q1 2026 del 18%. Procesos licitatorios lentos para inversiones tecnológicas.', meta: 75, meta_date: '2026-12-31' },
        test: { status: 200 }
      }),
      req('PUT', '{{base_url}}/api/evaluations/evaluations/{{eval_bariloche_id}}/indicators/c0000000-0000-0000-0000-000000000013/value', {
        name: '5.8 [FIN] Fuentes de financiación - 60%',
        body: { destination_value: 60, destination_observations: 'Financiamiento mixto: fondos municipales, aportes de CAAVT y negociación activa con BID/FIDAE.', meta: 85, meta_date: '2027-06-30' },
        test: { status: 200 }
      }),

      // ── Cargar indicadores TEC (Infraestructura) ───────────────
      // Bariloche tiene buena infraestructura TIC general.
      req('PUT', '{{base_url}}/api/evaluations/evaluations/{{eval_bariloche_id}}/indicators/c0000000-0000-0000-0000-000000000044/value', {
        name: '5.9 [TEC] Infraestructura TIC - 80%',
        body: { destination_value: 80, destination_observations: 'Centro de datos municipal con redundancia. Cobertura de fibra óptica en zona centro y principales atractivos.', meta: 95, meta_date: '2026-12-31' },
        test: { status: 200 }
      }),
      req('PUT', '{{base_url}}/api/evaluations/evaluations/{{eval_bariloche_id}}/indicators/c0000000-0000-0000-0000-000000000045/value', {
        name: '5.10 [TEC] Ciberseguridad - 65%',
        body: { destination_value: 65, destination_observations: 'Política de seguridad vigente desde 2024. Auditorías anuales. Necesario implementar SOC 24/7.', meta: 90, meta_date: '2027-06-30' },
        test: { status: 200 }
      }),
      req('PUT', '{{base_url}}/api/evaluations/evaluations/{{eval_bariloche_id}}/indicators/c0000000-0000-0000-0000-000000000047/value', {
        name: '5.11 [TEC] Computación en la nube - 70%',
        body: { destination_value: 70, destination_observations: 'Servicios de gobierno digital migrados a nube pública (AWS). Backup en infraestructura propia.', meta: 90, meta_date: '2027-01-01' },
        test: { status: 200 }
      }),

      // ── Avanzar estados ───────────────────────────────────────
      req('POST', '{{base_url}}/api/evaluations/evaluations/{{eval_bariloche_id}}/change-status', {
        name: '6. Avanzar a carga_finalizada',
        body: { status: 'carga_finalizada' },
        test: { status: 200 }
      }),
      req('POST', '{{base_url}}/api/evaluations/evaluations/{{eval_bariloche_id}}/change-status', {
        name: '7. Avanzar a en_evaluacion',
        body: { status: 'en_evaluacion' },
        test: { status: 200 }
      }),

      // ── Crear acciones ────────────────────────────────────────
      req('POST', '{{base_url}}/api/evaluations/actions', {
        name: '8. Crear acción: Crear Observatorio Turístico',
        body: {
          destination_id: 'a0000000-0000-0000-0000-000000000100',
          name: 'Crear Observatorio de Datos Turísticos de Bariloche',
          summary: 'Desarrollar plataforma de inteligencia turística que centralice métricas de visitantes, ocupación hotelera, flujos en redes sociales y satisfacción del turismo.',
          objective: 'Contar con información en tiempo real para toma de decisiones basadas en datos',
          status: 'idea',
          axes: ['INF', 'DAT'],
          budget_amount: 85000,
          budget_currency: 'USD',
          start_date: '2026-07-01',
          end_date: '2027-06-30'
        },
        test: { status: 201, extra: setIdFromResponse('action_obs_id') }
      }),
      req('POST', '{{base_url}}/api/evaluations/actions', {
        name: '9. Crear acción: Fortalecer equipo DTI',
        body: {
          destination_id: 'a0000000-0000-0000-0000-000000000100',
          name: 'Fortalecimiento del equipo técnico DTI',
          summary: 'Incorporar 2 perfiles especializados: un data analyst y un especialista en experiencia de usuario. Programa de capacitación continua.',
          objective: 'Alcanzar el 85% de madurez en gestión DTI para Dic 2027',
          status: 'en_planificacion',
          axes: ['ORG'],
          budget_amount: 35000,
          budget_currency: 'USD',
          start_date: '2026-04-01',
          end_date: '2026-12-31'
        },
        test: { status: 201, extra: setIdFromResponse('action_eq_id') }
      }),
      req('POST', '{{base_url}}/api/evaluations/actions', {
        name: '10. Crear acción: Plataforma de Financiación DTI',
        body: {
          destination_id: 'a0000000-0000-0000-0000-000000000100',
          name: 'Plataforma digital de фондовой financiaciónturístico',
          summary: 'Desarrollar portal que conecte inversores con proyectos turísticos certificados DTI, con trazabilidad de impacto y métricas de retorno.',
          objective: 'Captar $200K USD en inversión para proyectos DTI Bariloche',
          status: 'idea',
          axes: ['FIN', 'TEC'],
          budget_amount: 50000,
          budget_currency: 'USD',
          start_date: '2026-09-01',
          end_date: '2027-12-31'
        },
        test: { status: 201, extra: setIdFromResponse('action_fin_id') }
      }),

      // ── Vincular indicadores a acciones ───────────────────────
      req('POST', '{{base_url}}/api/evaluations/actions/{{action_obs_id}}/link-indicator', {
        name: '11. Vincular indicador: Infraestructura TIC → Observatorio',
        body: { indicator_id: 'c0000000-0000-0000-0000-000000000044', evaluation_id: '{{eval_bariloche_id}}' },
        test: { status: 201 }
      }),
      req('POST', '{{base_url}}/api/evaluations/actions/{{action_eq_id}}/link-indicator', {
        name: '12. Vincular indicador: Perfiles equipo → Fortalecimiento',
        body: { indicator_id: 'c0000000-0000-0000-0000-000000000005', evaluation_id: '{{eval_bariloche_id}}' },
        test: { status: 201 }
      }),
      req('POST', '{{base_url}}/api/evaluations/actions/{{action_fin_id}}/link-indicator', {
        name: '13. Vincular indicador: Fuentes financiación → Plataforma',
        body: { indicator_id: 'c0000000-0000-0000-0000-000000000013', evaluation_id: '{{eval_bariloche_id}}' },
        test: { status: 201 }
      }),

      // ── Agregar evidencias ─────────────────────────────────────
      req('POST', '{{base_url}}/api/evaluations/actions/{{action_obs_id}}/evidence', {
        name: '14. Evidencia: Decreto DTI municipal',
        body: { evaluation_id: '{{eval_bariloche_id}}', type: 'document', file_path: '/evidencias/bariloche/decreto_dti_2024.pdf', description: 'Decreto municipal N°1256/2024 de adhesión al programa DTI' },
        test: { status: 201 }
      }),
      req('POST', '{{base_url}}/api/evaluations/actions/{{action_obs_id}}/evidence', {
        name: '15. Evidencia: Nota de prensa - Convenio UNCo',
        body: { evaluation_id: '{{eval_bariloche_id}}', type: 'press', url: 'https://bariloche.gob.ar/prensa/convenio-universidad-dti', description: 'Nota sobre convenio con Universidad Nacional del Comahue para el observatorio turístico' },
        test: { status: 201 }
      }),
      req('POST', '{{base_url}}/api/evaluations/actions/{{action_eq_id}}/evidence', {
        name: '16. Evidencia: Perfiles equipo DTI',
        body: { evaluation_id: '{{eval_bariloche_id}}', type: 'document', file_path: '/evidencias/bariloche/organigrama_dti_2026.pdf', description: 'Organigrama y perfiles del equipo DTI 2026' },
        test: { status: 201 }
      }),

      // ── Designar buena práctica ───────────────────────────────
      req('PUT', '{{base_url}}/api/evaluations/actions/{{action_eq_id}}/designate-good-practice', {
        name: '17. Designar como buena práctica',
        test: { status: 200 }
      }),

      // ── Crear Plan DTI ─────────────────────────────────────────
      req('POST', '{{base_url}}/api/evaluations/dti-plans', {
        name: '18. Crear Plan DTI Bariloche 2026-2029',
        body: {
          destination_id: 'a0000000-0000-0000-0000-000000000100',
          name: 'Plan DTI San Carlos de Bariloche 2026-2029',
          start_date: '2026-01-01',
          end_date: '2029-12-31',
          description: 'Plan estratégico quinquenal del destino turístico inteligente de Bariloche, con foco en infraestructura de datos, sostenibilidad y experiencia digital del visitante.'
        },
        test: { status: 201, extra: setIdFromResponse('dti_plan_bariloche_id') }
      }),

      // ── Agregar metas al Plan DTI ───────────────────────────────
      req('POST', '{{base_url}}/api/evaluations/dti-plans/{{dti_plan_bariloche_id}}/goals', {
        name: '19. Meta: Alcanzar 80% Infraestructura TIC',
        body: {
          indicator_id: 'c0000000-0000-0000-0000-000000000044',
          target_score: 80,
          target_date: '2026-12-31',
          description: 'Ampliar cobertura de fibra óptica yWiFi público en principales atractivos turísticos.'
        },
        test: { status: 201, extra: setIdFromResponse('goal_tec_id') }
      }),
      req('POST', '{{base_url}}/api/evaluations/dti-plans/{{dti_plan_bariloche_id}}/goals', {
        name: '20. Meta: Alcanzar 85% Compromiso político',
        body: {
          indicator_id: 'c0000000-0000-0000-0000-000000000003',
          target_score: 85,
          target_date: '2026-12-31',
          description: 'Consolidar el Consejo Asesor DTI con reuniones mensuales y decree de presupuesto plurianual.'
        },
        test: { status: 201 }
      }),
      req('POST', '{{base_url}}/api/evaluations/dti-plans/{{dti_plan_bariloche_id}}/goals', {
        name: '21. Meta: Alcanzar 75% Ejecución presupuestaria',
        body: {
          indicator_id: 'c0000000-0000-0000-0000-000000000012',
          target_score: 75,
          target_date: '2027-06-30',
          description: 'Optimizar procesos licitatorios para alcanzar el 75% de ejecución del presupuesto DTI asignado.'
        },
        test: { status: 201 }
      }),

      // ── Cerrar evaluación ─────────────────────────────────────
      req('POST', '{{base_url}}/api/evaluations/evaluations/{{eval_bariloche_id}}/change-status', {
        name: '22. Cerrar evaluación',
        body: { status: 'cerrada' },
        test: { status: 200 }
      }),

      // ── Obtener resultados ─────────────────────────────────────
      req('GET', '{{base_url}}/api/evaluations/results?evaluation_id={{eval_bariloche_id}}', {
        name: '23. Obtener resultados y puntuación final',
        test: { status: 200 }
      }),
      req('GET', '{{base_url}}/api/evaluations/evaluations/{{eval_bariloche_id}}/scopes', {
        name: '24. Ver progreso por eje DTI',
        test: { status: 200 }
      }),
    ], 'Flujo completo de autodiagnóstico para San Carlos de Bariloche 2026. Crea la evaluación, carga valores realistas para los ejes ORG, FIN y TEC, avanza estados, crea acciones con evidencias, define plan DTI con metas y cierra la evaluación.'),

  ],
};

// ══════════════════════════════════════════════════════════════
// OUTPUT
// ══════════════════════════════════════════════════════════════
console.log(JSON.stringify(collection, null, 2));
