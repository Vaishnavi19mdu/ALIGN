import { User, Building2 } from 'lucide-react';
import { Card } from '../common/Card';

interface RoleSelectorProps {
  onSelect: (role: 'volunteer' | 'organization') => void;
}

export const RoleSelector = ({ onSelect }: RoleSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-4">
      <button onClick={() => onSelect('volunteer')} className="text-left group outline-none focus:ring-2 focus:ring-brand-accent rounded-[12px]">
        <Card className="p-8 h-full flex flex-col items-center text-center hover:border-brand-accent transition-colors">
          <div className="w-16 h-16 rounded-full bg-brand-secondary/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <User className="w-8 h-8 text-brand-primary" />
          </div>
          <h3 className="text-xl font-heading mb-3">Volunteer</h3>
          <p className="text-brand-text-secondary">
            Join projects, share your skills, and make a measurable impact in your community.
          </p>
        </Card>
      </button>

      <button onClick={() => onSelect('organization')} className="text-left group outline-none focus:ring-2 focus:ring-brand-accent rounded-[12px]">
        <Card className="p-8 h-full flex flex-col items-center text-center hover:border-brand-accent transition-colors">
          <div className="w-16 h-16 rounded-full bg-brand-highlight/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Building2 className="w-8 h-8 text-brand-primary" />
          </div>
          <h3 className="text-xl font-heading mb-3">Organization</h3>
          <p className="text-brand-text-secondary">
            Post tasks, find the perfect talent, and manage your impact efficiency at scale.
          </p>
        </Card>
      </button>
    </div>
  );
};
