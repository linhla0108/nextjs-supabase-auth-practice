"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

const MOTION_PROPS = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
};

const BUTTON_WHILE_TAP = { scale: 0.95 };

export default function VerifyEmailPage() {
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [email, setEmail] = useState("");
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Step 1: Check session first — if already verified, redirect immediately
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/dashboard");
        return;
      }
      setIsCheckingSession(false);
    });
  }, [router]);

  // Step 2: Validate email param only after confirming no active session
  useEffect(() => {
    if (isCheckingSession) return;

    const emailParam = searchParams.get("email");
    if (!emailParam || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailParam)) {
      setError("Email does not exist. Please sign up again.");
      return;
    }
    setEmail(emailParam);
    setIsValidEmail(true);
  }, [searchParams, isCheckingSession]);

  async function handleResendVerification() {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (resendError) throw new Error(resendError.message);

      setSuccessMessage("Verification email resent. Please check your inbox.");
      setIsSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend email.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#ffffff] text-[#1d1d1f] flex items-center justify-center p-6" style={{ fontFamily: '"SF Pro Text", system-ui, -apple-system, sans-serif' }}>
        <p className="text-[17px] leading-[1.47] tracking-[-0.374px] text-[#6e6e73]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1d1d1f] flex items-center justify-center p-6" style={{ fontFamily: '"SF Pro Text", system-ui, -apple-system, sans-serif' }}>
      <motion.div {...MOTION_PROPS} className="w-full max-w-[440px] text-center">
        {!isValidEmail ? (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[15px]">
                {error}
              </div>
            )}
            <motion.button
              onClick={() => router.push("/signin")}
              whileTap={BUTTON_WHILE_TAP}
              className="mt-6 h-[44px] px-8 rounded-full border border-[#e0e0e0] text-[17px] leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
            >
              Back to Sign in
            </motion.button>
          </>
        ) : (
          <>
            <h1 className="text-[40px] leading-[1.1] font-semibold tracking-[-0.28px]" style={{ fontFamily: '"SF Pro Display", system-ui, -apple-system, sans-serif' }}>
              Verify email
            </h1>
            <p className="mt-3 mb-[80px] text-[17px] leading-[1.47] tracking-[-0.374px]">
              We&apos;ve sent a verification link to your email. Please click the link to verify your account.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[15px]">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-[15px]">
                {successMessage}
              </div>
            )}

            <motion.button
              onClick={() => router.push("/signin")}
              whileTap={BUTTON_WHILE_TAP}
              className="mt-6 h-[44px] px-8 rounded-full border border-[#e0e0e0] text-[17px] leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
            >
              Back to Sign in
            </motion.button>

            {!isSent && (
              <motion.button
                onClick={handleResendVerification}
                disabled={isLoading}
                whileTap={BUTTON_WHILE_TAP}
                className="mt-4 block w-full text-[17px] leading-[1.47] tracking-[-0.374px] text-[#0066cc] focus:outline-none focus:ring-2 focus:ring-[#0071e3] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending..." : "Resend verification email"}
              </motion.button>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
