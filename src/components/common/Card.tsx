import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-surface border border-black/5 rounded-[12px] shadow-sm transition-all',
          hover && 'hover:shadow-md hover:translate-y-[-2px]',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
