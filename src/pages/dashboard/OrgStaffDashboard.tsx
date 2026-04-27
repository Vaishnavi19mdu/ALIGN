import { useState, useEffect, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ClipboardList, CheckSquare, MessageSquare, BookOpen,
  CheckCircle2, XCircle, Star, Send, Plus, LogOut, ShieldCheck, ShieldOff,
  Loader2, X, AlertCircle, FileDown,
} from 'lucide-react';
import { doc, onSnapshot, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';
import { logOut } from '../../lib/authService';
import { useNavigate } from 'react-router-dom';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CreateTaskForm {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  category: string;
  deadline: string;
}

// ─── Dummy data ────────────────────────────────────────────────────────────────

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
  { user: 'Meena N.',   time: '10:30 AM',  message: 'Need 2 more volunteers for Task T-203 (Flood Relief). Urgent!' },
  { user: 'Karthik R.', time: '09:15 AM',  message: 'Task T-204 delayed by 1 day due to venue issue. Updated status.' },
  { user: 'Divya P.',   time: 'Yesterday', message: 'Great job team — T-199 completed ahead of schedule.' },
];

// ─── Resources data with real PDFs ────────────────────────────────────────────

const resources = [
  {
    title: 'How to Verify Task Completion',
    type: 'Guide',
    icon: '📋',
    desc: 'Step-by-step process for reviewing and approving volunteer-submitted task completions.',
    pdfUrl: 'https://drive.google.com/file/d/1KHer_oOP9HoEmyQs58MugiFRl5JWWnlB/preview',
    color: 'bg-brand-primary/10 text-brand-primary',
  },
  {
    title: 'Volunteer Onboarding Guidelines',
    type: 'PDF',
    icon: '📄',
    desc: 'Everything a new volunteer needs to know — roles, responsibilities, and first steps.',
    pdfUrl: 'https://drive.google.com/file/d/1GulUam079-bcAdGz3lS7ApSC-la8aa83/preview',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Emergency Response Protocol',
    type: 'Guide',
    icon: '🚨',
    desc: 'Critical procedures for flood relief, medical emergencies, and disaster response.',
    pdfUrl: 'https://drive.google.com/file/d/1JraXuNBOAohCKqwHzmgFF6q9mAv2xkJc/preview',
    color: 'bg-red-50 text-red-500',
  },
  {
    title: 'FAQs — Common Staff Queries',
    type: 'FAQ',
    icon: '❓',
    desc: 'Answers to the most common questions raised by org staff across all modules.',
    pdfUrl: 'https://drive.google.com/file/d/1X50J5bCei2AGc3cKH88Bwehu-spH1gJI/preview',
    color: 'bg-amber-50 text-amber-600',
  },
];// ─── Helpers ───────────────────────────────────────────────────────────────────

const statusStyle = (s: string) => {
  if (s === 'Completed')   return 'bg-green-100 text-green-700';
  if (s === 'In Progress') return 'bg-blue-100 text-blue-600';
  return 'bg-black/5 text-brand-text-secondary';
};

// ─── Create Task Modal ─────────────────────────────────────────────────────────

const CreateTaskModal = ({
  onClose,
  orgCode,
  staffName,
}: {
  onClose: () => void;
  orgCode: string;
  staffName: string;
}) => {
  const [form, setForm] = useState<CreateTaskForm>({
    title: '',
    description: '',
    priority: 'Medium',
    category: '',
    deadline: '',
  });
  const [saving, setSaving] = useState(false);
  const [done,   setDone]   = useState(false);
  const [error,  setError]  = useState('');

  const set = (field: keyof CreateTaskForm, val: string) =>
    setForm(prev => ({ ...prev, [field]: val }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Task title is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await addDoc(collection(db, 'tasks'), {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        category: form.category.trim(),
        deadline: form.deadline,
        status: 'Open',
        createdBy: staffName,
        orgCode,
        assignedTo: 'Unassigned',
        createdAt: serverTimestamp(),
      });
      setDone(true);
      setTimeout(onClose, 1400);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create task. Please try again.');
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
          initial={{ scale: 0.94, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 bg-brand-primary">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">New Task</p>
              <h2 className="text-base font-heading font-bold text-white">Create Task</h2>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {done ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <p className="font-bold text-brand-text-primary">Task created!</p>
              <p className="text-xs text-brand-text-secondary">It has been added to the task pool.</p>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">
                  Task Title <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Community Health Camp Setup"
                  className="w-full px-3 py-2.5 rounded-xl border border-black/10 focus:border-brand-primary outline-none text-sm bg-brand-background transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="What needs to be done? Add any relevant details…"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-black/10 focus:border-brand-primary outline-none text-sm bg-brand-background transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => set('priority', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-black/10 focus:border-brand-primary outline-none text-sm bg-brand-background transition-colors"
                  >
                    {(['Low', 'Medium', 'High', 'Emergency'] as const).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Category</label>
                  <input
                    value={form.category}
                    onChange={e => set('category', e.target.value)}
                    placeholder="e.g. Medical, Relief…"
                    className="w-full px-3 py-2.5 rounded-xl border border-black/10 focus:border-brand-primary outline-none text-sm bg-brand-background transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Deadline</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={e => set('deadline', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-black/10 focus:border-brand-primary outline-none text-sm bg-brand-background transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="ghost" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
                <Button size="sm" onClick={handleSubmit} disabled={saving} className="flex-1 gap-1.5">
                  {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : <><Plus className="w-3.5 h-3.5" /> Create Task</>}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Sub-pages ─────────────────────────────────────────────────────────────────

const StaffHome = ({ canCreateTask, onCreateTask }: { canCreateTask: boolean; onCreateTask: () => void }) => (
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

    {!canCreateTask && (
      <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
        <ShieldOff className="w-4 h-4 shrink-0" />
        <span><span className="font-semibold">Task creation disabled.</span> Your org admin has not granted you permission yet.</span>
      </div>
    )}

    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-heading font-bold">My Tasks</h2>
        {canCreateTask && (
          <Button size="sm" onClick={onCreateTask} className="gap-1.5 text-[10px] uppercase font-bold tracking-widest">
            <Plus className="w-3 h-3" /> Create Task
          </Button>
        )}
      </div>
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

const TasksPage = ({ canCreateTask, onCreateTask }: { canCreateTask: boolean; onCreateTask: () => void }) => {
  const [tasks, setTasks] = useState(staffTasks);
  const statusOptions = ['Open', 'In Progress', 'Completed'] as const;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-heading font-bold">Tasks</h2>
        {canCreateTask && (
          <Button size="sm" onClick={onCreateTask} className="gap-1.5 text-[10px] uppercase font-bold tracking-widest">
            <Plus className="w-3 h-3" /> Create Task
          </Button>
        )}
      </div>
      {!canCreateTask && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <ShieldOff className="w-4 h-4 shrink-0" />
          <span><span className="font-semibold">Note:</span> Task creation is currently disabled by your org admin.</span>
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

// ─── PDF Preview Modal ─────────────────────────────────────────────────────────

const ResourcePDFModal = ({
  resource,
  onClose,
}: {
  resource: typeof resources[number];
  onClose: () => void;
}) => {
  const handleDownload = () => {
  const fileId = resource.pdfUrl.split('/d/')[1].split('/')[0];
  const a = document.createElement('a');
  a.href = `https://drive.google.com/uc?export=download&id=${fileId}`;
  a.download = `${resource.title.replace(/\s+/g, '_')}.pdf`;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ width: '90vw', maxWidth: 860, height: '88vh' }}
          initial={{ scale: 0.93, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/8 bg-brand-background shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xl">{resource.icon}</span>
              <div>
                <p className="text-sm font-heading font-bold text-brand-text-primary leading-tight">{resource.title}</p>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${resource.color}`}>
                  {resource.type}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleDownload} className="gap-1.5 text-[10px] uppercase font-bold tracking-widest">
                <FileDown className="w-3 h-3" /> Download
              </Button>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/8 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PDF iframe */}
          <div className="flex-1 bg-neutral-200 overflow-hidden">
            <iframe
              src={resource.pdfUrl}
              className="w-full h-full border-0"
              title={resource.title}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Resources Page ────────────────────────────────────────────────────────────

const ResourcesPage = () => {
  const [selected, setSelected] = useState<typeof resources[number] | null>(null);

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-base font-heading font-bold">Training & Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Card
                className="p-5 flex items-start gap-4 hover:border-brand-primary/30 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setSelected(r)}
              >
                <div className="text-2xl shrink-0 mt-0.5">{r.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-brand-text-primary group-hover:text-brand-primary transition-colors">
                    {r.title}
                  </p>
                  <p className="text-[11px] text-brand-text-secondary mt-1 leading-relaxed">{r.desc}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${r.color}`}>
                      {r.type}
                    </span>
                    <span className="text-[10px] text-brand-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <FileDown className="w-2.5 h-2.5" /> Open PDF →
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {selected && (
        <ResourcePDFModal resource={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
};

// ─── Nav ───────────────────────────────────────────────────────────────────────

const BASE_NAV = [
  { key: 'dashboard', label: 'Dashboard',     icon: LayoutDashboard },
  { key: 'tasks',     label: 'Tasks',         icon: ClipboardList   },
  { key: 'verify',    label: 'Verify',        icon: CheckSquare     },
  { key: 'collab',    label: 'Collaboration', icon: MessageSquare   },
  { key: 'resources', label: 'Resources',     icon: BookOpen        },
] as const;

type NavKey = typeof BASE_NAV[number]['key'] | 'create_task';

// ─── Main export ───────────────────────────────────────────────────────────────

export const OrgStaffDashboard = () => {
  const [active, setActive] = useState<Exclude<NavKey, 'create_task'>>('dashboard');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const [canCreateTask, setCanCreateTask] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    return onSnapshot(doc(db, 'users', user.uid), snap => {
      if (snap.exists()) setCanCreateTask(snap.data().canCreateTask === true);
    });
  }, [user?.uid]);

  const [resolvedOrgName, setResolvedOrgName] = useState<string>('');

  useEffect(() => {
    if (profile?.orgName) { setResolvedOrgName(profile.orgName); return; }
    const orgCodeUsed = profile?.orgCodeUsed ?? profile?.orgCode;
    if (!orgCodeUsed) return;
    const q = query(
      collection(db, 'users'),
      where('orgCode', '==', orgCodeUsed),
      where('role', '==', 'org_admin'),
    );
    getDocs(q).then(snap => {
      if (!snap.empty) setResolvedOrgName(snap.docs[0].data().orgName ?? '');
    });
  }, [profile?.orgName, profile?.orgCodeUsed, profile?.orgCode]);

  const handleLogout = async () => { await logOut(); navigate('/login'); };

  const initials = (profile?.fullName ?? 'OS')
    .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const displayName = profile?.fullName ?? 'Org Staff';
  const orgCode = profile?.orgCodeUsed ?? profile?.orgCode ?? '';

  const permissionLoading = canCreateTask === null;
  const openCreateTask = () => setShowCreateModal(true);

  const PageMap: Record<Exclude<NavKey, 'create_task'>, ReactElement> = {
    dashboard: <StaffHome canCreateTask={canCreateTask ?? false} onCreateTask={openCreateTask} />,
    tasks:     <TasksPage canCreateTask={canCreateTask ?? false} onCreateTask={openCreateTask} />,
    verify:    <VerifyPage />,
    collab:    <CollabPage />,
    resources: <ResourcesPage />,
  };

  const navLabel: Record<Exclude<NavKey, 'create_task'>, string> = {
    dashboard: 'Dashboard', tasks: 'Tasks', verify: 'Verify Volunteers',
    collab: 'Collaboration', resources: 'Resources',
  };

  return (
    <>
      <style>{`
        .themed-scroll { scroll-behavior: smooth; }
        .themed-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .themed-scroll::-webkit-scrollbar-track { background: transparent; }
        .themed-scroll::-webkit-scrollbar-thumb { background: rgba(124, 58, 237, 0.25); border-radius: 99px; }
        .themed-scroll::-webkit-scrollbar-thumb:hover { background: rgba(124, 58, 237, 0.5); }
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 99px; }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
      `}</style>

      <div className="flex h-screen bg-brand-background overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className="hidden md:flex flex-col w-64 h-screen bg-brand-primary text-white shrink-0 sticky top-0">
          <div className="p-6 flex flex-col h-full">

            <div className="mb-8"><Logo /></div>

            <div className="mb-6 px-4 py-3 bg-white/10 rounded-[8px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Org Staff</p>
              <p className="text-sm font-semibold text-white mt-0.5 truncate">{resolvedOrgName || '—'}</p>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto sidebar-scroll">
              {BASE_NAV.map(item => (
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

              {canCreateTask && (
                <motion.button
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  onClick={openCreateTask}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-[8px] transition-all text-left mt-1
                    bg-brand-accent/20 text-brand-accent hover:bg-brand-accent/30 border border-brand-accent/20"
                >
                  <Plus className="w-5 h-5 shrink-0" />
                  <span className="font-semibold text-sm">Create Task</span>
                </motion.button>
              )}
            </nav>

            {/* Permission panel */}
            <div className="my-4 rounded-[8px] overflow-hidden border border-white/10">
              <div className="px-4 py-2.5 bg-white/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Permissions</p>
              </div>
              <div className="px-4 py-3 flex items-center gap-3">
                {permissionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 text-white/50 animate-spin shrink-0" />
                    <span className="text-xs text-white/50">Fetching permissions…</span>
                  </>
                ) : canCreateTask ? (
                  <>
                    <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-green-300">Task Creation</p>
                      <p className="text-[10px] text-white/40">Enabled by org admin</p>
                    </div>
                    <div className="ml-auto w-2 h-2 rounded-full bg-green-400 shrink-0" />
                  </>
                ) : (
                  <>
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <ShieldOff className="w-4 h-4 text-white/30" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white/50">Task Creation</p>
                      <p className="text-[10px] text-white/30">Not granted yet</p>
                    </div>
                    <div className="ml-auto w-2 h-2 rounded-full bg-white/20 shrink-0" />
                  </>
                )}
              </div>
            </div>

            {/* User + logout */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center gap-3 px-4">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{displayName}</p>
                  <p className="text-[10px] text-white/50 capitalize">{profile?.role ?? 'org_staff'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 w-full text-white/70 hover:text-white hover:bg-white/5 rounded-[8px] transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">Logout</span>
              </button>
            </div>

          </div>
        </aside>

        {/* Mobile bottom tabs */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-primary flex z-40">
          {BASE_NAV.map(item => (
            <button key={item.key} onClick={() => setActive(item.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors
                ${active === item.key ? 'text-brand-accent' : 'text-white/60'}`}>
              <item.icon className="w-4 h-4" />
              {item.label.split(' ')[0]}
            </button>
          ))}
          {canCreateTask && (
            <button onClick={openCreateTask}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors text-brand-accent">
              <Plus className="w-4 h-4" />
              Create
            </button>
          )}
        </div>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0 themed-scroll">
          <div className="px-6 py-5 border-b border-black/5 bg-white flex items-center justify-between sticky top-0 z-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Organisation Staff</p>
              <h1 className="text-lg font-heading font-bold text-brand-text-primary">{navLabel[active]}</h1>
            </div>
            {canCreateTask && (
              <Button size="sm" onClick={openCreateTask} className="gap-1.5 text-[10px] uppercase font-bold tracking-widest hidden md:flex">
                <Plus className="w-3 h-3" /> Create Task
              </Button>
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

      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          orgCode={orgCode}
          staffName={displayName}
        />
      )}
    </>
  );
};