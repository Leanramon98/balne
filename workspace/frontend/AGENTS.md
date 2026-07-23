# AGENTS.md — Frontend

> Frontend-specific conventions for the Project Template Next.js 15 application.

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
├── molecules/    ← FormField, FilterBar (atoms combined)
├── organisms/    ← Tables, Forms, Detail views
└── templates/    ← AppShell, NeutralShell (page layouts)
```

### Route Groups

| Group | Layout | Purpose |
|-------|--------|---------|
| `(admin)` | `AppShell` | Admin dashboard pages |
| `(public)` | None | Public pages (landing, etc.) |
| `(auth)` | None | Auth pages (login, register) |

### BFF Pattern (Backend-for-Frontend)

All API calls go through Next.js BFF routes:
- **Client-side**: relative path `/api/users/*` → Next.js rewrites → api-gateway
- **Server-side**: `INTERNAL_GATEWAY_URL` env var → direct to api-gateway

**Key rule**: NEVER call services directly from UI components. Always use `sdk/api/`.

### SDK Layer

```
sdk/
├── api/          ← API clients (users-api.ts)
├── auth/         ← AuthContext, guards, JWT utilities
└── hooks/        ← SWR hooks
```

The BFF proxy is at `app/api/[...path]/route.ts`. It:
- Reads `INTERNAL_GATEWAY_URL` from env
- Forwards requests to the gateway
- Handles 204 No Content specially (returns `new NextResponse(null, { status: 204 })`)

### State Management

- **SWR** for server state (fetching, caching, revalidation)
- **React useState/useReducer** for local UI state
- **No global state library** (no Redux, Zustand, etc.)

## UI Conventions

### shadcn/ui Usage

Import from `@/components/ui/*`:
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
```

### Color Palette

Follow the design tokens (Tailwind v4 CSS variables):
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

## File Rules

1. **Never import from `context/` or `lib/` at root** — use `sdk/hooks/` and `sdk/api/`
2. **Always use `useAuth()` for auth state** — don't read localStorage directly
3. **Use `cn()` utility for class merging** — from `@/lib/utils`
4. **Client components need `'use client'`** — server components are default
5. **Dynamic route params are async in Next.js 15** — must await `params` in page components

## Testing

- **E2E**: Playwright tests in `tests/e2e/`
- **Unit**: Jest + React Testing Library

## Dependencies

Key packages:
- `swr` — Data fetching
- `sonner` — Toast notifications
- `lucide-react` — Icons
- `@radix-ui/*` — Primitives (via shadcn)
