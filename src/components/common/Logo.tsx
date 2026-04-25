import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LogoProps {
  className?: string;
  isDark?: boolean;
  layout?: 'horizontal' | 'vertical';
}

const LogoIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 40 32" 
    className={cn("w-10 h-8", className)}
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 3 thin lines converging moving toward a single point */}
    <path d="M4 8H16L24 16" stroke="#E6D3B3" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M4 16H24" stroke="#E6D3B3" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M4 24H16L24 16" stroke="#E6D3B3" strokeWidth="1.5" strokeLinecap="round"/>
    
    {/* Merged right-pointing arrow */}
    <path d="M24 16H36" stroke="#EBAF5A" strokeWidth="3" strokeLinecap="round"/>
    <path d="M30 10L36 16L30 22" stroke="#EBAF5A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const Logo = ({ className, isDark = false, layout = 'horizontal' }: LogoProps) => {
  return (
    <div className={cn(
      "flex items-center gap-3", 
      layout === 'vertical' ? "flex-col text-center" : "flex-row",
      className
    )}>
      <LogoIcon />
      <span className={cn(
        "text-2xl font-heading font-bold tracking-widest leading-none",
        isDark ? "text-brand-primary" : "text-white"
      )}>
        ALIGN
      </span>
    </div>
  );
};
