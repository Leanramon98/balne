# AGENTS.md — Frontend

> Frontend-specific conventions for the Auto-Insight Next.js 15 application.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **React**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix primitives + Tailwind)
- **Icons**: lucide-react
- **Data Fetching**: SWR
- **Notifications**: sonner (toast)

## Architecture

### Atomic Design
Components follow the Atomic Design hierarchy:

```
components/
├── atoms/        ← Buttons, Inputs, Badges, Labels (reusable primitives)
├── molecules/    ← FormField, FilterBar, IndicatorRow (atoms combined)
├── organisms/    ← Tables, Forms, Detail views, ActionSelectorModal
└── templates/    ← AppShell, DtiShell (page layouts)
```

### Route Groups

| Group | Layout | Purpose |
|-------|--------|---------|
| `(dti)` | `DtiShell` | Main DTI pages (evaluaciones, acciones, resultados, etc.) |
| `(admin)` | `AppShell` | Deprecated — migrating to `(dti)` |
| `(public)` | None | Public pages (login, buenas-practicas) |
| `(auth)` | None | Auth pages (login) |

### BFF Pattern (Backend-for-Frontend)

All API calls go through Next.js BFF routes:
- **Client-side**: relative path `/api/evaluations/*` → Next.js rewrites → api-gateway
- **Server-side**: `INTERNAL_GATEWAY_URL` env var → direct to api-gateway

**Key rule**: NEVER call services directly from UI components. Always use `sdk/api/`.

### SDK Layer

```
sdk/
├── api/          ← API clients (evaluations-api.ts, users-api.ts)
├── auth/         ← AuthContext, guards, JWT utilities
└── hooks/        ← SWR hooks (useAuditLogs, useGoodPractices, etc.)
```

The BFF proxy is at `app/api/[...path]/route.ts`. It:
- Reads `INTERNAL_GATEWAY_URL` from env
- Forwards requests to the gateway
- Handles 204 No Content specially (returns `new NextResponse(null, { status: 204 })`)

### State Management

- **SWR** for server state (fetching, caching, revalidation)
- **React useState/useReducer** for local UI state
- **No global state library** (no Redux, Zustand, etc.)

SWR cache keys use arrays: `['indicator-value', evaluationId, indicatorId]`

## UI Conventions

### shadcn/ui Usage

Import from `@/components/ui/*`:
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
```

### Color Palette

Follow the DTI design tokens (Tailwind v4 CSS variables):
- Primary: `blue-600`
- Success: `green-500`/`green-600`
- Warning: `amber-500`
- Destructive: `red-500`
- Text primary: `zinc-900`
- Text secondary: `zinc-500`
- Background: `white` / `gray-50`

### Tables

Use the shadcn Table components:
```tsx
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
```

CRUD tables should have:
- Create button (top-right, `<Plus />` icon)
- Edit button per row (`<Edit />` icon)
- Delete button per row (`<Trash2 className="text-red-500" />` icon) with `ConfirmDialog`

### Forms

- Use `useState` for form fields
- Validation: inline checks before submit
- Submit buttons show loading state (`saving ? 'Guardando...' : 'Guardar'`)

## Domain-Specific Conventions

### Destino (Destination)
- Has `lat` and `lng` fields for map positioning
- `is_adhered` boolean for adhesion status
- Related to: `member_type_id`, `subnational_level_id`, `typology_id`, `population_range_id`, `region_id`

### Evaluación (Evaluation)
- States: `borrador` → `en_evaluacion` → `finalizada`
- Types: `auto_evaluacion`, `evaluacion`, `re_evaluacion`
- Users have `access_level`: `administracion`, `evaluador`, `observador`

### Indicador (Indicator)
- Types: `gradient` (0/25/50/75/100), `boolean` (Sí/No), `numeric`
- Linked to actions via `action_indicator_link`
- Values stored per evaluation (`destination_value`, `evaluator_value`)

## File Rules

1. **Never import from `context/` or `lib/` at root** — use `sdk/hooks/` and `sdk/api/`
2. **Always use `useAuth()` for auth state** — don't read localStorage directly
3. **Use `cn()` utility for class merging** — from `@/lib/utils`
4. **Client components need `'use client'`** — server components are default
5. **Dynamic route params are async in Next.js 15** — must await `params` in page components

## Testing

- **E2E**: Playwright tests in `tests/e2e/`
- **Unit**: Jest + React Testing Library
- Test data cleanup: use API calls in `tests/e2e/fixtures/cleanup.ts`

## Dependencies

Key packages:
- `swr` — Data fetching
- `sonner` — Toast notifications
- `lucide-react` — Icons
- `@radix-ui/*` — Primitives (via shadcn)
- `react-leaflet` + `leaflet` — Maps (Mapa de Destinos)
- `react-leaflet-cluster` — Marker clustering
