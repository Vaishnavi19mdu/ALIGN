import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-brand-primary text-white hover:brightness-110 hover:shadow-md shadow-sm',
      secondary: 'bg-brand-secondary text-brand-primary hover:brightness-105 hover:shadow-md',
      accent: 'bg-brand-accent text-brand-text-primary hover:brightness-105 hover:shadow-md',
      outline: 'border-2 border-brand-primary text-brand-primary bg-transparent hover:bg-brand-primary hover:text-white hover:shadow-md',
      ghost: 'bg-transparent text-brand-text-primary hover:bg-black/5',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-6 py-2.5 text-base',
      lg: 'px-8 py-3 text-lg',
      icon: 'p-2',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-[8px]',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
