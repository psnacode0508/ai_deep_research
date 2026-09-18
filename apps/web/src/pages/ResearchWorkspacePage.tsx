import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Settings, Brain, Search, XCircle, Play, ListTodo, StopCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { supabase } from "@/lib/supabase";
import { ResearchSession, ResearchStatus, ResearchEvent } from "@deepresearch/shared";
import { EvaluationSummary } from "@/components/EvaluationSummary";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function ResearchWorkspacePage(): React.JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<ResearchEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "reconnecting" | "disconnected">("connecting");
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  const fetchSession = async () => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) throw new Error("Authentication required");

      const res = await fetch(`${API_URL}/api/v1/research/${id}`, {
        headers: {
          Authorization: `Bearer ${authSession.access_token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to load session");
      }

      setSession(data.data);
      return authSession.access_token;
    } catch (err: any) {
      setError(err.message || "Failed to load session");
      setLoading(false);
      return null;
    }
  };

  const connectSSE = (token: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    setConnectionStatus(prev => prev === "disconnected" ? "reconnecting" : "connecting");
    const es = new EventSource(`${API_URL}/api/v1/research/${id}/events?token=${token}`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnectionStatus("connected");
    };

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as ResearchEvent;
        setEvents(prev => {
          // Prevent duplicates if backend resends history
          if (prev.some(ev => ev.timestamp === data.timestamp && ev.type === data.type)) return prev;
          return [...prev, data];
        });
        
        // Auto-update session status if it's a status event
        if (data.type === "session.status_changed" || data.type === "session.completed" || data.type === "session.failed") {
          setSession(s => s ? { ...s, status: (data.payload as any)?.status || (data.type === "session.completed" ? ResearchStatus.Complete : ResearchStatus.Failed) } : s);
        }
      } catch (err) {
        console.error("Failed to parse SSE message", err);
      }
    };

    es.onerror = (err) => {
      console.error("SSE Error:", err);
      es.close();
      setConnectionStatus("disconnected");
      // Basic reconnect backoff
      reconnectTimeout.current = setTimeout(() => {
        if (session && session.status !== ResearchStatus.Complete && session.status !== ResearchStatus.Failed && session.status !== ResearchStatus.Cancelled) {
          connectSSE(token);
        }
      }, 5000);
    };
  };

  useEffect(() => {
    if (id) {
      fetchSession().then(token => {
        if (token) {
          setLoading(false);
          connectSSE(token);
        }
      });
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [id]);

  const handleCancel = async () => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) return;

      const res = await fetch(`${API_URL}/api/v1/research/${id}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authSession.access_token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSession(s => s ? { ...s, status: ResearchStatus.Cancelled } : s);
      }
    } catch (err) {
      console.error("Failed to cancel", err);
    }
  };

  const handleApproval = async (type: 'plan' | 'report', action: 'approve' | 'reject') => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) return;

      const res = await fetch(`${API_URL}/api/v1/research/${id}/${type}/${action}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authSession.access_token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Optimistically update status to show loading/progress
        setSession(s => {
          if (!s) return s;
          if (type === 'plan' && action === 'approve') return { ...s, status: ResearchStatus.Planning };
          if (type === 'plan' && action === 'reject') return { ...s, status: ResearchStatus.PlanRejected };
          if (type === 'report' && action === 'approve') return { ...s, status: ResearchStatus.Synthesising };
          if (type === 'report' && action === 'reject') return { ...s, status: ResearchStatus.FinalRejected };
          return s;
        });
      }
    } catch (err) {
      console.error(`Failed to ${action} ${type}`, err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <XCircle size={32} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Error loading research</h2>
        <p className="text-[var(--color-muted)] mb-6">{error || "Session not found"}</p>
        <Button onClick={() => navigate("/dashboard")} variant="outline">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: ResearchStatus) => {
    switch (status) {
      case ResearchStatus.Pending:
        return <Badge variant="secondary">Pending Engine Start</Badge>;
      case ResearchStatus.Planning:
      case ResearchStatus.Researching:
      case ResearchStatus.Evaluating:
      case ResearchStatus.Reflecting:
      case ResearchStatus.FollowingUp:
      case ResearchStatus.Synthesising:
        return <Badge variant="default" className="animate-pulse">Active: {status}</Badge>;
      case ResearchStatus.AwaitingPlanApproval:
        return <Badge variant="warning">Awaiting Plan Approval</Badge>;
      case ResearchStatus.AwaitingFinalApproval:
        return <Badge variant="warning">Awaiting Final Approval</Badge>;
      case ResearchStatus.PlanRejected:
        return <Badge variant="destructive">Plan Rejected</Badge>;
      case ResearchStatus.FinalRejected:
        return <Badge variant="destructive">Report Rejected</Badge>;
      case ResearchStatus.Complete:
        return <Badge variant="success">Completed</Badge>;
      case ResearchStatus.Failed:
        return <Badge variant="destructive">Failed</Badge>;
      case ResearchStatus.Cancelled:
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Calculate stats from events
  const iterationCount = new Set(events.filter(e => e.type === 'reflection.completed').map(e => e.timestamp)).size;
  const sourcesCount = events.filter(e => e.type === 'task.source_found').length;
  const evidenceCount = events.filter(e => e.type === 'task.evidence_extracted').length;
  const gapsCount = events.filter(e => e.type === 'reflection.gap_identified').reduce((sum, e) => sum + ((e.payload as any)?.queries?.length || 1), 0);
  const contradictionsCount = events.filter(e => e.type === 'evaluation.contradiction_detected').length;

  const handleExport = async (format: 'markdown' | 'pdf' | 'docx') => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) return;
      
      const res = await fetch(`${API_URL}/api/v1/research/${id}/export/${format}`, {
        headers: { Authorization: `Bearer ${authSession.access_token}` },
      });
      
      if (!res.ok) {
        throw new Error("Export failed");
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `research_report_${id}.${format === 'markdown' ? 'md' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error("Export error", err);
      alert("Failed to export report");
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="h-16 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface-1)] flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-4 truncate">
          <button onClick={() => navigate("/dashboard")} className="text-[var(--color-muted)] hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="h-4 w-px bg-[var(--color-border)]" />
          <div className="truncate max-w-md lg:max-w-xl">
            <h1 className="text-sm font-semibold text-white truncate" title={session.question}>
              {session.title || session.question}
            </h1>
          </div>
          {getStatusBadge(session.status)}
          
          <Badge variant="outline" className={`ml-2 ${connectionStatus === 'connected' ? 'text-green-400 border-green-500/20 bg-green-500/10' : 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10'}`}>
             {connectionStatus}
          </Badge>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 text-xs h-8">
            <Settings size={14} />
            Config
          </Button>
          
          {session.status === ResearchStatus.Complete && (
            <div className="flex gap-2 mr-2">
              <Button onClick={() => handleExport('markdown')} variant="outline" size="sm" className="h-8 text-xs gap-1">
                <Download size={14} /> MD
              </Button>
              <Button onClick={() => handleExport('pdf')} variant="outline" size="sm" className="h-8 text-xs gap-1">
                <Download size={14} /> PDF
              </Button>
              <Button onClick={() => handleExport('docx')} variant="outline" size="sm" className="h-8 text-xs gap-1">
                <Download size={14} /> DOCX
              </Button>
            </div>
          )}
          {(session.status !== ResearchStatus.Complete && session.status !== ResearchStatus.Failed && session.status !== ResearchStatus.Cancelled) && (
            <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={handleCancel}>
              <StopCircle size={14} className="mr-2"/> Cancel Engine
            </Button>
          )}
        </div>
      </header>

      {/* Workspace Grid */}
      <div className="flex-1 overflow-hidden p-4 md:p-6 bg-[#0a0a0a]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
          
          {/* Left Panel: Plan & Tasks */}
          <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden">
            <Card className="flex-1 flex flex-col bg-[#111] border-white/5 overflow-hidden">
              <CardHeader className="py-4 border-b border-white/5 shrink-0">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ListTodo size={16} className="text-[var(--color-muted)]" />
                  Research Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4">
                {session.tasks && session.tasks.length > 0 ? (
                  <div className="space-y-4">
                    {session.status === ResearchStatus.AwaitingPlanApproval && (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-4">
                        <h4 className="text-sm font-semibold text-yellow-400 mb-2">Review Research Plan</h4>
                        <p className="text-xs text-[var(--color-muted)] mb-4">Please review the subtasks below before the engine begins execution.</p>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApproval('plan', 'approve')} className="bg-yellow-500 hover:bg-yellow-600 text-black">Approve Plan</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleApproval('plan', 'reject')}>Reject</Button>
                        </div>
                      </div>
                    )}
                    {session.tasks.map((task: any) => (
                      <div key={task.id} className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                        <div className="text-xs font-mono text-[var(--color-muted)] mb-1">Task {task.task_index + 1} {task.is_followup && "(Follow-up)"}</div>
                        <div className="text-sm text-white font-medium mb-2">{task.query}</div>
                        <Badge variant={task.status === 'complete' ? 'success' : 'secondary'} className="text-[10px] px-1.5 py-0">
                          {task.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                    <ListTodo size={24} className="mb-2" />
                    <p className="text-xs">Waiting for planner...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Center Panel: Activity Feed */}
          <div className="lg:col-span-6 flex flex-col gap-4 overflow-hidden">
            <Card className="flex-1 flex flex-col bg-[#111] border-white/5 overflow-hidden relative shadow-2xl">
              <CardHeader className="py-4 border-b border-white/5 shrink-0 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2 text-brand-400">
                  <Brain size={16} />
                  Engine Activity
                </CardTitle>
                <div className="flex items-center gap-4 text-xs font-mono text-[var(--color-muted)]">
                  <span className="flex items-center gap-1.5"><Clock size={14}/> Live Feed</span>
                  <span className="flex items-center gap-1.5"><Play size={14} className="text-brand-400"/> Iteration {iterationCount}/{session.metadata.maxIterations}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-6 font-mono text-xs text-[var(--color-muted)] flex flex-col gap-3">
                {events.length === 0 ? (
                  <div className="text-center mt-10">
                    <p className="text-sm mb-2 text-white">Engine is ready to start.</p>
                    <p>Connecting to stream...</p>
                  </div>
                ) : (
                  events.map((ev, i) => (
                    <div key={i} className="flex gap-4 border-b border-white/5 pb-2">
                      <span className="text-brand-400 shrink-0">
                         {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                      <div className="flex-1">
                        <span className="text-white font-medium block mb-1">{ev.message}</span>
                        {!!ev.payload && (
                          <div className="text-[10px] opacity-70 bg-black/40 p-2 rounded">
                             {JSON.stringify(ev.payload)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Sources */}
          <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden">
            <Card className="flex-1 flex flex-col bg-[#111] border-white/5 overflow-hidden">
              <CardHeader className="py-4 border-b border-white/5 shrink-0">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Search size={16} className="text-[var(--color-muted)]" />
                  Live Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-4 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-[var(--color-surface-2)] p-4 rounded-lg border border-[var(--color-border)] text-center">
                        <div className="text-2xl font-bold text-brand-400">{sourcesCount}</div>
                        <div className="text-xs text-[var(--color-muted)]">Sources Found</div>
                     </div>
                     <div className="bg-[var(--color-surface-2)] p-4 rounded-lg border border-[var(--color-border)] text-center">
                        <div className="text-2xl font-bold text-brand-400">{evidenceCount}</div>
                        <div className="text-xs text-[var(--color-muted)]">Claims Extracted</div>
                     </div>
                     <div className="bg-[var(--color-surface-2)] p-4 rounded-lg border border-[var(--color-border)] text-center">
                        <div className="text-2xl font-bold text-yellow-400">{contradictionsCount}</div>
                        <div className="text-xs text-[var(--color-muted)]">Contradictions</div>
                     </div>
                     <div className="bg-[var(--color-surface-2)] p-4 rounded-lg border border-[var(--color-border)] text-center">
                        <div className="text-2xl font-bold text-orange-400">{gapsCount}</div>
                        <div className="text-xs text-[var(--color-muted)]">Gaps Identified</div>
                     </div>
                  </div>
                  
                  {session.status === ResearchStatus.AwaitingFinalApproval && session.report && (
                    <div className="mt-4 flex flex-col items-center justify-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                       <span className="text-yellow-400 font-medium text-sm mb-2">Final Report Ready for Review</span>
                       <div className="flex gap-2">
                         <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black" onClick={() => handleApproval('report', 'approve')}>Approve Report</Button>
                         <Button size="sm" variant="destructive" onClick={() => handleApproval('report', 'reject')}>Reject</Button>
                       </div>
                    </div>
                  )}
                  {session.status === ResearchStatus.Complete && session.report && (
                    <div className="mt-4 flex flex-col items-center justify-center p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                       <span className="text-green-400 font-medium text-sm mb-2">Report Ready</span>
                       <Button size="sm" onClick={() => alert("Preview report here (UI to be built)")}>
                          View Report
                       </Button>
                    </div>
                  )}

                  {(session.status === ResearchStatus.AwaitingFinalApproval || session.status === ResearchStatus.Complete) && (
                    <EvaluationSummary sessionId={session.id} />
                  )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ResearchWorkspacePage;
