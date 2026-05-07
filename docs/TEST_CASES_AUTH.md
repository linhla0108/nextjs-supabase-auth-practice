# Auth Flow Test Cases

## 1. Sign Up Flow

### Manual Test Cases

#### TC-1.1: Valid Sign Up

- **Steps:**
  1. Navigate to `/signup`
  2. Enter name: "John Doe"
  3. Enter email: "<john@example.com>"
  4. Enter password: "password123"
  5. Click "Sign Up"
- **Expected:**
  - Success message or redirect to `/verify-email?email=john@example.com`
  - Email sent with verification link
  - User created in Supabase auth

#### TC-1.2: Invalid Email Format

- **Steps:**
  1. Navigate to `/signup`
  2. Enter name: "John Doe"
  3. Enter email: "invalid-email"
  4. Enter password: "password123"
  5. Click "Sign Up"
- **Expected:** Error message "Invalid email format."

#### TC-1.3: Password Too Short

- **Steps:**
  1. Navigate to `/signup`
  2. Enter name: "John Doe"
  3. Enter email: "<john@example.com>"
  4. Enter password: "123"
  5. Click "Sign Up"
- **Expected:** Error message "Password must be at least 6 characters."

#### TC-1.4: Name Too Short

- **Steps:**
  1. Navigate to `/signup`
  2. Enter name: "J"
  3. Enter email: "<john@example.com>"
  4. Enter password: "password123"
  5. Click "Sign Up"
- **Expected:** Error message "Name must be at least 2 characters."

#### TC-1.5: Duplicate Email

- **Steps:**
  1. Sign up with email "john@example.com"
  2. Try to sign up again with same email
- **Expected:** Error message about email already registered

#### TC-1.6: Email Already Registered - Suggest Sign In

- **Steps:**
  1. Sign up with email "existing@example.com"
  2. Try to sign up again with same email
- **Expected:** 
  - Error message "Email already registered. Please use a different email or sign in."
  - User can click link to go to Sign In page

#### TC-1.7: Empty Fields

- **Steps:**
  1. Navigate to `/signup`
  2. Leave fields empty
  3. Click "Sign Up"
- **Expected:** Browser validation prevents submission

---

## 2. Verify Email Flow

### Manual Test Cases

#### TC-2.1: Verify Email Page Display

- **Steps:**
  1. Complete sign up with email "john@example.com"
  2. Redirected to `/verify-email?email=john@example.com`
- **Expected:**
  - Page displays heading "Verify email"
  - Message shows "We've sent a verification link to your email"
  - Button "Resend verification email" is visible
  - Button "Back to Sign in" is visible

#### TC-2.2: Click Verification Link in Email

- **Steps:**
  1. Sign up with email
  2. Check email inbox
  3. Click the verification link in email
- **Expected:**
  - User is automatically verified
  - Redirected to `/dashboard`
  - User session is established

#### TC-2.3: Resend Verification Email

- **Steps:**
  1. Navigate to `/verify-email?email=john@example.com`
  2. Click "Resend verification email"
- **Expected:**
  - Success message "Verification email resent."
  - New verification email sent
  - User receives email within 30 seconds

#### TC-2.4: Return to Sign In

- **Steps:**
  1. Navigate to `/verify-email?email=john@example.com`
  2. Click "Back to Sign in" button
- **Expected:**
  - Redirected to `/signin` page
  - Can sign in with email/password

#### TC-2.5: Expired Verification Link

- **Steps:**
  1. Sign up with email
  2. Wait 24+ hours
  3. Click verification link from email
- **Expected:** Error message about expired link, option to resend

#### TC-2.6: Invalid Email Parameter

- **Steps:**
  1. Navigate to `/verify-email?email=invalid`
- **Expected:** Error message "Email does not exist. Please sign up again."

## 3. Sign In Flow

### Manual Test Cases

#### TC-3.1: Valid Sign In

- **Steps:**
  1. Navigate to `/signin`
  2. Enter email: "<john@example.com>" (verified account)
  3. Enter password: "password123"
  4. Click "Sign In"
- **Expected:**
  - Redirected to `/dashboard`
  - User session established
  - Can access protected pages

#### TC-3.2: Wrong Password

- **Steps:**
  1. Navigate to `/signin`
  2. Enter email: "<john@example.com>"
  3. Enter password: "wrongpassword"
  4. Click "Sign In"
- **Expected:** Error message about invalid credentials

#### TC-3.3: Non-existent Email

- **Steps:**
  1. Navigate to `/signin`
  2. Enter email: "<nonexistent@example.com>"
  3. Enter password: "password123"
  4. Click "Sign In"
- **Expected:** Error message about invalid credentials

#### TC-3.4: Unverified Email Sign In

- **Steps:**
  1. Sign up but don't verify email
  2. Try to sign in with that email
- **Expected:** Error message "Please verify your email before signing in."

#### TC-3.5: Empty Fields

- **Steps:**
  1. Navigate to `/signin`
  2. Leave fields empty
  3. Click "Sign In"
- **Expected:** Browser validation prevents submission

---

## 4. Forgot Password Flow

### Manual Test Cases

#### TC-4.1: Valid Forgot Password Request

- **Steps:**
  1. Navigate to `/forgot-password`
  2. Enter email: "<john@example.com>"
  3. Click "Send Reset Link"
- **Expected:**
  - Success message "Password reset email sent!"
  - Email sent with reset link
  - Link contains token parameter

#### TC-4.2: Non-existent Email

- **Steps:**
  1. Navigate to `/forgot-password`
  2. Enter email: "<nonexistent@example.com>"
  3. Click "Send Reset Link"
- **Expected:**
  - Success message shown (for security, don't reveal if email exists)
  - No email sent

#### TC-4.3: Invalid Email Format

- **Steps:**
  1. Navigate to `/forgot-password`
  2. Enter email: "invalid-email"
  3. Click "Send Reset Link"
- **Expected:** Error message "Invalid email format."

#### TC-4.4: Empty Email

- **Steps:**
  1. Navigate to `/forgot-password`
  2. Leave email empty
  3. Click "Send Reset Link"
- **Expected:** Browser validation prevents submission

---

## 5. Reset Password Flow

### Manual Test Cases

#### TC-5.1: Valid Password Reset

- **Steps:**
  1. Request password reset for "<john@example.com>"
  2. Click reset link in email
  3. Enter new password: "newpassword123"
  4. Confirm password: "newpassword123"
  5. Click "Reset Password"
- **Expected:**
  - Success message "Password updated successfully!"
  - Redirected to Sign In page
  - Can sign in with new password

#### TC-5.2: Passwords Don't Match

- **Steps:**
  1. Click reset link from email
  2. Enter password: "newpassword123"
  3. Confirm password: "differentpassword"
  4. Click "Reset Password"
- **Expected:** Error message "Passwords do not match."

#### TC-5.3: Password Too Short

- **Steps:**
  1. Click reset link from email
  2. Enter password: "123"
  3. Confirm password: "123"
  4. Click "Reset Password"
- **Expected:** Error message "Password must be at least 6 characters."

#### TC-5.4: Expired Reset Link

- **Steps:**
  1. Request password reset
  2. Wait 24+ hours
  3. Click reset link from email
  4. Try to reset password
- **Expected:** Error message about expired link

#### TC-5.5: Invalid/Missing Token

- **Steps:**
  1. Navigate to `/reset-password` without token
  2. Try to submit form
- **Expected:** Error message "Invalid or expired reset link. Please request a new one."

#### TC-5.6: Empty Fields

- **Steps:**
  1. Click reset link from email
  2. Leave password fields empty
  3. Click "Reset Password"
- **Expected:** Error message "Please fill in all fields."

#### TC-5.7: Invalid Token (Expired or Tampered)

- **Steps:**
  1. Navigate to `/reset-password` with invalid/expired token (e.g., `?token=invalid-token-123`)
  2. Try to submit form
- **Expected:**
  - Error message "Invalid or expired reset link. Please request a new one."
  - Link to `/forgot-password` to request new reset link

---

## 6. Session Management

### Manual Test Cases

#### TC-6.1: Session Persistence

- **Steps:**
  1. Sign in successfully
  2. Refresh page
  3. Navigate to `/dashboard`
- **Expected:** Still logged in, session persists

#### TC-6.2: Sign Out

- **Steps:**
  1. Sign in successfully
  2. Click sign out button (if available)
- **Expected:**
  - Session cleared
  - Redirected to `/signin`
  - Cannot access protected pages

#### TC-6.3: Protected Route Access

- **Steps:**
  1. Without signing in, try to access `/dashboard`
- **Expected:** Redirected to `/signin`

---

## 7. Email Delivery

### Manual Test Cases

#### TC-7.1: Verification Email Received

- **Steps:**
  1. Sign up with real email
  2. Check inbox
- **Expected:**
  - Email received within 30 seconds
  - Contains verification link
  - Link format: `YOUR_URL/verify-email`

#### TC-7.2: Reset Password Email Received

- **Steps:**
  1. Request password reset with real email
  2. Check inbox
- **Expected:**
  - Email received within 30 seconds
  - Contains reset link
  - Link format: `YOUR_URL/reset-password?token=...`

#### TC-7.3: Resend Email

- **Steps:**
  1. Sign up
  2. Click "Resend verification email"
  3. Check inbox
- **Expected:**
  - New email received
  - Contains same or new verification link

---

## Test Data

### Valid Test Accounts

```
Email: leanhlinh.bm@gmail.com
Password: Sun1234

```

### Invalid Test Data

```
Invalid Emails:
- test@
- @example.com
- test.example.com
- test @example.com

Invalid Passwords:
- 12345 (too short)
- (empty)

Invalid Names:
- (empty)
- A (too short)
```

---

## Browser Compatibility

Test on:

- Chrome

---

## Performance Checks

- [ ] Sign up form loads in < 2s
- [ ] Verification email arrives in < 30s
- [ ] Password reset email arrives in < 30s
- [ ] Sign in completes in < 3s
- [ ] Page redirects happen smoothly
