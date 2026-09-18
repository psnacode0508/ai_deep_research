import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { History as HistoryIcon, Clock, Search, Filter, Trash2, ArrowRight, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { supabase } from "@/lib/supabase";
import { ResearchStatus } from "@deepresearch/shared";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function HistoryPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortDir, setSortDir] = useState("desc");

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchHistory();
  }, [page, debouncedSearch, statusFilter, sortDir]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const query = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        sortDir
      });

      if (debouncedSearch) query.append("search", debouncedSearch);
      if (statusFilter) query.append("status", statusFilter);

      const res = await fetch(`${API_URL}/api/v1/research?${query.toString()}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSessions(json.data);
        setTotal(json.meta.total);
        setTotalPages(json.meta.totalPages);
      } else {
        throw new Error(json.error?.message || "Failed to load history");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this research session? This cannot be undone.")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API_URL}/api/v1/research/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (res.ok) {
        // Refresh the current page, or go back to page 1 if empty
        if (sessions.length === 1 && page > 1) {
          setPage(p => p - 1);
        } else {
          fetchHistory();
        }
      } else {
        alert("Failed to delete session");
      }
    } catch (err) {
      alert("Error deleting session");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case ResearchStatus.Pending:
        return <Badge variant="secondary">Pending Engine</Badge>;
      case ResearchStatus.Planning:
      case ResearchStatus.Researching:
      case ResearchStatus.Evaluating:
      case ResearchStatus.Reflecting:
      case ResearchStatus.FollowingUp:
      case ResearchStatus.Synthesising:
        return <Badge variant="default" className="animate-pulse">Active: {status}</Badge>;
      case ResearchStatus.AwaitingPlanApproval:
      case ResearchStatus.AwaitingFinalApproval:
        return <Badge variant="warning">Awaiting Approval</Badge>;
      case ResearchStatus.PlanRejected:
      case ResearchStatus.FinalRejected:
        return <Badge variant="destructive">Rejected</Badge>;
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
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full h-full flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col h-full"
      >
        <div className="flex items-center gap-3 mb-2 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center">
            <HistoryIcon size={20} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Research History</h1>
        </div>
        <p className="text-[var(--color-muted)] mb-8 ml-13 shrink-0">
          Your past research sessions and generated reports.
        </p>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6 shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
            <input 
              type="text" 
              placeholder="Search title or question..." 
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-md pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>
          
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] pointer-events-none" />
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="appearance-none bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-md pl-9 pr-8 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              <option value="">All Statuses</option>
              {Object.values(ResearchStatus).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <select
            value={sortDir}
            onChange={e => { setSortDir(e.target.value); setPage(1); }}
            className="bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-md px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 relative">
          {error ? (
            <Card className="border-dashed h-full flex items-center justify-center">
              <CardContent className="p-12 text-center flex flex-col items-center">
                <XCircle size={32} className="text-red-400 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Failed to load</h3>
                <p className="text-sm text-[var(--color-muted)] max-w-sm mb-4">{error}</p>
                <Button onClick={fetchHistory} variant="outline">Retry</Button>
              </CardContent>
            </Card>
          ) : loading && sessions.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : sessions.length === 0 ? (
            <Card className="border-dashed h-full flex items-center justify-center">
              <CardContent className="p-12 text-center flex flex-col items-center">
                <Clock size={32} className="text-[var(--color-muted)] mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No history found</h3>
                <p className="text-sm text-[var(--color-muted)] max-w-sm">
                  {debouncedSearch || statusFilter ? "No sessions match your filters." : "You haven't started any research yet."}
                </p>
                {(debouncedSearch || statusFilter) && (
                  <Button 
                    className="mt-4" 
                    variant="outline" 
                    onClick={() => { setSearch(""); setStatusFilter(""); setPage(1); }}
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 auto-rows-max pb-8">
              {sessions.map(session => (
                <Card 
                  key={session.id} 
                  className="hover:border-white/20 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/research/${session.id}`)}
                >
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {getStatusBadge(session.status)}
                        <Badge variant="outline">{session.depth}</Badge>
                      </div>
                      <h3 className="text-white font-medium truncate" title={session.title || session.question}>
                        {session.title || session.question}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-muted)]">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(session.created_at).toLocaleString()}
                        </span>
                        {session.research_reports?.[0]?.created_at && (
                          <span className="text-brand-400/80 hidden sm:inline">
                            Completed: {new Date(session.research_reports[0].created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
                        onClick={(e) => handleDelete(session.id, e)}
                      >
                        <Trash2 size={16} />
                      </Button>
                      <div className="w-8 h-8 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="shrink-0 pt-4 flex items-center justify-between border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-muted)]">
              Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1 text-sm text-[var(--color-muted)] px-2">
                Page {page} of {totalPages}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default HistoryPage;
