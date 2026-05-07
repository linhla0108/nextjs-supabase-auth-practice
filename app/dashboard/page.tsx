"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

const MOTION_PROPS = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
};

const BUTTON_WHILE_TAP = { scale: 0.95 };

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push("/signin");
        return;
      }

      setUser(currentUser);
      setIsLoading(false);
    }

    loadUser();
  }, [router]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <p className="text-[17px]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1d1d1f] p-6" style={{ fontFamily: '"SF Pro Text", system-ui, -apple-system, sans-serif' }}>
      <motion.div
        {...MOTION_PROPS}
        className="max-w-[800px] mx-auto"
      >
        <div className="mb-[80px]">
          <h1 className="text-[40px] leading-[1.1] font-semibold tracking-[-0.28px]" style={{ fontFamily: '"SF Pro Display", system-ui, -apple-system, sans-serif' }}>Dashboard</h1>
          <p className="mt-3 text-[17px] leading-[1.47] tracking-[-0.374px]">Welcome to the Next.js + Supabase auth practice app.</p>
        </div>

        <div className="space-y-6">
          <div className="p-6 border border-[#e0e0e0] rounded-2xl">
            <h2 className="text-[24px] font-semibold mb-4">Account Information</h2>
            <div className="space-y-3 text-[17px]">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Email status:</strong> {user?.email_confirmed_at ? "Verified" : "Not verified"}</p>
            </div>
          </div>

          <motion.button
            onClick={handleSignOut}
            whileTap={BUTTON_WHILE_TAP}
            className="h-[44px] px-8 rounded-full bg-[#0066cc] text-white text-[17px] leading-[1.47] tracking-[-0.374px] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
          >
            Sign Out
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
