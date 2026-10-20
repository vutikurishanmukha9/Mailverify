import React from 'react';
import { useApp } from '../../context/AppContext';
import { Menu, Coins, Plus } from 'lucide-react';
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
        return 'Platform Integrations';
      case 'api':
        return 'Developer API & Webhooks';
      case 'buy-credits':
        return 'Purchase Add-on Credits';
      case 'roadmap':
        return 'Product Roadmap & Changelog';
      case 'support':
        return 'Help & Technical Support';
      case 'settings':
        return `Account Settings · ${settingsTab.charAt(0).toUpperCase() + settingsTab.slice(1)}`;
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
          <Menu size={18} />
        </button>

        {/* Breadcrumb Path */}
        <div className="breadcrumb-path">
          <span className="breadcrumb-root">MailVerify</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{getScreenTitle()}</span>
        </div>
      </div>

      <div className="header-right">
        {/* Top Credits Pill */}
        <div
          className="header-credit-pill"
          onClick={() => navigateTo('buy-credits')}
          title="Click to purchase more credits"
        >
          <Coins size={14} className="credit-pill-icon" />
          <span className="credit-pill-count tabular-nums">
            {subscription.creditsRemaining.toLocaleString()}
          </span>
          <span className="credit-pill-label">credits</span>
          <span className="credit-pill-add">
            <Plus size={11} />
          </span>
        </div>

        {/* Contextual Action Button based on screen */}
        {screen === 'single' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigateTo('bulk')}
            leftIcon={<Plus size={13} />}
          >
            Bulk Verify List
          </Button>
        )}

        {screen === 'api' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              const btn = document.getElementById('trigger-new-key-btn');
              if (btn) btn.click();
            }}
            leftIcon={<Plus size={13} />}
          >
            Create API Key
          </Button>
        )}

        {screen !== 'single' && screen !== 'bulk' && screen !== 'api' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateTo('api')}
          >
            API Docs
          </Button>
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
          padding: 6px;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }

        .breadcrumb-path {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }

        .breadcrumb-root {
          color: var(--text-muted);
          font-weight: 500;
        }

        .breadcrumb-separator {
          color: var(--text-tertiary);
          font-size: 11px;
        }

        .breadcrumb-current {
          color: var(--text-primary);
          font-weight: 600;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .header-credit-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: var(--bg-panel);
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-full);
          padding: 4px 10px 4px 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .header-credit-pill:hover {
          border-color: var(--accent-border);
          background-color: var(--bg-hover);
        }

        .credit-pill-icon {
          color: var(--accent-primary);
        }

        .credit-pill-count {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .credit-pill-label {
          font-size: 11px;
          color: var(--text-muted);
        }

        .credit-pill-add {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--accent-subtle);
          color: var(--accent-text);
          border-radius: 50%;
          width: 14px;
          height: 14px;
          margin-left: 2px;
        }

        @media (max-width: 900px) {
          .top-header {
            padding: 0 var(--space-4);
          }
          .mobile-menu-btn {
            display: flex;
          }
          .breadcrumb-path {
            font-size: 12px;
          }
        }
      `}</style>
    </header>
  );
};
