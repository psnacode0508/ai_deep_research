import { useState, useEffect } from 'react';
import { X, Copy, Link as LinkIcon, Check } from 'lucide-react';
import { Button } from './Button';
import Spinner from './Spinner';
import { supabase } from '../../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ShareModalProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ sessionId, isOpen, onClose }: ShareModalProps) {
  const [loading, setLoading] = useState(true);
  const [share, setShare] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchShareStatus();
    }
  }, [isOpen]);

  const fetchShareStatus = async () => {
    try {
      setLoading(true);
      setError('');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No auth session");

      const res = await fetch(`${API_URL}/api/v1/research/${sessionId}/share`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setShare(json.data);
      } else {
        if (res.status !== 404) {
          setError(json.error?.message || "Failed to load share status");
        }
        setShare(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const enableShare = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No auth session");

      const res = await fetch(`${API_URL}/api/v1/research/${sessionId}/share`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // Add optional expires_at here later
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setShare(json.data);
      } else {
        throw new Error(json.error?.message || "Failed to enable sharing");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const revokeShare = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No auth session");

      const res = await fetch(`${API_URL}/api/v1/research/${sessionId}/share`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setShare(json.data); // Should have is_public: false
      } else {
        throw new Error(json.error?.message || "Failed to revoke sharing");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!share?.share_token) return;
    const url = `${window.location.origin}/share/${share.share_token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <LinkIcon size={18} /> Share Report
          </h2>
          <button onClick={onClose} className="text-[var(--color-muted)] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-6">
              {share?.is_public ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-muted)]">Public Link</label>
                    <div className="flex gap-2">
                      <input 
                        readOnly 
                        value={`${window.location.origin}/share/${share.share_token}`}
                        className="flex-1 bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white font-mono focus:outline-none"
                      />
                      <Button onClick={copyToClipboard} variant="outline" className="px-3">
                        {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                      </Button>
                    </div>
                    <p className="text-xs text-[var(--color-muted)]">
                      Anyone with this link can view the read-only report.
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-white/5 flex justify-end">
                    <Button variant="destructive" onClick={revokeShare}>
                      Revoke Link
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                    <LinkIcon size={24} className="text-brand-400" />
                  </div>
                  <h3 className="text-white font-medium">Publish to the web</h3>
                  <p className="text-sm text-[var(--color-muted)] pb-4">
                    Create a public read-only link to share your finalized research report.
                  </p>
                  <Button onClick={enableShare} className="w-full">
                    Create Public Link
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
