import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF641F] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-[#FF641F] text-white hover:bg-[#FF7533] active:bg-[#E05414] shadow-sm shadow-[#FF641F]/20 font-semibold',
        primary:
          'bg-[#FF641F] text-white hover:bg-[#FF7533] active:bg-[#E05414] shadow-sm shadow-[#FF641F]/20 font-semibold',
        destructive:
          'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25',
        danger:
          'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25',
        outline:
          'border border-white/12 bg-white/[0.02] text-[#F8FAFC] hover:bg-white/[0.06] hover:border-white/20 shadow-xs',
        secondary:
          'bg-[#181C26] text-[#F8FAFC] border border-white/[0.09] hover:bg-[#202533] shadow-xs',
        ghost:
          'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.06]',
        link:
          'text-[#FF641F] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-10 px-4 py-2 text-sm rounded-lg',
        md: 'h-10 px-4 py-2 text-sm rounded-lg',
        sm: 'h-8.5 px-3.5 py-1.5 text-xs rounded-md',
        lg: 'h-12 px-6 text-base rounded-xl font-semibold',
        icon: 'h-10 w-10 p-0 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
