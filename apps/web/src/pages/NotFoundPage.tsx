import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Home, AlertTriangle } from "lucide-react";

/**
 * 404 Not Found page.
 */
function NotFoundPage(): React.JSX.Element {
  return (
    <main className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center mb-6"
        >
          <div className="w-16 h-16 rounded-xl bg-red-500/10 border border-red-500/20
                          flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-6xl font-bold text-white mb-2"
        >
          404
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="text-[var(--color-muted)] mb-8"
        >
          This page does not exist.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                       bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium
                       transition-colors duration-200"
          >
            <Home size={16} />
            Back to Home
          </Link>
        </motion.div>
      </div>
    </main>
  );
}

export default NotFoundPage;
