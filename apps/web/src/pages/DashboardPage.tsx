import React from "react";
import { motion } from "framer-motion";
import { Brain, LogOut, User, Zap, Globe, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

/**
 * DashboardPage — /dashboard (Milestone 1 placeholder)
 *
 * Protected page proving authentication works end-to-end.
 * Shows the authenticated user's info and a sign-out button.
 *
 * The real research dashboard will be built in a future milestone.
 */
function DashboardPage(): React.JSX.Element {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <main className="min-h-dvh bg-[var(--color-bg)] p-6">
      {/* Ambient glow */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-brand-600/8 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Top bar */}
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
              <Brain size={18} className="text-brand-400" />
            </div>
            <span className="text-white font-semibold">DeepResearch</span>
          </div>
          <button
            id="signout-btn"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                       text-[var(--color-muted)] hover:text-white hover:bg-[var(--color-surface-2)]
                       border border-transparent hover:border-[var(--color-border)]
                       transition-all duration-150"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </header>

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-medium rounded-full
                          border border-brand-500/30 bg-brand-500/10 text-brand-300">
            <Zap size={11} className="text-brand-400" />
            Milestone 1 — Authentication
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}!
          </h1>
          <p className="text-[var(--color-muted)]">
            Authentication is working. The research engine arrives in a future milestone.
          </p>
        </motion.div>

        {/* User info card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6 p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)]"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-brand-500/15 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
              <User size={20} className="text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white mb-0.5">Authenticated user</p>
              <p className="text-sm text-[var(--color-muted)] truncate">{user?.email}</p>
              <p className="text-xs text-[var(--color-muted)] mt-1 font-mono opacity-60">
                ID: {user?.id}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Status cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            { icon: Shield, label: "Authentication", status: "Active", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
            { icon: Brain,  label: "Research Engine", status: "Planned", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
            { icon: Globe,  label: "Web Search",      status: "Planned", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
          ].map(({ icon: Icon, label, status, color, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 + i * 0.05 }}
              className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]"
            >
              <div className={`w-8 h-8 rounded-lg border ${bg} flex items-center justify-center mb-3`}>
                <Icon size={16} className={color} />
              </div>
              <p className="text-sm font-medium text-white">{label}</p>
              <p className={`text-xs mt-0.5 ${color}`}>{status}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}

export default DashboardPage;
