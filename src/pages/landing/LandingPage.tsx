import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  Target, 
  CheckCircle2, 
  ChevronRight,
  Zap,
  MapPin,
  Menu,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Logo } from '../../components/common/Logo';

export const LandingPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-background text-brand-text-primary selection:bg-brand-primary selection:text-white">
      {/* Navigation */}
      <nav className="h-20 px-6 md:px-12 lg:px-20 flex items-center justify-between border-b border-black/5 bg-brand-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Logo isDark className="scale-75 md:scale-90 lg:scale-100 origin-left" />
        </div>
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8 mr-4">
          <Link to="/login" className="text-xs lg:text-sm font-medium hover:text-brand-primary transition-colors">Login</Link>
          <Link to="/signup">
            <Button variant="primary" size="sm" className="px-5">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-brand-text-primary hover:text-brand-primary transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 bg-white shadow-2xl p-6 border-b border-black/5 md:hidden flex flex-col gap-6"
            >
              <div className="flex flex-col gap-4">
                {['Home', 'Platform', 'Network', 'Impact'].map((item) => (
                  <a key={item} href="#" className="text-lg font-bold hover:text-brand-primary transition-colors">{item}</a>
                ))}
              </div>
              <div className="flex flex-col gap-3 pt-6 border-t border-black/5">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full h-12">Login</Button>
                </Link>
                <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full h-12">Get Started</Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-8 md:pt-12 pb-20 md:pb-32 px-4 md:px-8 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-secondary/20 text-brand-primary rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest mb-6 md:mb-8">
              <Zap className="w-3 h-3 fill-current" /> Intelligent Social Impact
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-heading font-bold text-brand-text-primary leading-[1.1] lg:leading-[1] mb-6 md:mb-8">
              Match Need with <br/><span className="text-brand-primary">Precision.</span>
            </h1>
            <p className="text-base md:text-xl text-brand-text-secondary mb-8 md:mb-12 max-w-lg mx-auto lg:mx-0 leading-relaxed mix-blend-multiply">
              Aligning the world’s solvers with humanity’s most urgent tasks through intelligent allocation driven by skill matching, proximity, and urgency.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 md:gap-5">
              <Link to="/demo" className="w-full sm:w-auto">
                <Button size="lg" className="w-full gap-2 shadow-lg shadow-brand-primary/20">
                  Launch App Simulator <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/signup" className="w-full sm:w-auto">
                <Button variant="ghost" size="lg" className="w-full border border-black/5">Create Account</Button>
              </Link>
            </div>
          </motion.div>

          {/* Right Side: Responsive Split Panel UI */}
          <div className="relative group w-full max-w-lg lg:max-w-none mx-auto">
             <div className="absolute inset-0 bg-brand-accent/5 blur-[80px] md:blur-[120px] rounded-full" />
             
             <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
                {/* Task Card */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="w-full md:flex-1"
                >
                  <Card className="p-5 md:p-6 border-2 border-brand-primary shadow-xl md:shadow-2xl relative overflow-hidden bg-white">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary" />
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase">High Priority</span>
                      <MapPin className="w-4 h-4 text-brand-text-secondary" />
                    </div>
                    <h3 className="font-heading text-base md:text-lg leading-tight mb-2">Flood Relief <br className="hidden md:block"/>Support</h3>
                    <p className="text-[10px] md:text-xs text-brand-text-secondary mb-4 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Chennai Metro
                    </p>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[9px] md:text-[10px] uppercase font-bold text-brand-text-secondary mb-1">Required Skills</p>
                        <div className="flex flex-wrap gap-1">
                          <span className="px-2 py-0.5 bg-brand-background rounded-full text-[8px] md:text-[9px] font-medium border border-black/5">Medical Aid</span>
                          <span className="px-2 py-0.5 bg-brand-background rounded-full text-[8px] md:text-[9px] font-medium border border-black/5">First Response</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-black/5">
                        <p className="text-[9px] md:text-[10px] text-brand-text-secondary">Impact Potential</p>
                        <p className="text-xs md:text-sm font-bold text-brand-primary">120+ People Affected</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Connection Line - Responsive: Vertical on Mobile, Horizontal on Desktop */}
                <div className="flex md:flex-1 items-center justify-center relative w-px h-16 md:w-full md:h-px bg-brand-accent mx-auto md:mx-0">
                   <div className="absolute inset-0 flex items-center justify-center md:-top-8 -left-20 md:left-auto w-40 md:w-full h-full md:h-auto">
                      <span className="text-[8px] md:text-[9px] font-bold text-center bg-white px-2 leading-tight whitespace-nowrap text-brand-text-secondary border border-black/5 rounded-full py-1 z-10">
                        Skill + Proximity + Availability
                      </span>
                   </div>
                   
                   {/* Scoring Chips - Desktop Only / Scaled for Tablet */}
                   <div className="hidden lg:flex absolute top-4 left-1/2 -translate-x-1/2 flex-col gap-1 w-max">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-700 rounded text-[9px] font-bold border border-green-100">SM: 92%</div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-bold border border-blue-100">DS: 88%</div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-[9px] font-bold border border-orange-100">AV: 100%</div>
                   </div>

                   {/* Animated Pulse */}
                   <motion.div 
                     animate={typeof window !== 'undefined' && window.innerWidth < 768 
                       ? { y: [0, 40, 0], opacity: [0, 1, 0] }
                       : { x: [0, 60, 0], opacity: [0, 1, 0] }
                     }
                     transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                     className="absolute w-2 h-2 bg-brand-accent rounded-full md:-top-[4px] -left-[4px] md:left-auto shadow-[0_0_8px_#EBAF5A]"
                   />
                   
                   <div className="absolute top-0 md:left-0 md:top-auto w-1.5 h-1.5 bg-brand-primary rounded-full -left-[3px] md:-top-[3px]" />
                   <div className="absolute bottom-0 md:right-0 md:bottom-auto w-1.5 h-1.5 bg-brand-accent rounded-full -left-[3px] md:-top-[3px]" />
                </div>

                {/* Volunteer Card */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="w-full md:flex-1"
                >
                  <Card className="p-5 md:p-6 border border-black/5 shadow-lg bg-white/80 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-brand-primary">PS</div>
                      <div>
                        <h4 className="font-heading text-sm">Vaishnavi N</h4>
                        <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Available Now</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] md:text-xs">
                        <span className="text-brand-text-secondary">Distance</span>
                        <span className="font-bold">2 km Away</span>
                      </div>
                      <div className="flex justify-between text-[10px] md:text-xs">
                        <span className="text-brand-text-secondary">Reliability</span>
                        <span className="font-bold text-brand-primary">High (5.0)</span>
                      </div>
                      <div className="pt-2">
                        <p className="text-[9px] md:text-[10px] uppercase font-bold text-brand-text-secondary mb-1">Top Skill Match</p>
                        <div className="px-2 md:px-3 py-1.5 md:py-2 bg-brand-primary/5 rounded-lg border border-brand-primary/10">
                           <p className="text-[10px] md:text-xs font-bold text-brand-primary italic">"Crisis Response Expert"</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
             </div>
          </div>
        </div>
      </section>

      {/* Problems section */}
      <section className="py-24 bg-brand-background px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading mb-4">Why traditional volunteering is broken</h2>
            <p className="text-brand-text-secondary">Manual coordination leads to resource leakage and missed impact.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck, title: 'Identity Fragmentation', desc: 'Fragmented data leads to untrustworthy matches.' },
              { icon: Users, title: 'Unstructured Skills', desc: 'Talents remain hidden behind generic profiles.' },
              { icon: Target, title: 'Decision Fatigue', desc: 'Coordinators spend 80% time on paperwork, 20% on impact.' }
            ].map((p, i) => (
              <Card key={i} className="p-8 group hover:border-brand-primary transition-colors">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-6 shadow-sm group-hover:bg-brand-primary group-hover:text-white transition-colors">
                  <p.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-heading mb-3">{p.title}</h3>
                <p className="text-brand-text-secondary leading-relaxed">{p.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline section */}
      <section className="py-24 bg-white px-8">
        <div className="max-w-4xl mx-auto">
           <div className="flex flex-col md:flex-row items-center gap-12">
             <div className="flex-1">
                <h2 className="text-4xl font-heading mb-6">The High-Impact Pipeline</h2>
                <div className="space-y-8">
                   {[
                     { step: '01', title: 'Need Aggregation', desc: 'Organizations post tasks with structured requirements.' },
                     { step: '02', title: 'Scoring Engine', desc: 'Align uses 4-factor logic to rank potential matches.' },
                     { step: '03', title: 'Seamless Execution', desc: 'One-click allocation with real-time reporting.' }
                   ].map((s, i) => (
                     <div key={i} className="flex gap-6">
                        <span className="text-3xl font-heading text-brand-primary opacity-20">{s.step}</span>
                        <div>
                           <h4 className="font-bold text-lg mb-1">{s.title}</h4>
                           <p className="text-brand-text-secondary">{s.desc}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
             <div className="w-1 bg-brand-primary/10 h-80 hidden md:block rounded-full" />
             <div className="flex-1 flex justify-center">
                <div className="w-64 h-64 border-2 border-dashed border-brand-accent rounded-full flex items-center justify-center animate-spin-slow">
                   <div className="w-48 h-48 bg-brand-primary rounded-full flex items-center justify-center text-white font-heading text-xl shadow-2xl">
                      ALIGN AI
                   </div>
                </div>
             </div>
           </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 bg-brand-primary text-white text-center overflow-hidden relative">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto relative z-10"
         >
            <h2 className="text-4xl font-heading mb-6">Ready to align your impact?</h2>
            <p className="text-white/80 mb-10 text-lg">Join 500+ organizations scaling their social missions with precision.</p>
            <div className="flex justify-center gap-4">
               <Button className="bg-white text-brand-primary hover:bg-brand-accent hover:text-brand-primary border-none">Create My Organization</Button>
               <Button variant="ghost" className="text-white hover:bg-white/10">Become Volunteer</Button>
            </div>
         </motion.div>
      </section>

      <footer className="py-12 px-8 border-t border-black/5 flex flex-col md:flex-row justify-between items-center bg-white gap-6">
         <div className="flex items-center gap-2">
            <span className="font-heading font-bold tracking-tight text-brand-primary">ALIGN</span>
            <span className="text-xs text-brand-text-secondary">© 2026 Impact Protocol</span>
         </div>
         <div className="flex gap-8 text-sm text-brand-text-secondary">
            <a href="#" className="hover:text-brand-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-brand-primary transition-colors">Allocation Ledger</a>
         </div>
      </footer>
    </div>
  );
};
