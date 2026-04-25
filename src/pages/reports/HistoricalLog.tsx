import { motion } from 'framer-motion';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Users,
  Target
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

const historicalData = [
  {
    id: 'ALC-40926',
    task: 'Medical Supplies Transport',
    volunteer: 'Sarah Jenkins',
    date: '2026-04-20',
    score: 94,
    status: 'Completed',
    performance: 'Exemplary'
  },
  {
    id: 'ALC-40925',
    task: 'Warehouse Sorting',
    volunteer: 'David Chen',
    date: '2026-04-19',
    score: 88,
    status: 'Completed',
    performance: 'On Time'
  },
  {
    id: 'ALC-40924',
    task: 'Emergency Comms Setup',
    volunteer: 'Aria Rodriguez',
    date: '2026-04-19',
    score: 91,
    status: 'In Review',
    performance: 'Efficient'
  },
  {
    id: 'ALC-40923',
    task: 'Water Purification Deployment',
    volunteer: 'James Wilson',
    date: '2026-04-18',
    score: 82,
    status: 'Completed',
    performance: 'Delayed - Logistical'
  },
  {
    id: 'ALC-40922',
    task: 'Temporary Shelter Setup',
    volunteer: 'Emily Blunt',
    date: '2026-04-18',
    score: 96,
    status: 'Completed',
    performance: 'Rapid Completion'
  }
];

const stats = [
  { label: 'Avg Match Score', value: '89.4%', icon: Target, color: 'text-brand-primary' },
  { label: 'Completion Rate', value: '96.2%', icon: CheckCircle2, color: 'text-green-600' },
  { label: 'Avg Assignment Time', value: '4.2m', icon: Clock, color: 'text-blue-600' },
  { label: 'Engine Reliability', value: '99.9%', icon: TrendingUp, color: 'text-brand-accent' },
];

export const HistoricalLog = () => {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <History className="w-6 h-6 text-brand-primary" /> Allocation Intelligence Log
          </h1>
          <p className="text-sm text-brand-text-secondary">Historical analysis of system-driven assignments and performance results.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" /> Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4 md:p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary mb-1">{stat.label}</p>
                  <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-2 bg-black/5 rounded-lg`}>
                  <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Log Table */}
        <Card className="lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-black/5 flex items-center justify-between">
            <h2 className="font-heading font-bold text-sm">Historical Assignments</h2>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary" />
              <input 
                type="text" 
                placeholder="Search log..."
                className="pl-9 pr-4 py-1.5 bg-brand-background border border-black/5 rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary/20 w-48 md:w-64"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-brand-background/50 text-[10px] uppercase font-bold tracking-wider text-brand-text-secondary">
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3">Task & Volunteer</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 text-xs text-brand-text-primary">
                {historicalData.map((row) => (
                  <tr key={row.id} className="hover:bg-brand-background/30 transition-colors group">
                    <td className="px-6 py-4 font-mono text-[10px] opacity-60">{row.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold">{row.task}</p>
                      <p className="text-[10px] text-brand-text-secondary flex items-center gap-1">
                        <Users className="w-3 h-3" /> {row.volunteer} • {row.date}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-1 bg-black/5 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-primary" style={{ width: `${row.score}%` }} />
                        </div>
                        <span className="font-bold">{row.score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        row.status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-brand-accent/20 text-brand-primary'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{row.performance}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-black/5 bg-brand-background/30 text-center">
            <Button variant="ghost" size="sm" className="text-[10px] uppercase tracking-widest font-bold">
              View Older Records
            </Button>
          </div>
        </Card>

        {/* System Efficiency Chart / Distribution */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-heading font-bold text-sm mb-6 uppercase tracking-widest">Performance Distribution</h3>
            <div className="space-y-6">
              {[
                { label: 'Exceeded SLA', val: 78, color: 'bg-brand-primary' },
                { label: 'Met SLA', val: 18, color: 'bg-brand-accent' },
                { label: 'Below SLA', val: 4, color: 'bg-red-500' },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase">
                    <span>{item.label}</span>
                    <span className="text-brand-text-secondary">{item.val}%</span>
                  </div>
                  <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.val}%` }}
                      className={`h-full ${item.color} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-black/5">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                <p className="text-[10px] text-brand-text-secondary leading-relaxed">
                  System throughput has increased by <span className="text-brand-primary font-bold">14%</span> since the last algorithm update (v2.4.1).
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-brand-primary text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
            <h3 className="font-heading font-bold text-sm mb-4 relative z-10">AI Optimization</h3>
            <p className="text-xs text-white/70 leading-relaxed mb-6 relative z-10">
              The engine is currently leaning 12% more on <span className="text-brand-accent font-bold">Proximity</span> than last week to reduce response times.
            </p>
            <Button className="w-full bg-white text-brand-primary hover:bg-white/90 border-none font-bold text-[10px] uppercase tracking-widest h-9">
              Run New Simulation
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
