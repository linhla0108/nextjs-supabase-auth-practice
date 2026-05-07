"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const MOTION_PROPS = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
};

const BUTTON_WHILE_TAP = { scale: 0.95 };

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsValidSession(true);
        setIsChecking(false);
      }
    });

    // Fallback: if no PASSWORD_RECOVERY fires within 500ms, link is invalid
    const timeout = setTimeout(() => {
      setIsChecking(false);
    }, 500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleResetPassword() {
    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#ffffff] text-[#1d1d1f] flex items-center justify-center p-6" style={{ fontFamily: '"SF Pro Text", system-ui, -apple-system, sans-serif' }}>
        <p className="text-[17px] leading-[1.47] tracking-[-0.374px]">Verifying reset link...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#ffffff] text-[#1d1d1f] flex items-center justify-center p-6" style={{ fontFamily: '"SF Pro Text", system-ui, -apple-system, sans-serif' }}>
        <motion.div {...MOTION_PROPS} className="w-full max-w-[440px]">
          <div className="mb-[80px] text-center">
            <h1 className="text-[40px] leading-[1.1] font-semibold tracking-[-0.28px]" style={{ fontFamily: '"SF Pro Display", system-ui, -apple-system, sans-serif' }}>
              Password Updated
            </h1>
            <p className="mt-3 text-[17px] leading-[1.47] tracking-[-0.374px]">
              Your password has been successfully reset.
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-[17px]">
              Password updated successfully!
            </div>
            <motion.button
              onClick={() => router.push("/signin")}
              whileTap={BUTTON_WHILE_TAP}
              className="h-[44px] w-full rounded-full bg-[#0066cc] text-white text-[17px] leading-[1.47] tracking-[-0.374px] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
            >
              Go to Sign In
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-[#ffffff] text-[#1d1d1f] flex items-center justify-center p-6" style={{ fontFamily: '"SF Pro Text", system-ui, -apple-system, sans-serif' }}>
        <motion.div {...MOTION_PROPS} className="w-full max-w-[440px] text-center space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-[15px]">
            Invalid or expired reset link. Please request a new one.
          </div>
          <motion.button
            onClick={() => router.push("/forgot-password")}
            whileTap={BUTTON_WHILE_TAP}
            className="h-[44px] w-full rounded-full bg-[#0066cc] text-white text-[17px] leading-[1.47] tracking-[-0.374px] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
          >
            Request New Reset Link
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1d1d1f] flex items-center justify-center p-6" style={{ fontFamily: '"SF Pro Text", system-ui, -apple-system, sans-serif' }}>
      <motion.div {...MOTION_PROPS} className="w-full max-w-[440px]">
        <div className="mb-[80px] text-center">
          <h1 className="text-[40px] leading-[1.1] font-semibold tracking-[-0.28px]" style={{ fontFamily: '"SF Pro Display", system-ui, -apple-system, sans-serif' }}>
            Reset Password
          </h1>
          <p className="mt-3 text-[17px] leading-[1.47] tracking-[-0.374px]">
            Enter your new password below.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[15px]">
            {error}
          </div>
        )}

        <form
          className="space-y-[24px]"
          onSubmit={async (e) => {
            e.preventDefault();
            await handleResetPassword();
          }}
        >
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            className="h-[44px] w-full rounded-full border border-[#e0e0e0] px-5 text-[17px] leading-[1.47] tracking-[-0.374px] outline-none focus:ring-2 focus:ring-[#0071e3]"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
            className="h-[44px] w-full rounded-full border border-[#e0e0e0] px-5 text-[17px] leading-[1.47] tracking-[-0.374px] outline-none focus:ring-2 focus:ring-[#0071e3]"
          />
          <motion.button
            type="submit"
            whileTap={BUTTON_WHILE_TAP}
            disabled={isLoading}
            className="h-[44px] w-full rounded-full bg-[#0066cc] text-white text-[17px] leading-[1.47] tracking-[-0.374px] focus:outline-none focus:ring-2 focus:ring-[#0071e3] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/forgot-password" className="text-[#0066cc] text-[17px]">
            Request a new reset link
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
