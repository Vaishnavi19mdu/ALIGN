import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Building2 } from 'lucide-react';
import { RoleSelector } from './RoleSelector';
import { VolunteerForm } from './VolunteerForm';
import { OrgForm } from './OrgForm';
import { Card } from '../common/Card';

export const FlipCardSignup = () => {
  const [role, setRole] = useState<'volunteer' | 'organization' | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isFlipped = !!role;

  if (isMobile) {
    return (
      <div className="w-full max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {!role ? (
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card className="w-full p-6 bg-white shadow-xl">
                <h2 className="text-xl font-heading mb-2">Create your account</h2>
                <p className="text-sm text-brand-text-secondary mb-8">Select your primary role to get started</p>
                <div className="space-y-4">
                  <button onClick={() => setRole('volunteer')} className="w-full text-left">
                    <div className="p-4 border border-black/5 rounded-xl bg-brand-background/20 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-brand-primary" />
                      </div>
                      <div>
                        <p className="font-bold">Volunteer</p>
                        <p className="text-[10px] text-brand-text-secondary">Join projects and share skills</p>
                      </div>
                    </div>
                  </button>
                  <button onClick={() => setRole('organization')} className="w-full text-left">
                    <div className="p-4 border border-black/5 rounded-xl bg-brand-background/20 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-brand-primary" />
                      </div>
                      <div>
                        <p className="font-bold">Organization</p>
                        <p className="text-[10px] text-brand-text-secondary">Manage impact and talent</p>
                      </div>
                    </div>
                  </button>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="form-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="w-full p-6 bg-white shadow-xl">
                <div className="mb-6">
                  <h2 className="text-xl font-heading">
                    {role === 'volunteer' ? 'Registration' : 'Organization Setup'}
                  </h2>
                </div>
                {role === 'volunteer'
                  ? <VolunteerForm onBack={() => setRole(null)} />
                  : <OrgForm onBack={() => setRole(null)} />}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop: perspective flip — NO fixed height, let content size naturally
  return (
    <div className="perspective-1000 w-full max-w-2xl mx-auto">
      <motion.div
        className="relative w-full preserves-3d"
        style={{ minHeight: isFlipped ? 'auto' : '500px' }}
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Front Face: Role Selection — fixed height is fine here */}
        <div className={`${isFlipped ? 'absolute' : 'relative'} w-full backface-hidden`}
             style={{ height: isFlipped ? 0 : 'auto', minHeight: isFlipped ? 0 : '500px', overflow: 'hidden' }}>
          <Card className="w-full h-full p-8 flex flex-col items-center justify-center bg-white shadow-xl">
            <h2 className="text-2xl font-heading mb-2">Create your account</h2>
            <p className="text-brand-text-secondary mb-10 text-center">Select your primary role to get started</p>
            <RoleSelector onSelect={setRole} />
          </Card>
        </div>

        {/* Back Face: Forms — height auto so content is never clipped */}
        <div className="w-full backface-hidden [transform:rotateY(180deg)]"
             style={{ position: isFlipped ? 'relative' : 'absolute', top: 0, left: 0 }}>
          <Card className="w-full p-10 flex flex-col bg-white shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-heading">
                {role === 'volunteer' ? 'Volunteer Registration' : 'Organization Setup'}
              </h2>
              <div className="px-3 py-1 bg-brand-background rounded-full text-[10px] font-bold uppercase tracking-widest text-brand-primary">
                Step 2 of 2
              </div>
            </div>

            <AnimatePresence mode="wait">
              {role === 'volunteer' && (
                <motion.div key="volunteer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <VolunteerForm onBack={() => setRole(null)} />
                </motion.div>
              )}
              {role === 'organization' && (
                <motion.div key="org" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <OrgForm onBack={() => setRole(null)} />
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};