import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import { signUpVolunteer } from '../../lib/authService';
import { X } from 'lucide-react';

const PRESET_SKILLS = ['Content Writing', 'First Aid', 'Coding', 'Events', 'Teaching', 'Logistics', 'Photography', 'Translation'];

export const VolunteerForm = ({ onBack }: { onBack: () => void }) => {
  const navigate = useNavigate();

  const [fullName, setFullName]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [location, setLocation]       = useState('');
  const [skills, setSkills]           = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [showCustom, setShowCustom]   = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const toggleSkill = (skill: string) =>
    setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !skills.includes(trimmed)) setSkills(prev => [...prev, trimmed]);
    setCustomSkill('');
    setShowCustom(false);
  };

  const handleSubmit = async () => {
    if (!fullName || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUpVolunteer(email, password, { fullName, location, skills });
      navigate('/volunteer');
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 w-full">

      {/* Name + Email */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-brand-text-secondary">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-brand-background border border-black/10 focus:border-brand-primary outline-none"
            placeholder="John Doe"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-brand-text-secondary">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-brand-background border border-black/10 focus:border-brand-primary outline-none"
            placeholder="john@example.com"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase text-brand-text-secondary">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-brand-background border border-black/10 focus:border-brand-primary outline-none"
          placeholder="Min. 8 characters"
          minLength={8}
        />
      </div>

      {/* Location */}
      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase text-brand-text-secondary">Location</label>
        <input
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-brand-background border border-black/10 focus:border-brand-primary outline-none"
          placeholder="City or region"
        />
      </div>

      {/* Skills */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase text-brand-text-secondary">Skills</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_SKILLS.map(skill => (
            <button
              key={skill}
              type="button"
              onClick={() => toggleSkill(skill)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                skills.includes(skill)
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'bg-brand-background text-brand-primary border-brand-primary/20 hover:border-brand-primary'
              }`}
            >
              {skill}
            </button>
          ))}

          {/* Custom skills */}
          {skills.filter(s => !PRESET_SKILLS.includes(s)).map(skill => (
            <span
              key={skill}
              className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-brand-primary text-white border border-brand-primary"
            >
              {skill}
              <button type="button" onClick={() => toggleSkill(skill)} className="hover:opacity-70 transition-opacity">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}

          {/* + Add */}
          {showCustom ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                autoFocus
                value={customSkill}
                onChange={e => setCustomSkill(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); addCustomSkill(); }
                  if (e.key === 'Escape') setShowCustom(false);
                }}
                placeholder="Type skill…"
                className="px-2 py-1 text-xs rounded-lg border border-brand-primary/30 focus:border-brand-primary outline-none w-28"
              />
              <button type="button" onClick={addCustomSkill} className="text-xs text-brand-primary font-bold hover:opacity-70">
                Add
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustom(true)}
              className="px-3 py-1 border border-dashed border-brand-text-secondary text-brand-text-secondary text-xs rounded-full hover:border-brand-primary hover:text-brand-primary transition-colors"
            >
              + Add
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {/* Buttons — type="button" on both, no form wrapping these */}
      <div className="pt-2 flex gap-4">
        <Button type="button" variant="ghost" onClick={onBack} className="flex-1" disabled={loading}>
          Back
        </Button>
        <Button type="button" onClick={handleSubmit} className="flex-1" disabled={loading}>
          {loading ? 'Creating account…' : 'Complete Signup'}
        </Button>
      </div>

    </div>
  );
};