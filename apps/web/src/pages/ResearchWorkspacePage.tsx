import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Settings, Brain, Search, XCircle, Play, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { supabase } from "@/lib/supabase";
import { ResearchSession, ResearchStatus } from "@deepresearch/shared";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function ResearchWorkspacePage(): React.JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    } catch (err: any) {
      setError(err.message || "Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSession();
    }
  }, [id]);

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
      case ResearchStatus.AwaitingApproval:
        return <Badge variant="warning">Awaiting Approval</Badge>;
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
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 text-xs h-8">
            <Settings size={14} />
            Config
          </Button>
          {(session.status !== ResearchStatus.Complete && session.status !== ResearchStatus.Failed && session.status !== ResearchStatus.Cancelled) && (
            <Button variant="destructive" size="sm" className="h-8 text-xs">
              Cancel Engine
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
                    {session.tasks.map((task: any, i: number) => (
                      <div key={task.id} className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                        <div className="text-xs font-mono text-[var(--color-muted)] mb-1">Task {i+1}</div>
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
                  <span className="flex items-center gap-1.5"><Clock size={14}/> 00:00:00</span>
                  <span className="flex items-center gap-1.5"><Play size={14} className="text-brand-400"/> Iteration 0/{session.metadata.maxIterations}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-6 font-mono text-xs text-[var(--color-muted)]">
                {session.status === ResearchStatus.Pending ? (
                  <div className="text-center mt-10">
                    <p className="text-sm mb-2 text-white">Engine is ready to start.</p>
                    <p>In Milestone 4, engine execution is disabled.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Placeholder event stream */}
                    <div className="flex gap-4">
                      <span className="text-brand-400 shrink-0">10:00:01</span>
                      <span className="text-white">Session initialized.</span>
                    </div>
                  </div>
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
                  Sources & Evidence
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center opacity-50 text-center">
                 <Search size={24} className="mb-2" />
                 <p className="text-xs">No sources retrieved yet.</p>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ResearchWorkspacePage;
