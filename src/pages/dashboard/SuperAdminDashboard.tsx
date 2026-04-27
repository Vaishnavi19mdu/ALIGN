import { useState, useEffect, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ClipboardCheck, Building2, Users, BarChart2,
  Megaphone, Settings, LogOut, CheckCircle2, XCircle, Globe,
  TrendingUp, Shield, Plus, X, ChevronDown, ToggleLeft, ToggleRight,
  AlertCircle, Loader2,
} from 'lucide-react';
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, serverTimestamp, addDoc, orderBy, limit,
  getDocs,
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

interface OrgDoc {
  id: string;         // doc id = orgCode e.g. "GRN-2002"
  orgCode: string;
  orgName: string;
  orgType: string;
  orgSize: string;
  adminEmail: string;
  adminUid: string;
  createdAt: any;
  // computed
  volunteerCount?: number;
  staffCount?: number;
  taskCount?: number;
  status?: string;
}

interface UserDoc {
  uid: string;
  fullName: string;
  email: string;
  role: string;
  orgName?: string;
  orgCodeUsed?: string;
  orgCode?: string;
  status: string;
  canCreateTask?: boolean;
}

interface TaskDoc {
  id: string;
  title: string;
  orgCode: string;
  status: string;
  priority: string;
  assignedTo: string;
  createdBy: string;
  category: string;
  deadline: string;
}

interface AnnouncementDoc {
  id: string;
  title: string;
  body: string;
  audience: string;
  sentAt: any;
  pinned: boolean;
}

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

const statusDot = (s: string) =>
  s === 'Active' || s === 'approved' ? 'bg-green-500' : 'bg-brand-text-secondary/30';

const fmtTime = (ts: any): string => {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const systemSettings = [
  { key: 'auto_approve_volunteers', label: 'Auto-approve volunteer signups',         description: 'New volunteers are active immediately without admin review',      enabled: true  },
  { key: 'org_code_expiry',         label: 'Org invite codes expire after 30 days',  description: 'Codes generated on approval expire after 30 days',               enabled: false },
  { key: 'ai_matching',             label: 'AI-powered task matching',               description: 'Use the auto-assign engine for new tasks',                       enabled: true  },
  { key: 'email_notifications',     label: 'Email notifications',                    description: 'Send email alerts for approvals, task assignments and updates',   enabled: true  },
  { key: 'require_doc_upload',      label: 'Require bonafide doc on org signup',     description: 'Orgs must upload incorporation certificate to register',          enabled: true  },
  { key: 'maintenance_mode',        label: 'Maintenance mode',                       description: 'Take the platform offline for all non-superadmin users',         enabled: false },
];

// ─── DashboardHome ────────────────────────────────────────────────────────────

const DashboardHome = () => {
  const [pendingPreview, setPendingPreview] = useState<PendingOrg[]>([]);
  const [pendingCount,   setPendingCount]   = useState(0);
  const [orgCount,       setOrgCount]       = useState(0);
  const [volunteerCount, setVolunteerCount] = useState(0);
  const [taskCount,      setTaskCount]      = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [orgs,           setOrgs]           = useState<OrgDoc[]>([]);

  useEffect(() => {
    // Pending org_admin applications
    const qPending = query(
      collection(db, 'users'),
      where('role', '==', 'org_admin'),
      where('status', '==', 'pending'),
    );
    const unsubPending = onSnapshot(qPending, snap => {
      const docs = snap.docs.map(d => ({ uid: d.id, ...d.data() } as PendingOrg));
      setPendingCount(docs.length);
      setPendingPreview(docs.slice(0, 3));
    });

    // Orgs collection
    const unsubOrgs = onSnapshot(collection(db, 'organisations'), snap => {
      setOrgCount(snap.size);
      setOrgs(snap.docs.map(d => ({ id: d.id, ...d.data() } as OrgDoc)));
    });

    // Volunteers
    const qVols = query(collection(db, 'users'), where('role', '==', 'volunteer'));
    const unsubVols = onSnapshot(qVols, snap => setVolunteerCount(snap.size));

    // Tasks
    const unsubTasks = onSnapshot(collection(db, 'tasks'), snap => {
      setTaskCount(snap.size);
      setCompletedCount(snap.docs.filter(d => d.data().status === 'Completed').length);
    });

    return () => { unsubPending(); unsubOrgs(); unsubVols(); unsubTasks(); };
  }, []);

  const completionRate = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

  const platformStats = [
    { label: 'Total Orgs',       value: String(orgCount),       sub: 'registered',         color: 'text-brand-primary', bg: 'bg-brand-primary/10', icon: Building2     },
    { label: 'Total Volunteers', value: String(volunteerCount), sub: 'active on platform',  color: 'text-blue-600',      bg: 'bg-blue-50',          icon: Users         },
    { label: 'Tasks',            value: String(taskCount),      sub: `${completedCount} completed`, color: 'text-green-600', bg: 'bg-green-50',    icon: ClipboardCheck },
    { label: 'Completion Rate',  value: `${completionRate}%`,   sub: 'platform avg',        color: 'text-brand-accent',  bg: 'bg-brand-accent/10',  icon: TrendingUp    },
  ];

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

      {/* Org overview */}
      <div>
        <h2 className="text-base font-heading font-bold mb-3">Registered Organisations</h2>
        <Card className="p-5 space-y-3">
          {orgs.length === 0 && (
            <p className="text-sm text-brand-text-secondary text-center py-4">No organisations yet.</p>
          )}
          {orgs.slice(0, 5).map((org, i) => (
            <div key={org.id} className="flex items-center gap-4">
              <span className="text-sm w-44 shrink-0 font-medium text-brand-text-primary truncate">{org.orgName}</span>
              <span className="text-[11px] text-brand-text-secondary shrink-0">{org.orgType}</span>
              <span className="ml-auto font-mono text-xs font-bold text-brand-primary">{org.orgCode}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ─── ApprovalsPage ────────────────────────────────────────────────────────────

const ApprovalsPage = () => {
  const [pending,    setPending]    = useState<PendingOrg[]>([]);
  const [resolved,   setResolved]   = useState<{ uid: string; orgName: string; status: 'approved' | 'rejected'; code?: string }[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [acting,     setActing]     = useState<string | null>(null);

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
    // Update user doc
    await updateDoc(doc(db, 'users', org.uid), {
      status: 'approved', orgCode: code, resolvedAt: serverTimestamp(),
    });
    // Create org doc in 'organisations' collection
    await addDoc(collection(db, 'organisations'), {
      orgCode:    code,
      orgName:    org.orgName,
      orgType:    org.orgType,
      orgSize:    org.orgSize,
      adminEmail: org.email,
      adminUid:   org.uid,
      createdAt:  serverTimestamp(),
    });
    setResolved(prev => [...prev, { uid: org.uid, orgName: org.orgName, status: 'approved', code }]);
    setActing(null);
  };

  const reject = async (org: PendingOrg) => {
    setActing(org.uid);
    await updateDoc(doc(db, 'users', org.uid), { status: 'rejected', resolvedAt: serverTimestamp() });
    setResolved(prev => [...prev, { uid: org.uid, orgName: org.orgName, status: 'rejected' }]);
    setActing(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-20 text-brand-text-secondary text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading approvals…
    </div>
  );

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
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
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
                          { label: 'Applied',     val: fmtTime(org.createdAt) },
                        ].map(f => (
                          <div key={f.label} className="bg-brand-background rounded-lg px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">{f.label}</p>
                            <p className="text-sm font-medium text-brand-text-primary mt-0.5 truncate">{f.val}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3 pt-1">
                        <Button variant="ghost" size="sm"
                          className="flex-1 gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 border border-red-100"
                          onClick={() => reject(org)} disabled={acting === org.uid}>
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                        <Button size="sm" className="flex-1 gap-1.5"
                          onClick={() => approve(org)} disabled={acting === org.uid}>
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

const OrgsPage = () => {
  const [orgs,    setOrgs]    = useState<OrgDoc[]>([]);
  const [loading, setLoading] = useState(true);
  // Per-org counts keyed by orgCode
  const [counts, setCounts] = useState<Record<string, { volunteers: number; staff: number; tasks: number }>>({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'organisations'), async snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as OrgDoc));
      setOrgs(docs);
      setLoading(false);

      // Fetch counts for each org
      const newCounts: Record<string, { volunteers: number; staff: number; tasks: number }> = {};
      await Promise.all(docs.map(async org => {
        const [volSnap, staffSnap, taskSnap] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('orgCodeUsed', '==', org.orgCode), where('role', '==', 'volunteer'))),
          getDocs(query(collection(db, 'users'), where('orgCodeUsed', '==', org.orgCode), where('role', '==', 'org_staff'))),
          getDocs(query(collection(db, 'tasks'), where('orgCode', '==', org.orgCode))),
        ]);
        newCounts[org.orgCode] = {
          volunteers: volSnap.size,
          staff:      staffSnap.size,
          tasks:      taskSnap.size,
        };
      }));
      setCounts(newCounts);
    });
    return unsub;
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-20 text-brand-text-secondary text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading organisations…
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-heading font-bold">All Organisations</h2>
        <span className="text-xs text-brand-text-secondary">{orgs.length} registered</span>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-brand-background/50 border-b border-black/5">
                {['Organisation', 'Type', 'Size', 'Volunteers', 'Staff', 'Tasks', 'Org Code', 'Admin'].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 text-brand-text-primary">
              {orgs.map((org, i) => {
                const c = counts[org.orgCode] ?? { volunteers: '—', staff: '—', tasks: '—' };
                return (
                  <motion.tr key={org.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-brand-background/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-sm">{org.orgName}</div>
                      <div className="text-[10px] text-brand-text-secondary">{fmtTime(org.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-text-secondary">{org.orgType}</td>
                    <td className="px-4 py-3 text-sm text-brand-text-secondary">{org.orgSize}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{c.volunteers}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{c.staff}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{c.tasks}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-brand-primary tracking-widest">{org.orgCode}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-brand-text-secondary truncate max-w-[120px]">{org.adminEmail}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ─── UsersPage ────────────────────────────────────────────────────────────────

const UsersPage = () => {
  const [users,   setUsers]   = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<'all' | 'org_admin' | 'org_staff' | 'volunteer'>('all');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserDoc)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter);

  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-20 text-brand-text-secondary text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading users…
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-heading font-bold">All Users <span className="text-brand-text-secondary font-normal text-sm">({filtered.length})</span></h2>
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'org_admin', 'org_staff', 'volunteer'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-colors
                ${filter === f ? 'bg-brand-primary text-white' : 'bg-black/5 text-brand-text-secondary hover:bg-black/10'}`}>
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
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
              {filtered.map((u, i) => (
                <motion.tr key={u.uid} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="hover:bg-brand-background/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-brand-primary/10 flex items-center justify-center text-[10px] font-bold text-brand-primary shrink-0">
                        {u.fullName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '??'}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{u.fullName}</p>
                        <p className="text-[10px] text-brand-text-secondary">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${roleStyle(u.role)}`}>
                      {u.role?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-brand-text-secondary">
                    {u.orgName ?? '—'}
                    {(u.orgCodeUsed || u.orgCode) && (
                      <span className="ml-1 font-mono text-[10px] text-brand-primary">{u.orgCodeUsed ?? u.orgCode}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${statusDot(u.status)}`} />
                      <span className="text-xs text-brand-text-secondary capitalize">{u.status}</span>
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
};

// ─── PerformancePage ──────────────────────────────────────────────────────────

const PerformancePage = () => {
  const [orgStats, setOrgStats] = useState<{
    orgCode: string; orgName: string; orgType: string;
    taskCount: number; completedCount: number; volunteerCount: number; completionRate: number;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'organisations'), async snap => {
      const orgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as OrgDoc));

      const stats = await Promise.all(orgs.map(async org => {
        const [taskSnap, volSnap] = await Promise.all([
          getDocs(query(collection(db, 'tasks'), where('orgCode', '==', org.orgCode))),
          getDocs(query(collection(db, 'users'), where('orgCodeUsed', '==', org.orgCode), where('role', '==', 'volunteer'))),
        ]);
        const taskCount = taskSnap.size;
        const completedCount = taskSnap.docs.filter(d => d.data().status === 'Completed').length;
        return {
          orgCode:        org.orgCode,
          orgName:        org.orgName,
          orgType:        org.orgType,
          taskCount,
          completedCount,
          volunteerCount: volSnap.size,
          completionRate: taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0,
        };
      }));

      setOrgStats(stats.sort((a, b) => b.completionRate - a.completionRate));
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-20 text-brand-text-secondary text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading performance…
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-base font-heading font-bold">Org Performance</h2>
      {orgStats.length === 0 && (
        <Card className="p-10 text-center text-sm text-brand-text-secondary">No org data yet.</Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orgStats.map((org, i) => (
          <motion.div key={org.orgCode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-sm text-brand-text-primary">{org.orgName}</p>
                  <p className="text-[11px] text-brand-text-secondary">{org.volunteerCount} volunteers · {org.taskCount} tasks · {org.orgType}</p>
                </div>
                <div className={`text-2xl font-bold ${org.completionRate >= 80 ? 'text-green-600' : org.completionRate >= 50 ? 'text-brand-primary' : 'text-amber-500'}`}>
                  {org.completionRate}%
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-brand-text-secondary">
                  <span>Completion Rate</span>
                  <span className="font-bold">{org.completedCount}/{org.taskCount} tasks</span>
                </div>
                <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${org.completionRate >= 80 ? 'bg-green-500' : org.completionRate >= 50 ? 'bg-brand-primary' : 'bg-amber-500'}`}
                    style={{ width: 0 }}
                    animate={{ width: `${org.completionRate}%` }}
                    transition={{ duration: 0.7, delay: i * 0.08 }}
                  />
                </div>
                <p className="text-[10px] font-mono text-brand-text-secondary">{org.orgCode}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ─── AnnouncementsPage ────────────────────────────────────────────────────────

const AnnouncementsPage = () => {
  const [list,     setList]     = useState<AnnouncementDoc[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending,  setSending]  = useState(false);
  const [form,     setForm]     = useState({ title: '', body: '', audience: 'All' });

  useEffect(() => {
    const q = query(
      collection(db, 'announcements'),
      orderBy('sentAt', 'desc'),
      limit(30),
    );
    return onSnapshot(q, snap => {
      setList(snap.docs.map(d => ({ id: d.id, ...d.data() } as AnnouncementDoc)));
      setLoading(false);
    });
  }, []);

  const send = async () => {
    if (!form.title || !form.body) return;
    setSending(true);
    await addDoc(collection(db, 'announcements'), {
      title:    form.title,
      body:     form.body,
      audience: form.audience,
      sentAt:   serverTimestamp(),
      pinned:   false,
    });
    setForm({ title: '', body: '', audience: 'All' });
    setShowForm(false);
    setSending(false);
  };

  const remove = async (id: string) => {
    await updateDoc(doc(db, 'announcements', id), { deleted: true });
    setList(prev => prev.filter(a => a.id !== id));
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
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Announcement title…"
                  className="w-full px-3 py-2 rounded-lg bg-brand-background border border-black/10 focus:border-brand-primary outline-none text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Message</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Write your message…" rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-brand-background border border-black/10 focus:border-brand-primary outline-none text-sm resize-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Audience</label>
                <select value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-brand-background border border-black/10 focus:border-brand-primary outline-none text-sm">
                  {['All', 'Org Admins', 'Org Staff', 'Volunteers'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" className="flex-1 gap-1.5" onClick={send} disabled={sending}>
                  <Megaphone className="w-3 h-3" /> {sending ? 'Sending…' : 'Broadcast'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-brand-text-secondary text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading announcements…
        </div>
      )}

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
                  <p className="text-[10px] text-brand-text-secondary mt-2">{fmtTime(a.sentAt)}</p>
                </div>
                <button onClick={() => remove(a.id)}
                  className="text-brand-text-secondary hover:text-brand-text-primary transition-colors shrink-0 mt-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          </motion.div>
        ))}
        {!loading && list.length === 0 && (
          <Card className="p-10 text-center text-sm text-brand-text-secondary">No announcements yet.</Card>
        )}
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
            <button onClick={() => setSettings(p => ({ ...p, [s.key]: !p[s.key] }))}
              className="flex items-center gap-2 shrink-0 transition-colors">
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
  { key: 'approvals',     label: 'Approvals',      icon: ClipboardCheck  },
  { key: 'orgs',          label: 'Organisations',  icon: Building2       },
  { key: 'users',         label: 'All Users',      icon: Users           },
  { key: 'performance',   label: 'Performance',    icon: BarChart2       },
  { key: 'announcements', label: 'Announcements',  icon: Megaphone       },
  { key: 'settings',      label: 'Settings',       icon: Settings        },
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

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'org_admin'),
      where('status', '==', 'pending'),
    );
    return onSnapshot(q, snap => setLivePendingCount(snap.size));
  }, []);

  const handleLogout = async () => { await logOut(); navigate('/login'); };

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
          <div className="mb-8"><Logo /></div>
          <div className="mb-6 px-4 py-3 bg-white/10 rounded-[8px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">👑 SuperAdmin</p>
            <p className="text-sm font-semibold text-white mt-0.5 truncate">{displayName}</p>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {NAV_BASE.map(item => (
              <button key={item.key} onClick={() => setActive(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[8px] transition-all text-left
                  ${active === item.key ? 'bg-white/10 text-brand-accent font-semibold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
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
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">{initials}</div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-[10px] text-white/50">👑 SuperAdmin</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 w-full text-white/70 hover:text-white hover:bg-white/5 rounded-[8px] transition-all">
              <LogOut className="w-5 h-5" /><span className="font-medium text-sm">Logout</span>
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