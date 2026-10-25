import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors select-none',
  {
    variants: {
      variant: {
        default:
          'border border-transparent bg-[#FF641F] text-white',
        secondary:
          'border border-white/10 bg-white/[0.05] text-[#8E929D]',
        neutral:
          'border border-white/10 bg-white/[0.04] text-[#8E929D]',
        success:
          'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        error:
          'border border-red-500/20 bg-red-500/10 text-red-400',
        destructive:
          'border border-red-500/20 bg-red-500/10 text-red-400',
        warning:
          'border border-amber-500/20 bg-amber-500/10 text-amber-300',
        outline:
          'border border-white/15 text-[#EDEDEF]',
        accent:
          'border border-[#FF641F]/30 bg-[#FF641F]/10 text-[#FF7B3D]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  showDot?: boolean;
}

function Badge({ className, variant, showDot = true, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {showDot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full shrink-0',
            variant === 'success' && 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]',
            variant === 'error' && 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]',
            variant === 'destructive' && 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]',
            variant === 'warning' && 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]',
            variant === 'accent' && 'bg-[#FF641F] shadow-[0_0_6px_rgba(255,100,31,0.8)]',
            (!variant || variant === 'default' || variant === 'secondary' || variant === 'neutral' || variant === 'outline') &&
              'bg-current'
          )}
        />
      )}
      {children}
    </div>
  );
}

export const DeliverabilityBadge: React.FC<{
  status: 'deliverable' | 'undeliverable' | 'risky';
  score?: number;
  className?: string;
}> = ({ status, score, className }) => {
  if (status === 'deliverable') {
    return (
      <Badge variant="success" className={className}>
        Deliverable {score !== undefined && `(${score}%)`}
      </Badge>
    );
  }
  if (status === 'undeliverable') {
    return (
      <Badge variant="error" className={className}>
        Undeliverable {score !== undefined && `(${score}%)`}
      </Badge>
    );
  }
  return (
    <Badge variant="warning" className={className}>
      Risky {score !== undefined && `(${score}%)`}
    </Badge>
  );
};

export { Badge, badgeVariants };
