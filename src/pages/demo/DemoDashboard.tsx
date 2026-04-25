import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Search, 
  Settings, 
  UserPlus, 
  ShieldCheck,
  CheckCircle2,
  Activity,
  MapPin,
  Heart,
  X,
  Sparkles
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Link } from 'react-router-dom';

const flowSteps = [
  { id: 0, title: 'Task Created', icon: Search, color: 'text-blue-500' },
  { id: 1, title: 'Matching Engine', icon: Settings, color: 'text-brand-primary' },
  { id: 2, title: 'Best Volunteer', icon: UserPlus, color: 'text-brand-accent' },
  { id: 3, title: 'Assignment', icon: CheckCircle2, color: 'text-green-500' },
];

const scoresData = [
  { label: 'Skill Match', val: 92, color: 'bg-brand-primary' },
  { label: 'Distance', val: 88, color: 'bg-brand-accent' },
  { label: 'Availability', val: 100, color: 'bg-green-500' },
];

export const DemoDashboard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCalculated, setIsCalculated] = useState(false);

  useEffect(() => {
    const sequence = async () => {
      await new Promise(r => setTimeout(r, 1200));
      setCurrentStep(1);
      
      await new Promise(r => setTimeout(r, 1800));
      setCurrentStep(2);
      
      await new Promise(r => setTimeout(r, 1200));
      setCurrentStep(3);
      setIsCalculated(true);
    };
    sequence();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-6 md:py-8 px-6 min-h-screen flex flex-col justify-center gap-6 md:gap-8">
      {/* Page Title */}
      <div className="text-center space-y-1">
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-2xl md:text-3xl font-heading font-bold text-brand-primary uppercase tracking-tight"
        >
          Mission Allocation Simulation
        </motion.h1>
        <p className="text-brand-text-secondary text-xs font-medium uppercase tracking-[0.2em] opacity-60">Humanity Aligned with Technology</p>
      </div>

      {/* SECTION 1: STEP FLOW */}
      <div className="relative flex justify-between max-w-xl mx-auto w-full px-4">
        <div className="absolute top-5 left-0 w-full h-[2px] bg-black/5 -z-10 hidden md:block" />
        <motion.div 
          initial={{ width: '0%' }}
          animate={{ width: `${(currentStep / (flowSteps.length - 1)) * 100}%` }}
          className="absolute top-5 left-0 h-[2px] bg-brand-primary -z-10 hidden md:block shadow-[0_0_10px_rgba(136,6,42,0.4)]"
          transition={{ duration: 0.8 }}
        />

        {flowSteps.map((step, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <motion.div 
              animate={{ 
                scale: currentStep === i ? 1.15 : 1,
                backgroundColor: currentStep >= i ? '#88062a' : '#ffffff',
                color: currentStep >= i ? '#ffffff' : '#cbd5e1',
                borderColor: currentStep === i ? '#88062a' : '#f1f5f9'
              }}
              className="w-10 h-10 rounded-full shadow-sm border-2 flex items-center justify-center relative transition-colors duration-500"
            >
              <step.icon className="w-4 h-4" />
              <AnimatePresence>
                {currentStep === i && (
                  <motion.div 
                    layoutId="active-glow"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute -inset-1 rounded-full border-2 border-brand-primary"
                    transition={{ duration: 0.5 }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
            <span className={`text-[8px] font-bold uppercase tracking-widest text-center transition-colors duration-500 ${currentStep >= i ? 'text-brand-primary' : 'text-slate-400'}`}>
              {step.title}
            </span>
          </div>
        ))}
      </div>

      {/* SECTION 2: LIVE MATCHING */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 py-2">
        {/* Task Card */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex-1 w-full max-w-[280px]"
        >
          <Card className="p-4 border-red-100 bg-red-50/20 relative overflow-hidden shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[7px] font-bold uppercase rounded tracking-widest">Urgent Need</span>
              <Activity className="w-4 h-4 text-red-500" />
            </div>
            <h3 className="text-lg font-heading font-bold mb-0.5 leading-tight">Flood Relief</h3>
            <p className="text-[10px] text-brand-text-secondary mb-3 flex items-center gap-1 font-medium">
              <MapPin className="w-3 h-3 text-red-500" /> Chennai • Medical Response
            </p>
            <div className="text-[9px] font-bold text-red-700 bg-white/40 p-2 rounded-lg border border-red-50 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              120+ Families At Risk
            </div>
          </Card>
        </motion.div>

        {/* Center Line / Matching State */}
        <div className="flex flex-col items-center gap-2 w-28 md:w-40">
          <div className="relative w-full h-8 flex items-center justify-center">
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-black/5 -translate-y-1/2" />
            <AnimatePresence>
              {currentStep >= 1 && (
                <motion.div 
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  className="absolute inset-x-0 top-1/2 h-[2px] bg-gradient-to-r from-red-500 via-brand-primary to-brand-accent -translate-y-1/2 shadow-[0_0_12px_rgba(136,6,42,0.6)]"
                />
              )}
            </AnimatePresence>
            <motion.div
              animate={{ 
                scale: currentStep === 1 ? [1, 1.1, 1] : 1,
                rotate: currentStep === 1 ? 180 : 0
              }}
              className={`z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white transition-all duration-500 ${currentStep >= 1 ? 'bg-brand-primary text-white' : 'bg-white text-slate-300'}`}
            >
              {currentStep < 2 ? <Settings className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </motion.div>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.span 
              key={currentStep}
              className="text-[8px] font-bold text-brand-primary uppercase bg-brand-primary/5 px-2.5 py-1 rounded-full text-center tracking-tighter"
            >
              {currentStep === 0 && "In Queue"}
              {currentStep === 1 && "Logic Engine Processing"}
              {currentStep >= 2 && "Precision Fit Confirmed"}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Volunteer Card */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ opacity: currentStep >= 2 ? 1 : 0.2, x: 0 }}
          className="flex-1 w-full max-w-[280px]"
        >
          <Card className={`p-4 border-brand-primary/10 transition-all duration-700 ${currentStep >= 2 ? 'bg-white shadow-sm ring-1 ring-brand-primary/5' : 'bg-brand-background'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-brand-primary border-2 border-white shadow-sm">
                VN
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm truncate">Vaishnavi N</h4>
                <div className="flex items-center gap-1 text-[9px] text-brand-text-secondary font-medium uppercase tracking-tight">
                  <ShieldCheck className="w-3 h-3 text-brand-primary shrink-0" /> Senior Solver
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-brand-background/40 p-2 rounded-md border border-black/5">
                 <p className="text-[7px] uppercase font-bold text-brand-text-secondary">Prio</p>
                 <p className="text-[10px] font-bold text-brand-text-primary">First Aid</p>
              </div>
              <div className="bg-brand-background/40 p-2 rounded-md border border-black/5">
                 <p className="text-[7px] uppercase font-bold text-brand-text-secondary">Prox</p>
                 <p className="text-[10px] font-bold text-brand-text-primary">1.2km</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* SECTION 3: SCORE BREAKDOWN */}
      <AnimatePresence>
        {currentStep >= 2 && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto w-full space-y-3"
          >
            <div className="grid grid-cols-3 gap-6">
              {scoresData.map((s, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-brand-text-secondary">
                    <span>{s.label}</span>
                    <span className="text-brand-primary">{s.val}%</span>
                  </div>
                  <div className="h-1.5 bg-black/5 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${s.val}%` }}
                      transition={{ duration: 1.2, delay: 0.1 }}
                      className={`h-full ${s.color} shadow-[0_0_6px_rgba(136,6,42,0.2)]`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 4: FINAL OUTPUT */}
      <AnimatePresence>
        {isCalculated && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-xs mx-auto w-full"
          >
            <div className="p-4 bg-brand-primary text-white rounded-xl text-center shadow-lg relative overflow-hidden ring-4 ring-brand-primary/5">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <div className="w-7 h-7 bg-brand-accent rounded-full flex items-center justify-center mb-1 shadow-md">
                  <CheckCircle2 className="w-4 h-4 text-brand-primary" />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/50">Verified Allocation</p>
                <p className="text-base font-bold">Assigned: Vaishnavi N</p>
                <p className="text-[8px] text-white/30 font-mono tracking-tighter">NODE_VERIFICATION::SUCCESS</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Exit */}
      <div className="fixed top-4 right-4 md:top-6 md:right-6">
        <Link to="/">
          <Button variant="outline" size="sm" className="gap-2 bg-white/90 backdrop-blur-md border-black/10 hover:bg-white font-bold shadow-sm transition-all hover:scale-105 active:scale-95 group text-[10px] h-9">
            <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" /> Exit Demo
          </Button>
        </Link>
      </div>
    </div>
  );
};

