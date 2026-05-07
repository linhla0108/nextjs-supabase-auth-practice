# Risk & UX Fix Plan — Auth System

> Tạo từ audit `docs/AUTH_SYSTEM.md` · Ngày: 2026-05-07

---

## Danh sách đầy đủ ⚠️ RISK và 🔵 UX

### ⚠️ RISK (14 items)

| ID | Page | Mô tả |
|----|------|-------|
| A.3.2 | signup | Email đã đăng ký nhưng chưa verify → hiện banner "duplicate" (không phân biệt verified/unverified) |
| A.4.3 | signup | Double-submit với motion.button — disabled chưa được verify hoàn toàn |
| A.5.3 | signup | Back button sau signup thành công → form trống xuất hiện lại |
| B.2.3 | verify-email | `getSession()` không có timeout → loading vô hạn nếu Supabase chậm |
| B.4.5 | verify-email | Resend thành công nhưng email rơi vào spam — UI không nhắc |
| B.5.2 | verify-email | Link verify hết hạn (mặc định Supabase: 10 phút) → UI không handle explicitly |
| B.5.3 | verify-email | Click link verify 2 lần — Supabase đã auto re-check token nên UI đã handle đúng |
| C.3.3 | signin | Flash màn hình signin sau khi `router.push("/dashboard")` |
| D.4.1 | forgot-password | Submit nhiều lần → Supabase rate limit, error message từ Supabase đã được surface lên UI |
| D.4.3 | forgot-password | Back button sau success → form hiện lại, có thể re-submit |
| D.4.4 | forgot-password | `resetPasswordForEmail` lỗi nhưng vẫn hiện success (intentional security) |
| E.2.6 | reset-password | 500ms timeout quá ngắn trên mạng chậm → hiện "Invalid" dù link hợp lệ |
| E.4.1 | reset-password | Logged-in user vào `/reset-password` → thấy "Invalid or expired" (confusing) |
| F.1.6 | proxy.ts | `/reset-password` không trong GUEST_ONLY_PATHS — authenticated user vào được |

### 🔵 UX (10 items)

| ID | Pages | Mô tả |
|----|-------|-------|
| A.5.1 | signup | Không có password strength indicator |
| A.5.2 | signup | Không có show/hide password toggle |
| C.4.1 | signin | Không có "Remember me" checkbox |
| C.4.2 | signin | Không có show/hide password toggle |
| C.4.3 | signin | Rate limit error từ Supabase không được thông báo rõ |
| D.4.2 | forgot-password | Email có thể rơi vào spam — UI không hướng dẫn check spam |
| E.5.1 | reset-password | Không có show/hide password toggle |
| G.3 | all | Không có `aria-live` → screen reader không announce error/success |
| G.4 | all | Framer Motion không check `prefers-reduced-motion` |
| G.1/G.2 | all | Không có success animation / skeleton loading |

---

## Phân loại theo khả năng fix

### ✅ SẼ FIX (8 issues → triển khai ngay)

| Priority | ID | Fix |
|----------|----|-----|
| HIGH | A.5.2 / C.4.2 / E.5.1 | Show/hide password toggle — tất cả password inputs |
| HIGH | B.2.3 | Thêm 5s timeout cho `getSession()` trong verify-email |
| HIGH | E.2.6 | Tăng PASSWORD_RECOVERY timeout từ 500ms → 2000ms |
| HIGH | A.5.3 | `router.replace` thay vì `router.push` sau signup |
| HIGH | G.3 | `role="alert" aria-live="assertive"` trên tất cả error/success divs |
| MEDIUM | G.4 | `useReducedMotion()` từ `motion/react` — skip animation nếu OS setting bật |
| MEDIUM | B.4.5 / D.4.2 | Thêm "Please also check your spam folder." vào success messages |
| MEDIUM | C.4.3 | Normalize rate limit error message từ Supabase |

### ✅ ROUND 2 — SẼ FIX (3 issues, sau review)

| Priority | ID | Fix |
|----------|----|-----|
| HIGH | A.5.1 | Custom `getPasswordStrength()` (length/upper-lower/digit/special) + 4-bar visual indicator dưới password input trong signup |
| HIGH | C.4.1 | Remember me checkbox trong signin — set cookie `remember-me`, cookie handler ở `proxy.ts` + `lib/supabase/client.ts` strip `maxAge`/`expires` của Supabase auth cookies khi `rememberMe=false` → trở thành session cookies (đóng browser = đăng xuất) |
| LOW | B.5.3 / D.4.1 | Đánh dấu lại là 🟢 NORMAL — Supabase đã handle (re-check token / surface rate-limit error) |

### ⏭️ SKIP / KHÔNG FIX (lý do)

| ID | Lý do skip |
|----|-----------|
| A.3.2 | Supabase limitation — không phân biệt được verified/unverified duplicate |
| A.4.3 | `disabled={isLoading}` đã set đúng — motion animation vẫn chạy nhưng không re-submit |
| B.5.2 | Supabase-side behavior (link mặc định 10 phút), UI không control được |
| C.3.3 | Flash nhỏ, không gây lỗi — router.push là đúng |
| D.4.3 | isSuccess là React state — back button sẽ re-render page mới, không phải issue thực sự |
| D.4.4 | Intentional security behavior — luôn show success |
| E.4.1 | Behavior đúng — logged-in user không nên ở reset-password flow |
| F.1.6 | Behavior đúng — /reset-password cần accessible trong PASSWORD_RECOVERY flow |
| G.1 / G.2 | Skipped per user — không cần skeleton/animation cho practice scope |

---

## Implementation Plan

### Subagent 1 → `app/signup/page.tsx`

**Changes:**
1. **Show/hide password** (A.5.2): Thêm `showPassword` state, wrap password input trong `div relative`, thêm toggle button
2. **router.replace** (A.5.3): Đổi `router.push(...)` → `router.replace(...)` trong `handleSignUp`
3. **aria-live** (G.3): Thêm `role="alert" aria-live="assertive"` vào cả 2 error divs (duplicate + regular)
4. **prefers-reduced-motion** (G.4): Dùng `useReducedMotion()` — nếu true thì pass `{}` thay vì `MOTION_PROPS`

### Subagent 2 → `app/signin/page.tsx`

**Changes:**
1. **Show/hide password** (C.4.2): Thêm `showPassword` state, wrap password input, thêm toggle button
2. **Rate limit message** (C.4.3): Trong `handleSignIn` normalize thêm: nếu message chứa "rate" hoặc "too many" → "Too many attempts. Please wait a moment before trying again."
3. **aria-live** (G.3): Thêm `role="alert" aria-live="assertive"` vào error div
4. **prefers-reduced-motion** (G.4): Dùng `useReducedMotion()`

### Subagent 3 → `app/verify-email/page.tsx`

**Changes:**
1. **getSession timeout** (B.2.3): Trong useEffect Step 1, thêm `setTimeout 5000ms` fallback — nếu `getSession` không trả về trong 5s thì `setIsCheckingSession(false)`
2. **Spam hint** (B.4.5): Đổi success message → `"Verification email resent. Please check your inbox and spam folder."`
3. **aria-live** (G.3): Thêm `role="alert" aria-live="assertive"` vào error và success divs
4. **prefers-reduced-motion** (G.4): Dùng `useReducedMotion()`

### Subagent 4 → `app/forgot-password/page.tsx`

**Changes:**
1. **Spam hint** (D.4.2): Đổi success text → "Password reset email sent! Please check your inbox and spam folder."
2. **aria-live** (G.3): Thêm `role="alert" aria-live="assertive"` vào error div và success div
3. **prefers-reduced-motion** (G.4): Dùng `useReducedMotion()`

### Subagent 5 → `app/reset-password/page.tsx`

**Changes:**
1. **Show/hide password** (E.5.1): Thêm `showPassword` + `showConfirmPassword` states, wrap cả 2 password inputs trong `div relative`, 2 toggle buttons
2. **Increase timeout** (E.2.6): Đổi `500` → `2000` ms trong setTimeout của PASSWORD_RECOVERY
3. **aria-live** (G.3): Thêm `role="alert" aria-live="assertive"` vào error div
4. **prefers-reduced-motion** (G.4): Dùng `useReducedMotion()`

---

## Show/Hide Toggle — Design Spec

Pattern nhất quán dùng cho tất cả password inputs:

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

**Note:** Thêm `pr-12` vào input className để text không bị che bởi button.

---

## prefers-reduced-motion — Design Spec

```tsx
import { motion, useReducedMotion } from "motion/react";

// Trong component
const prefersReduced = useReducedMotion();
const motionProps = prefersReduced ? {} : MOTION_PROPS;

// Dùng
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

### Round 2 (sau review)
| Task | File(s) | Status |
|------|---------|--------|
| A.5.1 Password strength indicator | app/signup/page.tsx | ✅ done |
| C.4.1 Remember me — UI | app/signin/page.tsx | ✅ done |
| C.4.1 Remember me — cookie handler (browser) | lib/supabase/client.ts | ✅ done |
| C.4.1 Remember me — cookie handler (server) | proxy.ts | ✅ done |

---

## Checklist sau khi implement

- [ ] `signup/page.tsx`: password toggle hoạt động, router.replace, aria-live, reduced-motion
- [ ] `signin/page.tsx`: password toggle hoạt động, rate limit message, aria-live, reduced-motion
- [ ] `verify-email/page.tsx`: getSession timeout fallback, spam hint, aria-live, reduced-motion
- [ ] `forgot-password/page.tsx`: spam hint, aria-live, reduced-motion
- [ ] `reset-password/page.tsx`: 2 password toggles, timeout 2000ms, aria-live, reduced-motion
- [ ] TypeScript compile không lỗi (`tsc --noEmit`)
- [ ] Không có regression trên các page khác
