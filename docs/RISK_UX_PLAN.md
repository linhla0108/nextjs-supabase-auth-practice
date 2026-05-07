# Risk & UX Fix Plan — Auth System

> Created from audit `docs/AUTH_SYSTEM.md` · Date: 2026-05-07

---

## Complete list of ⚠️ RISK and 🔵 UX

### ⚠️ RISK (14 items)

| ID | Page | Description |
|----|------|-------|
| A.3.2 | signup | Email already registered but not yet verified → shows "duplicate" banner (cannot distinguish verified/unverified) |
| A.4.3 | signup | Double-submit with motion.button — disabled has not been fully verified |
| A.5.3 | signup | Back button after successful signup → empty form reappears |
| B.2.3 | verify-email | `getSession()` has no timeout → infinite loading if Supabase is slow |
| B.4.5 | verify-email | Resend succeeds but email lands in spam — UI does not warn |
| B.5.2 | verify-email | Verify link expired (Supabase default: 10 minutes) → UI does not handle explicitly |
| B.5.3 | verify-email | Clicking verify link twice — Supabase auto re-checks the token, so the UI already handles this correctly |
| C.3.3 | signin | Signin screen flash after `router.push("/dashboard")` |
| D.4.1 | forgot-password | Multiple submits → Supabase rate limit, error message from Supabase is surfaced to UI |
| D.4.3 | forgot-password | Back button after success → form reappears, can be re-submitted |
| D.4.4 | forgot-password | `resetPasswordForEmail` errors but still shows success (intentional security) |
| E.2.6 | reset-password | 500ms timeout too short on slow networks → shows "Invalid" even when link is valid |
| E.4.1 | reset-password | Logged-in user navigates to `/reset-password` → sees "Invalid or expired" (confusing) |
| F.1.6 | proxy.ts | `/reset-password` not in GUEST_ONLY_PATHS — authenticated user can access it |

### 🔵 UX (10 items)

| ID | Pages | Description |
|----|-------|-------|
| A.5.1 | signup | No password strength indicator |
| A.5.2 | signup | No show/hide password toggle |
| C.4.1 | signin | No "Remember me" checkbox |
| C.4.2 | signin | No show/hide password toggle |
| C.4.3 | signin | Rate limit error from Supabase is not clearly communicated |
| D.4.2 | forgot-password | Email may land in spam — UI does not instruct to check spam |
| E.5.1 | reset-password | No show/hide password toggle |
| G.3 | all | No `aria-live` → screen readers do not announce error/success |
| G.4 | all | Framer Motion does not check `prefers-reduced-motion` |
| G.1/G.2 | all | No success animation / skeleton loading |

---

## Classification by fix feasibility

### ✅ WILL FIX (8 issues → implement immediately)

| Priority | ID | Fix |
|----------|----|-----|
| HIGH | A.5.2 / C.4.2 / E.5.1 | Show/hide password toggle — all password inputs |
| HIGH | B.2.3 | Add 5s timeout for `getSession()` in verify-email |
| HIGH | E.2.6 | Increase PASSWORD_RECOVERY timeout from 500ms → 2000ms |
| HIGH | A.5.3 | `router.replace` instead of `router.push` after signup |
| HIGH | G.3 | `role="alert" aria-live="assertive"` on all error/success divs |
| MEDIUM | G.4 | `useReducedMotion()` from `motion/react` — skip animation if OS setting is enabled |
| MEDIUM | B.4.5 / D.4.2 | Add "Please also check your spam folder." to success messages |
| MEDIUM | C.4.3 | Normalize rate limit error message from Supabase |

### ✅ Round 2 — WILL FIX (3 issues, after review)

| Priority | ID | Fix |
|----------|----|-----|
| HIGH | A.5.1 | Custom `getPasswordStrength()` (length/upper-lower/digit/special) + 4-bar visual indicator below password input in signup |
| HIGH | C.4.1 | Remember me checkbox in signin — sets cookie `remember-me`, cookie handler in `proxy.ts` + `lib/supabase/client.ts` strips `maxAge`/`expires` from Supabase auth cookies when `rememberMe=false` → becomes session cookies (closing browser = sign out) |
| LOW | B.5.3 / D.4.1 | Re-classify as 🟢 NORMAL — Supabase handles this (re-check token / surface rate-limit error) |

### ⏭️ SKIP / WILL NOT FIX (reasons)

| ID | Skip reason |
|----|-----------|
| A.3.2 | Supabase limitation — cannot distinguish verified/unverified duplicate |
| A.4.3 | `disabled={isLoading}` is set correctly — motion animation still runs but does not re-submit |
| B.5.2 | Supabase-side behavior (default link 10 minutes), UI cannot control |
| C.3.3 | Small flash, does not cause errors — router.push is correct |
| D.4.3 | isSuccess is React state — back button will re-render a new page, not a real issue |
| D.4.4 | Intentional security behavior — always show success |
| E.4.1 | Correct behavior — logged-in user should not be in reset-password flow |
| F.1.6 | Correct behavior — /reset-password needs to be accessible in PASSWORD_RECOVERY flow |
| G.1 / G.2 | Skipped per user — no need for skeleton/animation in practice scope |

---

## Implementation Plan

### Subagent 1 → `app/signup/page.tsx`

**Changes:**
1. **Show/hide password** (A.5.2): Add `showPassword` state, wrap password input in `div relative`, add toggle button
2. **router.replace** (A.5.3): Change `router.push(...)` → `router.replace(...)` in `handleSignUp`
3. **aria-live** (G.3): Add `role="alert" aria-live="assertive"` to both error divs (duplicate + regular)
4. **prefers-reduced-motion** (G.4): Use `useReducedMotion()` — if true, pass `{}` instead of `MOTION_PROPS`

### Subagent 2 → `app/signin/page.tsx`

**Changes:**
1. **Show/hide password** (C.4.2): Add `showPassword` state, wrap password input, add toggle button
2. **Rate limit message** (C.4.3): In `handleSignIn`, also normalize: if message contains "rate" or "too many" → "Too many attempts. Please wait a moment before trying again."
3. **aria-live** (G.3): Add `role="alert" aria-live="assertive"` to error div
4. **prefers-reduced-motion** (G.4): Use `useReducedMotion()`

### Subagent 3 → `app/verify-email/page.tsx`

**Changes:**
1. **getSession timeout** (B.2.3): In useEffect Step 1, add `setTimeout 5000ms` fallback — if `getSession` doesn't return in 5s, then `setIsCheckingSession(false)`
2. **Spam hint** (B.4.5): Change success message → `"Verification email resent. Please check your inbox and spam folder."`
3. **aria-live** (G.3): Add `role="alert" aria-live="assertive"` to error and success divs
4. **prefers-reduced-motion** (G.4): Use `useReducedMotion()`

### Subagent 4 → `app/forgot-password/page.tsx`

**Changes:**
1. **Spam hint** (D.4.2): Change success text → "Password reset email sent! Please check your inbox and spam folder."
2. **aria-live** (G.3): Add `role="alert" aria-live="assertive"` to error div and success div
3. **prefers-reduced-motion** (G.4): Use `useReducedMotion()`

### Subagent 5 → `app/reset-password/page.tsx`

**Changes:**
1. **Show/hide password** (E.5.1): Add `showPassword` + `showConfirmPassword` states, wrap both password inputs in `div relative`, 2 toggle buttons
2. **Increase timeout** (E.2.6): Change `500` → `2000` ms in PASSWORD_RECOVERY's setTimeout
3. **aria-live** (G.3): Add `role="alert" aria-live="assertive"` to error div
4. **prefers-reduced-motion** (G.4): Use `useReducedMotion()`

---

## Show/Hide Toggle — Design Spec

Consistent pattern used for all password inputs:

```tsx
// State
const [showPassword, setShowPassword] = useState(false);

// Wrapper + input + button
<div className="relative">
  <input
    type={showPassword ? "text" : "password"}
    className="h-[44px] w-full rounded-full border border-[#e0e0e0] px-5 pr-12 text-[17px] ..."
  />
  <button
    type="button"
    onClick={() => setShowPassword(v => !v)}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6e6e73] text-[13px] focus:outline-none"
    aria-label={showPassword ? "Hide password" : "Show password"}
  >
    {showPassword ? "Hide" : "Show"}
  </button>
</div>
```

**Note:** Add `pr-12` to input className so text isn't hidden by the button.

---

## prefers-reduced-motion — Design Spec

```tsx
import { motion, useReducedMotion } from "motion/react";

// In the component
const prefersReduced = useReducedMotion();
const motionProps = prefersReduced ? {} : MOTION_PROPS;

// Use
<motion.div {...motionProps} className="...">
```

---

## aria-live — Design Spec

```tsx
// Error
<div role="alert" aria-live="assertive" className="mb-4 p-3 bg-red-50 ...">
  {error}
</div>

// Success
<div role="status" aria-live="polite" className="mb-4 p-3 bg-green-50 ...">
  {successMessage}
</div>
```

---

## Status Tracking

### Round 1
| Subagent | File | Status |
|----------|------|--------|
| 1 | app/signup/page.tsx | ✅ done |
| 2 | app/signin/page.tsx | ✅ done |
| 3 | app/verify-email/page.tsx | ✅ done |
| 4 | app/forgot-password/page.tsx | ✅ done |
| 5 | app/reset-password/page.tsx | ✅ done |

### Round 2 (after review)
| Task | File(s) | Status |
|------|---------|--------|
| A.5.1 Password strength indicator | app/signup/page.tsx | ✅ done |
| C.4.1 Remember me — UI | app/signin/page.tsx | ✅ done |
| C.4.1 Remember me — cookie handler (browser) | lib/supabase/client.ts | ✅ done |
| C.4.1 Remember me — cookie handler (server) | proxy.ts | ✅ done |

---

## Checklist after implementation

- [ ] `signup/page.tsx`: password toggle works, router.replace, aria-live, reduced-motion
- [ ] `signin/page.tsx`: password toggle works, rate limit message, aria-live, reduced-motion
- [ ] `verify-email/page.tsx`: getSession timeout fallback, spam hint, aria-live, reduced-motion
- [ ] `forgot-password/page.tsx`: spam hint, aria-live, reduced-motion
- [ ] `reset-password/page.tsx`: 2 password toggles, timeout 2000ms, aria-live, reduced-motion
- [ ] TypeScript compiles with no errors (`tsc --noEmit`)
- [ ] No regression on other pages
