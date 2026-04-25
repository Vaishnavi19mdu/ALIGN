import { Button } from '../common/Button';

export const VolunteerForm = ({ onBack }: { onBack: () => void }) => {
  return (
    <form className="space-y-4 w-full" onSubmit={(e) => e.preventDefault()}>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-brand-text-secondary">Full Name</label>
          <input type="text" className="w-full px-4 py-2 rounded-lg bg-surface border border-black/10 focus:border-brand-primary outline-none" placeholder="John Doe" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-brand-text-secondary">Email</label>
          <input type="email" className="w-full px-4 py-2 rounded-lg bg-surface border border-black/10 focus:border-brand-primary outline-none" placeholder="john@example.com" />
        </div>
      </div>
      
      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase text-brand-text-secondary">Location</label>
        <input type="text" className="w-full px-4 py-2 rounded-lg bg-surface border border-black/10 focus:border-brand-primary outline-none" placeholder="City or Coordinates" />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase text-brand-text-secondary">Skills</label>
        <div className="flex flex-wrap gap-2 py-1">
          {['Content Writing', 'First Aid', 'Coding', 'Events'].map(skill => (
            <span key={skill} className="px-3 py-1 bg-brand-secondary/30 text-brand-primary text-xs font-medium rounded-full border border-brand-primary/10">
              {skill}
            </span>
          ))}
          <button className="px-3 py-1 border border-dashed border-brand-text-secondary text-brand-text-secondary text-xs rounded-full">+ Add</button>
        </div>
      </div>

      <div className="pt-4 flex gap-4">
        <Button variant="ghost" onClick={onBack} className="flex-1">Back</Button>
        <Button className="flex-1">Complete Signup</Button>
      </div>
    </form>
  );
};
