import { useState, useEffect, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ClipboardList, Bell, Settings, LogOut,
  MapPin, Zap, CheckCircle2, Clock, ChevronDown,
  Star, Target, Navigation, Award, Save, WifiOff, Wifi,
  AlertCircle, Loader2, Calendar, Building2,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { logOut } from '../../lib/authService';
import { useNavigate } from 'react-router-dom';
import { LocationSection } from './LocationSection';
import { getDistanceKm, formatDistance } from '../../lib/locationUtils';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../lib/firebase'; // adjust path if needed

// ─── Types ───────────────────────────────────────────────────────────────────

type TaskStatus = 'new' | 'active' | 'completed';
type TaskSource = 'dummy' | 'firestore';

interface VolunteerTask {
  id: string;
  firestoreId?: string; // original Firestore doc ID
  title: string;
  location: string;
  date: string;
  status: TaskStatus;
  urgency: 'Low' | 'High' | 'Critical';
  skill: string;
  distance: string;
  whyChosen: { skillMatch: number; distance: string; availability: string };
  source: TaskSource;
  // Firestore extras
  description?: string;
  category?: string;
  orgCode?: string;
  deadline?: string;
  hoursLogged?: number;
  createdBy?: string;
}

// ─── Static Data ─────────────────────────────────────────────────────────────

const DUMMY_TASKS: VolunteerTask[] = [
  { id: 'VT-441', title: 'Senior Tech Mentor', location: 'Public Library, Anna Nagar', date: 'Oct 24, 14:00', status: 'new', urgency: 'High', skill: 'Teaching', distance: '1.2 km', whyChosen: { skillMatch: 94, distance: '1.2 km', availability: 'Full match' }, source: 'dummy' },
  { id: 'VT-442', title: 'Food Bank Sorter', location: 'Main Warehouse, T.Nagar', date: 'Oct 26, 09:00', status: 'active', urgency: 'Critical', skill: 'Logistics', distance: '3.4 km', whyChosen: { skillMatch: 88, distance: '3.4 km', availability: 'Morning slot' }, source: 'dummy' },
  { id: 'VT-438', title: 'Flood Relief Ops Support', location: 'Community Centre, Adyar', date: 'Oct 20, 08:00', status: 'completed', urgency: 'High', skill: 'First Aid', distance: '5.1 km', whyChosen: { skillMatch: 91, distance: '5.1 km', availability: 'Weekend' }, source: 'dummy' },
  { id: 'VT-435', title: 'Ration Kit Packing', location: 'NGO Hub, Mylapore', date: 'Oct 18, 10:00', status: 'completed', urgency: 'Low', skill: 'Logistics', distance: '4.0 km', whyChosen: { skillMatch: 79, distance: '4.0 km', availability: 'Flexible' }, source: 'dummy' },
];

const NEARBY = [
  { id: 'NT-101', title: 'Tree Planting Drive', location: 'Marina Beach', distance: '0.8 km', skill: 'General', fit: 87 },
  { id: 'NT-102', title: 'Health Camp Assistant', location: 'Govt. Hospital, Egmore', distance: '2.2 km', skill: 'First Aid', fit: 92 },
  { id: 'NT-103', title: 'Ration Kit Packing', location: 'NGO Hub, Mylapore', distance: '3.0 km', skill: 'Logistics', fit: 79 },
];

const DUMMY_NOTIFS = [
  { id: 1, type: 'assignment', text: 'New task assigned: Senior Tech Mentor', time: '10 min ago', read: false },
  { id: 2, type: 'reminder', text: 'Reminder: Food Bank Sorter starts in 2 days', time: '1 hr ago', read: false },
  { id: 3, type: 'badge', text: 'You earned the "Consistent Volunteer" badge!', time: '2 days ago', read: true },
];

const SKILL_OPTIONS = ['Teaching', 'Logistics', 'First Aid', 'Driving', 'Cooking', 'Medical', 'Tech', 'Construction'];
const TIME_SLOTS = ['Weekday Morning', 'Weekday Evening', 'Weekend Morning', 'Weekend Evening', 'Flexible'];

// ─── Firestore → VolunteerTask mapper ────────────────────────────────────────

const priorityToUrgency = (p: string): VolunteerTask['urgency'] => {
  if (!p) return 'Low';
  const lower = p.toLowerCase();
  if (lower === 'emergency' || lower === 'critical') return 'Critical';
  if (lower === 'high') return 'High';
  return 'Low';
};

const firestoreStatusToLocal = (s: string): TaskStatus => {
  if (!s) return 'new';
  const lower = s.toLowerCase();
  if (lower === 'completed' || lower === 'done') return 'completed';
  if (lower === 'in progress' || lower === 'active' || lower === 'assigned') return 'active';
  return 'new'; // Open, Unassigned, etc.
};

const formatDeadline = (deadline: string): string => {
  if (!deadline) return 'TBD';
  try {
    const d = new Date(deadline);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return deadline;
  }
};

let fsTaskCounter = 1;
const mapFirestoreTask = (docId: string, data: Record<string, unknown>): VolunteerTask => {
  const idx = fsTaskCounter++;
  return {
    id: `FS-${String(idx).padStart(3, '0')}`,
    firestoreId: docId,
    title: (data.title as string) ?? 'Untitled Task',
    location: (data.location as string) ?? 'Location TBD',
    date: formatDeadline(data.deadline as string),
    status: firestoreStatusToLocal(data.status as string),
    urgency: priorityToUrgency(data.priority as string),
    skill: (data.category as string) ?? 'General',
    distance: '—',
    whyChosen: { skillMatch: Math.floor(75 + Math.random() * 20), distance: '—', availability: 'Check schedule' },
    source: 'firestore',
    description: data.description as string,
    category: data.category as string,
    orgCode: data.orgCode as string,
    deadline: data.deadline as string,
    hoursLogged: data.hoursLogged as number,
    createdBy: data.createdBy as string,
  };
};

// ─── Sort: active/new first, completed last ───────────────────────────────────
const sortTasks = (tasks: VolunteerTask[]) => [
  ...tasks.filter(t => t.status === 'new'),
  ...tasks.filter(t => t.status === 'active'),
  ...tasks.filter(t => t.status === 'completed'),
];

// ─── Styling helpers ──────────────────────────────────────────────────────────

const urgencyStyle = (u: string) =>
  u === 'Critical' ? 'bg-red-100 text-red-600' : u === 'High' ? 'bg-amber-100 text-amber-600' : 'bg-black/5 text-brand-text-secondary';
const statusStyle = (s: string) =>
  s === 'new' ? 'bg-blue-100 text-blue-600' : s === 'active' ? 'bg-green-100 text-green-600' : 'bg-black/5 text-brand-text-secondary';
const statusLabel = (s: string) => s === 'new' ? 'New' : s === 'active' ? 'Active' : 'Done';

// ─── Groq AI Allocation Engine ────────────────────────────────────────────────

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;

interface AllocationResult {
  skillMatch: number;
  proximityScore: number;
  availabilityFit: string;
  reasoning: string;
  tags: string[];
}

const fetchAllocationReasoning = async (task: VolunteerTask): Promise<AllocationResult> => {
  const prompt = `You are an AI Volunteer Allocation Engine. Given a task, produce a short allocation report explaining why this volunteer was selected.

Task details:
- Title: ${task.title}
- Category/Skill: ${task.skill}
- Location: ${task.location}
- Urgency: ${task.urgency}
- Deadline: ${task.date}
${task.description ? `- Description: ${task.description}` : ''}

Respond ONLY with a valid JSON object, no markdown, no explanation outside JSON:
{
  "skillMatch": <integer 70-99>,
  "proximityScore": <integer 60-99>,
  "availabilityFit": "<2-3 word phrase>",
  "reasoning": "<2 concise sentences explaining why the volunteer is a strong match>",
  "tags": ["<tag1>", "<tag2>", "<tag3>"]
}`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) throw new Error('Groq request failed');
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(raw.replace(/```json|```/g, '').trim()) as AllocationResult;
};

// ─── TaskCard ─────────────────────────────────────────────────────────────────

const TaskCard = ({
  task, onAccept, onComplete,
}: {
  task: VolunteerTask;
  onAccept: (id: string) => void;
  onComplete: (id: string, firestoreId?: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [aiResult, setAiResult] = useState<AllocationResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);
  const isFirestore = task.source === 'firestore';

  const handleExpand = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !aiResult && !aiLoading) {
      setAiLoading(true);
      setAiError(false);
      try {
        const result = await fetchAllocationReasoning(task);
        setAiResult(result);
      } catch {
        setAiError(true);
      } finally {
        setAiLoading(false);
      }
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: task.status === 'completed' ? 0.55 : 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="overflow-hidden">
        <div className="p-5 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-brand-text-primary">{task.title}</p>
                {isFirestore && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-brand-primary/10 text-brand-primary uppercase tracking-wide">Live</span>
                )}
              </div>
              <p className="text-[10px] text-brand-text-secondary font-mono mt-0.5">{task.id}</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${urgencyStyle(task.urgency)}`}>{task.urgency}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusStyle(task.status)}`}>{statusLabel(task.status)}</span>
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-brand-text-secondary">
            <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-brand-primary shrink-0" />{task.location}</div>
            <div className="flex items-center gap-1.5">
              {isFirestore
                ? <Calendar className="w-3 h-3 text-brand-primary shrink-0" />
                : <Clock className="w-3 h-3 text-brand-primary shrink-0" />}
              {task.date}
            </div>
            <div className="flex items-center gap-1.5"><Target className="w-3 h-3 text-brand-primary shrink-0" />{task.skill}</div>
            {isFirestore && task.orgCode
              ? <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3 text-brand-primary shrink-0" />{task.orgCode}</div>
              : <div className="flex items-center gap-1.5"><Navigation className="w-3 h-3 text-brand-primary shrink-0" />{task.distance}</div>}
          </div>

          {/* Description (Firestore only) */}
          {isFirestore && task.description && (
            <p className="text-[11px] text-brand-text-secondary bg-brand-background rounded-lg px-3 py-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Why chosen — AI Allocation Engine */}
          <button onClick={handleExpand} className="flex items-center gap-1.5 text-[11px] font-bold text-brand-primary hover:opacity-75 transition-opacity">
            <Zap className="w-3 h-3" /> AI Allocation Engine
            <span className="text-[9px] font-normal text-brand-text-secondary ml-0.5">ALIGN LOGIC</span>
            <ChevronDown className={`w-3 h-3 transition-transform ml-auto ${expanded ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                {aiLoading && (
                  <div className="flex items-center gap-2 py-3 text-[11px] text-brand-text-secondary">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                    Analysing volunteer profile…
                  </div>
                )}
                {aiError && (
                  <p className="text-[11px] text-red-500 py-2">Failed to load AI analysis. Check your Groq key.</p>
                )}
                {aiResult && (
                  <div className="space-y-3 pt-1">
                    {/* Score chips */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Skill Match', value: `${aiResult.skillMatch}%`, color: 'text-brand-primary' },
                        { label: 'Proximity', value: `${aiResult.proximityScore}%`, color: 'text-blue-600' },
                        { label: 'Availability', value: aiResult.availabilityFit, color: 'text-green-600' },
                      ].map(m => (
                        <div key={m.label} className="bg-brand-background rounded-lg px-3 py-2 text-center">
                          <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                          <p className="text-[9px] text-brand-text-secondary uppercase tracking-wide mt-0.5">{m.label}</p>
                        </div>
                      ))}
                    </div>
                    {/* AI reasoning */}
                    <div className="bg-brand-primary/5 border border-brand-primary/15 rounded-lg px-3 py-2.5 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-primary flex items-center gap-1.5">
                        <Zap className="w-3 h-3" /> Allocation Reasoning
                      </p>
                      <p className="text-[11px] text-brand-text-secondary leading-relaxed">{aiResult.reasoning}</p>
                      {aiResult.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {aiResult.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full text-[9px] font-semibold">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {task.status === 'new' && (
              <>
                <Button className="flex-1 text-[10px] h-8 font-bold" onClick={() => onAccept(task.id)}>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Accept
                </Button>
                <Button variant="ghost" className="flex-1 text-[10px] h-8 font-bold">Decline</Button>
              </>
            )}
            {task.status === 'active' && (
              <Button
                className="flex-1 text-[10px] h-8 bg-green-600 hover:bg-green-700 font-bold"
                onClick={() => onComplete(task.id, task.firestoreId)}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Complete
              </Button>
            )}
            {task.status === 'completed' && (
              <div className="flex-1 flex items-center justify-center gap-1.5 text-[11px] text-green-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// ─── DashboardPage ────────────────────────────────────────────────────────────

const DashboardPage = ({
  tasks, displayName, onAccept, onComplete, loading,
}: {
  tasks: VolunteerTask[];
  displayName: string;
  onAccept: (id: string) => void;
  onComplete: (id: string, firestoreId?: string) => void;
  loading: boolean;
}) => {
  const assigned = tasks.filter(t => t.status === 'new').length;
  const active = tasks.filter(t => t.status === 'active').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const featured = tasks.find(t => t.status === 'active') ?? tasks.find(t => t.status === 'new');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading font-bold text-brand-text-primary">Hey, {displayName.split(' ')[0]} 👋</h2>
        <p className="text-sm text-brand-text-secondary mt-0.5">Here's what's on your plate today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Assigned', value: assigned, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active', value: active, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Completed', value: completed, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className={`p-4 text-center ${s.bg}`}>
              {loading ? <div className="w-8 h-8 rounded bg-black/10 animate-pulse mx-auto" /> : <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>}
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary mt-0.5">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Featured */}
      {loading ? (
        <Card className="p-8 flex items-center justify-center gap-3 text-brand-text-secondary text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Fetching live tasks…
        </Card>
      ) : featured ? (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-brand-text-primary flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand-primary" /> Needs Your Attention
          </h3>
          <TaskCard task={featured} onAccept={onAccept} onComplete={onComplete} />
        </div>
      ) : null}

      {/* Nearby */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-brand-text-primary flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-primary" /> Nearby Tasks
          <span className="text-[10px] font-normal text-brand-text-secondary">You might be a good fit</span>
        </h3>
        {NEARBY.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="px-4 py-3 flex items-center justify-between gap-3 hover:border-brand-primary/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-brand-text-primary truncate">{t.title}</p>
                  <p className="text-[10px] text-brand-text-secondary">{t.location} · {t.distance}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-brand-primary">{t.fit}%</p>
                <p className="text-[9px] text-brand-text-secondary">fit score</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ─── TasksPage ────────────────────────────────────────────────────────────────

type TabKey = 'all' | 'new' | 'active' | 'completed';

const TasksPage = ({
  tasks, onAccept, onComplete, loading,
}: {
  tasks: VolunteerTask[];
  onAccept: (id: string) => void;
  onComplete: (id: string, firestoreId?: string) => void;
  loading: boolean;
}) => {
  const [tab, setTab] = useState<TabKey>('all');
  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: tasks.length },
    { key: 'new', label: 'New', count: tasks.filter(t => t.status === 'new').length },
    { key: 'active', label: 'Active', count: tasks.filter(t => t.status === 'active').length },
    { key: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'completed').length },
  ];
  const filtered = tab === 'all' ? tasks : tasks.filter(t => t.status === tab);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-brand-background rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.key ? 'bg-white text-brand-primary shadow-sm' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}>
            {t.label}
            {t.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${tab === t.key ? 'bg-brand-primary/10 text-brand-primary' : 'bg-black/5'}`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <Card className="p-8 flex items-center justify-center gap-3 text-brand-text-secondary text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading tasks…
        </Card>
      )}

      <AnimatePresence mode="wait">
        {!loading && (
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="space-y-3">
            {filtered.length === 0
              ? <Card className="p-10 text-center"><p className="text-sm text-brand-text-secondary">No {tab === 'all' ? '' : tab} tasks.</p></Card>
              : filtered.map(t => <TaskCard key={t.id} task={t} onAccept={onAccept} onComplete={onComplete} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── PerformancePage ──────────────────────────────────────────────────────────

const PerformancePage = ({ tasks }: { tasks: VolunteerTask[] }) => {
  const completed = tasks.filter(t => t.status === 'completed').length;
  const total = tasks.length;
  return (
    <div className="space-y-6">
      <Card className="p-6 flex flex-col items-center text-center gap-4">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90">
            <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-black/5" />
            <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray="339.29" strokeDashoffset={339.29 - (339.29 * 92 / 100)} className="text-brand-primary" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-brand-text-primary">92%</span>
            <span className="text-[10px] font-bold text-brand-text-secondary uppercase">Reliability</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full">
          <Award className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-amber-700">Trusted Volunteer</span>
        </div>
        <p className="text-sm text-brand-text-secondary">You complete tasks consistently and on time. Keep it up!</p>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Tasks Assigned', value: total, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completed', value: completed, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Completion Rate', value: `${total > 0 ? Math.round(completed / total * 100) : 0}%`, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
          { label: 'Trust Score', value: '9.2/10', color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((s, i) => (
          <Card key={i} className={`p-4 text-center ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-brand-text-primary">Badges</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '🏅', label: 'First Task', desc: 'Completed first assignment' },
            { icon: '⚡', label: 'Fast Responder', desc: 'Accepted within 1 hour' },
            { icon: '🔁', label: 'Consistent Volunteer', desc: '5 tasks in a row' },
            { icon: '🛡️', label: 'Trusted Volunteer', desc: '90%+ reliability score' },
          ].map((b, i) => (
            <Card key={i} className="p-4 flex items-start gap-3">
              <span className="text-2xl shrink-0">{b.icon}</span>
              <div>
                <p className="text-xs font-bold text-brand-text-primary">{b.label}</p>
                <p className="text-[10px] text-brand-text-secondary mt-0.5">{b.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── NotificationsPage ────────────────────────────────────────────────────────

const NotificationsPage = ({ notifs, onRead }: { notifs: typeof DUMMY_NOTIFS; onRead: (id: number) => void }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-base font-heading font-bold">Notifications</h2>
      <span className="text-[10px] text-brand-text-secondary">{notifs.filter(n => !n.read).length} unread</span>
    </div>
    <Card className="divide-y divide-black/5">
      {notifs.map(n => (
        <div key={n.id} onClick={() => onRead(n.id)}
          className={`flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-brand-background/30 transition-colors ${!n.read ? 'bg-brand-primary/5' : ''}`}>
          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-brand-primary' : 'bg-transparent'}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${!n.read ? 'font-semibold text-brand-text-primary' : 'text-brand-text-secondary'}`}>{n.text}</p>
            <p className="text-[10px] text-brand-text-secondary mt-0.5">{n.time}</p>
          </div>
          {n.type === 'assignment' && <AlertCircle className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />}
          {n.type === 'reminder' && <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
          {n.type === 'badge' && <Star className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
        </div>
      ))}
    </Card>
  </div>
);

// ─── SettingsPage ─────────────────────────────────────────────────────────────

const SettingsPage = ({ displayName }: { displayName: string }) => {
  const [name, setName] = useState(displayName);
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState<string[]>(['Teaching', 'Logistics']);
  const [slots, setSlots] = useState<string[]>(['Weekend Morning']);
  const [notifOn, setNotifOn] = useState(true);
  const [saved, setSaved] = useState(false);
  const toggle = (arr: string[], set: (v: string[]) => void, s: string) =>
    set(arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s]);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="space-y-4">

      {/* ── NEW: geolocation card ── */}
      <LocationSection />

      <Card className="p-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Profile</p>
        {[
          { label: 'Full Name', value: name, set: setName, type: 'text', ph: 'Your name' },
          { label: 'Phone', value: phone, set: setPhone, type: 'tel', ph: '+91 9876543210' },
          { label: 'Location (City)', value: location, set: setLocation, type: 'text', ph: 'Chennai, TN' },
        ].map(f => (
          <div key={f.label} className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">{f.label}</label>
            <input type={f.type} value={f.value} placeholder={f.ph} onChange={e => f.set(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-brand-background border border-black/10 focus:border-brand-primary outline-none text-sm" />
          </div>
        ))}
      </Card>
      <Card className="p-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Skills</p>
        <div className="flex flex-wrap gap-2">
          {SKILL_OPTIONS.map(s => (
            <button key={s} onClick={() => toggle(skills, setSkills, s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${skills.includes(s) ? 'bg-brand-primary text-white border-brand-primary' : 'bg-transparent text-brand-text-secondary border-black/10 hover:border-brand-primary'}`}>{s}</button>
          ))}
        </div>
      </Card>
      <Card className="p-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Availability</p>
        <div className="flex flex-wrap gap-2">
          {TIME_SLOTS.map(s => (
            <button key={s} onClick={() => toggle(slots, setSlots, s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${slots.includes(s) ? 'bg-brand-primary text-white border-brand-primary' : 'bg-transparent text-brand-text-secondary border-black/10 hover:border-brand-primary'}`}>{s}</button>
          ))}
        </div>
      </Card>
      <Card className="p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-text-primary">Notifications</p>
          <p className="text-xs text-brand-text-secondary mt-0.5">Task assignments and reminders</p>
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
// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'tasks', label: 'My Tasks', icon: ClipboardList },
  { key: 'performance', label: 'Performance', icon: Star },
  { key: 'notifications', label: 'Alerts', icon: Bell },
  { key: 'settings', label: 'Settings', icon: Settings },
] as const;

type NavKey = typeof NAV[number]['key'];

// ─── Root component ───────────────────────────────────────────────────────────

export const VolunteerDashboard = () => {
  const [active, setActive] = useState<NavKey>('dashboard');
  const [tasks, setTasks] = useState<VolunteerTask[]>(sortTasks(DUMMY_TASKS));
  const [notifs, setNotifs] = useState(DUMMY_NOTIFS);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);

  const { profile } = useAuth();
  const navigate = useNavigate();

  const displayName = profile?.fullName ?? 'Volunteer';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const unread = notifs.filter(n => !n.read).length;

  // ── Fetch Firestore tasks on mount ──────────────────────────────────────────
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        fsTaskCounter = 1; // reset counter for clean IDs
        const fetched: VolunteerTask[] = snapshot.docs.map(d =>
          mapFirestoreTask(d.id, d.data() as Record<string, unknown>)
        );
        // Merge: Firestore tasks first (de-duplicated by title), then dummy tasks
        const firestoreTitles = new Set(fetched.map(t => t.title.toLowerCase()));
        const filteredDummy = DUMMY_TASKS.filter(d => !firestoreTitles.has(d.title.toLowerCase()));
        setTasks(sortTasks([...fetched, ...filteredDummy]));
      } catch (err) {
        console.error('Failed to fetch Firestore tasks:', err);
        // Fall back to dummy data gracefully
        setTasks(sortTasks(DUMMY_TASKS));
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAccept = (id: string) => {
    setTasks(prev => sortTasks(prev.map(t => t.id === id ? { ...t, status: 'active' as const } : t)));
  };

  const handleComplete = async (id: string, firestoreId?: string) => {
    // Optimistic update immediately
    setTasks(prev => sortTasks(prev.map(t => t.id === id ? { ...t, status: 'completed' as const } : t)));

    // Write back to Firestore if it's a live task
    if (firestoreId) {
      try {
        await updateDoc(doc(db, 'tasks', firestoreId), { status: 'Completed' });
      } catch (err) {
        console.error('Failed to update Firestore task status:', err);
        // Rollback optimistic update on failure
        setTasks(prev => sortTasks(prev.map(t => t.id === id ? { ...t, status: 'active' as const } : t)));
      }
    }
  };

  const handleRead = (id: number) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const handleLogout = async () => { await logOut(); navigate('/login'); };

  const navLabel: Record<NavKey, string> = {
    dashboard: 'Dashboard', tasks: 'My Tasks', performance: 'Performance',
    notifications: 'Notifications', settings: 'Settings',
  };

  const PageMap: Record<NavKey, ReactElement> = {
    dashboard: <DashboardPage tasks={tasks} displayName={displayName} onAccept={handleAccept} onComplete={handleComplete} loading={loading} />,
    tasks: <TasksPage tasks={tasks} onAccept={handleAccept} onComplete={handleComplete} loading={loading} />,
    performance: <PerformancePage tasks={tasks} />,
    notifications: <NotificationsPage notifs={notifs} onRead={handleRead} />,
    settings: <SettingsPage displayName={displayName} />,
  };

  return (
    <div className="flex h-screen bg-brand-background overflow-hidden">

      {/* Sidebar (md+) */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-brand-primary text-white shrink-0 sticky top-0">
        <div className="p-6 flex flex-col h-full">
          <nav className="flex-1 space-y-1 mt-4">
            {NAV.map(item => (
              <button key={item.key} onClick={() => setActive(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[8px] transition-all text-left
                  ${active === item.key ? 'bg-white/10 text-brand-accent font-semibold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="font-medium text-sm flex-1">{item.label}</span>
                {item.key === 'notifications' && unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{unread}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="pt-4 border-t border-white/10">
            <button onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 w-full text-white/70 hover:text-white hover:bg-white/5 rounded-[8px] transition-all">
              <LogOut className="w-5 h-5" /><span className="font-medium text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-primary flex z-40">
        {NAV.map(item => (
          <button key={item.key} onClick={() => setActive(item.key)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors relative
              ${active === item.key ? 'text-brand-accent' : 'text-white/60'}`}>
            <item.icon className="w-4 h-4" />
            {item.key === 'notifications' && unread > 0 && (
              <span className="absolute top-1.5 right-2.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">{unread}</span>
            )}
            {item.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="relative px-6 py-4 border-b border-black/5 bg-white sticky top-0 z-10 flex items-center justify-between">
          {/* Available toggle */}
          <button onClick={() => setAvailable(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              available ? 'bg-green-50 border-green-200 text-green-700' : 'bg-black/5 border-black/10 text-brand-text-secondary'
            }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${available ? 'bg-green-500' : 'bg-brand-text-secondary/40'}`} />
            {available ? 'Available' : 'Busy'}
          </button>

          {/* Page title */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Volunteer</p>
            <h1 className="text-lg font-heading font-bold text-brand-text-primary">{navLabel[active]}</h1>
          </div>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-brand-primary/20 flex items-center justify-center text-sm font-bold text-brand-primary shrink-0">
            {initials}
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