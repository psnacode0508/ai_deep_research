import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "@/context/AuthContext";
import RootLayout from "@/layouts/RootLayout";
import ProtectedRoute from "@/router/ProtectedRoute";
import PublicOnlyRoute from "@/router/PublicOnlyRoute";

import Spinner from "@/components/ui/Spinner";

// Lazy-loaded routes for code splitting
const HomePage = React.lazy(() => import("@/pages/HomePage"));
const NotFoundPage = React.lazy(() => import("@/pages/NotFoundPage"));
const PublicSharedReportPage = React.lazy(() => import("@/pages/PublicSharedReportPage").then(m => ({ default: m.PublicSharedReportPage })));

// Auth pages
const LoginPage = React.lazy(() => import("@/pages/auth/LoginPage"));
const SignupPage = React.lazy(() => import("@/pages/auth/SignupPage"));
const ForgotPasswordPage = React.lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = React.lazy(() => import("@/pages/auth/ResetPasswordPage"));
const VerifyEmailPage = React.lazy(() => import("@/pages/auth/VerifyEmailPage"));
const AuthCallbackPage = React.lazy(() => import("@/pages/auth/AuthCallbackPage"));

// Protected Application Shell
const DashboardLayout = React.lazy(() => import("@/layouts/DashboardLayout"));
const DashboardPage = React.lazy(() => import("@/pages/DashboardPage"));
const NewResearchPage = React.lazy(() => import("@/pages/NewResearchPage"));
const ResearchWorkspacePage = React.lazy(() => import("@/pages/ResearchWorkspacePage"));
const HistoryPage = React.lazy(() => import("@/pages/HistoryPage"));
const SettingsPage = React.lazy(() => import("@/pages/SettingsPage"));

// Fallback loader for suspense
const PageLoader = () => (
  <div className="min-h-dvh flex items-center justify-center bg-[var(--color-bg)]">
    <Spinner size="lg" />
  </div>
);

/**
 * Application root.
 */
function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<RootLayout />}>
              {/* ── Public routes ───────────────────────────── */}
              <Route index element={<HomePage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/share/:token" element={<PublicSharedReportPage />} />

              {/* ── Public-only routes (redirect if authed) ─── */}
              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              </Route>

              {/* ── Protected routes (redirect to /login) ────── */}
              <Route element={<ProtectedRoute />}>
                {/* Application Shell */}
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/research/new" element={<NewResearchPage />} />
                  <Route path="/research/:id" element={<ResearchWorkspacePage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>

              {/* ── 404 ───────────────────────────────────────── */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
