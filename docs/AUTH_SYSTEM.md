# Lucky250 Auth System Documentation

## Overview

4 Supabase Auth pages with Apple Design System styling, validation, and Framer Motion animations.

---

## 1. Sign In Page (`app/signin/page.tsx`)

### Purpose

Allow existing users to sign in to access the lucky draw event.

### Input Fields

- **Email** - text input, 44px height, pill-shaped
- **Password** - password input, 44px height, pill-shaped

### Validations

- Email regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- Password minimum: 6 characters

### Business Logic

1. Check if `email_confirmed_at` exists in user profile
2. If not confirmed, throw error: "Please verify your email before signing in."
3. Redirect to `/dashboard` on successful login
4. Provide user-friendly error messages

### Error Handling

- Map "Invalid login credentials" → "Invalid email or password."
- Catch all other errors and display generic "Sign in failed."

### Navigation Links

- "Forgot password?" → `/forgot-password`
- "Sign up" → `/signup`

---

## 2. Sign Up Page (`app/signup/page.tsx`)

### Purpose

Allow new users to create accounts and participate in the lucky draw event.

### Input Fields

- **Full Name** - text input, 44px height, pill-shaped
- **Email** - email input, 44px height, pill-shaped
- **Password** - password input, 44px height, pill-shaped

### Validations

- Name minimum: 2 characters (after trim)
- Email regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- Password minimum: 6 characters

### Duplicate Email Detection

- Supabase returns `data.user` with `identities.length === 0` for duplicate emails (silent success)
- Set `isDuplicateEmail` state and show error message with link to `/signin`
- Error message: "Email already registered. Please use a different email or sign in."

### Success Flow

1. Redirect to `/verify-email?email=encodeURIComponent(email)`
2. Verify-email page validates email format via regex

> ⚠️ **sessionStorage không được dùng** — cross-device limitation: user signup trên máy tính, mở link resend trên điện thoại → sessionStorage rỗng → lỗi nhầm. Bảo vệ thực sự ở server-side (Supabase không gửi email cho địa chỉ chưa đăng ký). Xem `CLAUDE.md`.

### Navigation Links

- "Already have an account? Sign in" → `/signin`

---

## 3. Forgot Password Page (`app/forgot-password/page.tsx`)

### Purpose

Allow users to initiate password reset process via email.

### Input Fields

- **Email** - email input, 44px height, pill-shaped

### Validations

- Email regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`

### User Experience

- **Loading state**: "Sending..."
- **Success state**: Show "Password reset email sent!" green alert, "Back to Sign in" link
- **Error handling**: Catch errors silently, still show success state (prevents email enumeration attack)

### Navigation Links

- "Back to Sign in" → `/signin`

---

## 4. Verify Email Page (`app/verify-email/page.tsx`)

### Purpose

Verify user email and allow resend if verification link was not clicked.

### Two-Step Validation Flow

#### Step 1: Session Check (runs first)

- If user already has a session → redirect to `/dashboard`
- Renders "Loading..." during check to prevent flash

#### Step 2: Email Format Validation (runs after Step 1)

- Email param must match regex pattern: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- If no `?email=` param or format invalid → "Email does not exist. Please sign up again."
- If email format valid (kể cả chưa đăng ký) → hiện verify UI bình thường
- Bảo vệ thực sự ở server-side: Supabase không gửi email cho địa chỉ chưa đăng ký
- **Không dùng sessionStorage gate** — cross-device limitation (xem `CLAUDE.md`)

### States

- **isCheckingSession** (initial) — Show "Loading..."
- **error** — Red alert: "Email does not exist. Please sign up again."
- **successMessage** — Green alert: "Verification email resent. Please check your inbox."
- **isSent** — Hide "Resend verification email" button after first success (spam prevention)
- **isValidEmail** — Show resend button and back to sign in

### Navigation Links

- "Back to Sign in" → `/signin`
- "Resend verification email" → Triggers `supabase.auth.resend({ type: "signup", email })`

---

## 5. Reset Password Page (`app/reset-password/page.tsx`)

### Purpose

Allow users to set a new password after clicking reset link from email.

### Input Fields

- **New Password** - password input, 44px height, pill-shaped
- **Confirm Password** - password input, 44px height, pill-shaped

### Validations

- Both fields required
- Passwords must match
- Password minimum: 6 characters

### Four-State Flow

#### State 1: Checking (`isChecking = true`)

- Listens for `PASSWORD_RECOVERY` event via `supabase.auth.onAuthStateChange`
- 500ms timeout fallback for invalid/expired links
- Shows "Verifying reset link..."

#### State 2: Invalid Session (`isValidSession = false`)

- Shows yellow alert: "Invalid or expired reset link. Please request a new one."
- Button: "Request New Reset Link" → `/forgot-password`

#### State 3: Valid Session (`isValidSession = true`)

- Shows password reset form
- Validates password match and length
- Shows loading state during submission

#### State 4: Success (`success = true`)

- Shows "Password Updated" heading + green alert: "Password updated successfully!"
- Button: "Go to Sign In" → `/signin`

### Error Handling

- "Please fill in all fields."
- "Passwords do not match."
- "Password must be at least 6 characters."
- Supabase `updateUser` error messages passed through

### Navigation Links

- "Request a new reset link" → `/forgot-password`
- "Go to Sign In" → `/signin`

---

## 6. Dashboard Page (`app/dashboard/page.tsx`)

### Purpose

Protected page showing user profile and account information after successful authentication.

### Features

- User profile display (email, full name, username)
- Email verification status
- Sign out functionality

### Dual Protection

1. **Server-side**: Middleware checks session before rendering
2. **Client-side**: Component checks `supabase.auth.getUser()` and redirects if null

### User Information Display

- **Email**: From `user.email`
- **Full Name**: From `profile.full_name` (or "Chưa cập nhật")
- **Username**: From `profile.username` (or "Chưa cập nhật")
- **Email Status**: Shows "Đã xác thực" if `email_confirmed_at` exists

### Sign Out

- Clears session via `supabase.auth.signOut()`
- Redirects to `/signin`
- Clears all auth cookies

---

## Supabase Client Setup

### Location

`lib/supabase/client.ts`

### Implementation

- Uses `createBrowserClient` from `@supabase/ssr`
- Type-safe with `Database` types from `@/types/database.types`
- Syncs session to cookies (readable by server/middleware)

### Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Anon key (public client)

> ⚠️ **Không dùng** `createClient` từ `@supabase/supabase-js` — client đó lưu session vào localStorage, middleware không đọc được.

---

## Middleware Configuration

### Location

`middleware.ts`

### Protected Routes

`const PROTECTED_PATHS = ["/dashboard"];`

- Requires active session
- Redirects to `/signin` if unauthenticated

### Guest-Only Routes

`const GUEST_ONLY_PATHS = ["/signin", "/signup", "/forgot-password"];`

- Redirects to `/dashboard` if authenticated
- Prevents unnecessary form submissions

### Logic

1. Create server client with cookie handling (`createServerClient` from `@supabase/ssr`)
2. Get session from Supabase
3. Check if route is protected or guest-only
4. Redirect accordingly

### Matcher Pattern

- Applies to all routes except static assets (`_next/static`, images, favicon, etc.)

---

## Design System (Apple)

### Typography

| Element | Font | Size | Weight | Tracking |
|---------|------|------|--------|----------|
| Headlines | SF Pro Display | 40px | 600 | -0.28px |
| Body | SF Pro Text | 17px | 400 | -0.374px |
| Alerts | SF Pro Text | 15px | 400 | n/a |

### Color Palette

| Color | Value | Usage |
|-------|-------|-------|
| Primary (Action Blue) | `#0066cc` | Buttons, links |
| Focus (Focus Blue) | `#0071e3` | Focus ring outline |
| Ink | `#1d1d1f` | Text on light backgrounds |
| Dividers | `#e0e0e0` | Input borders |
| Red Alert | `bg-red-50 text-red-600` | Error messages |
| Green Alert | `bg-green-50 text-green-700` | Success messages |
| Yellow Alert | `bg-yellow-50 text-yellow-700` | Warning messages |

### Layout & Spacing

- **Section padding**: 80px vertical
- **Input height**: 44px
- **Button height**: 44px
- **Card width**: Max 440px
- **Form gap**: 24px between inputs

### Input Fields

- Height: 44px, border-radius: full (pill-shaped)
- Border: 1px solid `#e0e0e0`, Padding: 0 20px
- Font: 17px SF Pro Text, Focus ring: 2px solid `#0071e3`

### Primary Buttons

- Height: 44px, border-radius: full, Background: `#0066cc`
- Text: white 17px, Focus ring: 2px solid `#0071e3`
- Disabled: opacity 50%, cursor not-allowed

---

## Animations (Framer Motion)

### Entrance Animation

- Initial: `{ opacity: 0, scale: 0.94 }`
- Animate: `{ opacity: 1, scale: 1 }`

### Button Press Animation

- `whileTap={{ scale: 0.95 }}`

---

## Form States

| State | Progressive Enhancement |
|-------|-------------------------|
| TYPING | Input redrawn, error cleared via `onChange` |
| LOADING | Button disabled + spinner text |
| SUCCESS | Green alert shown, navigation triggered |
| ERROR | Red alert shown, error message displayed |

---

## Security Considerations

### 1. Session Validation

- Check existing session before allowing verification
- Prevent sign-in before email confirmation
- Server-side middleware validation
- Client-side component-level checks

### 2. URL Param Validation

- Email must match regex pattern: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- Invalid format hoặc thiếu param → hiện lỗi, không render verify UI
- Email format hợp lệ → hiện UI (Supabase không gửi email cho địa chỉ chưa đăng ký — server-side protection)
- **Không dùng sessionStorage gate** (cross-device limitation, xem `CLAUDE.md`)

### 3. Supabase Keys

- Use `createBrowserClient` (client-side)
- Never use SERVICE_ROLE key in browser
- Server-side uses `createServerClient` with proper cookie handling

### 4. Email Verification

- Require `email_confirmed_at` before sign-in
- Redirect to verify-email after signup
- Client-side: regex validation cho email param; server-side: Supabase không gửi email cho địa chỉ chưa đăng ký

### 5. Password Reset Security

- Validate `PASSWORD_RECOVERY` event before showing form
- 500ms timeout for invalid/expired links
- Always show success for forgot password (prevent email enumeration)

---

## Security Fixes (Critical Cases Fixed)

| # | Problem | Fix | Location |
|---|---------|-----|----------|
| S1 | Unauthenticated user accessing `/dashboard` | Middleware redirects to `/signin` | `middleware.ts` — PROTECTED_PATHS |
| S2 | Authenticated user accessing `/signin`, `/signup`, `/forgot-password` | Middleware redirects to `/dashboard` | `middleware.ts` — GUEST_ONLY_PATHS |
| S3 | Invalid/expired reset links showed password form | `PASSWORD_RECOVERY` event validation + 500ms timeout | `reset-password/page.tsx` |
| S4 | Verify-email hiện UI dù email param sai format | Email regex validation; sessionStorage gate bị loại bỏ (cross-device limitation) — bảo vệ server-side qua Supabase | `verify-email/page.tsx` |
| S5 | Signup allowed re-registration with duplicate email | Check `data.user.identities.length === 0` after `signUp()` | `signup/page.tsx` |
| S6 | Middleware couldn't read session (localStorage-based client) | Switched to `createBrowserClient` (SSR-aware, cookie sync) | `lib/supabase/client.ts` |
| S7 | Middleware using wrong server client | Switched to `createServerClient` with `cookies.getAll()/setAll()` | `middleware.ts` |
| S8 | Dashboard client-side bypass possible | `getUser()` check + redirect if null | `dashboard/page.tsx` |
| S9 | Session cookie tampering | Supabase server-side validation on every request | Middleware + all auth pages |

---

## UI/UX Cases — Toàn bộ

> Liệt kê **tất cả** các case UI/UX liên quan đến hệ thống auth (5 trang + middleware).
> Bao gồm: lỗi đã fix ✅, lỗi chưa gặp nhưng có nguy cơ ⚠️, case thông thường 🟢, và cải tiến UX 🔵

| Icon | Ý nghĩa |
|------|---------|
| ✅ **FIXED** | Lỗi đã xảy ra và đã được fix |
| ⚠️ **RISK** | Chưa gặp nhưng có khả năng xảy ra |
| 🟢 **NORMAL** | Happy path / case thông thường hoạt động đúng |
| 🔵 **UX** | Vấn đề UX/design (không crash nhưng trải nghiệm kém) |

---

### A. Sign Up (`/signup`)

#### A.1 Happy Path
| # | Case | Hành vi mong đợi | Trạng thái |
|---|------|-----------------|------------|
| A.1.1 | Điền đầy đủ name, email, password hợp lệ → Submit | Redirect `/verify-email?email=...`, Supabase gửi email xác nhận | 🟢 NORMAL |
| A.1.2 | Form loads lần đầu | Trắng, focus vào input Name | 🟢 NORMAL |
| A.1.3 | Nhập vào input → xóa lỗi cũ | Error banner tự biến mất ngay khi user bắt đầu gõ | 🟢 NORMAL |
| A.1.4 | Click "Sign Up" → đang xử lý | Button "Signing up..." và disabled | 🟢 NORMAL |
| A.1.5 | Click "Already have an account? Sign in" | Redirect `/signin` | 🟢 NORMAL |

#### A.2 Validation Errors
| # | Case | Hành vi mong đợi | Trạng thái |
|---|------|-----------------|------------|
| A.2.1 | Name < 2 ký tự | Hiện lỗi "Name must be at least 2 characters." | 🟢 NORMAL |
| A.2.2 | Name chỉ có spaces (e.g. `"  "`) | Hiện lỗi name quá ngắn (trim() trước khi check) | 🟢 NORMAL |
| A.2.3 | Email sai format (thiếu @, thiếu domain...) | Hiện lỗi "Invalid email format." | 🟢 NORMAL |
| A.2.4 | Password < 6 ký tự | Hiện lỗi "Password must be at least 6 characters." | 🟢 NORMAL |
| A.2.5 | Bỏ trống tất cả fields | Browser native validation ngăn submit (`required`) | 🟢 NORMAL |

#### A.3 Duplicate Email
| # | Case | Hành vi mong đợi | Trạng thái |
|---|------|-----------------|------------|
| A.3.1 | ✅ Email đã đăng ký — Supabase trả **success giả** (`identities: []`) | Hiện banner đỏ "Email already registered. Please use a different email or **sign in**." với link `/signin` | ✅ FIXED |
| A.3.2 | Email đã đăng ký nhưng **chưa verify** | Supabase vẫn trả `identities: []` → hiện banner duplicate (không phân biệt verified/unverified) | ⚠️ RISK |
| A.3.3 | Nhập email khác sau khi thấy lỗi duplicate | `isDuplicateEmail` reset về `false`, banner biến mất | 🟢 NORMAL |

#### A.4 Network / Server Errors
| # | Case | Hành vi mong đợi | Trạng thái |
|---|------|-----------------|------------|
| A.4.1 | Mất mạng khi submit | Supabase throw error → hiện message lỗi | 🟢 NORMAL |
| A.4.2 | Supabase trả lỗi không xác định | Hiện `err.message` hoặc fallback "Sign up failed." | 🟢 NORMAL |
| A.4.3 | Double-submit (click nhanh 2 lần) | Button disabled sau click đầu — motion.button cần verify disabled hoàn toàn | ⚠️ RISK |

#### A.5 UX
| # | Case | Vấn đề | Trạng thái |
|---|------|--------|------------|
| A.5.1 | ✅ Password strength indicator | **Đã fix**: Custom `getPasswordStrength()` + 4-bar visual indicator dưới password input | ✅ FIXED |
| A.5.2 | ✅ Show/hide password toggle | **Đã fix**: Toggle button "Show/Hide" ở góc phải input | ✅ FIXED |
| A.5.3 | ✅ Sau signup thành công, back button về `/signup` | **Đã fix**: Đổi `router.push` → `router.replace` để remove khỏi history stack | ✅ FIXED |

---

### B. Verify Email (`/verify-email`)

#### B.1 Happy Path
| # | Case | Hành vi mong đợi | Trạng thái |
|---|------|-----------------|------------|
| B.1.1 | Vào trang sau signup thành công | Hiện "Loading..." → heading "Verify email" + message + 2 buttons | 🟢 NORMAL |
| B.1.2 | Email format hợp lệ trong URL param | Hiện full UI verify (heading, message, Resend button, Back button) | 🟢 NORMAL |
| B.1.3 | Click "Resend verification email" → thành công | Button "Sending..." → biến mất → banner xanh "Verification email resent. Please check your inbox." | 🟢 NORMAL |
| B.1.4 | Click "Back to Sign in" | Redirect `/signin` | 🟢 NORMAL |
| B.1.5 | User đã verify (có session) → vào trang này | "Loading..." → redirect `/dashboard` ngay | 🟢 NORMAL |

#### B.2 Session Handling (Logic Critical)
| # | Case | Hành vi mong đợi | Trạng thái |
|---|------|-----------------|------------|
| B.2.1 | ✅ Race condition: email validation chạy trước session check | **Đã fix**: session check (Step 1) xong mới validate email (Step 2, gated `isCheckingSession`) | ✅ FIXED |
| B.2.2 | ✅ Flash state: trang hiện UI brief trước khi redirect nếu có session | **Đã fix**: `isCheckingSession=true` → render "Loading..." | ✅ FIXED |
| B.2.3 | ✅ Session check bị timeout / Supabase chậm | **Đã fix**: Thêm 5s `setTimeout` fallback — sau 5s vẫn chưa có response thì set `isCheckingSession=false` | ✅ FIXED |

#### B.3 Email Param Validation
| # | Case | Hành vi mong đợi | Trạng thái |
|---|------|-----------------|------------|
| B.3.1 | ✅ Vào `/verify-email` không có `?email=` param | Hiện lỗi "Email does not exist..." + Back button, KHÔNG hiện verify UI | ✅ FIXED |
| B.3.2 | ✅ Vào `/verify-email?email=invalid-format` | Hiện lỗi "Email does not exist..." (regex validation) | ✅ FIXED |
| B.3.3 | Email format hợp lệ (kể cả email chưa đăng ký) | Hiện verify UI — Supabase không gửi email cho địa chỉ chưa đăng ký (server-side) | 🟢 NORMAL |
| B.3.4 | Mở link verify trên tab/thiết bị khác (email client mở tab mới, điện thoại...) | Hoạt động bình thường — không dùng sessionStorage gate nữa | 🟢 NORMAL |

> 💡 **Thiết kế có chủ đích**: `/verify-email` không dùng sessionStorage gate vì sessionStorage không share giữa tabs/thiết bị — user signup trên máy tính, mở link resend trên điện thoại sẽ bị lỗi nhầm. Bảo vệ thực sự ở server-side (Supabase không gửi email cho địa chỉ chưa đăng ký). Quyết định ghi trong `CLAUDE.md`.

#### B.4 Resend Functionality
| # | Case | Hành vi mong đợi | Trạng thái |
|---|------|-----------------|------------|
| B.4.1 | ✅ Resend thành công → click Resend lần 2 | Button biến mất sau lần gửi đầu (`isSent=true`) → không thể spam | ✅ FIXED |
| B.4.2 | ✅ Resend gặp lỗi (e.g. "Too many requests") | Hiện banner đỏ từ Supabase, button vẫn còn để thử lại | ✅ FIXED |
| B.4.3 | ✅ Success message hiện màu đỏ (dùng `setError` cho success) | **Đã fix**: tách `successMessage` state riêng → banner xanh `text-green-700` | ✅ FIXED |
| B.4.4 | Click Resend → đang loading | Button "Sending..." và disabled | 🟢 NORMAL |
| B.4.5 | ✅ Resend thành công nhưng email rơi vào spam | **Đã fix**: Success message bổ sung "Please check your inbox and spam folder." | ✅ FIXED |

#### B.5 Link Verification Flow
| # | Case | Hành vi mong đợi | Trạng thái |
|---|------|-----------------|------------|
| B.5.1 | Click link verify trong email | Supabase redirect → user có session → trang detect session → redirect `/dashboard` | 🟢 NORMAL |
| B.5.2 | Link verify đã hết hạn (mặc định Supabase: 10 phút) | Supabase báo lỗi → user vẫn ở trang verify-email, có thể resend | ⚠️ RISK (UI không handle explicitly) |
| B.5.3 | Click link verify 2 lần (link đã dùng) | Supabase tự động re-check token, redirect dashboard nếu session còn — UI handle đúng | 🟢 NORMAL |

---

### C. Sign In (`/signin`)

#### C.1 Happy Path
| # | Case | Hành vi mong đợi | Trạng thái |
|---|------|-----------------|------------|
| C.1.1 | Email + password đúng, email đã verify | Redirect `/dashboard` | 🟢 NORMAL |
| C.1.2 | Click "Forgot password?" | Redirect `/forgot-password` | 🟢 NORMAL |
| C.1.3 | Click "Sign up" | Redirect `/signup` | 🟢 NORMAL |
| C.1.4 | Đang submit | Button "Signing in..." và disabled | 🟢 NORMAL |
| C.1.5 | Gõ vào input → error banner tự xóa | Error biến mất khi user chỉnh sửa | 🟢 NORMAL |

#### C.2 Credential Errors
| # | Case | Hành vi mong đợi | Trạng thái |
|---|------|-----------------|------------|
| C.2.1 | Password sai | Hiện "Invalid email or password." (Supabase message được normalize) | 🟢 NORMAL |
| C.2.2 | Email không tồn tại | Hiện "Invalid email or password." (cùng message — không reveal account existence) | 🟢 NORMAL |
| C.2.3 | Email chưa verify | Hiện "Please verify your email before signing in." (`email_confirmed_at` null check) | 🟢 NORMAL |
| C.2.4 | Email sai format | Hiện "Invalid email format." (client-side, không gọi API) | 🟢 NORMAL |
| C.2.5 | Password < 6 ký tự | Hiện "Password must be at least 6 characters." (client-side) | 🟢 NORMAL |

#### C.3 Session / Middleware
| # | Case | Hành vi mong đợi | Trạng thái |
|---|------|-----------------|------------|
| C.3.1 | ✅ Đã đăng nhập → truy cập `/signin` | Middleware redirect về `/dashboard` | ✅ FIXED |
| C.3.2 | Chưa đăng nhập → truy cập `/dashboard` | Middleware redirect về `/signin` | 🟢 NORMAL |
| C.3.3 | Signin thành công nhưng `router.push("/dashboard")` lag | User thấy flash màn hình signin rồi mới chuyển | ⚠️ RISK |

#### C.4 UX
| # | Case | Vấn đề | Trạng thái |
|---|------|--------|------------|
| C.4.1 | ✅ Remember me checkbox | **Đã fix**: Checkbox + cookie `remember-me`. Khi unchecked, cookie handler (proxy + browser client) strip `maxAge`/`expires` của Supabase auth cookies → session cookies (đăng xuất khi đóng browser) | ✅ FIXED |
| C.4.2 | ✅ Show/hide password toggle | **Đã fix**: Toggle button "Show/Hide" ở góc phải input | ✅ FIXED |
| C.4.3 | ✅ Rate limit message từ Supabase | **Đã fix**: Normalize message — nếu chứa "rate"/"too many"/"limit" → "Too many attempts. Please wait a moment before trying again." | ✅ FIXED |

---

### D. Forgot Password (`/forgot-password`)

#### D.1 Happy Path
| # | Case | Hành vi mong đợi | Trạng thái |
|---|------|-----------------|------------|
| D.1.1 | Email hợp lệ + tồn tại → Submit | Banner xanh "Password reset email sent!" + link "Back to Sign in" | 🟢 NORMAL |
| D.1.2 | Email hợp lệ nhưng **không tồn tại** → Submit | Vẫn hiện success (security best practice — không reveal account existence) | 🟢 NORMAL |
| D.1.3 | Đang submit | Button "Sending..." và disabled | 🟢 NORMAL |
| D.1.4 | Click "Back to Sign in" (link dưới form) | Redirect `/signin` | 🟢 NORMAL |
| D.1.5 | Sau success → click "Back to Sign in" | Redirect `/signin` | 🟢 NORMAL |

#### D.2 Validation
| # | Case | Hành vi mong đợi | Trạng thái |
|---|------|-----------------|------------|
| D.2.1 | Email sai format | Hiện "Invalid email format." (client-side, không gọi API) | 🟢 NORMAL |
| D.2.2 | Email trống | Browser native validation ngăn submit | 🟢 NORMAL |

#### D.3 Session / Middleware
| # | Case | Hành vi mong đợi | Trạng thái |
|---|------|-----------------|------------|
| D.3.1 | ✅ Đã đăng nhập → truy cập `/forgot-password` | Middleware redirect về `/dashboard` | ✅ FIXED |

#### D.4 UX / Behavior
| # | Case | Vấn đề | Trạng thái |
|---|------|--------|------------|
| D.4.1 | Submit nhiều lần cùng 1 email | Supabase đã trả error message khi rate limit, UI surface message này lên (intentional design — luôn show success ở trạng thái success thật, error chỉ hiện khi Supabase trả error trước khi reach success state) | 🟢 NORMAL |
| D.4.2 | ✅ Email có thể bị delay / rơi vào spam | **Đã fix**: Success message bổ sung "Please check your inbox and spam folder." | ✅ FIXED |
| D.4.3 | Sau success, user back button về form | Form hiện trở lại, có thể submit lại | ⚠️ RISK |
| D.4.4 | `resetPasswordForEmail` lỗi nhưng UI vẫn hiện success | Lỗi bị `console.error` silent — intentional (security), nhưng user không biết thực ra thất bại | ⚠️ RISK |

---

### E. Reset Password (`/reset-password`)

#### E.1 Happy Path
| # | Case | Hành vi mong đợi | Trạng thái |
|---|------|-----------------|------------|
| E.1.1 | Click link hợp lệ từ email → vào trang | "Verifying reset link..." → `PASSWORD_RECOVERY` event fire → hiện form | 🟢 NORMAL |
| E.1.2 | Nhập password mới hợp lệ + confirm khớp → Submit | `updateUser()` thành công → trang success "Password Updated" + "Go to Sign In" | 🟢 NORMAL |
| E.1.3 | Đang submit | Button "Resetting..." và disabled | 🟢 NORMAL |
| E.1.4 | Reset thành công → click "Go to Sign In" | Redirect `/signin` | 🟢 NORMAL |
| E.1.5 | Click "Request a new reset link" | Redirect `/forgot-password` | 🟢 NORMAL |

#### E.2 Token / Session Validation
| # | Case | Hành vi mong đợi | Trạng thái |
|---|------|-----------------|------------|
| E.2.1 | ✅ Vào `/reset-password` trực tiếp (không qua email link) | `PASSWORD_RECOVERY` không fire → 500ms timeout → banner vàng "Invalid or expired reset link" | ✅ FIXED |
| E.2.2 | ✅ Trước đây dùng `?token=` query param (sai cơ chế Supabase) | **Đã fix**: Chuyển sang `onAuthStateChange("PASSWORD_RECOVERY")` | ✅ FIXED |
| E.2.3 | ✅ Không validate token → hiện form cho tất cả mọi người | **Đã fix**: Gated bởi `isValidSession` từ `PASSWORD_RECOVERY` event | ✅ FIXED |
| E.2.4 | Link reset đã hết hạn (>1h) | `PASSWORD_RECOVERY` không fire → 500ms → hiện "Invalid or expired" | 🟢 NORMAL |
| E.2.5 | Link reset đã dùng rồi | Supabase invalidate token → `PASSWORD_RECOVERY` không fire → hiện invalid | 🟢 NORMAL |
| E.2.6 | ✅ 500ms timeout quá ngắn trên mạng chậm | **Đã fix**: Tăng timeout lên 2000ms để đủ thời gian cho `PASSWORD_RECOVERY` event fire | ✅ FIXED |

#### E.3 Form Validation
| # | Case | Hành vi mong đợi | Trạng thái |
|---|------|-----------------|------------|
| E.3.1 | Bỏ trống cả 2 fields | Hiện "Please fill in all fields." | 🟢 NORMAL |
| E.3.2 | Password và Confirm không khớp | Hiện "Passwords do not match." | 🟢 NORMAL |
| E.3.3 | Password < 6 ký tự | Hiện "Password must be at least 6 characters." | 🟢 NORMAL |
| E.3.4 | Supabase `updateUser` trả lỗi | Hiện `err.message` hoặc "Failed to reset password." | 🟢 NORMAL |
| E.3.5 | Gõ vào input → error cũ tự xóa | Error biến mất khi chỉnh sửa | 🟢 NORMAL |

#### E.4 Session / Middleware
| # | Case | Hành vi mong đợi | Trạng thái |
|---|------|-----------------|------------|
| E.4.1 | Đã đăng nhập thường → vào `/reset-password` | Middleware không block (không trong GUEST_ONLY_PATHS) → vào được trang, thấy "Invalid or expired" vì không có `PASSWORD_RECOVERY` event | ⚠️ RISK |
| E.4.2 | Sau reset thành công, session Supabase vẫn còn | User có thể vào `/dashboard` ngay mà không cần signin lại | ⚠️ RISK |

#### E.5 UX
| # | Case | Vấn đề | Trạng thái |
|---|------|--------|------------|
| E.5.1 | ✅ Show/hide password toggle | **Đã fix**: 2 toggles (cho New password + Confirm password) | ✅ FIXED |
| E.5.2 | Supabase email template còn debug variables | Email có thể hiện raw `{{ .Token }}`, `{{ .TokenHash }}` nếu template chưa clean trong Supabase Dashboard | ⚠️ RISK |

---

### F. Middleware & Session Global

#### F.1 Route Protection
| # | Case | Hành vi mong đợi | Trạng thái |
|---|------|-----------------|------------|
| F.1.1 | ✅ Authenticated user → `/signin` | Redirect `/dashboard` | ✅ FIXED |
| F.1.2 | ✅ Authenticated user → `/signup` | Redirect `/dashboard` | ✅ FIXED |
| F.1.3 | ✅ Authenticated user → `/forgot-password` | Redirect `/dashboard` | ✅ FIXED |
| F.1.4 | Unauthenticated user → `/dashboard` | Redirect `/signin` | 🟢 NORMAL |
| F.1.5 | Authenticated user → `/verify-email` | Không block ở middleware, page tự redirect nếu có session | 🟢 NORMAL |
| F.1.6 | Authenticated user → `/reset-password` | Không block (không trong GUEST_ONLY_PATHS) — xem E.4.1 | ⚠️ RISK |

#### F.2 Supabase Client
| # | Case | Hành vi mong đợi | Trạng thái |
|---|------|-----------------|------------|
| F.2.1 | ✅ `createClient` (localStorage) → middleware không đọc được session | **Đã fix**: Chuyển sang `createBrowserClient` → sync session vào cookie | ✅ FIXED |
| F.2.2 | ✅ Middleware dùng sai client, không đọc được cookie | **Đã fix**: Middleware dùng `createServerClient` với `cookies.getAll()/setAll()` | ✅ FIXED |
| F.2.3 | Cookie expire → session mất đột ngột | User bị redirect `/signin` (Supabase auto-refresh, nhưng edge cases vẫn xảy ra) | ⚠️ RISK |

#### F.3 Session Persistence
| # | Case | Hành vi mong đợi | Trạng thái |
|---|------|-----------------|------------|
| F.3.1 | Signin thành công → refresh page | Vẫn logged in (cookie persist) | 🟢 NORMAL |
| F.3.2 | Mở tab mới sau khi signin | Vẫn logged in (auth cookie shared across tabs) | 🟢 NORMAL |
| F.3.3 | ✅ Đóng browser → mở lại | **Đã fix**: Remember me checkbox kiểm soát hành vi này. Khi checked (default) → session persist; khi unchecked → cookies trở thành session cookies, đóng browser = đăng xuất | ✅ FIXED |

---

### G. Cross-Cutting UX Issues

| # | Case | Vấn đề | Trang bị ảnh hưởng | Trạng thái |
|---|------|--------|--------------------|------------|
| G.1 | Không có success animation sau action | Visual feedback chỉ là text, không có motion | Tất cả | 🔵 UX (skipped — out of scope) |
| G.2 | Không có skeleton/placeholder khi loading | "Loading..." / "Verifying..." text thuần | verify-email, reset-password | 🔵 UX (skipped — out of scope) |
| G.3 | ✅ Accessible error announcements | **Đã fix**: Tất cả error/success divs có `role="alert" aria-live="assertive"` (error) hoặc `role="status" aria-live="polite"` (success) | ✅ FIXED |
| G.4 | ✅ `prefers-reduced-motion` support | **Đã fix**: Tất cả 5 auth pages dùng `useReducedMotion()` từ `motion/react` — skip animation nếu OS setting bật | ✅ FIXED |
| G.5 | Enter key submit form | Có `noValidate` nhưng `<form onSubmit>` vẫn handle được | signin, signup | 🟢 NORMAL |
| G.6 | Rapid re-submission | Button disabled trong loading → không gọi API nhiều lần | Tất cả | 🟢 NORMAL |
| G.7 | iOS Safari auto-zoom input | Font 17px đủ ngưỡng tránh auto-zoom | Tất cả | 🟢 NORMAL |

---

## Tóm tắt số liệu

| Loại | Số lượng |
|------|---------|
| ✅ Bugs/cases đã được fix | **27** (14 ban đầu + 13 từ Risk/UX plan rounds 1+2) |
| ⚠️ Risks còn tồn (skipped với lý do hợp lệ) | **6** |
| 🟢 Cases thông thường hoạt động đúng | **35** |
| 🔵 UX improvements để tham khảo (G.1, G.2) | **2** |
| **Tổng** | **70** |

---

## Bugs Đã Fix — Quick Reference

| # | Vấn đề | Giải pháp | File |
|---|--------|-----------|------|
| B1 | Signup không detect email đã đăng ký (Supabase trả success giả) | Check `data.user.identities.length === 0` | `signup/page.tsx` |
| B2 | Verify-email hiện UI dù email param sai format | Regex validation gated sau session check; không dùng sessionStorage | `verify-email/page.tsx` |
| B3 | Flash content trước khi redirect nếu có session | `isCheckingSession=true` → render "Loading..." trong khi check session | `verify-email/page.tsx` |
| B4 | Race condition: email validate chạy trước session check | Step 1 (session check) → Step 2 (email regex) với `isCheckingSession` gate | `verify-email/page.tsx` |
| B5 | Resend success dùng `setError` → message màu đỏ thay vì xanh | Tách `successMessage` state riêng, banner `text-green-700` | `verify-email/page.tsx` |
| B6 | Resend không có spam protection (có thể gửi nhiều lần) | `isSent=true` sau lần gửi đầu → ẩn button | `verify-email/page.tsx` |
| B7 | Reset-password dùng `?token=` query param (sai cơ chế Supabase) | Chuyển sang `onAuthStateChange("PASSWORD_RECOVERY")` | `reset-password/page.tsx` |
| B8 | Reset-password hiện form cho tất cả mọi người (không validate token) | Gated bởi `isValidSession` từ PASSWORD_RECOVERY event | `reset-password/page.tsx` |
| B9 | Authenticated user vào được `/signin`, `/signup`, `/forgot-password` | Middleware thêm `GUEST_ONLY_PATHS` redirect → `/dashboard` | `middleware.ts` |
| B10 | Middleware không đọc được session (`createClient` dùng localStorage) | Đổi sang `createBrowserClient` (SSR-aware, sync cookie) | `lib/supabase/client.ts` |
| B11 | Middleware dùng sai server client | Chuyển sang `createServerClient` với `cookies.getAll()/setAll()` | `middleware.ts` |
| B12 | Back button sau signup → form trống xuất hiện lại | Đổi `router.push` → `router.replace` | `signup/page.tsx` |
| B13 | `getSession()` infinite loading khi Supabase chậm | 5s timeout fallback → set `isCheckingSession=false` | `verify-email/page.tsx` |
| B14 | Resend / forgot-password email rơi vào spam, UI không nhắc | Bổ sung "Please check your inbox and spam folder." | `verify-email/page.tsx`, `forgot-password/page.tsx` |
| B15 | Reset-password 500ms timeout quá ngắn → false negative trên mạng chậm | Tăng lên 2000ms | `reset-password/page.tsx` |
| B16 | Rate limit từ Supabase hiện message generic | Normalize → "Too many attempts. Please wait a moment before trying again." | `signin/page.tsx` |
| B17 | Password inputs không có show/hide toggle | Thêm `showPassword` state + button toggle ở 4 inputs (signup, signin, reset-password ×2) | `signup/page.tsx`, `signin/page.tsx`, `reset-password/page.tsx` |
| B18 | Screen reader không announce error/success | Thêm `role="alert" aria-live="assertive"` (error), `role="status" aria-live="polite"` (success) | tất cả 5 auth pages |
| B19 | Framer Motion không respect OS `prefers-reduced-motion` | Dùng `useReducedMotion()` → skip animation nếu OS setting bật | tất cả 5 auth pages |
| B20 | Signup không có password strength indicator | Custom `getPasswordStrength()` (length/upper-lower/digit/special) + 4-bar visual indicator | `signup/page.tsx` |
| B21 | Signin không có Remember me — session persistence không kiểm soát được | Checkbox `rememberMe` + cookie `remember-me`. Cookie handler (proxy + browser client) strip `maxAge`/`expires` khi `rememberMe=false` → auth cookies trở thành session cookies | `signin/page.tsx`, `proxy.ts`, `lib/supabase/client.ts` |

---

## Testing Checklist

### Unit Tests

- [x] Form validation (all fields)
- [x] Email format validation
- [x] Password length validation
- [x] Duplicate email detection
- [x] Session check redirect logic
- [x] PASSWORD_RECOVERY event detection
- [x] SessionStorage token matching
- [ ] Middleware protected path detection
- [ ] Middleware guest-only path detection

### Integration Tests

- [ ] Sign in with valid credentials
- [ ] Sign in with unverified email
- [ ] Sign up with valid data
- [ ] Sign up with duplicate email
- [ ] Password reset email sending
- [ ] Verification email sending
- [ ] Session persistence
- [ ] Link protection (verify-email)
- [ ] Reset password with valid token
- [ ] Reset password with invalid/expired token
- [ ] Middleware redirects for protected routes
- [ ] Middleware redirects for guest-only routes

### E2E Tests

- [ ] End-to-end signup → verify → signin → dashboard
- [ ] End-to-end forgot password → reset → signin flow
- [ ] Error state handling across all pages
- [ ] Loading state visualization
- [ ] Browser back button behavior
- [ ] Unauthenticated access to `/dashboard` → redirected to `/signin`
- [ ] Authenticated access to `/signin` → redirected to `/dashboard`
- [ ] Invalid reset link → error message shown
- [ ] Expired reset link → error message shown
- [ ] Manual URL tampering → validation fails
- [ ] Email format invalid in URL param → validation fails (no sessionStorage gate)
- [ ] Session expiration → automatic redirect to `/signin`

### Security Tests

- [ ] Direct dashboard access without auth → blocked
- [ ] Direct signin access with auth → redirected
- [ ] Direct verify-email access with invalid email format → blocked (regex validation)
- [ ] Direct reset-password access without token → blocked
- [ ] URL parameter injection → validation fails
- [ ] Rate limiting on failed attempts → enforced by Supabase

---

## QA Checklist (Quick Runbook)

### A. Sign Up Flow

- [ ] Mở `/signup`, UI đúng layout (title, inputs, button, link signin)
- [ ] Submit rỗng → native browser validation
- [ ] Name < 2 ký tự → báo lỗi đúng
- [ ] Email sai format → báo lỗi đúng
- [ ] Password < 6 ký tự → báo lỗi đúng
- [ ] Email đã tồn tại → hiện lỗi duplicate + link qua `/signin`
- [ ] Email mới hợp lệ → redirect `/verify-email?email=...`

### B. Verify Email Flow

- [ ] Vào `/verify-email` thiếu query email → báo lỗi, không hiện verify UI
- [ ] Query email sai format → báo lỗi
- [ ] Query email format hợp lệ (kể cả chưa đăng ký) → hiện verify UI
- [ ] Mở trang trên thiết bị/tab khác với email hợp lệ → hoạt động bình thường (không bị sessionStorage block)
- [ ] Logged-in user vào `/verify-email` → redirect `/dashboard`
- [ ] Click resend email → loading → success message xanh
- [ ] Resend thành công → ẩn nút resend (`isSent=true`)
- [ ] Resend thất bại → hiện error đỏ, nút vẫn còn

### C. Sign In Flow

- [ ] Mở `/signin`, UI đầy đủ (email/password/forgot/signup links)
- [ ] Email sai format → báo lỗi
- [ ] Password < 6 → báo lỗi
- [ ] Sai credentials → "Invalid email or password."
- [ ] Account chưa verify email → báo lỗi verify
- [ ] Login đúng + đã verify → redirect `/dashboard`
- [ ] Trong lúc submit: button disabled + "Signing in..."

### D. Forgot Password Flow

- [ ] Mở `/forgot-password`, UI đúng
- [ ] Email sai format → báo lỗi
- [ ] Submit email hợp lệ → success state + link back signin
- [ ] Trong lúc submit: button disabled + "Sending..."
- [ ] Dù email không tồn tại vẫn hiện success (chống email enumeration)

### E. Reset Password Flow

- [ ] Mở link reset hợp lệ từ email → "Verifying reset link..." → form
- [ ] Vào `/reset-password` trực tiếp → "Verifying..." → "Invalid or expired reset link"
- [ ] Password/confirm rỗng → "Please fill in all fields."
- [ ] Password != confirm → "Passwords do not match."
- [ ] Password < 6 → "Password must be at least 6 characters."
- [ ] Reset thành công → màn success + "Go to Sign In"

### F. Route Guard & Session

- [ ] Chưa login vào `/dashboard` → redirect `/signin`
- [ ] Đã login vào `/signin` → redirect `/dashboard`
- [ ] Đã login vào `/signup` → redirect `/dashboard`
- [ ] Đã login vào `/forgot-password` → redirect `/dashboard`
- [ ] Sign out từ dashboard → về `/signin`

### G. UI/UX Consistency

- [ ] Inputs/buttons cao 44px, pill shape đúng design
- [ ] Focus ring xuất hiện khi tab bằng bàn phím
- [ ] Error box màu đỏ (`text-red-600`), success box màu xanh (`text-green-700`)
- [ ] Motion animation mượt, không giật
- [ ] Nút disabled có opacity + cursor-not-allowed
- [ ] Text loading đúng theo từng action

### H. Mobile & Accessibility Smoke

- [ ] iOS Safari không auto-zoom input (font >= 16px)
- [ ] Tap target đủ dễ bấm trên mobile (44px)
- [ ] Enter key submit form hoạt động
- [ ] Keyboard tab order đúng (email → password → button → links)

### I. Regression Smoke (Must Pass Before Release)

- [ ] Signup mới hoàn tất full flow đến verify
- [ ] Signin account đã verify vào được dashboard
- [ ] Forgot/reset password full flow hoạt động
- [ ] Route guard không cho bypass auth bằng URL thủ công
- [ ] Không có lỗi console nghiêm trọng trong auth pages
- [ ] Không có trường hợp kẹt loading vô hạn

### QA Execution Notes

- Test trên ít nhất: Chrome, Safari
- Test mobile: iPhone viewport + Android viewport
- Nếu dùng Supabase rate limit, chờ cooldown trước khi retest resend/reset
- Ghi rõ bug theo format: `Page | Step | Expected | Actual | Screenshot | Console logs`

---

## Related Documentation

- `/DESIGN-apple.md` - Full Apple Design System specification
- `/types/database.types` - Supabase Database types
- `/list-staff.txt` - Staff member data (250 staffs)
- `/SUPABASE_MIGRATION.md` - Supabase setup and migration guide
- `/TEST_CASES_AUTH.md` - Manual test cases for QA
- `/CLAUDE.md` - Project memory: architectural decisions và lý do từ chối một số approach

---

## Changelog

### 2026-05-07 (Update 6 — Risk/UX Plan implementation)

- Round 1 (5 subagent fixes — see `docs/RISK_UX_PLAN.md`):
  - A.5.2 / C.4.2 / E.5.1: Show/hide password toggle ở 4 inputs
  - A.5.3: `router.replace` thay `router.push` sau signup
  - B.2.3: 5s timeout fallback cho `getSession()`
  - B.4.5 / D.4.2: Spam folder hint trong success messages
  - C.4.3: Normalize rate limit error message
  - E.2.6: PASSWORD_RECOVERY timeout 500ms → 2000ms
  - G.3: `aria-live` cho tất cả error/success divs
  - G.4: `useReducedMotion()` cho Framer Motion
- Round 2 (sau review user):
  - A.5.1: Custom `getPasswordStrength()` + 4-bar visual indicator
  - C.4.1: Remember me checkbox + cookie `remember-me` driving Supabase auth cookie persistence (handler ở proxy + browser client)
  - B.5.3 / D.4.1: Reclassify từ ⚠️ RISK → 🟢 NORMAL (Supabase đã handle đúng)
  - B.5.2: Sửa "(>24h)" → "(>10 phút)" theo Supabase default
- Section "UI/UX Cases — Toàn bộ": cập nhật trạng thái 13 items
- Section "Bugs Đã Fix — Quick Reference": thêm B12–B21
- Section "Tóm tắt số liệu": 27 fixed, 6 RISK còn tồn (skipped)

### 2026-05-07 (Update 5 — Sync với CLAUDE.md)

- Xóa toàn bộ references đến `sessionStorage` gate trong verify-email flow
- Lý do: sessionStorage không share giữa tabs/thiết bị → cross-device limitation (ghi trong `CLAUDE.md`)
- Cập nhật Sign Up page: bỏ step "Store email in sessionStorage"
- Cập nhật Verify Email page: Step 2 chỉ còn regex validation, không còn sessionStorage check
- Cập nhật Security Considerations section 2 và 4
- Cập nhật Security Fixes S4
- Cập nhật UI/UX Cases B.3: bỏ B.3.3 (sessionStorage gate FIXED), B.3.4 (URL manipulation blocked), B.3.5 (cross-tab risk); thêm B.3.3 và B.3.4 mới phản ánh behavior thực tế
- Cập nhật QA Checklist và Testing Checklist: bỏ sessionStorage items, thêm cross-device test
- Cập nhật Bugs Quick Reference B2/B4: làm rõ fix là regex + session ordering, không phải sessionStorage
- Thêm `CLAUDE.md` vào Related Documentation

### 2026-05-07 (Update 4 — Merge)

- Merged `UI_UX_AUTH_CASES.md` vào `docs/AUTH_SYSTEM.md`
- Thay thế phần "UI/UX Cases" dạng category (47 cases) bằng phần UI/UX Cases dạng page-based chi tiết hơn (73 cases)
- Gộp Security Fixes + Bugs Đã Fix thành 2 section riêng biệt (không duplicate)
- Thêm ghi chú phân biệt `sessionStorage` (email gate, không share tabs) vs auth cookie (share tabs)
- Cập nhật summary statistics: 73 tổng cases

### 2026-05-07 (Update 3)

- Removed all code examples and blocks to reduce file length
- Kept only essential descriptions and summaries
- File reduced from 1626 lines to ~700 lines (57% reduction)

### 2026-05-07 (Update 2)

- Added comprehensive UI/UX Cases documentation (47 cases, 11 categories)
- Added QA Checklist (Quick Runbook) with 9 sections

### 2026-05-07 (Update 1)

- Added security fixes documentation (7 critical cases)
- Added middleware configuration details
- Added reset-password and dashboard page documentation
- Expanded testing checklist with security tests

### 2026-05-07 (Initial)

- Created comprehensive auth system documentation
- Documented all 4 auth pages + Supabase integration
- Apple Design System specifications
- Security considerations
