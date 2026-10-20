import React from 'react';
import { useApp } from '../../context/AppContext';
import type { ScreenId } from '../../types';
import {
  MailCheck,
  Layers,
  Zap,
  Code2,
  Coins,
  MapPin,
  HelpCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';

interface NavItem {
  id: ScreenId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

const PRIMARY_NAV: NavItem[] = [
  { id: 'single', label: 'Single Verify', icon: MailCheck },
  { id: 'bulk', label: 'Bulk Verify', icon: Layers },
  { id: 'integrations', label: 'Integrations', icon: Zap },
  { id: 'api', label: 'API & Webhooks', icon: Code2 }
];

const GENERAL_NAV: NavItem[] = [
  { id: 'buy-credits', label: 'Buy Credits', icon: Coins },
  { id: 'roadmap', label: 'Roadmap', icon: MapPin },
  { id: 'support', label: 'Help & Support', icon: HelpCircle }
];

export const Sidebar: React.FC = () => {
  const {
    screen,
    navigateTo,
    isSidebarCollapsed,
    setSidebarCollapsed,
    isMobileMenuOpen,
    setMobileMenuOpen,
    subscription,
    userProfile
  } = useApp();

  const creditPercent = Math.min(
    100,
    Math.round((subscription.creditsRemaining / subscription.monthlyCreditAllowance) * 100)
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 900 }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${
          isMobileMenuOpen ? 'mobile-open' : ''
        }`}
      >
        {/* Brand / Logo Area */}
        <div className="sidebar-brand">
          <div className="brand-logo" onClick={() => navigateTo('single')}>
            <div className="brand-icon">
              <MailCheck size={18} strokeWidth={2.4} />
            </div>
            {!isSidebarCollapsed && (
              <div className="brand-text">
                <span className="brand-name">MailVerify</span>
                <span className="brand-badge">ENTERPRISE</span>
              </div>
            )}
          </div>
          <button
            className="sidebar-toggle-btn desktop-only"
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'}
            aria-label="Toggle sidebar collapse"
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="sidebar-nav-scroll">
          {/* Primary Section */}
          <div className="nav-group">
            {!isSidebarCollapsed && <div className="nav-group-label">VERIFICATION</div>}
            <nav className="nav-list">
              {PRIMARY_NAV.map((item) => {
                const Icon = item.icon;
                const isActive = screen === item.id;
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => navigateTo(item.id)}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <Icon size={17} className="nav-icon" />
                    {!isSidebarCollapsed && <span className="nav-label">{item.label}</span>}
                    {!isSidebarCollapsed && item.badge && (
                      <span className="nav-badge-pill">{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* General Section */}
          <div className="nav-group">
            {!isSidebarCollapsed && <div className="nav-group-label">RESOURCES</div>}
            <nav className="nav-list">
              {GENERAL_NAV.map((item) => {
                const Icon = item.icon;
                const isActive = screen === item.id;
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => navigateTo(item.id)}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <Icon size={17} className="nav-icon" />
                    {!isSidebarCollapsed && <span className="nav-label">{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Operational Status Pill (Non-obstructive) */}
          {!isSidebarCollapsed && (
            <div className="system-health-pill">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="health-indicator-dot" />
                <span>All Systems Operational</span>
              </div>
              <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>42ms</span>
            </div>
          )}
        </div>

        {/* Compact Account & Credits Footer Area */}
        <div className="sidebar-footer">
          {/* Credit balance card */}
          {!isSidebarCollapsed ? (
            <div className="credit-summary-card">
              <div className="credit-card-header">
                <span className="credit-card-title">CREDITS REMAINING</span>
                <button
                  className="credit-refill-btn"
                  onClick={() => navigateTo('buy-credits')}
                  title="Purchase add-on credits"
                >
                  <Plus size={11} />
                  <span>Add</span>
                </button>
              </div>
              <div className="credit-card-balance tabular-nums">
                {subscription.creditsRemaining.toLocaleString()}
                <span className="credit-card-total">
                  {' '}/ {subscription.monthlyCreditAllowance.toLocaleString()}
                </span>
              </div>
              <div className="credit-progress-bar">
                <div
                  className="credit-progress-fill"
                  style={{ width: `${Math.max(4, creditPercent)}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              className="collapsed-credit-icon-btn"
              onClick={() => navigateTo('buy-credits')}
              title={`${subscription.creditsRemaining.toLocaleString()} Credits Available`}
            >
              <Coins size={16} />
            </button>
          )}

          {/* User Profile / Settings Row */}
          <div
            className={`account-row ${screen === 'settings' ? 'active' : ''}`}
            onClick={() => navigateTo('settings', 'profile')}
            title="Open Account Settings"
          >
            <div className="account-avatar">
              {userProfile.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div className="account-details">
                <div className="account-name">{userProfile.name}</div>
                <div className="account-tier">{subscription.tierName}</div>
              </div>
            )}
            {!isSidebarCollapsed && (
              <div className="account-settings-icon">
                <Settings size={15} />
              </div>
            )}
          </div>
        </div>
      </aside>

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          background-color: var(--bg-sidebar);
          border-right: 1px solid var(--border-standard);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          height: 100vh;
          position: sticky;
          top: 0;
          z-index: 100;
          transition: width 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
        }

        .sidebar.collapsed {
          width: var(--sidebar-collapsed-width);
        }

        .sidebar-brand {
          height: var(--header-height);
          padding: 0 var(--space-4);
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-subtle);
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          cursor: pointer;
          overflow: hidden;
        }

        .brand-icon {
          width: 32px;
          height: 32px;
          background-color: var(--accent-subtle);
          border: 1px solid var(--accent-border);
          color: var(--accent-primary);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .brand-text {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .brand-name {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .brand-badge {
          font-size: 9.5px;
          font-weight: 700;
          padding: 1px 5px;
          background-color: var(--accent-subtle);
          border: 1px solid var(--accent-border);
          color: var(--accent-text);
          border-radius: 4px;
          letter-spacing: 0.05em;
        }

        .sidebar-toggle-btn {
          background: transparent;
          border: 1px solid var(--border-subtle);
          color: var(--text-muted);
          width: 24px;
          height: 24px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .sidebar-toggle-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-strong);
          background-color: var(--bg-hover);
        }

        .sidebar-nav-scroll {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-4) var(--space-3);
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }

        .nav-group-label {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.06em;
          padding: 0 var(--space-2) var(--space-1);
        }

        .nav-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: 8px 10px;
          border-radius: var(--radius-sm);
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          font-family: var(--font-sans);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.12s ease;
          width: 100%;
          text-align: left;
        }

        .nav-item:hover {
          background-color: var(--bg-hover);
          color: var(--text-primary);
        }

        .nav-item.active {
          background-color: var(--bg-panel-elevated);
          color: var(--text-primary);
          border-color: var(--border-standard);
        }

        .nav-item.active .nav-icon {
          color: var(--accent-primary);
        }

        .nav-icon {
          color: var(--text-muted);
          flex-shrink: 0;
          transition: color 0.12s ease;
        }

        .nav-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-badge-pill {
          font-size: 10px;
          padding: 1px 5px;
          background-color: var(--bg-panel);
          border: 1px solid var(--border-standard);
          border-radius: 4px;
          color: var(--text-muted);
        }

        .system-health-pill {
          background-color: #121316;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 6px 10px;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: var(--text-secondary);
        }

        .health-indicator-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--status-success);
          box-shadow: 0 0 6px rgba(39, 174, 96, 0.4);
        }

        .sidebar-footer {
          padding: var(--space-3);
          border-top: 1px solid var(--border-subtle);
          background-color: var(--bg-sidebar);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .credit-summary-card {
          background-color: #131417;
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
        }

        .credit-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .credit-card-title {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .credit-refill-btn {
          display: flex;
          align-items: center;
          gap: 2px;
          background-color: var(--accent-subtle);
          border: 1px solid var(--accent-border);
          color: var(--accent-text);
          font-size: 10.5px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .credit-refill-btn:hover {
          background-color: var(--accent-primary);
          color: #FFF;
        }

        .credit-card-balance {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 6px;
        }

        .credit-card-total {
          font-size: 11.5px;
          font-weight: 400;
          color: var(--text-muted);
        }

        .credit-progress-bar {
          height: 4px;
          background-color: #202227;
          border-radius: 2px;
          overflow: hidden;
        }

        .credit-progress-fill {
          height: 100%;
          background-color: var(--accent-primary);
          border-radius: 2px;
        }

        .collapsed-credit-icon-btn {
          width: 100%;
          height: 38px;
          background-color: #131417;
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-sm);
          color: var(--accent-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .account-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 8px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background-color 0.12s ease;
        }
        .account-row:hover, .account-row.active {
          background-color: var(--bg-hover);
        }

        .account-avatar {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background-color: #23252A;
          border: 1px solid var(--border-strong);
          color: var(--text-primary);
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .account-details {
          flex: 1;
          min-width: 0;
        }

        .account-name {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .account-tier {
          font-size: 11px;
          color: var(--text-muted);
        }

        .account-settings-icon {
          color: var(--text-muted);
        }

        @media (max-width: 900px) {
          .sidebar {
            position: fixed;
            left: -100%;
            top: 0;
            bottom: 0;
            width: 260px !important;
            z-index: 1000;
          }
          .sidebar.mobile-open {
            left: 0;
          }
          .desktop-only {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};
