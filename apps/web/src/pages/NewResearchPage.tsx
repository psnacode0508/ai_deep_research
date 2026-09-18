import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ResearchDepth, CreateResearchRequest } from "@deepresearch/shared";
import { supabase } from "@/lib/supabase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function NewResearchPage(): React.JSX.Element {
  const navigate = useNavigate();
  
  const [question, setQuestion] = useState("");
  const [depth, setDepth] = useState<ResearchDepth>(ResearchDepth.Standard);
  const [preferredSourceTypes, setPreferredSourceTypes] = useState<string>("");
  const [prioritizeDomains, setPrioritizeDomains] = useState<string>("");
  const [excludeDomains, setExcludeDomains] = useState<string>("");
  const [maxIterations, setMaxIterations] = useState<number>(3);
  const [requirePlanApproval, setRequirePlanApproval] = useState(false);
  const [requireFinalApproval, setRequireFinalApproval] = useState(false);
  
  // External Sources
  const [externalUrls, setExternalUrls] = useState<string>("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      setError("Please enter a research question.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication required");

      const payload: CreateResearchRequest = {
        question: question.trim(),
        depth,
        metadata: {
          preferredSourceTypes: preferredSourceTypes.split(",").map(s => s.trim()).filter(Boolean),
          prioritizeDomains: prioritizeDomains.split(",").map(s => s.trim()).filter(Boolean),
          excludeDomains: excludeDomains.split(",").map(s => s.trim()).filter(Boolean),
          maxIterations,
          requirePlanApproval,
          requireFinalApproval,
        }
      };

      const res = await fetch(`${API_URL}/api/v1/research`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to create research session");
      }

      const sessionId = data.data.id;

      // Upload external sources if any
      const urls = externalUrls.split(",").map(u => u.trim()).filter(Boolean);
      for (const url of urls) {
        await fetch(`${API_URL}/api/v1/research/${sessionId}/sources`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ url }),
        });
      }

      if (rawText.trim()) {
        await fetch(`${API_URL}/api/v1/research/${sessionId}/sources`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ text: rawText.trim() }),
        });
      }

      if (pdfFile) {
        const formData = new FormData();
        formData.append("file", pdfFile);
        await fetch(`${API_URL}/api/v1/research/${sessionId}/sources`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        });
      }

      navigate(`/research/${sessionId}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto w-full">
      <Button variant="ghost" className="mb-6 gap-2 -ml-4" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        Back
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
            <Sparkles size={20} className="text-brand-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">New Research</h1>
        </div>
        <p className="text-[var(--color-muted)] mb-8 ml-13">
          Configure and launch a new deep research session.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-200 leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Core Objective</CardTitle>
              <CardDescription>
                What should the AI engine investigate?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="question" className="text-sm font-medium text-white">
                  Research Question <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="question"
                  rows={4}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] p-3 text-sm text-white placeholder:text-[var(--color-muted)] resize-none focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="e.g., What are the long-term economic impacts of shifting to universal basic income in developing nations?"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white">Research Depth</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { val: ResearchDepth.Quick, label: 'Quick Scan', desc: 'Fewer tasks, surface level' },
                    { val: ResearchDepth.Standard, label: 'Standard', desc: 'Balanced depth (recommended)' },
                    { val: ResearchDepth.Deep, label: 'Deep Dive', desc: 'Exhaustive with multiple reflections' }
                  ].map(({ val, label, desc }) => (
                    <div 
                      key={val} 
                      onClick={() => !isSubmitting && setDepth(val as ResearchDepth)}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        depth === val 
                          ? 'border-brand-500 bg-brand-500/10' 
                          : 'border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-border-hover)]'
                      } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="text-sm font-medium text-white mb-1">{label}</div>
                      <div className="text-xs text-[var(--color-muted)]">{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Advanced Configuration</CardTitle>
              <CardDescription>
                Tune the engine's behavior and sources. (Optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="prioritizeDomains" className="text-sm font-medium text-white">
                    Prioritize Domains
                  </label>
                  <input
                    id="prioritizeDomains"
                    type="text"
                    value={prioritizeDomains}
                    onChange={(e) => setPrioritizeDomains(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="e.g. nature.com, reuters.com (comma separated)"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label htmlFor="excludeDomains" className="text-sm font-medium text-white">
                    Exclude Domains
                  </label>
                  <input
                    id="excludeDomains"
                    type="text"
                    value={excludeDomains}
                    onChange={(e) => setExcludeDomains(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="e.g. reddit.com, twitter.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="preferredSourceTypes" className="text-sm font-medium text-white">
                    Preferred Source Types
                  </label>
                  <input
                    id="preferredSourceTypes"
                    type="text"
                    value={preferredSourceTypes}
                    onChange={(e) => setPreferredSourceTypes(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="e.g. academic, news, government"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="maxIterations" className="text-sm font-medium text-white">
                    Max Reflections/Iterations
                  </label>
                  <input
                    id="maxIterations"
                    type="number"
                    min="1"
                    max="10"
                    value={maxIterations}
                    onChange={(e) => setMaxIterations(parseInt(e.target.value))}
                    disabled={isSubmitting}
                    className="w-full rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--color-border)] flex flex-col gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={requirePlanApproval}
                    onChange={(e) => setRequirePlanApproval(e.target.checked)}
                    disabled={isSubmitting}
                    className="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-surface-2)] text-brand-500 focus:ring-brand-500/50"
                  />
                  <div>
                    <div className="text-sm font-medium text-white">Require Plan Approval</div>
                    <div className="text-xs text-[var(--color-muted)]">Pause the engine after initial planning to allow manual review and editing of sub-tasks. Highly recommended for complex queries.</div>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={requireFinalApproval}
                    onChange={(e) => setRequireFinalApproval(e.target.checked)}
                    disabled={isSubmitting}
                    className="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-surface-2)] text-brand-500 focus:ring-brand-500/50"
                  />
                  <div>
                    <div className="text-sm font-medium text-white">Require Final Approval</div>
                    <div className="text-xs text-[var(--color-muted)]">Pause before generating the final report. Allows you to review extracted evidence and evaluation metrics first.</div>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>External Sources (Optional)</CardTitle>
              <CardDescription>
                Provide your own sources to be analyzed alongside automated research.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="externalUrls" className="text-sm font-medium text-white">
                  Specific URLs
                </label>
                <input
                  id="externalUrls"
                  type="text"
                  value={externalUrls}
                  onChange={(e) => setExternalUrls(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="e.g. https://example.com/report, https://example.org/study (comma separated)"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white">
                  Upload PDF Document
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  disabled={isSubmitting}
                  className="w-full text-sm text-[var(--color-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-500/10 file:text-brand-400 hover:file:bg-brand-500/20"
                />
                {pdfFile && (
                  <div className="text-xs text-brand-400 mt-1">
                    Attached: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="rawText" className="text-sm font-medium text-white">
                  Raw Text / Context
                </label>
                <textarea
                  id="rawText"
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] p-3 text-sm text-white placeholder:text-[var(--color-muted)] resize-none focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Paste any raw text, notes, or internal context you want the engine to consider."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2 pb-10">
            <Button type="submit" disabled={isSubmitting} className="gap-2 px-8">
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Start Engine
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default NewResearchPage;
