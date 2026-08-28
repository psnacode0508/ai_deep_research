import React from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";

function SettingsPage(): React.JSX.Element {
  const { user } = useAuth();

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center">
            <SettingsIcon size={20} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        </div>
        <p className="text-[var(--color-muted)] mb-8 ml-13">
          Manage your account and preferences.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Your current session information from Supabase Auth.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)]">
              <div className="w-12 h-12 rounded-full bg-brand-500/15 flex items-center justify-center">
                <User size={24} className="text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user?.email}</p>
                <p className="text-xs text-[var(--color-muted)] font-mono mt-1">ID: {user?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default SettingsPage;
