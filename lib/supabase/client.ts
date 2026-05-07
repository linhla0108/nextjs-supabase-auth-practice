import { createBrowserClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

const REMEMBER_COOKIE = "remember-me";

function parseCookies(): Array<{ name: string; value: string }> {
  if (typeof document === "undefined") return [];
  return document.cookie
    .split("; ")
    .filter(Boolean)
    .map((c) => {
      const idx = c.indexOf("=");
      return idx === -1
        ? { name: c, value: "" }
        : {
            name: c.slice(0, idx),
            value: decodeURIComponent(c.slice(idx + 1)),
          };
    });
}

function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions,
): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.path) parts.push(`path=${options.path}`);
  if (options.domain) parts.push(`domain=${options.domain}`);
  if (typeof options.maxAge === "number") parts.push(`max-age=${options.maxAge}`);
  if (options.expires) parts.push(`expires=${options.expires.toUTCString()}`);
  if (options.sameSite) parts.push(`samesite=${options.sameSite}`);
  if (options.secure) parts.push("secure");
  return parts.join("; ");
}

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
  {
    cookies: {
      getAll: parseCookies,
      setAll(cookiesToSet) {
        if (typeof document === "undefined") return;
        const rememberMe =
          parseCookies().find((c) => c.name === REMEMBER_COOKIE)?.value !==
          "false";
        cookiesToSet.forEach(({ name, value, options }) => {
          // When clearing (maxAge=0), preserve options so cookie clears properly.
          const shouldStripPersistence =
            !rememberMe && options.maxAge !== 0 && value !== "";
          const finalOptions = shouldStripPersistence
            ? { ...options, maxAge: undefined, expires: undefined }
            : options;
          document.cookie = serializeCookie(name, value, finalOptions);
        });
      },
    },
  },
);
