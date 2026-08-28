import React from "react";
import { motion } from "framer-motion";
import { History as HistoryIcon, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

function HistoryPage(): React.JSX.Element {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center">
            <HistoryIcon size={20} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Research History</h1>
        </div>
        <p className="text-[var(--color-muted)] mb-8 ml-13">
          Your past research sessions and generated reports.
        </p>

        <Card className="border-dashed">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <Clock size={32} className="text-[var(--color-muted)] mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No history found</h3>
            <p className="text-sm text-[var(--color-muted)] max-w-sm">
              Data fetching is disabled in Milestone 3. Your past research sessions will appear here once connected to the database.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default HistoryPage;
