import { motion } from 'framer-motion';
import { Users, ClipboardList, CheckCircle, TrendingUp, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

const stats = [
  { label: 'Total Tasks', value: '142', icon: ClipboardList, color: 'text-brand-primary' },
  { label: 'Active Volunteers', value: '1,280', icon: Users, color: 'text-blue-600' },
  { label: 'Completed Tasks', value: '856', icon: CheckCircle, color: 'text-green-600' },
  { label: 'Impact Efficiency', value: '94%', icon: TrendingUp, color: 'text-brand-accent' },
];

const recentTasks = [
  { id: 'T-102', title: 'Food Distribution', impact: 88, status: 'Open', manager: 'Admin' },
  { id: 'T-105', title: 'Community Teaching', impact: 95, status: 'Matching', manager: 'Staff' },
  { id: 'T-108', title: 'Flood Relief Ops', impact: 99, status: 'Emergency', manager: 'Admin' },
];

export const AdminDashboard = () => {
  const isMobile = useIsMobile();
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4 md:p-5 text-brand-text-primary">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-1">{stat.label}</p>
                  <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-1.5 md:p-2 bg-black/5 rounded-lg shrink-0`}>
                  <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-bold">Urgent Unassigned Tasks</h2>
            <Button size="sm" className="gap-2 text-[10px] uppercase font-bold tracking-widest">
              <Sparkles className="w-3 h-3" /> Auto Assign
            </Button>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-brand-background/50 border-b border-black/5">
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary">Task Title</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary hidden sm:table-cell">Impact</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary">Status</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-brand-text-primary">
                  {recentTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-brand-background/30 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="font-bold text-sm truncate max-w-[150px] md:max-w-none">{task.title}</div>
                        <div className="text-[10px] text-brand-text-secondary">Ref: {task.id}</div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 w-12 md:w-16 bg-black/5 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-primary" style={{ width: `${task.impact}%` }} />
                          </div>
                          <span className="text-[10px] font-bold">{task.impact}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-wider ${
                          task.status === 'Emergency' ? 'bg-red-100 text-red-600' : 'bg-brand-accent/20 text-brand-primary'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" className="text-[10px] h-7 px-3">Assign</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Breakdown Card */}
        <div className="space-y-4">
          <h2 className="text-lg font-heading font-bold">Allocation Logic</h2>
          <Card className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[300px]">
            <div className="relative w-32 h-32 md:w-40 md:h-40 mb-8 text-brand-text-primary">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx={isMobile ? 64 : 80} cy={isMobile ? 64 : 80} r={isMobile ? 54 : 68} stroke="currentColor" strokeWidth="10" fill="transparent" className="text-black/5" />
                <circle cx={isMobile ? 64 : 80} cy={isMobile ? 64 : 80} r={isMobile ? 54 : 68} stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={isMobile ? 339.29 : 427.25} strokeDashoffset={isMobile ? 101.78 : 128.17} className="text-brand-primary" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl md:text-3xl font-bold">72%</span>
                <span className="text-[8px] md:text-[10px] font-bold text-brand-text-secondary uppercase">Auto-Match</span>
              </div>
            </div>
            <div className="w-full space-y-3">
              {[
                { color: 'bg-brand-primary', label: 'Skill Set Match', val: '48%' },
                { color: 'bg-brand-accent', label: 'Proximity Score', val: '32%' },
                { color: 'bg-brand-secondary', label: 'Active Availability', val: '20%' },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] md:text-xs">
                  <div className="flex items-center gap-2 font-medium">
                    <div className={`w-2.5 h-2.5 ${row.color} rounded-sm`} />
                    {row.label}
                  </div>
                  <span className="font-bold">{row.val}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};