import { useState, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ClipboardList, GitBranch, Users, BarChart2,
  ScrollText, FileDown, Sparkles, Plus, ToggleLeft, ToggleRight,
  Download, LogOut, X, Settings, CheckCircle2, Save, Wifi, WifiOff,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';
import { logOut } from '../../lib/authService';
import { useNavigate } from 'react-router-dom';

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

// ─── PDF Builder ───────────────────────────────────────────────────────────────

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
  const kpiRow = (items: {label:string;value:string;sub:string}[], y: number) => {
    const boxW = CONTENT_W/items.length-2;
    items.forEach((item,i) => {
      const x = MARGIN+i*(boxW+2); setColor('#f5f3ff','fill'); doc.roundedRect(x,y,boxW,20,2,2,'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(14); setColor('#7c3aed','text'); doc.text(item.value,x+boxW/2,y+10,{align:'center'});
      doc.setFont('helvetica','normal'); doc.setFontSize(7); setColor('#374151','text'); doc.text(item.label,x+boxW/2,y+15,{align:'center'});
      setColor('#6b7280','text'); doc.text(item.sub,x+boxW/2,y+19,{align:'center'});
    }); return y+26;
  };
  const drawTable = (headers: string[], rows: string[][], colWidths: number[], y: number) => {
    const ROW_H=8; setColor('#7c3aed','fill'); doc.rect(MARGIN,y,CONTENT_W,ROW_H,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5); setColor('#ffffff','text');
    let x=MARGIN+2; headers.forEach((h,i)=>{doc.text(h,x,y+5.5);x+=colWidths[i];}); y+=ROW_H;
    rows.forEach((row,ri)=>{
      setColor(ri%2===0?'#f9fafb':'#ffffff','fill'); doc.rect(MARGIN,y,CONTENT_W,ROW_H,'F');
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5); x=MARGIN+2;
      row.forEach((cell,ci)=>{
        const isHighlight=cell==='Emergency'||cell==='Unassigned';
        setColor(isHighlight?'#dc2626':'#374151','text'); doc.text(cell,x,y+5.5); x+=colWidths[ci];
      }); y+=ROW_H;
    });
    setColor('#e5e7eb','draw'); doc.setLineWidth(0.2); doc.rect(MARGIN,y-rows.length*ROW_H-ROW_H,CONTENT_W,(rows.length+1)*ROW_H,'D'); return y+4;
  };
  const barRow = (label:string,value:number,max:number,color:string,y:number)=>{
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); setColor('#374151','text'); doc.text(label,MARGIN,y+3.5);
    const barX=MARGIN+35; const barW=CONTENT_W-50; setColor('#e5e7eb','fill'); doc.roundedRect(barX,y,barW,5,1,1,'F');
    setColor(color,'fill'); doc.roundedRect(barX,y,(value/max)*barW,5,1,1,'F');
    setColor('#374151','text'); doc.text(`${value}`,barX+barW+3,y+3.5); return y+9;
  };
  drawHeader(); drawFooter(); let y=44;
  if (title==='Task Summary') {
    y=sectionHeading('OVERVIEW',y);
    y=kpiRow([{label:'Total Tasks',value:'38',sub:'+4 this week'},{label:'Open',value:'12',sub:'needs action'},{label:'In Progress',value:'9',sub:'active'},{label:'Completed',value:'17',sub:'94% on time'}],y);
    y=kpiRow([{label:'Emergency',value:'2',sub:'critical'},{label:'High Priority',value:'7',sub:'3 unassigned'},{label:'Avg Impact',value:'83.8',sub:'score'},{label:'Unassigned',value:'3',sub:'open slots'}],y);
    y=sectionHeading('TASK LIST',y);
    y=drawTable(['ID','Title','Status','Impact','Assigned To','Created By'],[['T-201','Food Kit Distribution','Open','92','Unassigned','Admin'],['T-202','Community Teaching','Matching','87','Ravi M.','Staff'],['T-203','Flood Relief Ops','Emergency','99','Unassigned','Admin'],['T-204','Medical Camp Setup','In Progress','78','Priya S.','Staff'],['T-205','Tree Planting Drive','Open','63','Unassigned','Admin']],[16,52,28,16,34,28],y);
    y=sectionHeading('COMPLETION STATS',y);
    ['On-time completion rate : 94%','Average impact score    : 83.8','Unassigned tasks        : 3'].forEach(line=>{doc.setFont('helvetica','normal');doc.setFontSize(8);setColor('#374151','text');doc.text(line,MARGIN+3,y);y+=6;});
  }
  if (title==='Assignment List') {
    y=sectionHeading('VOLUNTEER-TO-TASK MAPPING',y);
    [{task:'Food Kit Distribution (T-201)',volunteer:'Anjali R.',skill:94,rel:88,dist:2.1,backups:'Mohan D., Sneha T.'},{task:'Community Teaching (T-202)',volunteer:'Ravi M.',skill:89,rel:92,dist:3.4,backups:'Aditi K.'},{task:'Medical Camp Setup (T-204)',volunteer:'Priya S.',skill:97,rel:85,dist:1.8,backups:'Suresh P., Lakshmi V.'}].forEach(a=>{
      setColor('#f9fafb','fill'); doc.roundedRect(MARGIN,y,CONTENT_W,32,2,2,'F'); setColor('#e5e7eb','draw'); doc.setLineWidth(0.2); doc.roundedRect(MARGIN,y,CONTENT_W,32,2,2,'D');
      doc.setFont('helvetica','bold'); doc.setFontSize(9); setColor('#1f2937','text'); doc.text(a.task,MARGIN+4,y+8);
      doc.setFont('helvetica','normal'); doc.setFontSize(8); setColor('#6b7280','text'); doc.text('Assigned → ',MARGIN+4,y+15);
      doc.setFont('helvetica','bold'); setColor('#7c3aed','text'); doc.text(a.volunteer,MARGIN+25,y+15);
      [{label:'Skill Match',val:`${a.skill}%`,color:'#7c3aed'},{label:'Reliability',val:`${a.rel}%`,color:'#10b981'},{label:'Distance',val:`${a.dist} km`,color:'#3b82f6'}].forEach((m,mi)=>{
        const mx=MARGIN+4+mi*50; doc.setFont('helvetica','bold'); doc.setFontSize(11); const [r,g,b]=hex(m.color); doc.setTextColor(r,g,b); doc.text(m.val,mx,y+24);
        doc.setFont('helvetica','normal'); doc.setFontSize(6.5); setColor('#6b7280','text'); doc.text(m.label,mx,y+29);
      });
      doc.setFont('helvetica','normal'); doc.setFontSize(7); setColor('#6b7280','text'); doc.text(`Backups: ${a.backups}`,MARGIN+4+3*50,y+24); y+=37;
    });
    y=sectionHeading('UNASSIGNED TASKS',y);
    y=drawTable(['Task ID','Title','Impact Score','Status'],[['T-201','Food Kit Distribution','92','Open'],['T-203','Flood Relief Ops','99','Emergency'],['T-205','Tree Planting Drive','63','Open']],[20,80,36,38],y);
  }
  if (title==='Analytics Snapshot') {
    y=sectionHeading('SUMMARY KPIs',y);
    y=kpiRow([{label:'Active Volunteers',value:'124',sub:'+18 new'},{label:'Completed Tasks',value:'261',sub:'94% on time'},{label:'Weekly Avg Rate',value:'70%',sub:'completion'},{label:'Best Day',value:'Sat',sub:'91%'}],y);
    y=sectionHeading('TASK COMPLETION RATE — THIS WEEK',y);
    [{label:'Monday',val:62},{label:'Tuesday',val:78},{label:'Wednesday',val:55},{label:'Thursday',val:89},{label:'Friday',val:72},{label:'Saturday',val:91},{label:'Sunday',val:44}].forEach(d=>{y=barRow(d.label,d.val,100,'#7c3aed',y);});
    y+=2; y=sectionHeading('VOLUNTEER ACTIVITY BY CATEGORY',y);
    [{label:'Medical',val:34},{label:'Teaching',val:28},{label:'Relief',val:22},{label:'Other',val:16}].forEach((d,i)=>{y=barRow(d.label,d.val,100,['#7c3aed','#f59e0b','#10b981','#6b7280'][i],y);});
    y+=2; y=sectionHeading('STAFF PERFORMANCE',y);
    [{label:'Meena Nair',val:12},{label:'Karthik Rajan',val:8},{label:'Divya Pillai',val:15},{label:'Arjun Das',val:3}].forEach(d=>{y=barRow(d.label,d.val,20,'#7c3aed',y);});
  }
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
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Preview</p>
              <p className="text-sm font-heading font-bold text-brand-text-primary">{title}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleDownload} className="gap-1.5 text-[10px] uppercase font-bold tracking-widest">
                <Download className="w-3 h-3" /> Download PDF
              </Button>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/8 transition-colors text-brand-text-secondary hover:text-brand-text-primary">
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

const TasksPage = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-base font-heading font-bold">All Tasks</h2>
      <Button size="sm" className="gap-1.5 text-[10px] uppercase font-bold tracking-widest"><Plus className="w-3 h-3" /> Create Task</Button>
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
);

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

const StaffManagementPage = () => {
  const [perms, setPerms] = useState<Record<string, boolean>>(
    Object.fromEntries(staffList.map(s => [s.name, s.canCreateTask]))
  );
  return (
    <div className="space-y-4">
      <h2 className="text-base font-heading font-bold">Staff Management</h2>
      <Card className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-brand-background/50 border-b border-black/5">
              {['Name','Role','Tasks Created','Can Create Tasks',''].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 text-brand-text-primary">
            {staffList.map(s => (
              <tr key={s.name} className="hover:bg-brand-background/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-[11px] font-bold text-brand-primary">
                      {s.name.split(' ').map(w => w[0]).join('')}
                    </div>
                    <span className="font-semibold text-sm">{s.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-brand-text-secondary">{s.role}</td>
                <td className="px-4 py-3 text-sm font-semibold">{s.tasks}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setPerms(p => ({ ...p, [s.name]: !p[s.name] }))} className="flex items-center gap-2 text-xs font-medium transition-colors">
                    {perms[s.name]
                      ? <><ToggleRight className="w-6 h-6 text-brand-primary" /><span className="text-brand-primary">Enabled</span></>
                      : <><ToggleLeft  className="w-6 h-6 text-brand-text-secondary" /><span className="text-brand-text-secondary">Disabled</span></>}
                  </button>
                </td>
                <td className="px-4 py-3"><Button variant="ghost" size="sm" className="text-[10px] h-7 px-3">View</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
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
        <Card className="p-5 lg:col-span-2">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-4">Staff Performance</p>
          <div className="space-y-3">
            {staffList.map(s => (
              <div key={s.name} className="flex items-center gap-4">
                <span className="text-sm w-28 shrink-0 font-medium text-brand-text-primary">{s.name.split(' ')[0]}</span>
                <div className="flex-1 h-2 bg-black/5 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-brand-primary rounded-full" style={{ width: 0 }}
                    animate={{ width: `${(s.tasks/20)*100}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
                </div>
                <span className="text-xs font-bold text-brand-text-primary w-16 text-right">{s.tasks} tasks</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const ActivityLogPage = () => (
  <div className="space-y-4">
    <h2 className="text-base font-heading font-bold">Activity Log</h2>
    <Card className="divide-y divide-black/5">
      {activityLog.map((e, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i*0.05 }}
          className="flex items-start gap-4 px-5 py-4">
          <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-[10px] font-bold text-brand-primary">{e.user.split(' ').map(w=>w[0]).join('').slice(0,2)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-brand-text-primary"><span className="font-semibold">{e.user}</span> — {e.action}</p>
            <p className="text-[11px] text-brand-text-secondary mt-0.5">{e.time}</p>
          </div>
        </motion.div>
      ))}
    </Card>
  </div>
);

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

// ─── Settings Page ─────────────────────────────────────────────────────────────

const SettingsPage = ({ profile }: { profile: any }) => {
  const [notifOn, setNotifOn] = useState(true);
  const [saved,   setSaved]   = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-4">

      {/* Org Code */}
      <Card className="p-5 space-y-2 border border-brand-primary/20 bg-brand-primary/5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Your Organisation Code</p>
        <p className="text-[11px] text-brand-text-secondary">Share this with your staff so they can join your organisation.</p>
        {profile?.orgCode ? (
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-2xl font-bold text-brand-primary tracking-widest">{profile.orgCode}</span>
            <button onClick={() => navigator.clipboard.writeText(profile.orgCode)}
              className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold hover:opacity-90 transition-opacity">
              Copy
            </button>
          </div>
        ) : (
          <span className="text-sm text-amber-600 font-semibold">Pending approval — code will appear here once approved.</span>
        )}
      </Card>

      {/* Profile */}
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

      {/* Staff permissions note */}
      <Card className="p-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Staff Permissions</p>
        <p className="text-xs text-brand-text-secondary">Manage individual staff task creation permissions in the <span className="font-semibold text-brand-primary">Staff Management</span> tab.</p>
      </Card>

      {/* Notifications */}
      <Card className="p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-text-primary">Notifications</p>
          <p className="text-xs text-brand-text-secondary mt-0.5">Task assignments and platform updates</p>
        </div>
        <button onClick={() => setNotifOn(v => !v)} className="flex items-center gap-2">
          {notifOn
            ? <><Wifi    className="w-5 h-5 text-brand-primary" /><span className="text-xs font-medium text-brand-primary">On</span></>
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
  const navigate    = useNavigate();

  const displayName = profile?.fullName ?? 'Org Admin';
  const initials    = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const orgName     = profile?.orgName ?? 'Your Organisation';

  const handleLogout = async () => { await logOut(); navigate('/login'); };

  const PageMap: Record<NavKey, ReactElement> = {
    dashboard:  <DashboardHome />,
    tasks:      <TasksPage />,
    allocation: <AllocationPage />,
    staff:      <StaffManagementPage />,
    analytics:  <AnalyticsPage />,
    log:        <ActivityLogPage />,
    reports:    <ReportsPage />,
    settings:   <SettingsPage profile={profile} />,
  };

  const navLabel: Record<NavKey, string> = {
    dashboard: 'Dashboard', tasks: 'Tasks', allocation: 'Allocation',
    staff: 'Staff Management', analytics: 'Analytics', log: 'Activity Log',
    reports: 'Reports', settings: 'Settings',
  };

  return (
    <div className="flex h-screen bg-brand-background overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-brand-primary text-white shrink-0 sticky top-0">
        <div className="p-6 flex flex-col h-full">
          <div className="mb-8"><Logo /></div>
          <div className="mb-6 px-4 py-3 bg-white/10 rounded-[8px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Org Admin</p>
            <p className="text-sm font-semibold text-white mt-0.5 truncate">{orgName}</p>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {NAV.map(item => (
              <button key={item.key} onClick={() => setActive(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[8px] transition-all text-left
                  ${active === item.key ? 'bg-white/10 text-brand-accent font-semibold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="pt-6 border-t border-white/10 mt-auto space-y-3">
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
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors min-w-[60px]
              ${active === item.key ? 'text-brand-accent' : 'text-white/60'}`}>
            <item.icon className="w-4 h-4" />
            {item.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="px-6 py-5 border-b border-black/5 bg-white flex items-center justify-between sticky top-0 z-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Organisation Admin</p>
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