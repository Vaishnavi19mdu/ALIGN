import { useState, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ClipboardList, CheckSquare, MessageSquare, BookOpen,
  CheckCircle2, XCircle, Star, Send, Plus, LogOut,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { useUser } from '../../context/UserContext';

// ─── Dummy data ────────────────────────────────────────────────────────────────

const STAFF_CAN_CREATE_TASK = true;

const staffKpis = [
  { label: 'Tasks Today',           value: '4',  color: 'text-brand-primary' },
  { label: 'Pending Verifications', value: '3',  color: 'text-amber-500' },
  { label: 'Completed This Week',   value: '11', color: 'text-green-600' },
];

const staffTasks = [
  { id: 'T-202', title: 'Community Teaching', status: 'In Progress', volunteer: 'Ravi M.'   },
  { id: 'T-204', title: 'Medical Camp Setup',  status: 'In Progress', volunteer: 'Priya S.'  },
  { id: 'T-206', title: 'Ration Kit Packing',  status: 'Open',        volunteer: 'Unassigned' },
  { id: 'T-207', title: 'Awareness Walk',      status: 'Completed',   volunteer: 'Anita J.'  },
];

const pendingVerifications = [
  { task: 'Community Teaching', volunteer: 'Ravi M.',   hours: 6, status: 'pending' as const },
  { task: 'Medical Camp Setup', volunteer: 'Priya S.',  hours: 8, status: 'pending' as const },
  { task: 'Ration Kit Packing', volunteer: 'Deepak N.', hours: 4, status: 'pending' as const },
];

const collabPosts = [
  { user: 'Meena N.',   time: '10:30 AM', message: 'Need 2 more volunteers for Task T-203 (Flood Relief). Urgent!' },
  { user: 'Karthik R.', time: '09:15 AM', message: 'Task T-204 delayed by 1 day due to venue issue. Updated status.' },
  { user: 'Divya P.',   time: 'Yesterday', message: 'Great job team — T-199 completed ahead of schedule.' },
];

const resources = [
  { title: 'How to verify task completion',    type: 'Guide', icon: '📋' },
  { title: 'Volunteer onboarding guidelines',  type: 'PDF',   icon: '📄' },
  { title: 'Emergency response protocol',      type: 'Guide', icon: '🚨' },
  { title: 'FAQs — Common staff queries',      type: 'FAQ',   icon: '❓' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const statusStyle = (s: string) => {
  if (s === 'Completed')   return 'bg-green-100 text-green-700';
  if (s === 'In Progress') return 'bg-blue-100 text-blue-600';
  return 'bg-black/5 text-brand-text-secondary';
};

// ─── Sub-pages ─────────────────────────────────────────────────────────────────

const StaffHome = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-3 gap-4">
      {staffKpis.map((k, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
          <Card className="p-4 md:p-5 text-center">
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary mt-1">{k.label}</p>
          </Card>
        </motion.div>
      ))}
    </div>
    <div>
      <h2 className="text-base font-heading font-bold mb-3">My Tasks</h2>
      <Card className="divide-y divide-black/5">
        {staffTasks.map(t => (
          <div key={t.id} className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-brand-text-primary truncate">{t.title}</p>
              <p className="text-[11px] text-brand-text-secondary">{t.id} · {t.volunteer}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 ${statusStyle(t.status)}`}>
              {t.status}
            </span>
          </div>
        ))}
      </Card>
    </div>
  </div>
);

const TasksPage = () => {
  const [tasks, setTasks] = useState(staffTasks);
  const statusOptions = ['Open', 'In Progress', 'Completed'] as const;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-heading font-bold">Tasks</h2>
        {STAFF_CAN_CREATE_TASK && (
          <Button size="sm" className="gap-1.5 text-[10px] uppercase font-bold tracking-widest">
            <Plus className="w-3 h-3" /> Create Task
          </Button>
        )}
      </div>
      {!STAFF_CAN_CREATE_TASK && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <span className="font-semibold">Note:</span> Task creation is currently disabled by your admin.
        </div>
      )}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-brand-background/50 border-b border-black/5">
                {['Task', 'Volunteer', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 text-brand-text-primary">
              {tasks.map(t => (
                <tr key={t.id} className="hover:bg-brand-background/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-sm">{t.title}</p>
                    <p className="text-[10px] text-brand-text-secondary">{t.id}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-brand-text-secondary">{t.volunteer}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusStyle(t.status)}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select value={t.status}
                      onChange={e => setTasks(prev => prev.map(p => p.id === t.id ? { ...p, status: e.target.value } : p))}
                      className="text-[11px] border border-black/10 rounded-lg px-2 py-1 bg-brand-background outline-none focus:border-brand-primary">
                      {statusOptions.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const VerifyPage = () => {
  type VerificationStatus = 'pending' | 'approved' | 'rejected';
  type Verification = { task: string; volunteer: string; hours: number; status: VerificationStatus; rating: number; feedback: string; resolved: boolean; };
  const [verifications, setVerifications] = useState<Verification[]>(
    pendingVerifications.map(v => ({ ...v, rating: 0, feedback: '', resolved: false }))
  );
  const resolve = (i: number, approved: boolean) => {
    setVerifications(prev => prev.map((v, idx) =>
      idx === i ? { ...v, resolved: true, status: approved ? 'approved' : 'rejected' } : v
    ));
  };
  return (
    <div className="space-y-4">
      <h2 className="text-base font-heading font-bold">Verify Volunteers</h2>
      <div className="space-y-3">
        {verifications.map((v, i) => (
          <Card key={i} className={`p-5 transition-opacity ${v.resolved ? 'opacity-50' : ''}`}>
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <div className="flex-1">
                <p className="font-bold text-sm text-brand-text-primary">{v.task}</p>
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  Volunteer: <span className="font-semibold text-brand-primary">{v.volunteer}</span> · {v.hours}h logged
                </p>
                {v.resolved && (
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    (v.status as string) === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>{v.status}</span>
                )}
              </div>
              {!v.resolved && (
                <div className="flex flex-col gap-2 shrink-0">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} onClick={() => setVerifications(prev => prev.map((vv, idx) => idx === i ? { ...vv, rating: s } : vv))}>
                        <Star className={`w-4 h-4 ${v.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-black/10'}`} />
                      </button>
                    ))}
                  </div>
                  <input type="text" placeholder="Optional feedback…" value={v.feedback}
                    onChange={e => setVerifications(prev => prev.map((vv, idx) => idx === i ? { ...vv, feedback: e.target.value } : vv))}
                    className="text-xs px-3 py-1.5 border border-black/10 rounded-lg bg-brand-background outline-none focus:border-brand-primary w-48" />
                  <div className="flex gap-2">
                    <button onClick={() => resolve(i, true)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => resolve(i, false)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const CollabPage = () => {
  const [posts, setPosts] = useState(collabPosts);
  const [draft, setDraft] = useState('');
  const submit = () => {
    if (!draft.trim()) return;
    setPosts(prev => [{ user: 'You', time: 'Just now', message: draft }, ...prev]);
    setDraft('');
  };
  return (
    <div className="space-y-4">
      <h2 className="text-base font-heading font-bold">Collaboration Board</h2>
      <Card className="p-4 flex gap-3">
        <input type="text" placeholder="Post an update for your team…" value={draft}
          onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
          className="flex-1 text-sm px-4 py-2 bg-brand-background border border-black/10 rounded-xl outline-none focus:border-brand-primary" />
        <button onClick={submit}
          className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5">
          <Send className="w-3.5 h-3.5" /> Post
        </button>
      </Card>
      <div className="space-y-3">
        {posts.map((p, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="p-4 flex gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-[11px] font-bold text-brand-primary shrink-0">
                {p.user.split(' ').map(w => w[0]).join('').slice(0,2)}
              </div>
              <div>
                <p className="text-xs font-semibold text-brand-text-primary">{p.user} <span className="font-normal text-brand-text-secondary">· {p.time}</span></p>
                <p className="text-sm text-brand-text-primary mt-1">{p.message}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const ResourcesPage = () => (
  <div className="space-y-4">
    <h2 className="text-base font-heading font-bold">Training & Resources</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {resources.map((r, i) => (
        <Card key={i} className="p-5 flex items-start gap-4 hover:border-brand-primary/30 transition-colors cursor-pointer">
          <div className="text-2xl shrink-0">{r.icon}</div>
          <div>
            <p className="font-semibold text-sm text-brand-text-primary">{r.title}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-brand-primary/10 text-brand-primary">{r.type}</span>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

// ─── Nav ───────────────────────────────────────────────────────────────────────

const NAV = [
  { key: 'dashboard', label: 'Dashboard',    icon: LayoutDashboard },
  { key: 'tasks',     label: 'Tasks',        icon: ClipboardList },
  { key: 'verify',    label: 'Verify',       icon: CheckSquare },
  { key: 'collab',    label: 'Collaboration',icon: MessageSquare },
  { key: 'resources', label: 'Resources',    icon: BookOpen },
] as const;

type NavKey = typeof NAV[number]['key'];

// ─── Main export ───────────────────────────────────────────────────────────────

export const OrgStaffDashboard = () => {
  const [active, setActive] = useState<NavKey>('dashboard');
  const { user, initials, displayName } = useUser();

  const PageMap: Record<NavKey, ReactElement> = {
    dashboard: <StaffHome />,
    tasks:     <TasksPage />,
    verify:    <VerifyPage />,
    collab:    <CollabPage />,
    resources: <ResourcesPage />,
  };

  const navLabel: Record<NavKey, string> = {
    dashboard: 'Dashboard', tasks: 'Tasks', verify: 'Verify Volunteers',
    collab: 'Collaboration', resources: 'Resources',
  };

  return (
    <div className="flex h-screen bg-brand-background overflow-hidden">

      {/* ── Sidebar — matches global Sidebar style ── */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-brand-primary text-white shrink-0 sticky top-0">
        <div className="p-6 flex flex-col h-full">
          {/* Logo */}
          <div className="mb-8">
            <Logo />
          </div>

          {/* Org badge */}
          <div className="mb-6 px-4 py-3 bg-white/10 rounded-[8px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Org Staff</p>
            <p className="text-sm font-semibold text-white mt-0.5 truncate">{user.orgName}</p>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {NAV.map(item => (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[8px] transition-all text-left
                  ${active === item.key
                    ? 'bg-white/10 text-brand-accent font-semibold'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Task creation status indicator */}
          <div className="my-4">
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-xs ${STAFF_CAN_CREATE_TASK ? 'bg-green-500/20 text-green-300' : 'bg-white/5 text-white/40'}`}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${STAFF_CAN_CREATE_TASK ? 'bg-green-400' : 'bg-white/20'}`} />
              Task creation {STAFF_CAN_CREATE_TASK ? 'enabled' : 'disabled'}
            </div>
          </div>

          {/* User + logout */}
          <div className="pt-6 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-3 px-4">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-[10px] text-white/50 capitalize">{user.role}</p>
              </div>
            </div>
            <button className="flex items-center gap-3 px-4 py-2.5 w-full text-white/70 hover:text-white hover:bg-white/5 rounded-[8px] transition-all">
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-primary flex z-40">
        {NAV.map(item => (
          <button key={item.key} onClick={() => setActive(item.key)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors
              ${active === item.key ? 'text-brand-accent' : 'text-white/60'}`}>
            <item.icon className="w-4 h-4" />
            {item.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {/* Page header */}
        <div className="px-6 py-5 border-b border-black/5 bg-white flex items-center justify-between sticky top-0 z-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Organisation Staff</p>
            <h1 className="text-lg font-heading font-bold text-brand-text-primary">{navLabel[active]}</h1>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {PageMap[active]}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};