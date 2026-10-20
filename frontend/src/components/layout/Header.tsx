import React from 'react';
import { useApp } from '../../context/AppContext';
import { Menu, Coins, Plus, HelpCircle, Layers } from 'lucide-react';
import { Button } from '../common/Button';

export const Header: React.FC = () => {
  const {
    screen,
    settingsTab,
    setMobileMenuOpen,
    navigateTo,
    subscription
  } = useApp();

  const getScreenTitle = () => {
    switch (screen) {
      case 'single':
        return 'Single Email Verification';
      case 'bulk':
        return 'Bulk Email Verification';
      case 'integrations':
        return 'Integrations';
      case 'api':
        return 'API & Webhooks';
      case 'buy-credits':
        return 'Buy Credits';
      case 'roadmap':
        return 'Roadmap & Changelog';
      case 'support':
        return 'Help & Support';
      case 'settings':
        return `Settings · ${settingsTab.charAt(0).toUpperCase() + settingsTab.slice(1)}`;
      default:
        return 'MailVerify';
    }
  };

  return (
    <header className="top-header">
      <div className="header-left">
        {/* Mobile Hamburger */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open mobile navigation"
        >
          <Menu size={16} />
        </button>

        {/* Clean Breadcrumb */}
        <div className="breadcrumb-path">
          <span className="breadcrumb-root">MailVerify</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{getScreenTitle()}</span>
        </div>
      </div>

      <div className="header-right">
        {/* Credits Counter Pill */}
        <div
          className="header-credit-pill"
          onClick={() => navigateTo('buy-credits')}
          title="Click to view plans or purchase credits"
        >
          <Coins size={13} className="credit-pill-icon" />
          <span className="credit-pill-count tabular-nums">
            {subscription.creditsRemaining.toLocaleString()}
          </span>
          <span className="credit-pill-label">credits</span>
          <span className="credit-pill-add">
            <Plus size={10} />
          </span>
        </div>

        {/* Contextual navigation link if on Single Verify */}
        {screen === 'single' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateTo('bulk')}
            leftIcon={<Layers size={12} />}
          >
            Bulk Verify
          </Button>
        )}

        {/* Technical Support quick link */}
        {screen !== 'support' && (
          <button
            className="header-support-btn"
            onClick={() => navigateTo('support')}
            title="Help & Technical Documentation"
          >
            <HelpCircle size={15} />
          </button>
        )}
      </div>

      <style>{`
        .top-header {
          height: var(--header-height);
          background-color: var(--bg-canvas);
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--space-6);
          position: sticky;
          top: 0;
          z-index: 90;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .mobile-menu-btn {
          display: none;
          background: transparent;
          border: 1px solid var(--border-standard);
          color: var(--text-secondary);
          padding: 5px;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }

        .breadcrumb-path {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          user-select: none;
        }

        .breadcrumb-root {
          color: var(--text-muted);
          font-weight: 400;
        }

        .breadcrumb-separator {
          color: var(--text-tertiary);
          font-size: 11px;
        }

        .breadcrumb-current {
          color: var(--text-primary);
          font-weight: 500;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .header-credit-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          background-color: var(--bg-panel);
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-sm);
          padding: 4px 8px;
          cursor: pointer;
          font-size: 12px;
          transition: border-color 0.12s ease, background-color 0.12s ease;
          user-select: none;
        }

        .header-credit-pill:hover {
          background-color: var(--bg-hover);
          border-color: var(--border-strong);
        }

        .credit-pill-icon {
          color: var(--accent-primary);
        }

        .credit-pill-count {
          color: var(--text-primary);
          font-weight: 600;
          font-family: var(--font-mono);
        }

        .credit-pill-label {
          color: var(--text-muted);
          font-size: 11px;
        }

        .credit-pill-add {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 14px;
          height: 14px;
          border-radius: 3px;
          background-color: var(--accent-subtle);
          color: var(--accent-text);
          margin-left: 2px;
        }

        .header-support-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: var(--radius-sm);
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.12s ease;
        }

        .header-support-btn:hover {
          color: var(--text-primary);
          background-color: var(--bg-hover);
          border-color: var(--border-standard);
        }

        @media (max-width: 768px) {
          .top-header {
            padding: 0 14px;
          }
          .mobile-menu-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: var(--radius-sm);
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--border-standard);
            color: var(--text-primary);
          }
          .breadcrumb-root,
          .breadcrumb-separator {
            display: none;
          }
          .breadcrumb-current {
            font-size: 13px;
            max-width: 140px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .credit-pill-label {
            display: none;
          }
        }

        @media (max-width: 520px) {
          .top-header {
            padding: 0 10px;
          }
          .breadcrumb-current {
            max-width: 110px;
          }
          .header-right .btn {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};
