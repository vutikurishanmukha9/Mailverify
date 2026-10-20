import React from 'react';

interface CardProps {
  children: React.ReactNode;
  elevated?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  elevated = false,
  className = '',
  style,
  onClick
}) => {
  return (
    <div
      className={`card ${elevated ? 'card-elevated' : ''} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ title, subtitle, action, className = '', style }) => {
  return (
    <div className={`card-header ${className}`} style={style}>
      <div>
        <div className="card-header-title">{title}</div>
        {subtitle && <div className="card-header-subtitle">{subtitle}</div>}
      </div>
      {action && <div className="card-header-action">{action}</div>}
    </div>
  );
};

export const CardBody: React.FC<{
  children: React.ReactNode;
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, compact = false, className = '', style }) => {
  return (
    <div className={`${compact ? 'card-body-compact' : 'card-body'} ${className}`} style={style}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className = '', style }) => {
  return <div className={`card-footer ${className}`} style={style}>{children}</div>;
};
