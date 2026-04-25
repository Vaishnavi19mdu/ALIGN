import { Menu } from 'lucide-react';
import { useUser } from '../../context/UserContext';

export const Topbar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { initials } = useUser();

  return (
    <header className="h-14 border-b border-black/5 bg-white px-4 flex items-center justify-between sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-2 text-brand-text-secondary hover:text-brand-primary transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="ml-auto">
        <div className="w-8 h-8 rounded-full bg-brand-secondary flex items-center justify-center text-brand-primary font-bold text-sm">
          {initials}
        </div>
      </div>
    </header>
  );
};