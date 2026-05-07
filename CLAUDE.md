# Project Memory — nextjs-supabase-auth-practice

## Auth Flow Decisions

### verify-email page — sessionStorage bị bỏ

**Ngày quyết định:** 2026-05-07

**Quyết định:** KHÔNG dùng `sessionStorage` để bảo vệ trang `/verify-email`.

**Lý do đã thử và từ chối:**
- Đã thêm `sessionStorage.setItem("pendingVerificationEmail", email)` sau signup thành công
- Đã check `sessionStorage.getItem(...)` trong verify-email page để block direct URL access
- **Bị từ chối vì:** sessionStorage bị giới hạn trong 1 tab, 1 thiết bị. User signup trên máy tính → mở link trên điện thoại để resend → bị lỗi "Email does not exist" ngay cả khi hợp lệ.

**Giải pháp hiện tại:**
- Chỉ validate format email (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Nếu format sai hoặc không có `?email=` param → hiện lỗi ngay khi load
- Nếu email format hợp lệ nhưng chưa đăng ký → Supabase tự không gửi email (bảo vệ ở server side)
- Không cần block ở client vì trang `/verify-email` không gây hại dù ai truy cập

**File liên quan:**
- `app/verify-email/page.tsx` — có `isCheckingSession`, `isValidEmail` states
- `app/signup/page.tsx` — KHÔNG set sessionStorage
- `app/verify-email/page.test.tsx` — KHÔNG mock sessionStorage
