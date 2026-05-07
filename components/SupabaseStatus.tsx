"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase/client";

type Status = "connecting" | "connected" | "error";

const STATUS_CONFIG: Record<
  Status,
  { dot: string; glow: string; label: string; bg: string; border: string }
> = {
  connecting: {
    dot: "bg-amber-400",
    glow: "shadow-[0_0_8px_2px_rgba(251,191,36,0.4)]",
    label: "Đang kết nối...",
    bg: "bg-zinc-900/80",
    border: "border-zinc-700/60",
  },
  connected: {
    dot: "bg-emerald-400",
    glow: "shadow-[0_0_8px_2px_rgba(52,211,153,0.45)]",
    label: "Supabase",
    bg: "bg-zinc-900/80",
    border: "border-zinc-700/60",
  },
  error: {
    dot: "bg-red-500",
    glow: "shadow-[0_0_8px_2px_rgba(239,68,68,0.4)]",
    label: "Mất kết nối",
    bg: "bg-zinc-900/80",
    border: "border-red-500/30",
  },
};

export default function SupabaseStatus() {
  const [status, setStatus] = useState<Status>("connecting");
  const [latency, setLatency] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const pingStart = useRef(Date.now());

  useEffect(() => {
    pingStart.current = Date.now();

    const channel = supabase.channel("__status__").subscribe((s) => {
      if (s === "SUBSCRIBED") {
        setLatency(Date.now() - pingStart.current);
        setStatus("connected");
      } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
        setStatus("error");
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const cfg = STATUS_CONFIG[status];

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-50"
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 300, damping: 24 }}
    >
      <motion.button
        onClick={() => setExpanded((v) => !v)}
        layout
        className={`
          flex items-center gap-2 px-3 py-2 rounded-full
          backdrop-blur-md border cursor-pointer select-none
          transition-colors duration-300
          ${cfg.bg} ${cfg.border}
        `}
        whileTap={{ scale: 0.96 }}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* Status dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          {status === "connecting" && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-75`}
            />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${cfg.dot} ${status !== "connecting" ? cfg.glow : ""}`}
          />
        </span>

        {/* Label */}
        <span className="text-[11px] font-medium tracking-wide text-zinc-300 whitespace-nowrap">
          {cfg.label}
        </span>

        {/* Latency badge — only when connected & expanded */}
        <AnimatePresence>
          {expanded && status === "connected" && latency !== null && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <span
                className={`
                  text-[10px] font-mono px-1.5 py-0.5 rounded-full
                  ${
                    latency < 200
                      ? "bg-emerald-500/15 text-emerald-400"
                      : latency < 500
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-red-500/15 text-red-400"
                  }
                `}
              >
                {latency}ms
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
}
