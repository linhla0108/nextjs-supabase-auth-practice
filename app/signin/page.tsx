"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
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
  const router = useRouter();

  async function handleSignIn(emailValue: string, passwordValue: string) {
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: emailValue,
      password: passwordValue,
    });

    if (signInError) {
      const message = signInError.message === "Invalid login credentials" 
        ? "Invalid email or password."
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
        {...MOTION_PROPS}
        className="w-full max-w-[440px]"
      >
        <div className="mb-[80px] text-center">
          <h1 className="text-[40px] leading-[1.1] font-semibold tracking-[-0.28px]" style={{ fontFamily: '"SF Pro Display", system-ui, -apple-system, sans-serif' }}>Sign in</h1>
          <p className="mt-3 text-[17px] leading-[1.47] tracking-[-0.374px]">Sign in to continue participating in the event.</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[15px]">{error}</div>}

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
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            className="h-[44px] w-full rounded-full border border-[#e0e0e0] px-5 text-[17px] leading-[1.47] tracking-[-0.374px] outline-none focus:ring-2 focus:ring-[#0071e3]"
          />

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
