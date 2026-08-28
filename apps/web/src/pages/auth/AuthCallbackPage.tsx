import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Spinner from "@/components/ui/Spinner";

/**
 * AuthCallbackPage — /auth/callback
 *
 * Supabase redirects here after:
 *   - Google OAuth sign-in
 *   - Email verification link click
 *
 * The Supabase client automatically exchanges the `code` parameter in the
 * URL for a session via PKCE. We listen for the session to be established
 * and then redirect to /dashboard.
 *
 * If something goes wrong, we redirect to /login with an error.
 */
function AuthCallbackPage(): React.JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase handles the code exchange; we listen for the result
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/dashboard", { replace: true });
      } else if (event === "TOKEN_REFRESHED") {
        navigate("/dashboard", { replace: true });
      }
    });

    // Fallback: if auth state doesn't fire within 5s, redirect to login
    const timeout = setTimeout(() => {
      navigate("/login?error=callback_timeout", { replace: true });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-[var(--color-bg)]">
      <Spinner size="lg" />
      <p className="text-sm text-[var(--color-muted)]">Completing sign in…</p>
    </div>
  );
}

export default AuthCallbackPage;
