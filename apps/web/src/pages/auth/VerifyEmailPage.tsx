import React from "react";
import { Mail } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";

/**
 * VerifyEmailPage — /verify-email
 *
 * Informational page shown after signup asking user to verify their email.
 * This page has no action — it simply gives the user clear instructions.
 */
function VerifyEmailPage(): React.JSX.Element {
  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Almost there — check your inbox to get started"
    >
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
          <Mail size={32} className="text-brand-400" />
        </div>
        <div className="text-sm text-[var(--color-muted)] space-y-2">
          <p>We&apos;ve sent a verification link to your email address.</p>
          <p>Click the link to activate your account. The link expires in 24 hours.</p>
          <p className="text-xs pt-1">Don&apos;t see it? Check your spam or junk folder.</p>
        </div>
      </div>
    </AuthLayout>
  );
}

export default VerifyEmailPage;
