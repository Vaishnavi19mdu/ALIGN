import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { LandingPage } from './pages/landing/LandingPage';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { HistoricalLog } from './pages/reports/HistoricalLog';
import { AllocationView } from './pages/allocation/AllocationView';
import { VolunteerDashboard } from './pages/volunteer/VolunteerDashboard';
import { DemoDashboard } from './pages/demo/DemoDashboard';
import { FlipCardSignup } from './components/auth/FlipCardSignup';
import { SiteBot } from './components/common/SiteBot';
import { Button } from './components/common/Button';
import { Logo } from './components/common/Logo';
import { ArrowLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { OrgAdminDashboard } from './pages/dashboard/OrgAdminDashboard';
import { OrgStaffDashboard } from './pages/dashboard/OrgStaffDashboard';

// Routes that have their own inner sidebar — hide the global one
const ORG_ROUTES = ['/org-admin', '/org-staff'];

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isAuthPage = ['/', '/login', '/signup'].includes(location.pathname);
  const isDemoPage = location.pathname === '/demo';
  const isOrgPage  = ORG_ROUTES.some(r => location.pathname.startsWith(r));

  if (isAuthPage) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  if (isDemoPage) {
    return (
      <div className="bg-brand-background min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Org pages — skip global sidebar & topbar, render full width
  if (isOrgPage) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-brand-background min-h-screen"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="flex bg-brand-background min-h-screen relative overflow-x-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] z-50 lg:hidden"
            >
              <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

const LoginPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-brand-background px-4 relative">
    <div className="absolute top-8 left-8">
      <Link to="/">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Button>
      </Link>
    </div>
    <div className="w-full max-w-md space-y-8 text-center">
      <div className="flex justify-center mb-8">
        <Link to="/">
          <Logo isDark className="scale-125" />
        </Link>
      </div>
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-black/5 text-left">
        <h2 className="text-2xl font-heading mb-8 text-center">Login to your account</h2>
        <form className="space-y-6" onSubmit={e => e.preventDefault()}>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-brand-text-secondary">Email Address</label>
            <input type="email" placeholder="sarah@impact.org" className="w-full px-4 py-3 rounded-xl bg-brand-background/50 border border-transparent focus:border-brand-primary focus:bg-white outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-brand-text-secondary">Password</label>
            <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl bg-brand-background/50 border border-transparent focus:border-brand-primary focus:bg-white outline-none transition-all" />
          </div>
          <button className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold hover:opacity-90 transition-opacity">Sign In</button>
        </form>
        <p className="mt-8 text-sm text-brand-text-secondary">
          Don't have an account? <a href="/signup" className="text-brand-primary font-bold">Register today</a>
        </p>

        {/* ── DEV SHORTCUTS — remove before going to production ── */}
        <div className="mt-6 pt-6 border-t border-black/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary mb-3">Dev shortcuts</p>
          <div className="grid grid-cols-3 gap-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="w-full text-xs">Super Admin →</Button>
            </Link>
            <Link to="/org-admin">
              <Button variant="ghost" size="sm" className="w-full text-xs">Org Admin →</Button>
            </Link>
            <Link to="/org-staff">
              <Button variant="ghost" size="sm" className="w-full text-xs">Org Staff →</Button>
            </Link>
          </div>
        </div>
        {/* ── END DEV SHORTCUTS ── */}

      </div>
    </div>
  </div>
);

const SignupPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-brand-background py-12 px-4 relative">
    <div className="absolute top-8 left-8">
      <Link to="/">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Button>
      </Link>
    </div>
    <div className="w-full max-w-4xl text-center">
      <div className="flex justify-center mb-12">
        <Link to="/">
          <Logo isDark className="scale-125" />
        </Link>
      </div>
      <FlipCardSignup />
      <p className="mt-12 text-sm text-brand-text-secondary">
        Already have an account? <a href="/login" className="text-brand-primary font-bold">Sign in here</a>
      </p>
    </div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/demo" element={<DemoDashboard />} />

          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/tasks" element={<AdminDashboard />} />
          <Route path="/allocation" element={<AllocationView />} />
          <Route path="/volunteer" element={<VolunteerDashboard />} />
          <Route path="/reports" element={<HistoricalLog />} />
          <Route path="/org-admin" element={<OrgAdminDashboard />} />
          <Route path="/org-staff" element={<OrgStaffDashboard />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <SiteBot />
      </AppLayout>
    </BrowserRouter>
  );
}