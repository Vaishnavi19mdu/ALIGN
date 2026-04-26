import { useState, useEffect, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ClipboardList, GitBranch, Users, BarChart2,
  ScrollText, FileDown, Sparkles, Plus, ToggleLeft, ToggleRight,
  Download, LogOut, X, Settings, CheckCircle2, Save, Wifi, WifiOff,
  UserCheck, Bell, ChevronDown, Loader2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, serverTimestamp, addDoc, orderBy, limit,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';
import { logOut } from '../../lib/authService';
import { useNavigate } from 'react-router-dom';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PendingStaff {
  uid: string;
  fullName: string;
  email: string;
  orgCodeUsed: string;
  createdAt: any;
}

interface OrgStaffMember {
  uid: string;
  fullName: string;
  email: string;
  canCreateTask: boolean;
  status: string;
  tasksCreated?: number;
}

interface ActivityLogEntry {
  id: string;
  user: string;
  action: string;
  createdAt: any;
}

// ─── Dummy data ────────────────────────────────────────────────────────────────

const kpis = [
  { label: 'Total Tasks',       value: '38',  sub: '+4 this week', color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
  { label: 'High Priority',     value: '7',   sub: '3 unassigned', color: 'text-red-500',       bg: 'bg-red-50' },
  { label: 'Active Volunteers', value: '124', sub: '18 new',       color: 'text-blue-600',      bg: 'bg-blue-50' },
  { label: 'Completed',         value: '261', sub: '94% on time',  color: 'text-green-600',     bg: 'bg-green-50' },
];

const tasks = [
  { id: 'T-201', title: 'Food Kit Distribution', impact: 92, status: 'Open',        assignedTo: 'Unassigned', createdBy: 'Admin' },
  { id: 'T-202', title: 'Community Teaching',    impact: 87, status: 'Matching',    assignedTo: 'Ravi M.',    createdBy: 'Staff' },
  { id: 'T-203', title: 'Flood Relief Ops',      impact: 99, status: 'Emergency',   assignedTo: 'Unassigned', createdBy: 'Admin' },
  { id: 'T-204', title: 'Medical Camp Setup',    impact: 78, status: 'In Progress', assignedTo: 'Priya S.',   createdBy: 'Staff' },
  { id: 'T-205', title: 'Tree Planting Drive',   impact: 63, status: 'Open',        assignedTo: 'Unassigned', createdBy: 'Admin' },
];

const allocationData = [
  { task: 'Food Kit Distribution', volunteer: 'Anjali R.', skill: 94, reliability: 88, distance: 2.1, backups: ['Mohan D.', 'Sneha T.'] },
  { task: 'Community Teaching',    volunteer: 'Ravi M.',   skill: 89, reliability: 92, distance: 3.4, backups: ['Aditi K.'] },
  { task: 'Medical Camp Setup',    volunteer: 'Priya S.',  skill: 97, reliability: 85, distance: 1.8, backups: ['Suresh P.', 'Lakshmi V.'] },
];

const staffList = [
  { name: 'Meena Nair',    role: 'Staff', canCreateTask: true,  tasks: 12 },
  { name: 'Karthik Rajan', role: 'Staff', canCreateTask: false, tasks: 8  },
  { name: 'Divya Pillai',  role: 'Staff', canCreateTask: true,  tasks: 15 },
  { name: 'Arjun Das',     role: 'Staff', canCreateTask: false, tasks: 3  },
];

const analyticsCompletion = [
  { label: 'Mon', val: 62 }, { label: 'Tue', val: 78 }, { label: 'Wed', val: 55 },
  { label: 'Thu', val: 89 }, { label: 'Fri', val: 72 }, { label: 'Sat', val: 91 }, { label: 'Sun', val: 44 },
];

const analyticsVolunteer = [
  { label: 'Medical', val: 34 }, { label: 'Teaching', val: 28 },
  { label: 'Relief',  val: 22 }, { label: 'Other',    val: 16 },
];

const activityLog = [
  { time: '10:42 AM',  user: 'Admin',         action: 'Gave task creation permission to Meena Nair' },
  { time: '10:15 AM',  user: 'Karthik Rajan', action: 'Verified volunteer Anjali R. for Task T-201' },
  { time: '09:58 AM',  user: 'Divya Pillai',  action: 'Created Task T-205: Tree Planting Drive' },
  { time: '09:30 AM',  user: 'Admin',         action: 'Auto-assigned 3 tasks via allocation engine' },
  { time: 'Yesterday', user: 'Meena Nair',    action: 'Marked Task T-199 as Completed' },
  { time: 'Yesterday', user: 'Admin',         action: 'Revoked task creation for Arjun Das' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const statusStyle = (s: string) => {
  if (s === 'Emergency')   return 'bg-red-100 text-red-600';
  if (s === 'In Progress') return 'bg-blue-100 text-blue-600';
  if (s === 'Matching')    return 'bg-brand-accent/20 text-brand-primary';
  return 'bg-black/5 text-brand-text-secondary';
};

const pieColors = ['#7c3aed', '#f59e0b', '#10b981', '#6b7280'];

// ─── PDF Builder ──────────────────────────────────────────────────────────────

const buildPDF = (title: string): string => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PAGE_W = 210; const PAGE_H = 297; const MARGIN = 18; const CONTENT_W = PAGE_W - MARGIN * 2;
  const timestamp = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const hex = (h: string): [number, number, number] => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  const setColor = (color: string, type: 'fill'|'text'|'draw' = 'fill') => {
    const [r,g,b] = hex(color);
    if (type==='fill') doc.setFillColor(r,g,b);
    if (type==='text') doc.setTextColor(r,g,b);
    if (type==='draw') doc.setDrawColor(r,g,b);
  };
  const drawHeader = () => {
    setColor('#7c3aed','fill'); doc.rect(0,0,PAGE_W,36,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(16); setColor('#ffffff','text'); doc.text(title.toUpperCase(),MARGIN,16);
    doc.setFont('helvetica','normal'); doc.setFontSize(8); setColor('#e9d5ff','text');
    doc.text('Impact Global NGO',MARGIN,23); doc.text(`Generated: ${timestamp}`,MARGIN,29);
  };
  const drawFooter = () => {
    setColor('#f3f4f6','fill'); doc.rect(0,PAGE_H-14,PAGE_W,14,'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(7); setColor('#6b7280','text');
    doc.text('Impact Global NGO — Confidential',MARGIN,PAGE_H-5);
    doc.text('Page 1',PAGE_W-MARGIN,PAGE_H-5,{align:'right'});
  };
  const sectionHeading = (text: string, y: number) => {
    setColor('#7c3aed','fill'); doc.rect(MARGIN,y,CONTENT_W,7,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(8.5); setColor('#ffffff','text'); doc.text(text,MARGIN+3,y+5); return y+12;
  };
  void sectionHeading; // suppress unused warning
  drawHeader(); drawFooter();
  return doc.output('datauristring');
};

// ─── PDF Viewer ────────────────────────────────────────────────────────────────

const PDFViewer = ({ title, dataUri, onClose }: { title: string; dataUri: string; onClose: () => void }) => {
  const handleDownload = () => {
    const a = document.createElement('a'); a.href = dataUri;
    a.download = `${title.replace(/\s+/g,'_')}_${Date.now()}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="relative bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ width: '90vw', maxWidth: 860, height: '90vh' }}
          initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }} transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/8 bg-brand-background shrink-0">
            <p className="text-sm font-heading font-bold text-brand-text-primary">{title}</p>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleDownload} className="gap-1.5 text-[10px] uppercase font-bold tracking-widest">
                <Download className="w-3 h-3" /> Download PDF
              </Button>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/8 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 bg-neutral-200 overflow-hidden">
            <iframe src={dataUri} className="w-full h-full border-0" title={`${title} PDF Preview`} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Staff Requests Panel ─────────────────────────────────────────────────────

const StaffRequestsPage = ({ orgCode }: { orgCode: string }) => {
  const [pending,  setPending]  = useState<PendingStaff[]>([]);
  const [resolved, setResolved] = useState<{ uid: string; name: string; action: 'approved' | 'rejected' }[]>([]);
  const [acting,   setActing]   = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!orgCode) return;
    const q = query(
      collection(db, 'users'),
      where('orgCodeUsed', '==', orgCode),
      where('status', '==', 'pending'),
    );
    return onSnapshot(q, snap => {
      setPending(snap.docs.map(d => ({ uid: d.id, ...d.data() } as PendingStaff)));
      setLoading(false);
    });
  }, [orgCode]);

  const approve = async (s: PendingStaff) => {
    setActing(s.uid);
    await updateDoc(doc(db, 'users', s.uid), { status: 'approved', resolvedAt: serverTimestamp() });
    setResolved(prev => [...prev, { uid: s.uid, name: s.fullName, action: 'approved' }]);
    setActing(null);
  };

  const reject = async (s: PendingStaff) => {
    setActing(s.uid);
    await updateDoc(doc(db, 'users', s.uid), { status: 'rejected', resolvedAt: serverTimestamp() });
    setResolved(prev => [...prev, { uid: s.uid, name: s.fullName, action: 'rejected' }]);
    setActing(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-brand-text-secondary text-sm">
      Loading requests…
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-heading font-bold">Staff Join Requests</h2>
        {pending.length > 0 && (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">{pending.length} pending</span>
        )}
      </div>

      {pending.length === 0 && resolved.length === 0 && (
        <Card className="p-10 flex flex-col items-center gap-3 text-center">
          <UserCheck className="w-10 h-10 text-green-500" />
          <p className="font-semibold text-brand-text-primary">All caught up!</p>
          <p className="text-xs text-brand-text-secondary">No pending staff requests for your org code.</p>
        </Card>
      )}

      <div className="space-y-3">
        {pending.map((s, i) => (
          <motion.div key={s.uid} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-brand-background/30 transition-colors text-left"
                onClick={() => setExpanded(expanded === s.uid ? null : s.uid)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 text-[11px] font-bold text-brand-primary">
                    {s.fullName.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-brand-text-primary">{s.fullName}</p>
                    <p className="text-[11px] text-brand-text-secondary">{s.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-600 uppercase hidden sm:inline">Pending</span>
                  <ChevronDown className={`w-4 h-4 text-brand-text-secondary transition-transform ${expanded === s.uid ? 'rotate-180' : ''}`} />
                </div>
              </button>

              <AnimatePresence>
                {expanded === s.uid && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-black/5 pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Full Name', val: s.fullName },
                          { label: 'Email',     val: s.email },
                          { label: 'Code Used', val: s.orgCodeUsed },
                          { label: 'Requested', val: s.createdAt?.toDate?.()?.toLocaleDateString('en-IN') ?? 'Just now' },
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
                          onClick={() => reject(s)} disabled={acting === s.uid}>
                          <X className="w-3.5 h-3.5" /> Reject
                        </Button>
                        <Button size="sm" className="flex-1 gap-1.5"
                          onClick={() => approve(s)} disabled={acting === s.uid}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {acting === s.uid ? 'Saving…' : 'Approve'}
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
          <div className="space-y-2">
            {resolved.map(r => (
              <Card key={r.uid} className="px-5 py-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${r.action === 'approved' ? 'bg-green-50' : 'bg-red-50'}`}>
                  {r.action === 'approved'
                    ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                    : <X className="w-4 h-4 text-red-500" />}
                </div>
                <p className="font-semibold text-sm text-brand-text-primary flex-1">{r.name}</p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.action === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {r.action}
                </span>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Task Permissions Panel (fetches real org staff from Firestore) ─────────────

const TaskPermissionsPanel = ({ orgCode }: { orgCode: string }) => {
  const [staffMembers, setStaffMembers] = useState<OrgStaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (!orgCode) return;
    const q = query(
      collection(db, 'users'),
      where('orgCodeUsed', '==', orgCode),
      where('status', '==', 'approved'),
      where('role', '==', 'org_staff'),
    );
    return onSnapshot(q, snap => {
      setStaffMembers(snap.docs.map(d => ({
        uid: d.id,
        fullName: d.data().fullName ?? 'Unknown',
        email: d.data().email ?? '',
        canCreateTask: d.data().canCreateTask === true,
        status: d.data().status ?? 'approved',
      })));
      setLoading(false);
    });
  }, [orgCode]);

  const togglePermission = async (member: OrgStaffMember) => {
    setToggling(member.uid);
    await updateDoc(doc(db, 'users', member.uid), {
      canCreateTask: !member.canCreateTask,
    });
    setToggling(null);
  };

  if (loading) return (
    <div className="flex items-center gap-2 py-6 text-brand-text-secondary text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading staff…
    </div>
  );

  if (staffMembers.length === 0) return (
    <div className="py-6 text-center text-sm text-brand-text-secondary">
      No approved staff members found in your organisation.
    </div>
  );

  return (
    <div className="space-y-2">
      {staffMembers.map((member, i) => (
        <motion.div key={member.uid} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-background border border-black/5 hover:border-brand-primary/20 transition-colors">
            <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center text-[11px] font-bold text-brand-primary shrink-0">
              {member.fullName.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-brand-text-primary truncate">{member.fullName}</p>
              <p className="text-[11px] text-brand-text-secondary truncate">{member.email}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] font-bold uppercase tracking-wide ${member.canCreateTask ? 'text-brand-primary' : 'text-brand-text-secondary'}`}>
                {member.canCreateTask ? 'Enabled' : 'Disabled'}
              </span>
              <button
                onClick={() => togglePermission(member)}
                disabled={toggling === member.uid}
                className="relative focus:outline-none"
              >
                {toggling === member.uid
                  ? <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
                  : member.canCreateTask
                    ? <ToggleRight className="w-7 h-7 text-brand-primary transition-colors" />
                    : <ToggleLeft  className="w-7 h-7 text-brand-text-secondary/40 transition-colors" />
                }
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ─── Sub-pages ─────────────────────────────────────────────────────────────────

const DashboardHome = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((k, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
          <Card className="p-4 md:p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary mb-1">{k.label}</p>
            <p className="text-2xl font-bold text-brand-text-primary mb-1">{k.value}</p>
            <p className="text-[11px] text-brand-text-secondary">{k.sub}</p>
          </Card>
        </motion.div>
      ))}
    </div>
    <div className="flex items-center justify-between">
      <h2 className="text-base font-heading font-bold">Urgent Unassigned Tasks</h2>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" className="gap-1.5 text-[10px] uppercase font-bold tracking-widest"><Plus className="w-3 h-3" /> Create Task</Button>
        <Button size="sm" className="gap-1.5 text-[10px] uppercase font-bold tracking-widest"><Sparkles className="w-3 h-3" /> Auto Assign</Button>
      </div>
    </div>
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-brand-background/50 border-b border-black/5">
              {['Task Name','Impact','Status','Assigned To','Created By',''].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 text-brand-text-primary">
            {tasks.map(t => (
              <tr key={t.id} className="hover:bg-brand-background/30 transition-colors">
                <td className="px-4 py-3"><div className="font-semibold text-sm">{t.title}</div><div className="text-[10px] text-brand-text-secondary">{t.id}</div></td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-14 h-1 bg-black/5 rounded-full overflow-hidden"><div className="h-full bg-brand-primary rounded-full" style={{ width: `${t.impact}%` }} /></div><span className="text-[10px] font-bold">{t.impact}</span></div></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusStyle(t.status)}`}>{t.status}</span></td>
                <td className="px-4 py-3 text-sm text-brand-text-secondary">{t.assignedTo}</td>
                <td className="px-4 py-3 text-sm text-brand-text-secondary">{t.createdBy}</td>
                <td className="px-4 py-3"><Button variant="ghost" size="sm" className="text-[10px] h-7 px-3">Assign</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

// ─── Tasks Page — now includes Task Permissions section ───────────────────────

const TasksPage = ({ orgCode }: { orgCode: string }) => {
  const [showPermissions, setShowPermissions] = useState(false);

  return (
    <div className="space-y-6">
      {/* Tasks table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-heading font-bold">All Tasks</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost"
              onClick={() => setShowPermissions(v => !v)}
              className="gap-1.5 text-[10px] uppercase font-bold tracking-widest">
              <ToggleRight className="w-3.5 h-3.5" /> Task Permissions
            </Button>
            <Button size="sm" className="gap-1.5 text-[10px] uppercase font-bold tracking-widest">
              <Plus className="w-3 h-3" /> Create Task
            </Button>
          </div>
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-brand-background/50 border-b border-black/5">
                  {['Task','Impact','Status','Assigned Volunteer','Created By','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 text-brand-text-primary">
                {tasks.map(t => (
                  <tr key={t.id} className="hover:bg-brand-background/30 transition-colors">
                    <td className="px-4 py-3"><div className="font-semibold text-sm">{t.title}</div><div className="text-[10px] text-brand-text-secondary">{t.id}</div></td>
                    <td className="px-4 py-3"><span className="text-sm font-bold text-brand-primary">{t.impact}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusStyle(t.status)}`}>{t.status}</span></td>
                    <td className="px-4 py-3 text-sm text-brand-text-secondary">{t.assignedTo}</td>
                    <td className="px-4 py-3 text-sm text-brand-text-secondary">{t.createdBy}</td>
                    <td className="px-4 py-3"><Button variant="ghost" size="sm" className="text-[10px] h-7 px-3">Edit</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Task Permissions collapsible panel */}
      <AnimatePresence>
        {showPermissions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <Card className="p-5 space-y-4 border border-brand-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-heading font-bold text-brand-text-primary">Task Creation Permissions</h3>
                  <p className="text-[11px] text-brand-text-secondary mt-0.5">
                    Toggle which staff members can create new tasks in your organisation.
                  </p>
                </div>
                <button onClick={() => setShowPermissions(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors text-brand-text-secondary">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <TaskPermissionsPanel orgCode={orgCode} />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AllocationPage = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-base font-heading font-bold">Allocation View</h2>
      <Button size="sm" className="gap-1.5 text-[10px] uppercase font-bold tracking-widest"><Sparkles className="w-3 h-3" /> Re-run Auto Assign</Button>
    </div>
    <div className="space-y-3">
      {allocationData.map((row, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
          <Card className="p-5">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-brand-text-primary mb-0.5">{row.task}</p>
                <p className="text-xs text-brand-text-secondary">Assigned → <span className="font-semibold text-brand-primary">{row.volunteer}</span></p>
              </div>
              <div className="flex gap-4 flex-wrap">
                {[
                  { label: 'Skill Match',   val: row.skill,       color: 'text-brand-primary', suffix: '%' },
                  { label: 'Reliability',   val: row.reliability, color: 'text-green-600',     suffix: '%' },
                  { label: 'Distance (km)', val: row.distance,    color: 'text-blue-600',      suffix: ' km' },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <p className={`text-lg font-bold ${m.color}`}>{m.val}{m.suffix}</p>
                    <p className="text-[10px] text-brand-text-secondary uppercase tracking-wide">{m.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Backups</p>
                {row.backups.map(b => <span key={b} className="text-xs text-brand-text-secondary">{b}</span>)}
              </div>
              <Button variant="ghost" size="sm" className="text-[10px] h-7 px-3 shrink-0">Reassign</Button>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  </div>
);

const StaffManagementPage = ({ orgCode }: { orgCode: string }) => {
  const [members, setMembers]   = useState<OrgStaffMember[]>([]);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (!orgCode) return;
    const q = query(
      collection(db, 'users'),
      where('orgCodeUsed', '==', orgCode),
      where('status', '==', 'approved'),
      where('role', '==', 'org_staff'),
    );
    return onSnapshot(q, snap => {
      setMembers(snap.docs.map(d => ({
        uid: d.id,
        fullName:      d.data().fullName      ?? 'Unknown',
        email:         d.data().email         ?? '',
        canCreateTask: d.data().canCreateTask === true,
        status:        d.data().status        ?? 'approved',
        tasksCreated:  d.data().tasksCreated  ?? 0,
      })));
      setLoading(false);
    });
  }, [orgCode]);

  const togglePerm = async (m: OrgStaffMember) => {
    setToggling(m.uid);
    const next = !m.canCreateTask;
    await updateDoc(doc(db, 'users', m.uid), { canCreateTask: next });
    // Write activity log entry
    await addDoc(collection(db, 'activityLogs'), {
      orgCode,
      user:      'Admin',
      action:    next
        ? `Gave task creation permission to ${m.fullName}`
        : `Revoked task creation for ${m.fullName}`,
      createdAt: serverTimestamp(),
    });
    setToggling(null);
  };

  if (loading) return (
    <div className="flex items-center gap-2 py-20 justify-center text-brand-text-secondary text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading staff…
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-heading font-bold">Staff Management</h2>
        <span className="text-xs text-brand-text-secondary">{members.length} member{members.length !== 1 ? 's' : ''}</span>
      </div>

      {members.length === 0 ? (
        <Card className="p-10 flex flex-col items-center gap-3 text-center">
          <Users className="w-10 h-10 text-brand-text-secondary/40" />
          <p className="font-semibold text-brand-text-primary">No approved staff yet</p>
          <p className="text-xs text-brand-text-secondary">Approve staff requests and they will appear here.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-brand-background/50 border-b border-black/5">
                  {['Name','Email','Tasks Created','Can Create Tasks',''].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 text-brand-text-primary">
                {members.map((m, i) => (
                  <motion.tr key={m.uid} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="hover:bg-brand-background/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-[11px] font-bold text-brand-primary shrink-0">
                          {m.fullName.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-sm">{m.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-text-secondary">{m.email}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{m.tasksCreated ?? 0}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePerm(m)}
                        disabled={toggling === m.uid}
                        className="flex items-center gap-2 text-xs font-medium transition-colors"
                      >
                        {toggling === m.uid
                          ? <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
                          : m.canCreateTask
                            ? <><ToggleRight className="w-6 h-6 text-brand-primary" /><span className="text-brand-primary">Enabled</span></>
                            : <><ToggleLeft className="w-6 h-6 text-brand-text-secondary" /><span className="text-brand-text-secondary">Disabled</span></>
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" className="text-[10px] h-7 px-3">View</Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

const AnalyticsPage = () => {
  const maxBar = Math.max(...analyticsCompletion.map(d => d.val));
  const total  = analyticsVolunteer.reduce((a, b) => a + b.val, 0);
  let cumAngle = 0;
  const slices = analyticsVolunteer.map((d, i) => {
    const angle = (d.val / total) * 360; const start = cumAngle; cumAngle += angle;
    const r=60; const cx=80; const cy=80; const toRad=(deg:number)=>(deg*Math.PI)/180;
    const x1=cx+r*Math.cos(toRad(start-90)); const y1=cy+r*Math.sin(toRad(start-90));
    const x2=cx+r*Math.cos(toRad(start+angle-90)); const y2=cy+r*Math.sin(toRad(start+angle-90));
    return { d:`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${angle>180?1:0} 1 ${x2} ${y2} Z`, color:pieColors[i], label:d.label, val:d.val };
  });
  return (
    <div className="space-y-6">
      <h2 className="text-base font-heading font-bold">Analytics & Insights</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-4">Task Completion Rate — This Week</p>
          <div className="flex items-end gap-2 h-36">
            {analyticsCompletion.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-brand-primary">{d.val}%</span>
                <motion.div className="w-full bg-brand-primary/80 rounded-t-md" style={{ height: 0 }}
                  animate={{ height: `${(d.val/maxBar)*100}%` }} transition={{ delay: i*0.05, duration: 0.5, ease: 'easeOut' }} />
                <span className="text-[10px] text-brand-text-secondary">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-4">Volunteer Activity by Category</p>
          <div className="flex items-center gap-6">
            <svg viewBox="0 0 160 160" className="w-32 h-32 shrink-0">
              {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} />)}
              <circle cx="80" cy="80" r="30" fill="white" />
            </svg>
            <div className="space-y-2">
              {analyticsVolunteer.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: pieColors[i] }} />
                  <span className="text-brand-text-secondary">{d.label}</span>
                  <span className="font-bold text-brand-text-primary ml-auto pl-4">{d.val}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const ActivityLogPage = ({ orgCode }: { orgCode: string }) => {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgCode) return;
    const q = query(
      collection(db, 'activityLogs'),
      where('orgCode', '==', orgCode),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    return onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => ({
        id:        d.id,
        user:      d.data().user      ?? 'System',
        action:    d.data().action    ?? '',
        createdAt: d.data().createdAt ?? null,
      })));
      setLoading(false);
    });
  }, [orgCode]);

  const formatTime = (ts: any): string => {
    if (!ts?.toDate) return '—';
    const d = ts.toDate() as Date;
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    if (isToday) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    if (isYesterday) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  if (loading) return (
    <div className="flex items-center gap-2 py-20 justify-center text-brand-text-secondary text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading activity…
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-heading font-bold">Activity Log</h2>
        <span className="text-xs text-brand-text-secondary">{entries.length} entries</span>
      </div>

      {entries.length === 0 ? (
        <Card className="p-10 flex flex-col items-center gap-3 text-center">
          <ScrollText className="w-10 h-10 text-brand-text-secondary/40" />
          <p className="font-semibold text-brand-text-primary">No activity yet</p>
          <p className="text-xs text-brand-text-secondary">Actions taken in your organisation will appear here.</p>
        </Card>
      ) : (
        <Card className="divide-y divide-black/5">
          {entries.map((e, i) => (
            <motion.div key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className="flex items-start gap-4 px-5 py-4">
              <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-brand-primary">
                  {e.user.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-brand-text-primary">
                  <span className="font-semibold">{e.user}</span> — {e.action}
                </p>
                <p className="text-[11px] text-brand-text-secondary mt-0.5">{formatTime(e.createdAt)}</p>
              </div>
            </motion.div>
          ))}
        </Card>
      )}
    </div>
  );
};

const ReportsPage = () => {
  const [preview, setPreview] = useState<{ title: string; dataUri: string } | null>(null);
  const handlePreview = (title: string) => setPreview({ title, dataUri: buildPDF(title) });
  return (
    <>
      <div className="space-y-4">
        <h2 className="text-base font-heading font-bold">Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Task Summary',       desc: 'All tasks, statuses, and assignees',  icon: ClipboardList },
            { title: 'Assignment List',    desc: 'Volunteer-to-task mapping export',    icon: GitBranch     },
            { title: 'Analytics Snapshot', desc: 'Completion rates and vol. activity', icon: BarChart2     },
          ].map((r, i) => (
            <Card key={i} className="p-5 flex flex-col gap-3">
              <div className="w-9 h-9 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                <r.icon className="w-4 h-4 text-brand-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-brand-text-primary">{r.title}</p>
                <p className="text-xs text-brand-text-secondary mt-0.5">{r.desc}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handlePreview(r.title)}
                className="gap-1.5 text-[10px] uppercase font-bold tracking-widest w-full justify-center mt-auto">
                <Download className="w-3 h-3" /> Preview & Download
              </Button>
            </Card>
          ))}
        </div>
      </div>
      {preview && <PDFViewer title={preview.title} dataUri={preview.dataUri} onClose={() => setPreview(null)} />}
    </>
  );
};

// ─── Settings — org code lives here only ──────────────────────────────────────

const SettingsPage = ({ profile }: { profile: any }) => {
  const [notifOn, setNotifOn] = useState(true);
  const [saved,   setSaved]   = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="space-y-4">
      {/* Org Code card — prominently at top of Settings */}
      <Card className="p-5 space-y-3 border border-brand-primary/25 bg-gradient-to-br from-brand-primary/5 to-brand-accent/5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Your Organisation Code</p>
          <p className="text-[11px] text-brand-text-secondary mt-0.5">Share this with your staff so they can join your organisation.</p>
        </div>
        {profile?.orgCode ? (
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-white rounded-xl px-4 py-3 border border-brand-primary/20 flex items-center gap-3">
              <span className="font-mono text-2xl font-bold text-brand-primary tracking-[0.2em]">{profile.orgCode}</span>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(profile.orgCode)}
              className="px-4 py-3 rounded-xl bg-brand-primary text-white text-xs font-bold hover:opacity-90 transition-opacity shrink-0"
            >
              Copy Code
            </button>
          </div>
        ) : (
          <span className="text-sm text-amber-600 font-semibold">Pending approval — code will appear here once approved.</span>
        )}
      </Card>

      <Card className="p-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Organisation Profile</p>
        {[
          { label: 'Full Name',   value: profile?.fullName   ?? '' },
          { label: 'Email',       value: profile?.email      ?? '' },
          { label: 'Org Name',    value: profile?.orgName    ?? '' },
          { label: 'Org Type',    value: profile?.orgType    ?? '' },
          { label: 'Org Size',    value: profile?.orgSize    ?? '' },
          { label: 'Reg. Number', value: profile?.regNum     ?? '' },
          { label: 'Website',     value: profile?.orgWebsite ?? '' },
        ].map(f => (
          <div key={f.label} className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">{f.label}</label>
            <input defaultValue={f.value}
              className="w-full px-3 py-2 rounded-lg bg-brand-background border border-black/10 focus:border-brand-primary outline-none text-sm" />
          </div>
        ))}
      </Card>
      <Card className="p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-text-primary">Notifications</p>
          <p className="text-xs text-brand-text-secondary mt-0.5">Task assignments and platform updates</p>
        </div>
        <button onClick={() => setNotifOn(v => !v)} className="flex items-center gap-2">
          {notifOn
            ? <><Wifi className="w-5 h-5 text-brand-primary" /><span className="text-xs font-medium text-brand-primary">On</span></>
            : <><WifiOff className="w-5 h-5 text-brand-text-secondary" /><span className="text-xs font-medium text-brand-text-secondary">Off</span></>}
        </button>
      </Card>
      <Button className="w-full gap-2" onClick={save}>
        {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
      </Button>
    </div>
  );
};

// ─── Nav ───────────────────────────────────────────────────────────────────────

const NAV = [
  { key: 'dashboard',  label: 'Dashboard',       icon: LayoutDashboard },
  { key: 'tasks',      label: 'Tasks',            icon: ClipboardList   },
  { key: 'allocation', label: 'Allocation',       icon: GitBranch       },
  { key: 'staff',      label: 'Staff Management', icon: Users           },
  { key: 'requests',   label: 'Staff Requests',   icon: UserCheck       },
  { key: 'analytics',  label: 'Analytics',        icon: BarChart2       },
  { key: 'log',        label: 'Activity Log',     icon: ScrollText      },
  { key: 'reports',    label: 'Reports',          icon: FileDown        },
  { key: 'settings',   label: 'Settings',         icon: Settings        },
] as const;

type NavKey = typeof NAV[number]['key'];

// ─── Main export ───────────────────────────────────────────────────────────────

export const OrgAdminDashboard = () => {
  const [active, setActive] = useState<NavKey>('dashboard');
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const orgCode = profile?.orgCode;
    if (!orgCode) return;
    const q = query(
      collection(db, 'users'),
      where('orgCodeUsed', '==', orgCode),
      where('status', '==', 'pending'),
    );
    return onSnapshot(q, snap => setPendingCount(snap.size));
  }, [profile?.orgCode]);

  const displayName = profile?.fullName ?? 'Org Admin';
  const initials    = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const orgName     = profile?.orgName ?? 'Your Organisation';
  // Fix TS error: guarantee string for orgCode
  const orgCode     = profile?.orgCode ?? '';

  const handleLogout = async () => { await logOut(); navigate('/login'); };

  const PageMap: Record<NavKey, ReactElement> = {
    dashboard:  <DashboardHome />,
    tasks:      <TasksPage orgCode={orgCode} />,
    allocation: <AllocationPage />,
    staff:      <StaffManagementPage orgCode={orgCode} />,
    requests:   <StaffRequestsPage orgCode={orgCode} />,
    analytics:  <AnalyticsPage />,
    log:        <ActivityLogPage orgCode={orgCode} />,
    reports:    <ReportsPage />,
    settings:   <SettingsPage profile={profile} />,
  };

  const navLabel: Record<NavKey, string> = {
    dashboard: 'Dashboard', tasks: 'Tasks', allocation: 'Allocation',
    staff: 'Staff Management', requests: 'Staff Requests',
    analytics: 'Analytics', log: 'Activity Log',
    reports: 'Reports', settings: 'Settings',
  };

  return (
    <>
      {/* ── Themed scrollbar styles ── */}
      <style>{`
        .themed-scroll {
          scroll-behavior: smooth;
        }
        .themed-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .themed-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .themed-scroll::-webkit-scrollbar-thumb {
          background: rgba(124, 58, 237, 0.25);
          border-radius: 99px;
          transition: background 0.2s;
        }
        .themed-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 58, 237, 0.5);
        }
        .sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 99px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>

      <div className="flex h-screen bg-brand-background overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className="hidden md:flex flex-col w-64 h-screen bg-brand-primary text-white shrink-0 sticky top-0">
          <div className="p-6 flex flex-col h-full">
            <div className="mb-8"><Logo /></div>

            <div className="mb-6 px-4 py-3 bg-white/10 rounded-[8px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Org Admin</p>
              <p className="text-sm font-semibold text-white mt-0.5 truncate">{orgName}</p>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto sidebar-scroll">
              {NAV.map(item => (
                <button key={item.key} onClick={() => setActive(item.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[8px] transition-all text-left
                    ${active === item.key ? 'bg-white/10 text-brand-accent font-semibold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="font-medium text-sm flex-1">{item.label}</span>
                  {item.key === 'requests' && pendingCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Org code removed from sidebar — now in Settings only */}

            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center gap-3 px-4">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">{initials}</div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{displayName}</p>
                  <p className="text-[10px] text-white/50">Org Admin</p>
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
          {NAV.slice(0, 5).map(item => (
            <button key={item.key} onClick={() => setActive(item.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors min-w-[60px] relative
                ${active === item.key ? 'text-brand-accent' : 'text-white/60'}`}>
              <item.icon className="w-4 h-4" />
              {item.key === 'requests' && pendingCount > 0 && (
                <span className="absolute top-1.5 right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
              {item.label.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0 themed-scroll">
          <div className="px-6 py-5 border-b border-black/5 bg-white flex items-center justify-between sticky top-0 z-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Organisation Admin</p>
              <h1 className="text-lg font-heading font-bold text-brand-text-primary">{navLabel[active]}</h1>
            </div>
            {active !== 'requests' && pendingCount > 0 && (
              <button
                onClick={() => setActive('requests')}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
              >
                <Bell className="w-3.5 h-3.5" />
                {pendingCount} staff request{pendingCount > 1 ? 's' : ''} pending
              </button>
            )}
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
    </>
  );
};