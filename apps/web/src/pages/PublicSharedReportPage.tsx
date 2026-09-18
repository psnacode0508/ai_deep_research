import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Brain, FileText, AlertCircle, Eye } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function PublicSharedReportPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/v1/share/${token}`);
        const json = await res.json();
        
        if (res.ok && json.success) {
          setReport(json.data);
        } else {
          setError(json.error?.message || 'Report not found or not public');
        }
      } catch (err: any) {
        setError('Failed to connect to the server');
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      fetchReport();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-4 text-[var(--color-muted)] font-mono text-sm animate-pulse">Loading shared report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <AlertCircle size={32} className="text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 text-center">Unavailable</h1>
        <p className="text-[var(--color-muted)] text-center max-w-md">
          {error || "This report is not available. The link may be invalid, expired, or sharing has been revoked by the owner."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Read-only Banner */}
      <div className="bg-[#0a0a0a] text-white border-b border-white/10 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-brand-400" />
          <span className="font-semibold tracking-tight">DeepResearch</span>
          <span className="text-xs text-[var(--color-muted)] bg-white/10 px-2 py-0.5 rounded-full ml-2">Shared Report</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-[var(--color-muted)]">
          <span className="flex items-center gap-1"><FileText size={14} /> Published {new Date(report.created_at).toLocaleDateString()}</span>
          <span className="flex items-center gap-1"><Eye size={14} /> {report.views} views</span>
        </div>
      </div>
      
      {/* Report Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <article className="prose prose-slate lg:prose-lg mx-auto prose-headings:font-semibold prose-a:text-brand-600 hover:prose-a:text-brand-500 prose-pre:bg-slate-50 prose-pre:text-slate-900 prose-pre:border prose-pre:border-slate-200">
          <ReactMarkdown>
            {report.markdown}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
