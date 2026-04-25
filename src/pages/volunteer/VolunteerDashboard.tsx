import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  TrendingUp,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

const volunteerTasks = [
  { id: 'VT-441', title: 'Senior Tech Mentor', location: 'Public Library', date: 'Oct 24, 14:00', status: 'Pending', impact: 'Moderate' },
  { id: 'VT-442', title: 'Food Bank Sorter', location: 'Main Warehouse', date: 'Oct 26, 09:00', status: 'Assigned', impact: 'High' },
];

export const VolunteerDashboard = () => {
  return (
    <div className="p-4 md:p-6 grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Profile & Streak */}
      <div className="xl:col-span-1 space-y-4">
        <Card className="p-6 text-center bg-brand-primary text-white overflow-hidden relative shadow-lg">
           <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
           <div className="w-20 h-20 rounded-full bg-brand-secondary border-4 border-white/20 mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-brand-primary">
              MH
           </div>
           <h2 className="text-xl font-heading mb-0.5">Marcus Holloway</h2>
           <p className="text-white/60 text-[10px] mb-4 uppercase tracking-widest font-bold">Logistics Expert</p>
           
           <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                 <p className="text-xl font-bold">12</p>
                 <p className="text-[8px] text-white/50 uppercase">Tasks Done</p>
              </div>
              <div>
                 <p className="text-xl font-bold">9.8</p>
                 <p className="text-[8px] text-white/50 uppercase">Trust Score</p>
              </div>
           </div>
        </Card>

        <Card className="p-4 bg-white">
           <h3 className="font-heading mb-3 flex items-center gap-2 text-sm text-brand-text-primary uppercase tracking-wider font-bold">
             <TrendingUp className="w-4 h-4 text-brand-primary" /> Level Progress
           </h3>
           <div className="space-y-3">
              <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                 <div className="h-full bg-brand-accent w-3/4 shadow-[0_0_8px_rgba(235,175,90,0.5)]" />
              </div>
              <p className="text-[10px] text-brand-text-secondary">250 points until <span className="font-bold text-brand-primary">Guardian</span> rank</p>
           </div>
        </Card>
      </div>

      {/* Task Feed */}
      <div className="xl:col-span-3 space-y-4">
         <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-bold">Active Allocations</h2>
            <div className="flex gap-4">
               <span className="flex items-center gap-2 text-[10px] font-bold text-brand-text-secondary uppercase">
                 <div className="w-2 h-2 bg-orange-400 rounded-full" /> Pending 
               </span>
               <span className="flex items-center gap-2 text-[10px] font-bold text-brand-text-secondary uppercase">
                 <div className="w-2 h-2 bg-green-400 rounded-full" /> Active
               </span>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {volunteerTasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-0 overflow-hidden border-brand-accent/20 transition-all bg-white shadow-sm">
                   <div className="p-5 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                         <div className="min-w-0">
                            <h4 className="font-heading text-base font-bold truncate">{task.title}</h4>
                            <p className="text-[10px] text-brand-text-secondary font-mono">Ref: {task.id}</p>
                         </div>
                         <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest shrink-0 ${
                            task.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                         }`}>
                           {task.status}
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[10px]">
                         <div className="flex items-center gap-2 text-brand-text-secondary font-medium">
                            <MapPin className="w-3 h-3 text-brand-primary" /> {task.location}
                         </div>
                         <div className="flex items-center gap-2 text-brand-text-secondary font-medium">
                            <Calendar className="w-3 h-3 text-brand-primary" /> {task.date}
                         </div>
                      </div>

                      <div className="pt-2 flex gap-2">
                         {task.status === 'Pending' ? (
                           <>
                              <Button className="flex-1 text-[10px] h-8 bg-brand-primary font-bold">Accept Match</Button>
                              <Button variant="ghost" className="flex-1 text-[10px] h-8 font-bold">Decline</Button>
                           </>
                         ) : (
                           <>
                              <Button className="flex-1 text-[10px] h-8 bg-green-600 hover:bg-green-700 font-bold">
                                 <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Mark Complete
                              </Button>
                              <Button variant="outline" size="icon" className="w-8 h-8 shrink-0">
                                 <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                           </>
                         )}
                      </div>
                   </div>
                </Card>
              </motion.div>
            ))}
         </div>

         {/* Historical Feed Placeholder fallback */}
         <section className="pt-2 border-t border-black/5">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-brand-text-secondary mb-4">Historical Impact</h3>
            <Card className="p-8 text-center border-dashed bg-transparent border-black/10">
               <div className="max-w-xs mx-auto space-y-3">
                  <div className="w-10 h-10 bg-brand-background rounded-full mx-auto flex items-center justify-center opacity-50">
                     <Clock className="w-5 h-5 text-brand-primary" />
                  </div>
                  <h4 className="font-heading text-sm font-bold">Impact Ledger Processing</h4>
                  <p className="text-[10px] text-brand-text-secondary leading-relaxed">Your completed tasks are being verified by the allocation node. Check back in 24h.</p>
               </div>
            </Card>
         </section>
      </div>
    </div>
  );
};
