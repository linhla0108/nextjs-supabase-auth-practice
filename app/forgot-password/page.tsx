"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { supabase } from "@/lib/supabase/client";

const MOTION_PROPS = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
};

const BUTTON_WHILE_TAP = { scale: 0.95 };

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const prefersReduced = useReducedMotion();
  const motionProps = prefersReduced ? {} : MOTION_PROPS;

  async function handleForgotPassword(emailValue: string) {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      emailValue,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      },
    );

    if (resetError) {
      console.error("Password reset error:", resetError);
    }
  }

  function validateForm() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email format.");
      return false;
    }

    return true;
  }

  return (
    <div
      className="min-h-screen bg-[#ffffff] text-[#1d1d1f] flex items-center justify-center p-6"
      style={{
        fontFamily: '"SF Pro Text", system-ui, -apple-system, sans-serif',
      }}
    >
      <motion.div {...motionProps} className="w-full max-w-[440px]">
        <div className="mb-[80px] text-center">
          <h1
            className="text-[40px] leading-[1.1] font-semibold tracking-[-0.28px]"
            style={{
              fontFamily:
                '"SF Pro Display", system-ui, -apple-system, sans-serif',
            }}
          >
            Forgot password
          </h1>
          <p className="mt-3 text-[17px] leading-[1.47] tracking-[-0.374px]">
            Enter your email to receive a password reset link.
          </p>
        </div>

        {isSuccess ? (
          <div className="text-center space-y-4">
            <div role="status" aria-live="polite" className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-[17px]">
              Password reset email sent! Please check your inbox and spam folder.
            </div>
            <Link href="/signin" className="text-[#0066cc] text-[17px]">
              Back to Sign in
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div role="alert" aria-live="assertive" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[15px]">
                {error}
              </div>
            )}

            <form
              className="space-y-[24px]"
              noValidate
              onSubmit={async (e) => {
                e.preventDefault();
                if (!validateForm()) return;
                setIsLoading(true);
                try {
                  await handleForgotPassword(email);
                  setIsSuccess(true);
                } catch {
                  setIsSuccess(true);
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="h-[44px] w-full rounded-full border border-[#e0e0e0] px-5 text-[17px] leading-[1.47] tracking-[-0.374px] outline-none focus:ring-2 focus:ring-[#0071e3]"
              />
              <motion.button
                type="submit"
                whileTap={BUTTON_WHILE_TAP}
                disabled={isLoading}
                className="h-[44px] w-full rounded-full bg-[#0066cc] text-white text-[17px] leading-[1.47] tracking-[-0.374px] focus:outline-none focus:ring-2 focus:ring-[#0071e3] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </motion.button>
            </form>
            <div className="mt-6 text-center text-[17px] leading-[1.47] tracking-[-0.374px]">
              <Link href="/signin" className="text-[#0066cc]">
                Back to Sign in
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
