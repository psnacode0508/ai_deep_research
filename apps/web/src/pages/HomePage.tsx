import React from "react";
import { motion } from "framer-motion";
import { Brain, ArrowRight, Shield, Zap, Search, Globe, FileText, CheckCircle2, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

function HomePage(): React.JSX.Element {
  const { user } = useAuth();

  return (
    <div className="min-h-dvh bg-[#0a0a0a] flex flex-col font-sans selection:bg-brand-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
              <Brain size={18} className="text-brand-400" />
            </div>
            <span className="text-white font-semibold tracking-tight text-lg">DeepResearch</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Button asChild variant="outline" className="gap-2 border-white/10 hover:border-brand-500/30 hover:bg-brand-500/10 transition-all">
                <Link to="/dashboard">
                  Dashboard <ArrowRight size={16} />
                </Link>
              </Button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-[var(--color-muted)] hover:text-white transition-colors">
                  Sign in
                </Link>
                <Button asChild className="gap-2 bg-white text-black hover:bg-white/90">
                  <Link to="/signup">
                    Get started <ArrowRight size={16} />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-brand-600/20 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full border border-white/10 bg-white/5 backdrop-blur-md"
              >
                <span className="flex h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
                <span className="text-xs font-medium text-white/80">Milestone 3 Preview</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-6"
              >
                Research beyond search.
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg md:text-xl text-[var(--color-muted)] mb-10 max-w-2xl mx-auto font-light leading-relaxed"
              >
                An autonomous AI research engine that decomposes complex queries, explores the web, cross-checks evidence, and synthesizes comprehensive reports.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                {user ? (
                  <Button asChild size="lg" className="h-12 px-8 text-base bg-brand-600 hover:bg-brand-500 shadow-[0_0_40px_-10px_rgba(124,58,237,0.5)]">
                    <Link to="/dashboard">Go to Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg" className="h-12 px-8 text-base bg-white text-black hover:bg-white/90">
                      <Link to="/signup">Start researching</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base border-white/10 hover:bg-white/5">
                      <a href="#how-it-works">How it works</a>
                    </Button>
                  </>
                )}
              </motion.div>
            </div>

            {/* Workflow Visualization (CSS/SVG) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
              className="mt-24 relative max-w-5xl mx-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10" />
              <div className="rounded-xl border border-white/10 bg-[#111]/80 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden">
                {/* Node Network Visual */}
                <div className="flex items-center justify-between relative z-0 py-12 px-4 md:px-12">
                  <div className="absolute inset-x-12 top-1/2 h-0.5 -translate-y-1/2 bg-gradient-to-r from-brand-500/20 via-brand-500/60 to-blue-500/20" />
                  
                  {/* Node 1 */}
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                      <Search size={20} className="text-white/70" />
                    </div>
                    <span className="text-xs font-medium text-[var(--color-muted)]">Query</span>
                  </div>

                  {/* Node 2 */}
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-brand-900/50 border border-brand-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                      <Brain size={24} className="text-brand-400" />
                    </div>
                    <span className="text-xs font-medium text-brand-300">Plan</span>
                  </div>

                  {/* Node 3 */}
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/20 flex items-center justify-center">
                      <Globe size={20} className="text-blue-400" />
                    </div>
                    <span className="text-xs font-medium text-[var(--color-muted)]">Crawl</span>
                  </div>

                  {/* Node 4 */}
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/20 flex items-center justify-center">
                      <Shield size={20} className="text-green-400" />
                    </div>
                    <span className="text-xs font-medium text-[var(--color-muted)]">Verify</span>
                  </div>

                  {/* Node 5 */}
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                      <FileText size={24} className="text-white" />
                    </div>
                    <span className="text-xs font-medium text-white">Report</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="how-it-works" className="py-24 border-t border-white/5 relative bg-white/[0.02]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-16 md:text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Intelligence at scale</h2>
              <p className="text-[var(--color-muted)] max-w-2xl mx-auto text-lg">
                DeepResearch automates the cognitive labor of deep investigation. It doesn't just search; it reasons.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-8 rounded-2xl border border-white/5 bg-[#111] hover:bg-[#151515] transition-colors group">
                <div className="w-12 h-12 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap size={24} className="text-brand-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Multi-Agent Decomposition</h3>
                <p className="text-[var(--color-muted)] leading-relaxed">
                  Complex questions are broken down into parallel sub-tasks. Multiple agents explore different angles simultaneously for comprehensive coverage.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-2xl border border-white/5 bg-[#111] hover:bg-[#151515] transition-colors group">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <CheckCircle2 size={24} className="text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Evidence &amp; Citation</h3>
                <p className="text-[var(--color-muted)] leading-relaxed">
                  Every claim is backed by explicit citations. The engine extracts exact quotes and evaluates source credibility before including them in the final report.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-2xl border border-white/5 bg-[#111] hover:bg-[#151515] transition-colors group">
                <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield size={24} className="text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Contradiction Detection</h3>
                <p className="text-[var(--color-muted)] leading-relaxed">
                  The reflection phase actively looks for conflicting evidence across sources, resolving disputes or clearly presenting nuanced viewpoints.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Security / Auth Showcase */}
        <section className="py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-green-500/20 bg-green-500/10">
                  <Lock size={14} className="text-green-400" />
                  <span className="text-xs font-medium text-green-300">Enterprise Grade</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">Private by design.</h2>
                <p className="text-[var(--color-muted)] text-lg leading-relaxed">
                  Your research is secured by Supabase Row Level Security. Data is strictly isolated; you own your insights.
                </p>
                <ul className="space-y-3 pt-2">
                  {[
                    "Isolated tenant architecture",
                    "No training on your proprietary queries",
                    "Granular sharing controls for reports"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/80">
                      <CheckCircle2 size={16} className="text-brand-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full">
                <div className="rounded-xl border border-white/10 bg-[#111] p-6 shadow-2xl">
                   <pre className="text-xs font-mono text-white/60 overflow-x-auto">
                     <code className="language-sql">
{`-- Enforced at the database level
CREATE POLICY "sessions: select own"
  ON public.research_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "reports: update own"
  ON public.research_reports FOR UPDATE
  USING (auth.uid() = user_id);`}
                     </code>
                   </pre>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 opacity-50">
            <Brain size={16} className="text-white" />
            <span className="text-white text-sm font-semibold tracking-tight">DeepResearch</span>
          </div>
          <p className="text-xs text-[var(--color-muted)]">
            Milestone 3 — Premium UI Shell. Engine coming soon.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
