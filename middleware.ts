import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PATHS = ["/dashboard"];

// Routes only for guests (redirect to dashboard if already logged in)
const GUEST_ONLY_PATHS = ["/signin", "/signup", "/forgot-password"];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: { session } } = await supabase.auth.getSession();
  const isLoggedIn = !!session;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isGuestOnly = GUEST_ONLY_PATHS.some((p) => pathname.startsWith(p));

  // Unauthenticated user trying to access protected route → signin
  if (!isLoggedIn && isProtected) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  // Authenticated user trying to access guest-only pages → dashboard
  if (isLoggedIn && isGuestOnly) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
