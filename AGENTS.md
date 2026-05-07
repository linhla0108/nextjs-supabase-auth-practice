# AGENTS.md

## Commands

```bash
# Development
yarn dev          # Start dev server (localhost:3000)
yarn build        # Build for production
yarn start        # Run production build
yarn lint         # Run ESLint
yarn test         # Run Vitest (unit tests)
yarn test:ui      # Run Vitest with UI
```

## Architecture

- **Framework**: Next.js 16 (App Router) + React 19 + Tailwind CSS v4
- **Auth**: Supabase Auth via `@supabase/ssr`
- **Database**: Supabase (PostgreSQL)
- **Client**: `lib/supabase/client.ts` — browser-only (anon key via `createBrowserClient`)
- **TypeScript**: Strict mode, path alias `@/*` → root

## Auth Pages

| Route | File | Purpose |
|---|---|---|
| `/signin` | `app/signin/page.tsx` | Email + password login |
| `/signup` | `app/signup/page.tsx` | Registration with email verification |
| `/forgot-password` | `app/forgot-password/page.tsx` | Request password reset email |
| `/reset-password` | `app/reset-password/page.tsx` | Set new password via magic link |
| `/verify-email` | `app/verify-email/page.tsx` | Post-signup email verification screen |
| `/dashboard` | `app/dashboard/page.tsx` | Protected page, requires auth |

## Route Protection (middleware.ts)

- `PROTECTED_PATHS = ["/dashboard"]` → redirect to `/signin` if unauthenticated
- `GUEST_ONLY_PATHS = ["/signin", "/signup", "/forgot-password"]` → redirect to `/dashboard` if authenticated

## Supabase Setup Required

1. Create project at supabase.com
2. Enable Email Auth provider
3. Create `practice_profiles` table (see `docs/AUTH_SYSTEM.md` for schema)
4. Set up `handle_new_user()` trigger to auto-create profiles

## Environment Variables

Required in `.env`:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` — Anon key (browser-safe)

## Testing

Unit tests co-located with pages: `page.test.tsx` next to each `page.tsx`.
Integration test: `test/auth-db.test.ts` (simulates DB trigger logic).

Run: `yarn test`
