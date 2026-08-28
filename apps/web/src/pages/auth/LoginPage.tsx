import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import SocialButton from "@/components/auth/SocialButton";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";

function LoginPage(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithGoogle } = useAuth();

  const from = (location.state as { from?: Location })?.from?.pathname ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const errors: typeof fieldErrors = {};
    if (!email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Password is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    const { error: authError } = await signIn(email, password);
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    navigate(from, { replace: true });
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    const { error: authError } = await signInWithGoogle();
    // On success, Supabase redirects to /auth/callback — page unmounts
    if (authError) {
      setError(authError.message);
      setGoogleLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your DeepResearch account">
      {/* Google OAuth */}
      <SocialButton onClick={handleGoogle} loading={googleLoading} id="google-login-btn">
        Continue with Google
      </SocialButton>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[var(--color-border)]" />
        <span className="text-xs text-[var(--color-muted)]">or continue with email</span>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {error && (
          <div
            role="alert"
            className="px-3.5 py-3 rounded-lg bg-red-500/10 border border-red-500/25 text-sm text-red-400"
          >
            {error}
          </div>
        )}

        <AuthInput
          label="Email"
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFieldErrors(f => ({ ...f, email: undefined })); }}
          error={fieldErrors.email}
          disabled={loading}
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-medium text-[var(--color-text)]">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors(f => ({ ...f, password: undefined })); }}
              disabled={loading}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
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
            <p id="login-password-error" className="text-xs text-red-400 mt-0.5" role="alert">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <button
          id="login-submit-btn"
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 mt-1 py-2.5 px-4 rounded-lg
                     bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium
                     transition-colors duration-150 active:scale-[0.98]
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {loading ? <Spinner size="sm" /> : null}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--color-muted)] mt-6">
        Don&apos;t have an account?{" "}
        <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}

export default LoginPage;
