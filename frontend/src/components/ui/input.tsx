import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-lg border border-white/[0.12] bg-[#0F1219] px-3.5 py-2 text-sm text-[#F8FAFC] shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF641F] focus-visible:border-[#FF641F] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
