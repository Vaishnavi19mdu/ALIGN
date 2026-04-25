import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  ListCheck, 
  ArrowLeftRight, 
  BarChart3, 
  ChevronRight,
  LogOut,
  X,
  Zap
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { THEME } from '../../constants';
import { cn } from '../../lib/utils';

import { Logo } from '../common/Logo';

const iconMap: Record<string, any> = {
  LayoutDashboard,
  ListCheck,
  ArrowLeftRight,
  BarChart3,
  Zap,
};

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
  { name: 'Tasks', path: '/tasks', icon: 'ListCheck' },
  { name: 'Allocation', path: '/allocation', icon: 'ArrowLeftRight' },
  { name: 'Reports', path: '/reports', icon: 'BarChart3' },
  { name: 'How It Works', path: '/demo', icon: 'Zap' },
];

export const Sidebar = ({ onClose }: { onClose?: () => void }) => {
  return (
    <aside className="w-full lg:w-64 h-screen bg-brand-primary text-white flex flex-col sticky top-0 border-r border-white/5 overflow-hidden">
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-10">
          <Logo />
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-2 hover:bg-white/10 rounded-full">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = iconMap[item.icon];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-[8px] transition-all group",
                  isActive ? "bg-white/10 text-brand-accent" : "hover:bg-white/5 text-white/70 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-white/10 mt-auto">
          <button className="flex items-center gap-3 px-4 py-3 w-full text-white/70 hover:text-white hover:bg-white/5 rounded-[8px] transition-all group">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
