import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";

function ForgotPasswordPage(): React.JSX.Element {
  const { sendPasswordReset } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) { setFieldError("Email is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError("Enter a valid email address."); return; }
    setFieldError(undefined);

    setLoading(true);
    const { error: authError } = await sendPasswordReset(email);
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthLayout title="Check your inbox" subtitle={`We sent a password reset link to ${email}`}>
        <div className="flex flex-col items-center gap-5 py-4 text-center">
          <div className="w-16 h-16 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
            <Mail size={32} className="text-brand-400" />
          </div>
          <p className="text-sm text-[var(--color-muted)] max-w-xs">
            The link expires in 1 hour. If you don&apos;t see it, check your spam folder.
          </p>
          <button
            onClick={() => { setSent(false); setEmail(""); }}
            className="text-sm text-brand-400 hover:text-brand-300 transition-colors font-medium"
          >
            Resend email
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset link"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {error && (
          <div role="alert" className="px-3.5 py-3 rounded-lg bg-red-500/10 border border-red-500/25 text-sm text-red-400">
            {error}
          </div>
        )}

        <AuthInput
          label="Email"
          id="forgot-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFieldError(undefined); }}
          error={fieldError}
          disabled={loading}
        />

        <button
          id="forgot-submit-btn"
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
                     bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium
                     transition-colors duration-150 active:scale-[0.98]
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {loading ? <Spinner size="sm" /> : null}
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <Link
        to="/login"
        className="flex items-center justify-center gap-1.5 mt-6 text-sm text-[var(--color-muted)] hover:text-white transition-colors"
      >
        <ArrowLeft size={14} />
        Back to sign in
      </Link>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
