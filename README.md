# nextjs-supabase-auth-practice

Next.js 16 + Supabase Auth practice project with Apple Design System styling.

## Features

- Sign Up with email verification
- Sign In with email + password
- Forgot Password / Reset Password flow
- Protected routes via Next.js middleware
- Supabase Realtime connection status indicator

## Quick Start

```bash
# 1. Clone and install
yarn install

# 2. Set up environment
cp .env.example .env
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

# 3. Run dev server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) — auto-redirects to `/signin`.

## Supabase Setup

See `docs/AUTH_SYSTEM.md` for required tables, triggers, and RLS policies.

## Design

See `docs/DESIGN-apple.md` for Apple Design System specifications used.
