import React from "react";
import { motion } from "framer-motion";
import { FileText, Plus, ArrowRight, Zap, Shield, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";

function DashboardPage(): React.JSX.Element {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Placeholder for future milestone data
  const recentResearch = [];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Welcome back, {user?.email?.split("@")[0]}
          </h1>
          <p className="text-[var(--color-muted)]">
            Here's an overview of your recent research and activity.
          </p>
        </div>
        <Button onClick={() => navigate("/research/new")} className="gap-2 shrink-0">
          <Plus size={16} />
          New Research
        </Button>
      </motion.div>

      {/* Stats/Quick Links Row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
      >
        <Card className="bg-[var(--color-surface-2)] border-brand-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-brand-400 flex items-center gap-2 text-sm">
              <Zap size={16} />
              Active Milestone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">M3 — UI Shell</div>
            <p className="text-xs text-[var(--color-muted)]">Application structure is ready.</p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--color-surface-2)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[var(--color-muted)] flex items-center gap-2 text-sm">
              <Shield size={16} />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400 mb-1">Secured</div>
            <p className="text-xs text-[var(--color-muted)]">Session active via Supabase.</p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--color-surface-2)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[var(--color-muted)] flex items-center gap-2 text-sm">
              <Search size={16} />
              Engine Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400 mb-1">Offline</div>
            <p className="text-xs text-[var(--color-muted)]">Coming in a future milestone.</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Research Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Recent Research</h2>
          <Link to="/history" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {recentResearch.length === 0 ? (
          <div className="border border-dashed border-[var(--color-border)] rounded-xl p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center mb-4">
              <FileText size={24} className="text-[var(--color-muted)]" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No research yet</h3>
            <p className="text-sm text-[var(--color-muted)] max-w-sm mb-6">
              Start your first deep research session to see it appear here.
            </p>
            <Button onClick={() => navigate("/research/new")} variant="outline" className="gap-2">
              <Plus size={16} />
              Start Research
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* List items will go here */}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default DashboardPage;
