import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { CheckCircle2 } from 'lucide-react';

export const SettingsPage = () => {
  const { user, setUser, initials } = useUser();
  const [form, setForm] = useState({ ...user });
  const [saved, setSaved] = useState(false);

  const set = (k: string, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    setUser(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const previewInitials = (() => {
    const f = form.firstName.trim()[0] ?? '';
    const l = form.lastName.trim()[0] ?? '';
    return (f + l).toUpperCase() || '?';
  })();

  return (
    <div className="max-w-xl space-y-6">

      {/* Avatar preview */}
      <div className="flex flex-col items-center gap-2 py-4">
        <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center text-xl font-bold text-brand-primary">
          {previewInitials}
        </div>
        <p className="text-[11px] text-brand-text-secondary">Auto-generated from your name</p>
      </div>

      {/* Profile card */}
      <div className="bg-white border border-black/5 rounded-2xl overflow-hidden">
        <p className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary border-b border-black/5">
          Profile
        </p>
        {[
          { label: 'First name', key: 'firstName', type: 'text' },
          { label: 'Last name',  key: 'lastName',  type: 'text' },
          { label: 'Email',      key: 'email',     type: 'email' },
        ].map(f => (
          <div key={f.key} className="flex items-center px-5 py-3.5 border-b border-black/5 gap-4">
            <span className="text-xs text-brand-text-secondary w-28 shrink-0">{f.label}</span>
            <input
              type={f.type}
              value={(form as any)[f.key]}
              onChange={e => set(f.key, e.target.value)}
              className="flex-1 text-sm text-brand-text-primary bg-transparent outline-none border-none focus:ring-0"
            />
          </div>
        ))}
        <div className="flex items-center px-5 py-3.5 border-b border-black/5 gap-4">
          <span className="text-xs text-brand-text-secondary w-28 shrink-0">Role</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary font-semibold capitalize">
            {user.role}
          </span>
        </div>
        <div className="flex items-center px-5 py-3.5 gap-4">
          <span className="text-xs text-brand-text-secondary w-28 shrink-0">Organisation</span>
          <span className="text-sm text-brand-text-primary">{user.orgName}</span>
        </div>
      </div>

      {/* Security card */}
      <div className="bg-white border border-black/5 rounded-2xl overflow-hidden">
        <p className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary border-b border-black/5">
          Security
        </p>
        <div className="flex items-center px-5 py-3.5 border-b border-black/5 gap-4">
          <span className="text-xs text-brand-text-secondary w-28 shrink-0">Password</span>
          <input
            type="password"
            defaultValue="••••••••"
            className="flex-1 text-sm bg-transparent outline-none border-none focus:ring-0"
          />
        </div>
        <div className="flex items-center px-5 py-3.5 gap-4">
          <span className="text-xs text-brand-text-secondary w-28 shrink-0">Notifications</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-brand-primary" />
            <span className="text-sm text-brand-text-primary">Email alerts</span>
          </label>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="w-full py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
      >
        {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved</> : 'Save changes'}
      </button>
    </div>
  );
};