import React from "react";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

/**
 * AuthLayout — centered card shell shared by all auth pages.
 * Uses the existing design system tokens (surface, brand, muted).
 */
function AuthLayout({ children, title, subtitle }: AuthLayoutProps): React.JSX.Element {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-[var(--color-bg)]">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-600/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center
                            group-hover:bg-brand-500/25 transition-colors duration-200">
              <Brain size={20} className="text-brand-400" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">DeepResearch</span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-8 shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold text-white mb-1.5">{title}</h1>
            {subtitle && (
              <p className="text-sm text-[var(--color-muted)]">{subtitle}</p>
            )}
          </div>

          {children}
        </div>
      </motion.div>
    </div>
  );
}

export default AuthLayout;
