// Post-build: copy assets that Next.js standalone output does not include.
//
// With `output: 'standalone'`, Next.js bundles only what the server needs to
// boot (server.js + chunks). The `public/` directory and `.next/static/`
// assets must be copied into `.next/standalone/` manually, otherwise images
// and static chunks 404 in production.
//
// This runs automatically after `npm run build` via the "postbuild" npm hook.

import { cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const standalone = join(root, '.next', 'standalone');

if (!existsSync(standalone)) {
  console.log('[postbuild] .next/standalone not found (non-standalone build) — nothing to copy.');
  process.exit(0);
}

const publicDir = join(root, 'public');
if (existsSync(publicDir)) {
  cpSync(publicDir, join(standalone, 'public'), { recursive: true });
  console.log('[postbuild] Copied public/ -> .next/standalone/public/');
} else {
  console.warn('[postbuild] WARNING: no public/ directory found.');
}

const staticDir = join(root, '.next', 'static');
if (existsSync(staticDir)) {
  cpSync(staticDir, join(standalone, '.next', 'static'), { recursive: true });
  console.log('[postbuild] Copied .next/static/ -> .next/standalone/.next/static/');
} else {
  console.warn('[postbuild] WARNING: .next/static/ not found — client chunks will 404.');
}
