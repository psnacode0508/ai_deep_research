import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

function NewResearchPage(): React.JSX.Element {
  const navigate = useNavigate();

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
          Ask a complex question. The AI engine will decompose it, search the web, and synthesise a report.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Research Prompt</CardTitle>
            <CardDescription>
              Engine execution is disabled in Milestone 3. This is a UI placeholder.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="prompt" className="text-sm font-medium text-white">
                What would you like to research?
              </label>
              <textarea
                id="prompt"
                rows={4}
                disabled
                className="w-full rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] p-3 text-sm text-white placeholder:text-[var(--color-muted)] resize-none"
                placeholder="e.g., What are the long-term economic impacts of shifting to universal basic income in developing nations?"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white">Research Depth</label>
              <div className="grid grid-cols-3 gap-3">
                {['Quick', 'Standard', 'Deep'].map(depth => (
                  <div key={depth} className="border border-[var(--color-border)] bg-[var(--color-surface-2)] rounded-lg p-3 text-center opacity-50 cursor-not-allowed">
                    <span className="text-sm text-white">{depth}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button disabled className="gap-2">
                <Sparkles size={16} />
                Start Engine
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default NewResearchPage;
