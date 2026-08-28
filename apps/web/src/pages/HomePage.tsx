import React from "react";
import { motion } from "framer-motion";
import { Brain, Zap, Globe } from "lucide-react";

/**
 * HomePage — Milestone 0 placeholder.
 *
 * This is NOT the final landing page.
 * It exists solely to confirm the frontend is wired up correctly:
 *   • React renders
 *   • Tailwind classes apply
 *   • Framer Motion animates
 *   • Lucide icons load
 *
 * The real landing page will be built in a later milestone.
 */
function HomePage(): React.JSX.Element {
  return (
    <main className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        {/* Animated badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-xs font-medium rounded-full
                     border border-brand-500/30 bg-brand-500/10 text-brand-300"
        >
          <Zap size={12} className="text-brand-400" />
          Milestone 0 — Foundation
        </motion.div>

        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-6"
        >
          <div className="w-20 h-20 rounded-2xl bg-brand-500/15 border border-brand-500/25
                          flex items-center justify-center">
            <Brain size={40} className="text-brand-400" />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-4xl font-bold mb-4 text-white"
        >
          DeepResearch
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-[var(--color-muted)] mb-10 max-w-lg mx-auto"
        >
          Multi-Agent AI Research &amp; Web Intelligence Platform.
          <br />
          Project foundation is active. Full implementation coming in Milestone&nbsp;1+.
        </motion.p>

        {/* Status cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            { icon: Brain,  label: "Research Engine",  status: "Planned",  color: "text-yellow-400" },
            { icon: Globe,  label: "Web Search",        status: "Planned",  color: "text-yellow-400" },
            { icon: Zap,    label: "API Server",        status: "Running",  color: "text-green-400"  },
          ].map(({ icon: Icon, label, status, color }) => (
            <div
              key={label}
              className="p-4 rounded-xl border border-[var(--color-border)]
                         bg-[var(--color-surface-2)] text-left"
            >
              <Icon size={20} className={`mb-2 ${color}`} />
              <p className="text-sm font-medium text-white">{label}</p>
              <p className={`text-xs mt-1 ${color}`}>{status}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}

export default HomePage;
