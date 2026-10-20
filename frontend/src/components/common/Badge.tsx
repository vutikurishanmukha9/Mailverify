import React from 'react';

export type BadgeVariant = 'success' | 'error' | 'warning' | 'neutral' | 'accent';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  showDot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  showDot = true,
  className = ''
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {showDot && <span className="badge-dot" />}
      {children}
    </span>
  );
};

export const DeliverabilityBadge: React.FC<{ status: 'deliverable' | 'undeliverable' | 'risky'; score?: number }> = ({ status, score }) => {
  if (status === 'deliverable') {
    return (
      <Badge variant="success">
        Deliverable {score !== undefined && `(${score}%)`}
      </Badge>
    );
  }
  if (status === 'undeliverable') {
    return (
      <Badge variant="error">
        Undeliverable {score !== undefined && `(${score}%)`}
      </Badge>
    );
  }
  return (
    <Badge variant="warning">
      Risky {score !== undefined && `(${score}%)`}
    </Badge>
  );
};
