import { useState, useRef } from 'react';
import { Button } from '../common/Button';
import { ChevronLeft, Upload, CheckCircle2, X } from 'lucide-react';

type OrgRole = 'admin' | 'staff';
type AdminStep = 0 | 1 | 2 | 3 | 4;

const ADMIN_STEPS = [
  { title: 'Basic info',      subtitle: "Your organisation's contact details" },
  { title: 'Org details',     subtitle: 'Classification and registration' },
  { title: 'Bonafide docs',   subtitle: 'Verification documents' },
  { title: 'Admin account',   subtitle: 'Your personal login' },
  { title: 'Review',          subtitle: 'Everything looks right?' },
];

export const OrgForm = ({ onBack }: { onBack: () => void }) => {
  const [orgRole, setOrgRole]   = useState<OrgRole | null>(null);
  const [adminStep, setAdminStep] = useState<AdminStep>(0);
  const [staffStep, setStaffStep] = useState<0 | 1>(0);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [adminData, setAdminData] = useState({
    orgName: '', email: '', website: '',
    type: '', size: '', regNum: '',
    docName: '',
    adminName: '', adminEmail: '', password: '',
  });
  const [staffData, setStaffData] = useState({ code: '', name: '', email: '', password: '' });

  const setA = (k: string, v: string) => setAdminData(prev => ({ ...prev, [k]: v }));
  const setS = (k: string, v: string) => setStaffData(prev => ({ ...prev, [k]: v }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setA('docName', file.name);
  };

  // ── Pending / success screen ─────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="space-y-4 text-center py-2">
        <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6 text-brand-primary" />
        </div>
        <div>
          <h3 className="text-lg font-heading mb-1">
            {orgRole === 'admin' ? 'Application submitted' : 'Request sent'}
          </h3>
          <p className="text-xs text-brand-text-secondary leading-relaxed max-w-sm mx-auto">
            {orgRole === 'admin'
              ? 'Your registration is under superadmin review. Once approved you will receive a 7-digit org code to share with staff.'
              : 'Your join request is pending admin approval. You can browse volunteer activities in the meantime.'}
          </p>
        </div>
        <div className="bg-brand-background rounded-xl p-4 text-left space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary mb-2">What happens next</p>
          {orgRole === 'admin' ? (
            <>
              <p className="text-xs text-brand-text-secondary">→ Superadmin reviews submission and bonafide docs</p>
              <p className="text-xs text-brand-text-secondary">→ Approval email sent with your 7-digit org code</p>
              <p className="text-xs text-brand-text-secondary">→ Staff use that code to join on signup</p>
            </>
          ) : (
            <>
              <p className="text-xs text-brand-text-secondary">→ Admin reviews your request on their dashboard</p>
              <p className="text-xs text-brand-text-secondary">→ You'll get an email once access is granted</p>
            </>
          )}
        </div>
        <Button onClick={onBack} variant="ghost" className="w-full">Back to home</Button>
      </div>
    );
  }

  // ── Role selector ────────────────────────────────────────────────────────
  if (!orgRole) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {(['admin', 'staff'] as OrgRole[]).map(r => (
            <button key={r} onClick={() => setOrgRole(r)}
              className="p-4 border border-black/10 rounded-xl hover:border-brand-primary transition-colors text-left group">
              <p className="font-bold text-brand-primary capitalize mb-1 group-hover:scale-105 transition-transform inline-block">{r}</p>
              <p className="text-[11px] text-brand-text-secondary">
                {r === 'admin' ? 'Register & manage your organisation' : 'Join an existing org via invite code'}
              </p>
            </button>
          ))}
        </div>
        <Button variant="ghost" onClick={onBack} className="w-full">Cancel</Button>
      </div>
    );
  }

  // ── Staff flow ───────────────────────────────────────────────────────────
  if (orgRole === 'staff') {
    return (
      <div className="space-y-3">
        <button onClick={() => staffStep === 0 ? setOrgRole(null) : setStaffStep(0)}
          className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-primary transition-colors">
          <ChevronLeft className="w-3 h-3" /> Back
        </button>

        {staffStep === 0 ? (
          <>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Org invite code</label>
              <input type="text" maxLength={8} placeholder="ABC-1234"
                value={staffData.code}
                onChange={e => setS('code', e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-lg bg-brand-background border border-black/10 focus:border-brand-primary outline-none text-xl font-mono tracking-[0.2em] text-center" />
              <p className="text-[11px] text-brand-text-secondary text-center">3 letters · hyphen · 4 digits · given by your admin</p>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="ghost" onClick={() => setOrgRole(null)} className="flex-1">Back</Button>
              <Button className="flex-1" onClick={() => setStaffStep(1)} disabled={staffData.code.length < 7}>Continue</Button>
            </div>
          </>
        ) : (
          <form className="space-y-3" onSubmit={e => { e.preventDefault(); setSubmitted(true); }}>
            {[
              { label: 'Full name',     key: 'name',     type: 'text',     ph: 'Alex Kumar' },
              { label: 'Work email',    key: 'email',    type: 'email',    ph: 'alex@org.com' },
              { label: 'Password',      key: 'password', type: 'password', ph: 'Min. 8 characters' },
            ].map(f => (
              <div key={f.key} className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">{f.label}</label>
                <input type={f.type} placeholder={f.ph} value={(staffData as any)[f.key]}
                  onChange={e => setS(f.key, e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-brand-background border border-black/10 focus:border-brand-primary outline-none" />
              </div>
            ))}
            <div className="flex gap-3 pt-1">
              <Button variant="ghost" onClick={() => setStaffStep(0)} className="flex-1">Back</Button>
              <Button className="flex-1">Submit request</Button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // ── Admin flow ───────────────────────────────────────────────────────────
  const progress = ((adminStep + 1) / ADMIN_STEPS.length) * 100;
  const goNext = () => adminStep === 4 ? setSubmitted(true) : setAdminStep(s => (s + 1) as AdminStep);
  const goPrev = () => adminStep === 0 ? setOrgRole(null) : setAdminStep(s => (s - 1) as AdminStep);

  return (
    <div className="space-y-3">
      {/* Step nav */}
      <div className="flex items-center justify-between">
        <button onClick={goPrev}
          className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-primary transition-colors">
          <ChevronLeft className="w-3 h-3" /> {adminStep === 0 ? 'Role select' : 'Back'}
        </button>
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">
          Step {adminStep + 1} of {ADMIN_STEPS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-brand-background rounded-full overflow-hidden">
        <div className="h-full bg-brand-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="pb-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">{ADMIN_STEPS[adminStep].subtitle}</p>
        <h3 className="text-base font-heading">{ADMIN_STEPS[adminStep].title}</h3>
      </div>

      {/* Step 0 — Basic info */}
      {adminStep === 0 && (
        <div className="space-y-2.5">
          {[
            { label: 'Organisation name', key: 'orgName',  type: 'text',  ph: 'Impact Global NGO' },
            { label: 'Official email',    key: 'email',    type: 'email', ph: 'contact@org.org' },
            { label: 'Website URL',       key: 'website',  type: 'url',   ph: 'https://impactglobal.org' },
          ].map(f => (
            <div key={f.key} className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">{f.label}</label>
              <input type={f.type} placeholder={f.ph} value={(adminData as any)[f.key]}
                onChange={e => setA(f.key, e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-brand-background border border-black/10 focus:border-brand-primary outline-none text-sm" />
            </div>
          ))}
        </div>
      )}

      {/* Step 1 — Org details */}
      {adminStep === 1 && (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Type</label>
              <select value={adminData.type} onChange={e => setA('type', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-brand-background border border-black/10 focus:border-brand-primary outline-none text-sm">
                <option value="" disabled>Select…</option>
                {['NGO', 'Community', 'Govt', 'Corporate CSR'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Size</label>
              <select value={adminData.size} onChange={e => setA('size', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-brand-background border border-black/10 focus:border-brand-primary outline-none text-sm">
                <option value="" disabled>Select…</option>
                {['1–10', '11–50', '51–200', '200+'].map(o => <option key={o}>{o} people</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Registration / NGO ID</label>
            <input type="text" placeholder="NGO/REG/2019/00421" value={adminData.regNum}
              onChange={e => setA('regNum', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-brand-background border border-black/10 focus:border-brand-primary outline-none text-sm" />
          </div>
        </div>
      )}

      {/* Step 2 — Bonafide docs */}
      {adminStep === 2 && (
        <div className="space-y-2.5">
          {/* Hidden real file input — PDF only */}
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />

          {adminData.docName ? (
            /* Uploaded state — compact row */
            <div className="flex items-center gap-3 px-3 py-2.5 border border-brand-primary/30 bg-brand-primary/5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-brand-primary flex-shrink-0" />
              <span className="text-sm font-medium flex-1 truncate">{adminData.docName}</span>
              <button onClick={() => setA('docName', '')}
                className="text-brand-text-secondary hover:text-brand-primary transition-colors flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Upload trigger — single compact row, no multiline text */
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full flex items-center gap-3 px-3 py-2.5 border border-dashed border-black/20 rounded-xl hover:border-brand-primary transition-colors text-left">
              <Upload className="w-4 h-4 text-brand-text-secondary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium leading-none">Certificate of incorporation</p>
                <p className="text-[11px] text-brand-text-secondary mt-0.5">PDF only · max 5 MB</p>
              </div>
              <span className="ml-auto text-[11px] text-brand-primary font-medium flex-shrink-0">Browse</span>
            </button>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Reg. number (confirm)</label>
            <input type="text" value={adminData.regNum} readOnly
              className="w-full px-3 py-2 rounded-lg bg-brand-background border border-black/10 outline-none text-sm text-brand-text-secondary" />
          </div>
        </div>
      )}

      {/* Step 3 — Admin account */}
      {adminStep === 3 && (
        <div className="space-y-2.5">
          {[
            { label: 'Your full name', key: 'adminName',  type: 'text',     ph: 'Sarah Ramesh' },
            { label: 'Admin email',    key: 'adminEmail', type: 'email',    ph: 'sarah@impactglobal.org' },
            { label: 'Password',       key: 'password',   type: 'password', ph: 'Min. 8 characters' },
          ].map(f => (
            <div key={f.key} className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">{f.label}</label>
              <input type={f.type} placeholder={f.ph} value={(adminData as any)[f.key]}
                onChange={e => setA(f.key, e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-brand-background border border-black/10 focus:border-brand-primary outline-none text-sm" />
            </div>
          ))}
        </div>
      )}

      {/* Step 4 — Review */}
      {adminStep === 4 && (
        <div className="space-y-3 text-sm">
          {[
            { label: 'Organisation', rows: [['Name', adminData.orgName], ['Email', adminData.email], ['Website', adminData.website]] },
            { label: 'Details',      rows: [['Type', adminData.type], ['Size', adminData.size], ['Reg. no.', adminData.regNum]] },
            { label: 'Admin account',rows: [['Name', adminData.adminName], ['Email', adminData.adminEmail], ['Documents', adminData.docName ? `✓ ${adminData.docName}` : 'Not uploaded']] },
          ].map(section => (
            <div key={section.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary mb-1.5">{section.label}</p>
              <div className="bg-brand-background rounded-xl px-3 py-2 space-y-1.5">
                {section.rows.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <span className="text-brand-text-secondary text-xs flex-shrink-0">{k}</span>
                    <span className="font-medium text-xs text-right truncate">{v || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer buttons */}
      <div className="flex gap-3 pt-1">
        <Button variant="ghost" onClick={goPrev} className="flex-1">
          {adminStep === 0 ? 'Cancel' : 'Back'}
        </Button>
        <Button className="flex-1" onClick={goNext}>
          {adminStep === 4 ? 'Submit for approval' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};