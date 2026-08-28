import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";

/**
 * PublicOnlyRoute
 *
 * Redirects already-authenticated users away from public-only pages
 * (login, signup, etc.) to /dashboard.
 *
 * Shows a spinner while auth state is resolving to prevent flash.
 *
 * Usage:
 *   <Route element={<PublicOnlyRoute />}>
 *     <Route path="/login" element={<LoginPage />} />
 *   </Route>
 */
function PublicOnlyRoute(): React.JSX.Element {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--color-bg)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
