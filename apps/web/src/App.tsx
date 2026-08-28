import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "@/context/AuthContext";
import RootLayout from "@/layouts/RootLayout";
import ProtectedRoute from "@/router/ProtectedRoute";
import PublicOnlyRoute from "@/router/PublicOnlyRoute";

// Public pages
import HomePage from "@/pages/HomePage";
import NotFoundPage from "@/pages/NotFoundPage";

// Auth pages
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import VerifyEmailPage from "@/pages/auth/VerifyEmailPage";
import AuthCallbackPage from "@/pages/auth/AuthCallbackPage";

// Protected pages
import DashboardPage from "@/pages/DashboardPage";

/**
 * Application root.
 *
 * Route tree:
 *   /                    → HomePage          (public)
 *   /login               → LoginPage         (public-only: redirects to /dashboard if authed)
 *   /signup              → SignupPage         (public-only)
 *   /forgot-password     → ForgotPasswordPage (public-only)
 *   /reset-password      → ResetPasswordPage  (public)
 *   /verify-email        → VerifyEmailPage    (public)
 *   /auth/callback       → AuthCallbackPage   (public — OAuth/email redirect target)
 *   /dashboard           → DashboardPage      (protected — redirects to /login if not authed)
 *   *                    → NotFoundPage
 */
function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      {/*
        AuthProvider wraps everything so useAuth() works in all routes,
        including inside ProtectedRoute and PublicOnlyRoute.
      */}
      <AuthProvider>
        <Routes>
          <Route element={<RootLayout />}>
            {/* ── Public routes ───────────────────────────── */}
            <Route index element={<HomePage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* ── Public-only routes (redirect if authed) ─── */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>

            {/* ── Protected routes (redirect to /login) ────── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>

            {/* ── 404 ───────────────────────────────────────── */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
