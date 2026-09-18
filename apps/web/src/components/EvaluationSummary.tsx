import { useEffect, useState } from "react";
import { ResearchEvaluation } from "@deepresearch/shared";
import { supabase } from "@/lib/supabase";
import { Activity, AlertTriangle } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function EvaluationSummary({ sessionId }: { sessionId: string }) {
  const [evaluation, setEvaluation] = useState<ResearchEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchEval() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const res = await fetch(`${API_URL}/api/v1/research/${sessionId}/evaluation`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const data = await res.json();
        
        if (data.success) {
          setEvaluation(data.data);
        } else {
          setError(data.error?.message || "Failed to load evaluation");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEval();
  }, [sessionId]);

  if (loading) return <div className="p-4 flex justify-center"><Spinner size="sm" /></div>;
  if (error || !evaluation) return <div className="p-4 text-xs text-red-400">Failed to load evaluation metrics.</div>;

  const { qualityMetrics, performanceMetrics, usageMetrics } = evaluation;

  return (
    <div className="mt-4 bg-[var(--color-surface-2)] rounded-lg border border-[var(--color-border)] overflow-hidden">
      <div className="bg-brand-500/10 border-b border-brand-500/20 p-3 flex items-center gap-2 text-brand-400">
        <Activity size={16} />
        <h4 className="text-sm font-semibold">Evaluation Metrics</h4>
      </div>
      <div className="p-3 text-xs text-[var(--color-muted)] space-y-2">
        <div className="flex justify-between">
          <span>Evidence Coverage:</span>
          <span className="text-white">{(qualityMetrics.evidenceCoverage * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Citation Completeness:</span>
          <span className="text-white">{(qualityMetrics.citationCompleteness * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Sources Used:</span>
          <span className="text-white">{qualityMetrics.numberOfSources}</span>
        </div>
        <div className="flex justify-between">
          <span>Contradictions:</span>
          <span className={qualityMetrics.contradictionCount > 0 ? "text-yellow-400" : "text-white"}>
            {qualityMetrics.contradictionCount}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Research Gaps:</span>
          <span className="text-white">{qualityMetrics.identifiedResearchGaps}</span>
        </div>
        <div className="flex justify-between">
          <span>Iterations:</span>
          <span className="text-white">{qualityMetrics.followUpIterationCount + 1}</span>
        </div>
        <div className="flex justify-between">
          <span>Duration:</span>
          <span className="text-white">{(performanceMetrics.totalDurationMs / 1000).toFixed(1)}s</span>
        </div>
        {(usageMetrics.totalEstimatedCost !== null && usageMetrics.totalEstimatedCost > 0) && (
          <div className="flex justify-between">
            <span>Estimated Cost:</span>
            <span className="text-white">${usageMetrics.totalEstimatedCost.toFixed(4)}</span>
          </div>
        )}
      </div>
      <div className="bg-yellow-500/10 p-2 border-t border-[var(--color-border)] flex items-start gap-2 text-[10px] text-yellow-500/80">
        <AlertTriangle size={12} className="shrink-0 mt-0.5" />
        <p>These are measurable research metrics, not a guarantee that the report is factually correct.</p>
      </div>
    </div>
  );
}
