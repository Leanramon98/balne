# AGENTS.md — Frontend App Layer

> Conventions for Next.js App Router pages, layouts, and BFF routes.

## Route Structure

```
app/
├── (admin)/            ← Authenticated pages (AppShell layout)
│   ├── dashboard/
│   ├── configuracion/
│   └── perfil/
├── (public)/           ← No auth required
│   ├── login/
│   └── home/
└── api/                ← BFF proxy routes
    ├── [...path]/       ← Generic proxy to api-gateway
    ├── auth/
    │   ├── login/       ← Auth proxy
    │   ├── logout/
    │   └── me/          ← Current user from JWT
    ├── upload/          ← File upload proxy
    └── files/           ← File download proxy
```

## Layouts

### AdminLayout (`app/(admin)/layout.tsx`)
- Wraps all admin pages with `AppShell`
- Includes `Toaster` for notifications
- RoleGuard for admin roles

### RootLayout (`app/layout.tsx`)
- Global CSS imports (`globals_generated.css`, `globals.css`)
- `AuthProvider` wrapper
- No UI — just providers

## BFF Routes

### Generic Proxy (`api/[...path]/route.ts`)

Forwards any path to the api-gateway:
- Reads `INTERNAL_GATEWAY_URL` from env
- Forwards method, headers, body
- **Special handling for 204**: returns `new NextResponse(null, { status: 204 })`
- Removes hop-by-hop headers

### Auth Routes

- **`api/auth/login`** → forwards to users-service login, sets httpOnly cookie
- **`api/auth/logout`** → clears cookie
- **`api/auth/me`** → decodes JWT from cookie, returns user object

## Page Conventions

### Server Components (default)
- No `'use client'` directive
- Can use `async/await` for data fetching
- Cannot use hooks or browser APIs

### Client Components
- Must add `'use client'` at top
- Can use hooks, browser APIs, event handlers
- Use for interactive UI

### Route Groups
- Grouped by parentheses: `(admin)`, `(public)`, etc.
- Each group can have its own `layout.tsx`
- URL path does NOT include the group name

## Dynamic Routes

Next.js 15: `params` is async, must await:
```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // ...
}
```

## Navigation

Use Next.js `Link` component:
```tsx
import Link from 'next/link';
<Link href="/dashboard">Dashboard</Link>
```

For programmatic navigation:
```tsx
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/dashboard');
```

## Rules

1. **Never call backend directly** — always use BFF routes or SDK
2. **Use `useAuth()` for auth state** — don't read cookies directly
3. **Server components for data fetching** — client components for interactivity
4. **Always handle loading states** — use Skeleton or spinner
5. **Error boundaries** — use Error component for route errors
