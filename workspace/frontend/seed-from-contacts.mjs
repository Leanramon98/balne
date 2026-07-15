#!/usr/bin/env node
/**
 * Seed DTI destinations & users from contactos_dti.xlsx
 *
 * Usage:
 *   node seed-from-contacts.mjs
 *
 * You'll be prompted for admin credentials.
 * All users get password: DTI2026!
 */

import XLSX from 'xlsx';
import { readFileSync, existsSync } from 'fs';
import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

/* ── Config ───────────────────────────────────────────────────────── */

// Read INTERNAL_GATEWAY_URL from .env as fallback
let GATEWAY_URL = 'https://legal-eyes-sniff.loca.lt';
if (existsSync('.env')) {
  const env = readFileSync('.env', 'utf-8');
  const match = env.match(/INTERNAL_GATEWAY_URL=(.+)/);
  if (match) GATEWAY_URL = match[1].trim();
}

const XLSX_FILE = 'contactos_dti.xlsx';
const DEFAULT_PASSWORD = 'DTI2026!';

/* ── Helpers ──────────────────────────────────────────────────────── */

const rl = readline.createInterface({ input: stdin, output: stdout });

async function prompt(msg) {
  const answer = await rl.question(msg);
  return answer.trim();
}

async function api(method, path, body, token) {
  const url = `${GATEWAY_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${typeof data === 'object' ? JSON.stringify(data) : data}`);
  }

  return { status: res.status, data };
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/* ── Main ─────────────────────────────────────────────────────────── */

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   DTI — Seed destinos y usuarios            ║');
  console.log('║   Gateway: ' + GATEWAY_URL.padEnd(33) + '║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  // ── 1. Read xlsx ───────────────────────────────────────────────
  if (!existsSync(XLSX_FILE)) {
    console.error(`✗ No se encuentra ${XLSX_FILE}`);
    process.exit(1);
  }

  const wb = XLSX.readFile(XLSX_FILE);
  const ws = wb.Sheets['Contactos'];
  const rows = XLSX.utils.sheet_to_json(ws);

  console.log(`Leídos ${rows.length} contactos desde ${XLSX_FILE}`);
  console.log('');

  // ── 2. Admin login ─────────────────────────────────────────────
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.ADMIN_USER;
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS;

  const email = ADMIN_EMAIL || await prompt('  Email admin: ');
  const password = ADMIN_PASS || await prompt('  Contraseña: ');
  console.log('');

  console.log('  Iniciando sesión...');
  const { data: loginData } = await api('POST', '/api/users/auth/login', {
    email, password,
  });
  const token = loginData?.token || loginData?.Token;
  if (!token) {
    console.error('✗ No se recibió token en la respuesta de login');
    console.error('  Respuesta:', JSON.stringify(loginData));
    process.exit(1);
  }
  console.log('  ✓ Token obtenido');

  // ── 3. Resolve admin-destino role ──────────────────────────────
  console.log('  Resolviendo role admin-destino...');
  const { data: roles } = await api('GET', '/api/users/roles', null, token);
  const rolesList = roles?.Items || roles?.Item || roles?.data || (Array.isArray(roles) ? roles : []);
  const adminDestinoRole = rolesList.find(r =>
    (r.Name || r.name) === 'admin_destino'
  );
  if (!adminDestinoRole) {
    console.error('✗ No se encontró el role admin_destino');
    console.error('  Roles disponibles:', rolesList.map(r => r.Name || r.name));
    process.exit(1);
  }
  const ROLE_ID = adminDestinoRole.ID || adminDestinoRole.id;
  console.log(`  ✓ admin_destino → ${ROLE_ID}`);

  // ── 4. Get existing destinations to avoid dupes ────────────────
  console.log('  Obteniendo destinos existentes...');
  let existingDestinos = [];
  try {
    const { data: destData } = await api('GET', '/api/evaluations/destinations', null, token);
    existingDestinos = destData?.Items || destData?.Item || destData?.data || (Array.isArray(destData) ? destData : []);
  } catch (e) {
    console.log('  (no se pudieron obtener destinos existentes, se crean todos)');
  }
  const existingNames = new Set(existingDestinos.map(d => (d.Name || d.name || '').toLowerCase().trim()));
  console.log(`  ${existingDestinos.length} destinos existentes`);

  // ── 5. Build unique destinations from contacts ─────────────────
  const destMap = new Map();
  for (const row of rows) {
    const name = (row.Destino || '').trim();
    if (!name) continue;
    if (!destMap.has(name)) {
      destMap.set(name, {
        name,
        country: (row.País || '').trim(),
        state: (row['Estado/Provincia'] || '').trim(),
      });
    }
  }
  const destinosToCreate = [...destMap.values()].filter(d =>
    !existingNames.has(d.name.toLowerCase().trim())
  );
  console.log(`  ${destMap.size} destinos únicos en el archivo`);
  console.log(`  ${destinosToCreate.length} por crear (${existingNames.size} ya existen)`);
  console.log('');

  // ── 6. Create destinations ─────────────────────────────────────
  if (destinosToCreate.length > 0) {
    console.log('▶  Creando destinos...');
    for (const d of destinosToCreate) {
      try {
        const { data: created } = await api('POST', '/api/evaluations/destinations', {
          name: d.name,
          country: d.country,
        }, token);
        const id = created?.ID || created?.id;
        d._id = id;
        console.log(`  ✓ ${d.name} (${d.country}) → ${id}`);
        await sleep(200); // gentle pace
      } catch (e) {
        console.error(`  ✗ ${d.name}: ${e.message}`);
      }
    }
  } else {
    console.log('▶  No hay destinos nuevos para crear');
  }
  console.log('');

  // ── 7. Refresh destinos list to get IDs ────────────────────────
  console.log('  Obteniendo lista actualizada de destinos...');
  const { data: allDestData } = await api('GET', '/api/evaluations/destinations', null, token);
  const allDestinos = allDestData?.Items || allDestData?.Item || allDestData?.data || (Array.isArray(allDestData) ? allDestData : []);
  const destinosByName = new Map();
  for (const d of allDestinos) {
    destinosByName.set((d.Name || d.name || '').toLowerCase().trim(), d.ID || d.id);
  }
  console.log(`  ${allDestinos.length} destinos totales`);
  console.log('');

  // ── 8. Create users ────────────────────────────────────────────
  let created = 0;
  let skipped = 0;
  let errors = 0;

  console.log('▶  Creando usuarios (admin_destino)...');
  console.log('   Contraseña para todos: ' + DEFAULT_PASSWORD);
  console.log('');

  for (const row of rows) {
    const destName = (row.Destino || '').trim();
    const email = (row.Mail || '').trim().toLowerCase();
    const fullName = (row.Nombre || '').trim();
    const cargo = (row.Cargo || '').trim();

    if (!email || !fullName || !destName) {
      skipped++;
      continue;
    }

    const destinationId = destinosByName.get(destName.toLowerCase());

    const userPayload = {
      email,
      full_name: fullName,
      password: DEFAULT_PASSWORD,
      role_id: ROLE_ID,
      is_active: true,
    };
    if (destinationId) {
      userPayload.destination_id = destinationId;
    }

    try {
      const { data: createdUser } = await api('POST', '/api/users/users', userPayload, token);
      created++;
      if (created <= 3 || created % 50 === 0) {
        const shortName = fullName.length > 30 ? fullName.substring(0, 28) + '…' : fullName;
        const destLabel = destinationId ? destName : 'SIN DESTINO';
        console.log(`  ✓ ${(created + '').padStart(3)} ${email.padEnd(35)} ${shortName.padEnd(32)} ${destLabel}`);
      }
      await sleep(100);
    } catch (e) {
      // If it's a duplicate email, skip gracefully
      if (e.message.includes('409') || e.message.includes('duplicate') || e.message.includes('already exists')) {
        skipped++;
      } else {
        errors++;
        console.error(`  ✗ ${email}: ${e.message}`);
      }
    }
  }

  // ── Summary ────────────────────────────────────────────────────
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   RESULTADO                                  ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`  Destinos creados:  ${destinosToCreate.filter(d => d._id).length} / ${destinosToCreate.length}`);
  console.log(`  Usuarios creados:  ${created}`);
  console.log(`  Omitidos (duplicates/invalid): ${skipped}`);
  console.log(`  Errores:           ${errors}`);
  console.log('');
  console.log('  Password común:    ' + DEFAULT_PASSWORD);
  console.log('  Role:              admin_destino');
  console.log('');

  rl.close();
}

main().catch(err => {
  console.error('\n✗ Error fatal:', err.message);
  rl.close();
  process.exit(1);
});
