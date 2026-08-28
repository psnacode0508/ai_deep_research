import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import SocialButton from "@/components/auth/SocialButton";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";

function SignupPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const errors: typeof fieldErrors = {};
    if (!email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Password is required.";
    else if (password.length < 8) errors.password = "Password must be at least 8 characters.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    const { error: authError } = await signUp(email, password);
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    // Supabase sends a verification email — show confirmation
    setEmailSent(true);
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    const { error: authError } = await signInWithGoogle();
    if (authError) {
      setError(authError.message);
      setGoogleLoading(false);
    }
  }

  if (emailSent) {
    return (
      <AuthLayout title="Check your email" subtitle={`We sent a verification link to ${email}`}>
        <div className="flex flex-col items-center gap-5 py-4 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <p className="text-sm text-[var(--color-muted)] max-w-xs">
            Click the link in your email to verify your account. You can close this tab.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-brand-400 hover:text-brand-300 transition-colors font-medium"
          >
            Back to sign in
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create an account" subtitle="Start your first deep research session">
      <SocialButton onClick={handleGoogle} loading={googleLoading} id="google-signup-btn">
        Sign up with Google
      </SocialButton>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[var(--color-border)]" />
        <span className="text-xs text-[var(--color-muted)]">or continue with email</span>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {error && (
          <div role="alert" className="px-3.5 py-3 rounded-lg bg-red-500/10 border border-red-500/25 text-sm text-red-400">
            {error}
          </div>
        )}

        <AuthInput
          label="Email"
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFieldErrors(f => ({ ...f, email: undefined })); }}
          error={fieldErrors.email}
          disabled={loading}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="signup-password" className="text-sm font-medium text-[var(--color-text)]">
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors(f => ({ ...f, password: undefined })); }}
              disabled={loading}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "signup-password-error" : undefined}
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
            <p id="signup-password-error" className="text-xs text-red-400 mt-0.5" role="alert">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <button
          id="signup-submit-btn"
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 mt-1 py-2.5 px-4 rounded-lg
                     bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium
                     transition-colors duration-150 active:scale-[0.98]
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {loading ? <Spinner size="sm" /> : null}
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p className="text-xs text-[var(--color-muted)] text-center">
          By creating an account you agree to our Terms of Service.
        </p>
      </form>

      <p className="text-center text-sm text-[var(--color-muted)] mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default SignupPage;
