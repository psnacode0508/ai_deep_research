import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";

/**
 * ResetPasswordPage — /reset-password
 *
 * Supabase redirects here after the user clicks the password-reset link.
 * The URL contains the session tokens in the hash fragment, which the
 * Supabase client picks up automatically via detectSessionInUrl.
 *
 * We simply present the new-password form and call updatePassword().
 */
function ResetPasswordPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});

  function validate(): boolean {
    const errors: typeof fieldErrors = {};
    if (!password) errors.password = "Password is required.";
    else if (password.length < 8) errors.password = "Password must be at least 8 characters.";
    if (!confirm) errors.confirm = "Please confirm your password.";
    else if (confirm !== password) errors.confirm = "Passwords do not match.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    const { error: authError } = await updatePassword(password);
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate("/dashboard"), 2500);
  }

  if (success) {
    return (
      <AuthLayout title="Password updated!" subtitle="You'll be redirected to your dashboard shortly.">
        <div className="flex flex-col items-center gap-5 py-4 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <p className="text-sm text-[var(--color-muted)]">Redirecting to dashboard…</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong password for your account">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {error && (
          <div role="alert" className="px-3.5 py-3 rounded-lg bg-red-500/10 border border-red-500/25 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* New password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reset-password" className="text-sm font-medium text-[var(--color-text)]">
            New password
          </label>
          <div className="relative">
            <input
              id="reset-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors(f => ({ ...f, password: undefined })); }}
              disabled={loading}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "reset-password-error" : undefined}
              className={`w-full px-3.5 py-2.5 pr-10 rounded-lg text-sm text-white bg-[var(--color-surface-2)] border
                placeholder:text-[var(--color-muted)] transition-colors duration-150 outline-none
                ${fieldErrors.password
                  ? "border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
                  : "border-[var(--color-border)] focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/20"
                }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-white transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {fieldErrors.password && (
            <p id="reset-password-error" className="text-xs text-red-400 mt-0.5" role="alert">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reset-confirm" className="text-sm font-medium text-[var(--color-text)]">
            Confirm password
          </label>
          <input
            id="reset-confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repeat your new password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setFieldErrors(f => ({ ...f, confirm: undefined })); }}
            disabled={loading}
            aria-invalid={!!fieldErrors.confirm}
            aria-describedby={fieldErrors.confirm ? "reset-confirm-error" : undefined}
            className={`w-full px-3.5 py-2.5 rounded-lg text-sm text-white bg-[var(--color-surface-2)] border
              placeholder:text-[var(--color-muted)] transition-colors duration-150 outline-none
              ${fieldErrors.confirm
                ? "border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
                : "border-[var(--color-border)] focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/20"
              }`}
          />
          {fieldErrors.confirm && (
            <p id="reset-confirm-error" className="text-xs text-red-400 mt-0.5" role="alert">
              {fieldErrors.confirm}
            </p>
          )}
        </div>

        <button
          id="reset-submit-btn"
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 mt-1 py-2.5 px-4 rounded-lg
                     bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium
                     transition-colors duration-150 active:scale-[0.98]
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {loading ? <Spinner size="sm" /> : null}
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default ResetPasswordPage;
