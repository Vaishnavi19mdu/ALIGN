import { useState, useEffect, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ClipboardCheck, Building2, Users, BarChart2,
  Megaphone, Settings, LogOut, CheckCircle2, XCircle, Globe,
  TrendingUp, Shield, Plus, X, ChevronDown, ToggleLeft, ToggleRight,
  AlertCircle,
} from 'lucide-react';
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';
import { logOut } from '../../lib/authService';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingOrg {
  uid: string;
  email: string;
  fullName: string;
  orgName: string;
  orgType: string;
  orgSize: string;
  orgWebsite?: string;
  regNum: string;
  createdAt: any;
}

// ─── Dummy data (non-approval sections) ───────────────────────────────────────

const platformStats = [
  { label: 'Total Orgs',       value: '34',     sub: '+3 this month',  color: 'text-brand-primary', bg: 'bg-brand-primary/10', icon: Building2 },
  { label: 'Total Volunteers', value: '2,841',  sub: '+128 this week', color: 'text-blue-600',      bg: 'bg-blue-50',          icon: Users },
  { label: 'Tasks Completed',  value: '12,490', sub: '94% on time',    color: 'text-green-600',     bg: 'bg-green-50',         icon: ClipboardCheck },
  { label: 'Completion Rate',  value: '91%',    sub: 'platform avg',   color: 'text-brand-accent',  bg: 'bg-brand-accent/10',  icon: TrendingUp },
];

const allOrgs = [
  { id: 'ORG-001', name: 'Impact Global NGO',        type: 'NGO',          status: 'Active',   volunteers: 124, tasks: 38,  code: 'IMG-1234' },
  { id: 'ORG-002', name: 'Relief India Trust',        type: 'NGO',          status: 'Active',   volunteers: 89,  tasks: 27,  code: 'RIT-5678' },
  { id: 'ORG-003', name: 'EduReach Foundation',       type: 'NGO',          status: 'Active',   volunteers: 210, tasks: 61,  code: 'EDU-9012' },
  { id: 'ORG-004', name: 'TechForGood Corp',          type: 'Corporate CSR', status: 'Active',  volunteers: 55,  tasks: 14,  code: 'TFG-3456' },
  { id: 'ORG-005', name: 'Village Connect',           type: 'Community',    status: 'Inactive', volunteers: 32,  tasks: 8,   code: 'VLC-7890' },
  { id: 'ORG-006', name: 'Govt Health Initiative',    type: 'Govt',         status: 'Active',   volunteers: 178, tasks: 45,  code: 'GHI-2345' },
];

const allUsers = [
  { name: 'Anjali R.',     email: 'anjali@impact.org',    role: 'volunteer',  org: 'Impact Global NGO',     status: 'Active' },
  { name: 'Ravi M.',       email: 'ravi@relief.in',       role: 'volunteer',  org: 'Relief India Trust',    status: 'Active' },
  { name: 'Meena Nair',    email: 'meena@impact.org',     role: 'org_staff',  org: 'Impact Global NGO',     status: 'Active' },
  { name: 'Karthik Rajan', email: 'karthik@edureac.org',  role: 'org_staff',  org: 'EduReach Foundation',   status: 'Active' },
  { name: 'Sarah Ramesh',  email: 'sarah@impact.org',     role: 'org_admin',  org: 'Impact Global NGO',     status: 'Active' },
  { name: 'Divya Pillai',  email: 'divya@villagec.org',   role: 'org_admin',  org: 'Village Connect',       status: 'Inactive' },
  { name: 'Arjun Das',     email: 'arjun@techforgood.in', role: 'volunteer',  org: 'TechForGood Corp',      status: 'Active' },
  { name: 'Priya S.',      email: 'priya@govhealth.gov',  role: 'org_staff',  org: 'Govt Health Initiative', status: 'Active' },
];

const announcements = [
  { id: 1, title: 'Platform maintenance scheduled', body: 'System will be down for 2 hours on May 3rd at midnight IST.', audience: 'All', sentAt: 'Apr 24, 2026', pinned: true },
  { id: 2, title: 'New task auto-assign engine live', body: 'Upgraded matching algorithm now considers proximity within 5km radius.', audience: 'Org Admins', sentAt: 'Apr 20, 2026', pinned: false },
  { id: 3, title: 'Volunteer milestone: 10,000 tasks!', body: 'Celebrating a platform-wide milestone. Thank you to all orgs and volunteers.', audience: 'All', sentAt: 'Apr 15, 2026', pinned: false },
];

const orgPerformance = [
  { name: 'EduReach Foundation',    score: 96, tasks: 61, volunteers: 210, completionRate: 98 },
  { name: 'Impact Global NGO',       score: 91, tasks: 38, volunteers: 124, completionRate: 94 },
  { name: 'Govt Health Initiative',  score: 88, tasks: 45, volunteers: 178, completionRate: 91 },
  { name: 'Relief India Trust',      score: 84, tasks: 27, volunteers: 89,  completionRate: 87 },
  { name: 'TechForGood Corp',        score: 79, tasks: 14, volunteers: 55,  completionRate: 82 },
  { name: 'Village Connect',         score: 61, tasks: 8,  volunteers: 32,  completionRate: 74 },
];

const geoData = [
  { region: 'Tamil Nadu',      orgs: 12, volunteers: 980 },
  { region: 'Karnataka',       orgs: 8,  volunteers: 640 },
  { region: 'Maharashtra',     orgs: 7,  volunteers: 710 },
  { region: 'Delhi NCR',       orgs: 5,  volunteers: 390 },
  { region: 'West Bengal',     orgs: 2,  volunteers: 121 },
];

const systemSettings = [
  { key: 'auto_approve_volunteers', label: 'Auto-approve volunteer signups', description: 'New volunteers are active immediately without admin review', enabled: true },
  { key: 'org_code_expiry',         label: 'Org invite codes expire after 30 days', description: 'Codes generated on approval expire after 30 days', enabled: false },
  { key: 'ai_matching',             label: 'AI-powered task matching', description: 'Use the auto-assign engine for new tasks', enabled: true },
  { key: 'email_notifications',     label: 'Email notifications', description: 'Send email alerts for approvals, task assignments and updates', enabled: true },
  { key: 'require_doc_upload',      label: 'Require bonafide doc on org signup', description: 'Orgs must upload incorporation certificate to register', enabled: true },
  { key: 'maintenance_mode',        label: 'Maintenance mode', description: 'Take the platform offline for all non-superadmin users', enabled: false },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const generateOrgCode = (name: string) => {
  const prefix = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
};

const roleStyle = (role: string) => {
  if (role === 'org_admin') return 'bg-brand-primary/10 text-brand-primary';
  if (role === 'org_staff')  return 'bg-blue-50 text-blue-600';
  return 'bg-black/5 text-brand-text-secondary';
};

const statusDot = (s: string) => s === 'Active'
  ? 'bg-green-500'
  : 'bg-brand-text-secondary/30';

// ─── DashboardHome ────────────────────────────────────────────────────────────

const DashboardHome = () => {
  const [pendingPreview, setPendingPreview] = useState<PendingOrg[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'org_admin'),
      where('status', '==', 'pending'),
    );
    return onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ uid: d.id, ...d.data() } as PendingOrg));
      setPendingCount(docs.length);
      setPendingPreview(docs.slice(0, 3));
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {platformStats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-4 md:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary mb-1">{s.label}</p>
                  <p className="text-2xl font-bold text-brand-text-primary">{s.value}</p>
                  <p className="text-[11px] text-brand-text-secondary mt-0.5">{s.sub}</p>
                </div>
                <div className={`${s.color} ${s.bg} p-2 rounded-lg shrink-0`}>
                  <s.icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pending approvals preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-heading font-bold flex items-center gap-2">
            Pending Org Approvals
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">{pendingCount}</span>
            )}
          </h2>
        </div>
        <Card className="overflow-hidden">
          {pendingPreview.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-brand-text-secondary">No pending applications.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-brand-background/50 border-b border-black/5">
                    {['Organisation', 'Type', 'Contact', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-brand-text-primary">
                  {pendingPreview.map(org => (
                    <tr key={org.uid} className="hover:bg-brand-background/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-sm">{org.orgName}</div>
                        <div className="text-[10px] text-brand-text-secondary">{org.fullName}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-text-secondary">{org.orgType}</td>
                      <td className="px-4 py-3 text-sm text-brand-text-secondary">{org.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-600 uppercase">Pending</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Org performance preview */}
      <div>
        <h2 className="text-base font-heading font-bold mb-3">Org Performance Overview</h2>
        <Card className="p-5 space-y-3">
          {orgPerformance.slice(0, 4).map((org, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-sm w-44 shrink-0 font-medium text-brand-text-primary truncate">{org.name}</span>
              <div className="flex-1 h-2 bg-black/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-brand-primary rounded-full"
                  style={{ width: 0 }}
                  animate={{ width: `${org.score}%` }}
                  transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
                />
              </div>
              <span className="text-xs font-bold text-brand-primary w-10 text-right">{org.score}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ─── ApprovalsPage ────────────────────────────────────────────────────────────

const ApprovalsPage = () => {
  const [pending, setPending]   = useState<PendingOrg[]>([]);
  const [resolved, setResolved] = useState<{ uid: string; orgName: string; status: 'approved' | 'rejected'; code?: string }[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [acting, setActing]     = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'org_admin'),
      where('status', '==', 'pending'),
    );
    return onSnapshot(q, snap => {
      setPending(snap.docs.map(d => ({ uid: d.id, ...d.data() } as PendingOrg)));
      setLoading(false);
    });
  }, []);

  const approve = async (org: PendingOrg) => {
    setActing(org.uid);
    const code = generateOrgCode(org.orgName);
    await updateDoc(doc(db, 'users', org.uid), {
      status: 'approved',
      orgCode: code,
      resolvedAt: serverTimestamp(),
    });
    setResolved(prev => [...prev, { uid: org.uid, orgName: org.orgName, status: 'approved', code }]);
    setActing(null);
  };

  const reject = async (org: PendingOrg) => {
    setActing(org.uid);
    await updateDoc(doc(db, 'users', org.uid), {
      status: 'rejected',
      resolvedAt: serverTimestamp(),
    });
    setResolved(prev => [...prev, { uid: org.uid, orgName: org.orgName, status: 'rejected' }]);
    setActing(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-brand-text-secondary text-sm">
        Loading approvals…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-heading font-bold">Pending Approvals</h2>
        {pending.length > 0 && (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">{pending.length} waiting</span>
        )}
      </div>

      {pending.length === 0 && resolved.length === 0 && (
        <Card className="p-10 flex flex-col items-center justify-center gap-3 text-center">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
          <p className="font-semibold text-brand-text-primary">All caught up!</p>
          <p className="text-xs text-brand-text-secondary">No pending org applications right now.</p>
        </Card>
      )}

      <div className="space-y-3">
        {pending.map((org, i) => (
          <motion.div key={org.uid} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-brand-background/30 transition-colors text-left"
                onClick={() => setExpandedId(expandedId === org.uid ? null : org.uid)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-brand-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-brand-text-primary">{org.orgName}</p>
                    <p className="text-[11px] text-brand-text-secondary">{org.orgType} · {org.orgSize} · {org.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-600 uppercase hidden sm:inline">Pending</span>
                  <ChevronDown className={`w-4 h-4 text-brand-text-secondary transition-transform ${expandedId === org.uid ? 'rotate-180' : ''}`} />
                </div>
              </button>

              <AnimatePresence>
                {expandedId === org.uid && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-black/5 pt-4 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { label: 'Admin Name',  val: org.fullName },
                          { label: 'Email',       val: org.email },
                          { label: 'Org Type',    val: org.orgType },
                          { label: 'Org Size',    val: org.orgSize },
                          { label: 'Reg. Number', val: org.regNum },
                          { label: 'Website',     val: org.orgWebsite || '—' },
                        ].map(f => (
                          <div key={f.label} className="bg-brand-background rounded-lg px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">{f.label}</p>
                            <p className="text-sm font-medium text-brand-text-primary mt-0.5 truncate">{f.val}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 border border-red-100"
                          onClick={() => reject(org)}
                          disabled={acting === org.uid}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 gap-1.5"
                          onClick={() => approve(org)}
                          disabled={acting === org.uid}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {acting === org.uid ? 'Saving…' : 'Approve & Generate Code'}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </div>

      {resolved.length > 0 && (
        <>
          <h2 className="text-base font-heading font-bold">Resolved this session</h2>
          <div className="space-y-3">
            {resolved.map(org => (
              <Card key={org.uid} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${org.status === 'approved' ? 'bg-green-50' : 'bg-red-50'}`}>
                    {org.status === 'approved'
                      ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                      : <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                  <p className="font-semibold text-sm text-brand-text-primary">{org.orgName}</p>
                </div>
                {org.status === 'approved' && org.code && (
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Org Code</p>
                    <p className="font-mono font-bold text-brand-primary text-sm tracking-widest">{org.code}</p>
                  </div>
                )}
                {org.status === 'rejected' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 uppercase shrink-0">Rejected</span>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── OrgsPage ─────────────────────────────────────────────────────────────────

const OrgsPage = () => (
  <div className="space-y-4">
    <h2 className="text-base font-heading font-bold">All Organisations</h2>
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-brand-background/50 border-b border-black/5">
              {['Organisation', 'Type', 'Volunteers', 'Tasks', 'Org Code', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 text-brand-text-primary">
            {allOrgs.map((org, i) => (
              <motion.tr
                key={org.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="hover:bg-brand-background/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="font-semibold text-sm">{org.name}</div>
                  <div className="text-[10px] text-brand-text-secondary">{org.id}</div>
                </td>
                <td className="px-4 py-3 text-sm text-brand-text-secondary">{org.type}</td>
                <td className="px-4 py-3 text-sm font-semibold text-brand-text-primary">{org.volunteers}</td>
                <td className="px-4 py-3 text-sm font-semibold text-brand-text-primary">{org.tasks}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-bold text-brand-primary tracking-widest">{org.code}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusDot(org.status)}`} />
                    <span className="text-xs text-brand-text-secondary">{org.status}</span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

// ─── UsersPage ────────────────────────────────────────────────────────────────

const UsersPage = () => (
  <div className="space-y-4">
    <h2 className="text-base font-heading font-bold">All Users</h2>
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-brand-background/50 border-b border-black/5">
              {['User', 'Role', 'Organisation', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 text-brand-text-primary">
            {allUsers.map((u, i) => (
              <motion.tr
                key={u.email}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="hover:bg-brand-background/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-brand-primary/10 flex items-center justify-center text-[10px] font-bold text-brand-primary shrink-0">
                      {u.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{u.name}</p>
                      <p className="text-[10px] text-brand-text-secondary">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${roleStyle(u.role)}`}>
                    {u.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-brand-text-secondary">{u.org}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusDot(u.status)}`} />
                    <span className="text-xs text-brand-text-secondary">{u.status}</span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

// ─── PerformancePage ──────────────────────────────────────────────────────────

const PerformancePage = () => (
  <div className="space-y-6">
    <h2 className="text-base font-heading font-bold">Org Performance Scores</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {orgPerformance.map((org, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
          <Card className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-semibold text-sm text-brand-text-primary">{org.name}</p>
                <p className="text-[11px] text-brand-text-secondary">{org.volunteers} volunteers · {org.tasks} tasks</p>
              </div>
              <div className={`text-2xl font-bold ${org.score >= 90 ? 'text-green-600' : org.score >= 75 ? 'text-brand-primary' : 'text-amber-500'}`}>
                {org.score}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-brand-text-secondary">
                <span>Overall Score</span>
                <span className="font-bold">{org.score}/100</span>
              </div>
              <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${org.score >= 90 ? 'bg-green-500' : org.score >= 75 ? 'bg-brand-primary' : 'bg-amber-500'}`}
                  style={{ width: 0 }}
                  animate={{ width: `${org.score}%` }}
                  transition={{ duration: 0.7, delay: i * 0.08 }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-brand-text-secondary pt-1">
                <span>Completion Rate</span>
                <span className="font-bold text-brand-text-primary">{org.completionRate}%</span>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>

    <h2 className="text-base font-heading font-bold">Geographic Distribution</h2>
    <Card className="p-5 space-y-4">
      {geoData.map((g, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-brand-text-secondary" />
              <span className="font-medium text-brand-text-primary">{g.region}</span>
            </div>
            <div className="flex items-center gap-4 text-brand-text-secondary text-xs">
              <span><span className="font-bold text-brand-text-primary">{g.orgs}</span> orgs</span>
              <span><span className="font-bold text-brand-text-primary">{g.volunteers}</span> volunteers</span>
            </div>
          </div>
          <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-brand-primary/70 rounded-full"
              style={{ width: 0 }}
              animate={{ width: `${(g.volunteers / 980) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.07 }}
            />
          </div>
        </div>
      ))}
    </Card>
  </div>
);

// ─── AnnouncementsPage ────────────────────────────────────────────────────────

const AnnouncementsPage = () => {
  const [list, setList]         = useState(announcements);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ title: '', body: '', audience: 'All' });

  const send = () => {
    if (!form.title || !form.body) return;
    setList(prev => [{
      id: Date.now(), title: form.title, body: form.body,
      audience: form.audience, sentAt: 'Just now', pinned: false,
    }, ...prev]);
    setForm({ title: '', body: '', audience: 'All' });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-heading font-bold">Platform Announcements</h2>
        <Button size="sm" className="gap-1.5 text-[10px] uppercase font-bold tracking-widest" onClick={() => setShowForm(v => !v)}>
          <Plus className="w-3 h-3" /> New Announcement
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Card className="p-5 space-y-3 border border-brand-primary/20">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Title</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Announcement title…"
                  className="w-full px-3 py-2 rounded-lg bg-brand-background border border-black/10 focus:border-brand-primary outline-none text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Message</label>
                <textarea
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Write your message…"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-brand-background border border-black/10 focus:border-brand-primary outline-none text-sm resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Audience</label>
                <select
                  value={form.audience}
                  onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-brand-background border border-black/10 focus:border-brand-primary outline-none text-sm"
                >
                  {['All', 'Org Admins', 'Org Staff', 'Volunteers'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" className="flex-1 gap-1.5" onClick={send}>
                  <Megaphone className="w-3 h-3" /> Broadcast
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {list.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={`p-5 ${a.pinned ? 'border-l-4 border-l-brand-primary' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {a.pinned && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-primary/10 text-brand-primary uppercase tracking-widest">Pinned</span>
                    )}
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/5 text-brand-text-secondary uppercase tracking-widest">{a.audience}</span>
                  </div>
                  <p className="font-semibold text-sm text-brand-text-primary">{a.title}</p>
                  <p className="text-xs text-brand-text-secondary mt-1 leading-relaxed">{a.body}</p>
                  <p className="text-[10px] text-brand-text-secondary mt-2">{a.sentAt}</p>
                </div>
                <button
                  onClick={() => setList(prev => prev.filter(x => x.id !== a.id))}
                  className="text-brand-text-secondary hover:text-brand-text-primary transition-colors shrink-0 mt-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ─── SettingsPage ─────────────────────────────────────────────────────────────

const SettingsPage = () => {
  const [settings, setSettings] = useState(
    Object.fromEntries(systemSettings.map(s => [s.key, s.enabled]))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-4 h-4 text-amber-500" />
        <p className="text-xs text-brand-text-secondary">Changes take effect immediately across the platform.</p>
      </div>
      <Card className="divide-y divide-black/5">
        {systemSettings.map(s => (
          <div key={s.key} className="flex items-center justify-between px-5 py-4 gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-brand-text-primary">{s.label}</p>
              <p className="text-xs text-brand-text-secondary mt-0.5">{s.description}</p>
            </div>
            <button
              onClick={() => setSettings(p => ({ ...p, [s.key]: !p[s.key] }))}
              className="flex items-center gap-2 shrink-0 transition-colors"
            >
              {settings[s.key]
                ? <><ToggleRight className="w-7 h-7 text-brand-primary" /><span className="text-xs font-medium text-brand-primary hidden sm:inline">On</span></>
                : <><ToggleLeft  className="w-7 h-7 text-brand-text-secondary" /><span className="text-xs font-medium text-brand-text-secondary hidden sm:inline">Off</span></>}
            </button>
          </div>
        ))}
      </Card>
    </div>
  );
};

// ─── Nav ───────────────────────────────────────────────────────────────────────

const NAV_BASE = [
  { key: 'dashboard',     label: 'Dashboard',      icon: LayoutDashboard },
  { key: 'approvals',     label: 'Approvals',      icon: ClipboardCheck },
  { key: 'orgs',          label: 'Organisations',  icon: Building2 },
  { key: 'users',         label: 'All Users',      icon: Users },
  { key: 'performance',   label: 'Performance',    icon: BarChart2 },
  { key: 'announcements', label: 'Announcements',  icon: Megaphone },
  { key: 'settings',      label: 'Settings',       icon: Settings },
] as const;

type NavKey = typeof NAV_BASE[number]['key'];

// ─── Main export ───────────────────────────────────────────────────────────────

export const SuperAdminDashboard = () => {
  const [active, setActive] = useState<NavKey>('dashboard');
  const [livePendingCount, setLivePendingCount] = useState(0);
  const { profile } = useAuth();
  const navigate = useNavigate();

  const displayName = profile?.fullName ?? 'SuperAdmin';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  // Live pending badge count
  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'org_admin'),
      where('status', '==', 'pending'),
    );
    return onSnapshot(q, snap => setLivePendingCount(snap.size));
  }, []);

  const handleLogout = async () => {
    await logOut();
    navigate('/login');
  };

  const PageMap: Record<NavKey, ReactElement> = {
    dashboard:     <DashboardHome />,
    approvals:     <ApprovalsPage />,
    orgs:          <OrgsPage />,
    users:         <UsersPage />,
    performance:   <PerformancePage />,
    announcements: <AnnouncementsPage />,
    settings:      <SettingsPage />,
  };

  const navLabel: Record<NavKey, string> = {
    dashboard: 'Dashboard', approvals: 'Approvals', orgs: 'Organisations',
    users: 'All Users', performance: 'Performance',
    announcements: 'Announcements', settings: 'Settings',
  };

  return (
    <div className="flex h-screen bg-brand-background overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-brand-primary text-white shrink-0 sticky top-0">
        <div className="p-6 flex flex-col h-full">
          <div className="mb-8">
            <Logo />
          </div>

          <div className="mb-6 px-4 py-3 bg-white/10 rounded-[8px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">👑 SuperAdmin</p>
            <p className="text-sm font-semibold text-white mt-0.5 truncate">{displayName}</p>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto">
            {NAV_BASE.map(item => (
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
                <span className="font-medium text-sm flex-1">{item.label}</span>
                {item.key === 'approvals' && livePendingCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {livePendingCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="pt-6 border-t border-white/10 mt-auto space-y-3">
            <div className="flex items-center gap-3 px-4">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-[10px] text-white/50">👑 SuperAdmin</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 w-full text-white/70 hover:text-white hover:bg-white/5 rounded-[8px] transition-all">
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-primary flex z-40 overflow-x-auto">
        {NAV_BASE.slice(0, 5).map(item => (
          <button key={item.key} onClick={() => setActive(item.key)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors min-w-[60px] relative
              ${active === item.key ? 'text-brand-accent' : 'text-white/60'}`}>
            <item.icon className="w-4 h-4" />
            {item.key === 'approvals' && livePendingCount > 0 && (
              <span className="absolute top-1.5 right-2 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                {livePendingCount}
              </span>
            )}
            {item.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="px-6 py-5 border-b border-black/5 bg-white flex items-center justify-between sticky top-0 z-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary flex items-center gap-1">
              <Shield className="w-3 h-3" /> SuperAdmin Panel
            </p>
            <h1 className="text-lg font-heading font-bold text-brand-text-primary">{navLabel[active]}</h1>
          </div>
        </div>
        <div className="p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {PageMap[active]}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};