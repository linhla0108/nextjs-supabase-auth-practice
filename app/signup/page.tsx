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

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSignUp(nameValue: string, emailValue: string, passwordValue: string) {
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: emailValue,
      password: passwordValue,
      options: {
        data: {
          full_name: nameValue,
        },
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });

    if (signUpError) {
      if (signUpError.message.includes("already been registered") ||
          signUpError.message.includes("already exists") ||
          signUpError.message.includes("User already")) {
        throw new Error("Email already registered.");
      }
      throw new Error(signUpError.message);
    }

    // Supabase returns success with empty identities for existing emails
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      setIsDuplicateEmail(true);
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(emailValue)}`);
  }

  function validateForm() {
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return false;
    }

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
      <motion.div {...MOTION_PROPS} className="w-full max-w-[440px]">
        <div className="mb-[80px] text-center">
          <h1 className="text-[40px] leading-[1.1] font-semibold tracking-[-0.28px]" style={{ fontFamily: '"SF Pro Display", system-ui, -apple-system, sans-serif' }}>Sign up</h1>
          <p className="mt-3 text-[17px] leading-[1.47] tracking-[-0.374px]">Create a new account to start participating in the event.</p>
        </div>

        {isDuplicateEmail && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[15px]">
            Email already registered. Please use a different email or{" "}
            <Link href="/signin" className="underline text-[#0066cc]">sign in</Link>.
          </div>
        )}
        {!isDuplicateEmail && error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[15px]">{error}</div>}

        <form
          className="space-y-[24px]"
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            if (!validateForm()) return;
            setIsLoading(true);
            try {
              await handleSignUp(name, email, password);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Sign up failed.");
            } finally {
              setIsLoading(false);
            }
          }}
        >
          <input type="text" required placeholder="Full name" value={name} onChange={(e) => { setName(e.target.value); setError(""); setIsDuplicateEmail(false); }} className="h-[44px] w-full rounded-full border border-[#e0e0e0] px-5 text-[17px] leading-[1.47] tracking-[-0.374px] outline-none focus:ring-2 focus:ring-[#0071e3]" />
          <input type="email" required placeholder="Email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); setIsDuplicateEmail(false); }} className="h-[44px] w-full rounded-full border border-[#e0e0e0] px-5 text-[17px] leading-[1.47] tracking-[-0.374px] outline-none focus:ring-2 focus:ring-[#0071e3]" />
          <input type="password" required placeholder="Password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); setIsDuplicateEmail(false); }} className="h-[44px] w-full rounded-full border border-[#e0e0e0] px-5 text-[17px] leading-[1.47] tracking-[-0.374px] outline-none focus:ring-2 focus:ring-[#0071e3]" />
          <motion.button type="submit" whileTap={BUTTON_WHILE_TAP} disabled={isLoading} className="h-[44px] w-full rounded-full bg-[#0066cc] text-white text-[17px] leading-[1.47] tracking-[-0.374px] focus:outline-none focus:ring-2 focus:ring-[#0071e3] disabled:opacity-50 disabled:cursor-not-allowed">{isLoading ? "Signing up..." : "Sign Up"}</motion.button>
        </form>

        <div className="mt-6 text-center text-[17px] leading-[1.47] tracking-[-0.374px]">
          <Link href="/signin" className="text-[#0066cc]">Already have an account? Sign in</Link>
        </div>
      </motion.div>
    </div>
  );
}
