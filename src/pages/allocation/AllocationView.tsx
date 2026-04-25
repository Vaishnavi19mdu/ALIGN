import { motion } from 'framer-motion';
import { MapPin, Clock, Star, Shield, ArrowRight, UserPlus } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

const allocationData = {
  task: {
    title: 'Food Bank Logistics Manager',
    location: '6th Avenue Warehouse, Downtown',
    urgency: 'HIGH',
    impact: 94
  },
  primaryCandidate: {
    name: 'Marcus Holloway',
    score: 9.8,
    avatar: 'MH',
    reasons: [
      { label: 'Skill Match', value: 98, desc: 'Expert in non-profit logistics' },
      { label: 'Distance', value: 85, desc: '1.2 km from warehouse' },
      { label: 'Availability', value: 100, desc: 'Matches all required blocks' },
      { label: 'Reliability', value: 92, desc: '5/5 stars on 12 related tasks' }
    ]
  },
  backups: [
    { name: 'Elena Rodriguez', score: 8.5, skill: 'Certified Manager' },
    { name: 'James Chen', score: 8.2, skill: 'Logistics Student' }
  ]
};

export const AllocationView = () => {
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-bold mb-1">{allocationData.task.title}</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-brand-text-secondary">
             <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-brand-primary" /> {allocationData.task.location}</span>
             <span className="flex items-center gap-1.5 text-red-600"><Clock className="w-3.5 h-3.5" /> Priority: {allocationData.task.urgency}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none font-bold">Modify Logic</Button>
          <Button size="sm" className="flex-1 sm:flex-none font-bold">Finalize Match</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Primary Candidate Breakdown */}
        <div className="lg:col-span-2 space-y-6">
           <Card className="p-6 md:p-8 border-brand-accent/30 bg-gradient-to-br from-white to-brand-accent/5">
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 mb-8">
                 <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-brand-primary text-white flex items-center justify-center text-2xl font-bold shadow-lg ring-4 ring-brand-primary/10">
                      {allocationData.primaryCandidate.avatar}
                    </div>
                    <div className="text-center sm:text-left">
                       <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                          <h2 className="text-2xl font-heading font-bold">{allocationData.primaryCandidate.name}</h2>
                          <Shield className="w-5 h-5 text-brand-primary fill-brand-primary/10" />
                       </div>
                       <p className="text-xs text-brand-text-secondary font-medium italic">Vetted Senior Volunteer • Allocation Level 5</p>
                    </div>
                 </div>
                 <div className="text-center sm:text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-primary/60 mb-1">Match Score</p>
                    <p className="text-5xl font-heading font-bold text-brand-primary leading-none">{allocationData.primaryCandidate.score}</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary border-b border-black/5 pb-2">Reasoning Matrix</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                    {allocationData.primaryCandidate.reasons.map((r, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-end">
                           <span className="text-xs font-bold text-brand-text-primary">{r.label}</span>
                           <span className="text-lg font-bold text-brand-primary">{r.value}%</span>
                        </div>
                        <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
                           <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${r.value}%` }}
                                transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                                className="h-full bg-brand-primary rounded-full shadow-[0_0_8px_rgba(136,6,42,0.3)]" 
                           />
                        </div>
                        <p className="text-[10px] text-brand-text-secondary leading-tight italic">{r.desc}</p>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="mt-8 p-4 bg-brand-highlight/20 border border-brand-highlight/40 rounded-xl flex items-start gap-4">
                 <Sparkles className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                 <p className="text-xs text-brand-text-primary leading-relaxed">
                   <span className="font-bold uppercase tracking-tight mr-1">AI Logic:</span> Marcus has performed 4 similar warehouse roles in the last 30 days with a 100% completion rate. High probability of mission success.
                 </p>
              </div>
           </Card>
        </div>

        {/* Right: Backups and Actions */}
        <div className="space-y-6">
           <section className="space-y-4">
              <h3 className="font-heading text-sm font-bold uppercase tracking-widest text-brand-text-secondary">Backup Pipeline</h3>
              <div className="space-y-3">
                 {allocationData.backups.map((b, i) => (
                   <Card key={i} className="p-4 flex items-center justify-between hover:border-brand-primary transition-colors group cursor-pointer bg-white shadow-sm">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-brand-secondary/30 flex items-center justify-center font-bold text-brand-primary text-sm shrink-0">
                            {b.name[0]}
                         </div>
                         <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{b.name}</p>
                            <p className="text-[10px] text-brand-text-secondary font-medium">{b.skill}</p>
                         </div>
                      </div>
                      <div className="text-right shrink-0">
                         <p className="text-lg font-heading font-bold text-brand-text-primary leading-none">{b.score}</p>
                         <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                      </div>
                   </Card>
                 ))}
                 <Button variant="ghost" size="sm" className="w-full gap-2 text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                    <UserPlus className="w-4 h-4" /> Expand Potential Pool
                 </Button>
              </div>
           </section>

           <Card className="p-6 bg-brand-primary text-white space-y-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
              <h3 className="font-heading text-lg font-bold">System Finalization</h3>
              <p className="text-xs text-white/70 leading-relaxed">Confirming this allocation will broadcast a command to the volunteer's app and lock the task block immediately.</p>
              <Button className="w-full bg-brand-accent text-brand-primary hover:bg-brand-highlight border-none font-bold text-sm h-11">
                 Finalize Mission
              </Button>
           </Card>
        </div>
      </div>
    </div>
  );
};

const Sparkles = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
  </svg>
);
