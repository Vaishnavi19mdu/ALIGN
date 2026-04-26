import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
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
import { SuperAdminDashboard } from './pages/dashboard/SuperAdminDashboard';
import { useAuth } from './context/AuthContext';
import { signIn } from './lib/authService';

const ORG_ROUTES = ['/org-admin', '/org-staff', '/superadmin'];

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isAuthPage = ['/', '/login', '/signup'].includes(location.pathname);
  const isDemoPage = location.pathname === '/demo';
  const isOrgPage  = ORG_ROUTES.some(r => location.pathname.startsWith(r));

  if (isAuthPage) {
    return (
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ pointerEvents: 'auto' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  if (isDemoPage) {
    return (
      <div className="bg-brand-background min-h-screen">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ pointerEvents: 'auto' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  if (isOrgPage) {
    return (
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-brand-background min-h-screen"
          style={{ pointerEvents: 'auto' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="flex bg-brand-background min-h-screen relative overflow-x-hidden">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

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

const LoginPage = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { profile } = await signIn(email, password);
      if (profile.isAdmin) {
        navigate('/superadmin');
      } else if (profile.role === 'org_admin') {
        profile.status === 'approved' ? navigate('/org-admin') : setError('Your account is pending superadmin approval.');
      } else if (profile.role === 'org_staff') {
        profile.status === 'approved' ? navigate('/org-staff') : setError('Your account is pending admin approval.');
      } else {
        navigate('/volunteer');
      }
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
          <Link to="/"><Logo isDark className="scale-125" /></Link>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-black/5 text-left">
          <h2 className="text-2xl font-heading mb-8 text-center">Login to your account</h2>
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-brand-text-secondary">Email Address</label>
              <input
                type="email"
                placeholder="sarah@impact.org"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-brand-background/50 border border-transparent focus:border-brand-primary focus:bg-white outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-brand-text-secondary">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-brand-background/50 border border-transparent focus:border-brand-primary focus:bg-white outline-none transition-all"
              />
            </div>
            {error && (
              <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <p className="mt-8 text-sm text-brand-text-secondary">
            Don't have an account?{' '}
            <a href="/signup" className="text-brand-primary font-bold">Register today</a>
          </p>
        </div>
      </div>
    </div>
  );
};

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
        Already have an account?{' '}
        <a href="/login" className="text-brand-primary font-bold">Sign in here</a>
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

          <Route path="/superadmin" element={<SuperAdminDashboard />} />
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