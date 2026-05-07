"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const MOTION_PROPS = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
};

const BUTTON_WHILE_TAP = { scale: 0.95 };

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const motionProps = prefersReduced ? {} : MOTION_PROPS;

  async function handleSignIn(emailValue: string, passwordValue: string) {
    // Set Remember-me preference cookie BEFORE signIn so cookie handlers
    // (browser client + proxy) can decide whether to persist auth cookies.
    document.cookie = `remember-me=${rememberMe ? "true" : "false"}; path=/; max-age=31536000; samesite=lax`;

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: emailValue,
      password: passwordValue,
    });

    if (signInError) {
      const lowerMsg = signInError.message.toLowerCase();
      const message = signInError.message === "Invalid login credentials"
        ? "Invalid email or password."
        : lowerMsg.includes("rate") || lowerMsg.includes("too many") || lowerMsg.includes("limit")
        ? "Too many attempts. Please wait a moment before trying again."
        : signInError.message;
      throw new Error(message);
    }

    if (!data.user?.email_confirmed_at) {
      throw new Error("Please verify your email before signing in.");
    }

    router.push("/dashboard");
  }

  function validateForm() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email format.");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }

    return true;
  }

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1d1d1f] flex items-center justify-center p-6" style={{ fontFamily: '"SF Pro Text", system-ui, -apple-system, sans-serif' }}>
      <motion.div
        {...motionProps}
        className="w-full max-w-[440px]"
      >
        <div className="mb-[80px] text-center">
          <h1 className="text-[40px] leading-[1.1] font-semibold tracking-[-0.28px]" style={{ fontFamily: '"SF Pro Display", system-ui, -apple-system, sans-serif' }}>Sign in</h1>
          <p className="mt-3 text-[17px] leading-[1.47] tracking-[-0.374px]">Sign in to continue participating in the event.</p>
        </div>

        {error && <div role="alert" aria-live="assertive" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[15px]">{error}</div>}

        <form
          className="space-y-[24px]"
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            if (!validateForm()) return;
            setIsLoading(true);
            try {
              await handleSignIn(email, password);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Sign in failed.");
            } finally {
              setIsLoading(false);
            }
          }}
        >
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            className="h-[44px] w-full rounded-full border border-[#e0e0e0] px-5 text-[17px] leading-[1.47] tracking-[-0.374px] outline-none focus:ring-2 focus:ring-[#0071e3]"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              className="h-[44px] w-full rounded-full border border-[#e0e0e0] px-5 pr-12 text-[17px] leading-[1.47] tracking-[-0.374px] outline-none focus:ring-2 focus:ring-[#0071e3]"
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

          <label className="flex items-center gap-2 cursor-pointer select-none text-[15px] leading-[1.47] tracking-[-0.374px] text-[#1d1d1f]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-[18px] w-[18px] rounded border-[#d2d2d7] text-[#0066cc] focus:ring-2 focus:ring-[#0071e3] cursor-pointer"
            />
            Remember me
          </label>

          <motion.button
            type="submit"
            whileTap={BUTTON_WHILE_TAP}
            disabled={isLoading}
            className="h-[44px] w-full rounded-full bg-[#0066cc] text-white text-[17px] leading-[1.47] tracking-[-0.374px] focus:outline-none focus:ring-2 focus:ring-[#0071e3] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </motion.button>
        </form>

        <div className="mt-6 flex flex-col gap-4 text-[17px] leading-[1.47] tracking-[-0.374px]">
          <Link href="/forgot-password" className="text-[#0066cc]">Forgot password?</Link>
          <Link href="/signup" className="text-[#0066cc]">Sign up</Link>
        </div>
      </motion.div>
    </div>
  );
}
