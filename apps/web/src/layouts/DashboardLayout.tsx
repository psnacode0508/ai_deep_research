import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  Search, 
  History, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  Plus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

function DashboardLayout(): React.JSX.Element {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: Search },
    { label: "History", path: "/history", icon: History },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  const NavLinks = () => (
    <>
      <div className="px-3 py-2 mb-4">
        <Button 
          className="w-full justify-start gap-2" 
          onClick={() => {
            navigate("/research/new");
            setMobileMenuOpen(false);
          }}
        >
          <Plus size={16} />
          New Research
        </Button>
      </div>
      <div className="space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-500/10 text-brand-400"
                  : "text-[var(--color-muted)] hover:text-white hover:bg-[var(--color-surface-2)]"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="flex min-h-dvh bg-[var(--color-bg)]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-1)]">
        <div className="h-16 flex items-center px-6 border-b border-[var(--color-border)]">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/25 flex items-center justify-center group-hover:bg-brand-500/25 transition-colors">
              <Brain size={18} className="text-brand-400" />
            </div>
            <span className="text-white font-semibold tracking-tight">DeepResearch</span>
          </Link>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <NavLinks />
        </nav>

        <div className="p-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)]">
            <div className="w-8 h-8 rounded-full bg-brand-500/15 flex flex-shrink-0 items-center justify-center">
              <User size={16} className="text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.email}</p>
            </div>
            <button 
              onClick={handleSignOut}
              className="text-[var(--color-muted)] hover:text-white p-1 transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar & Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[var(--color-surface-1)] border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Brain size={20} className="text-brand-400" />
            <span className="text-white font-semibold">DeepResearch</span>
          </Link>
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-[var(--color-muted)] hover:text-white"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-3/4 max-w-sm bg-[var(--color-surface-1)] flex flex-col border-r border-[var(--color-border)]"
            >
              <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--color-border)]">
                <span className="text-white font-semibold">Menu</span>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-[var(--color-muted)] hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-4">
                <NavLinks />
              </nav>
              <div className="p-4 border-t border-[var(--color-border)]">
                <Button variant="outline" className="w-full justify-center gap-2" onClick={handleSignOut}>
                  <LogOut size={16} />
                  Sign out
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-dvh overflow-hidden relative">
        <div className="flex-1 overflow-y-auto pt-14 md:pt-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
