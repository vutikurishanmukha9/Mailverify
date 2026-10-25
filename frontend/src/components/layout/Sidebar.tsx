import React from 'react';
import { useApp } from '../../context/AppContext';
import type { ScreenId } from '../../types';
import {
  MailCheck,
  Layers,
  Blocks,
  Code2,
  Coins,
  MapPin,
  Settings,
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

interface NavItem {
  id: ScreenId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  badge?: string;
}

const PRIMARY_NAV: NavItem[] = [
  { id: 'single', label: 'Single Verify', icon: MailCheck },
  { id: 'bulk', label: 'Bulk Verify', icon: Layers },
  { id: 'integrations', label: 'Integrations', icon: Blocks },
  { id: 'api', label: 'API & Webhooks', icon: Code2 }
];

const MANAGEMENT_NAV: NavItem[] = [
  { id: 'buy-credits', label: 'Buy Credits', icon: Coins },
  { id: 'roadmap', label: 'Roadmap', icon: MapPin },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'support', label: 'Help & Support', icon: LifeBuoy }
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

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 999 }}
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
              <MailCheck size={16} strokeWidth={2.4} />
            </div>
            {!isSidebarCollapsed && (
              <div className="brand-text">
                <span className="brand-name">MailVerify</span>
                <span className="brand-badge">PRO</span>
              </div>
            )}
          </div>
          <button
            className="sidebar-toggle-btn desktop-only"
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'}
            aria-label="Toggle sidebar collapse"
          >
            {isSidebarCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
          <button
            className="sidebar-close-btn mobile-only"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close mobile navigation"
          >
            <X size={15} />
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="sidebar-nav-scroll">
          {/* Primary Verification Tools */}
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
                    onClick={() => {
                      navigateTo(item.id);
                      setMobileMenuOpen(false);
                    }}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <Icon size={16} strokeWidth={1.75} className="nav-icon" />
                    {!isSidebarCollapsed && <span className="nav-label">{item.label}</span>}
                    {!isSidebarCollapsed && item.badge && (
                      <span className="nav-badge-pill">{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Resources & Management */}
          <div className="nav-group">
            {!isSidebarCollapsed && <div className="nav-group-label">MANAGEMENT</div>}
            <nav className="nav-list">
              {MANAGEMENT_NAV.map((item) => {
                const Icon = item.icon;
                const isActive = screen === item.id;
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      navigateTo(item.id);
                      setMobileMenuOpen(false);
                    }}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <Icon size={16} strokeWidth={1.75} className="nav-icon" />
                    {!isSidebarCollapsed && <span className="nav-label">{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Quiet, Professional Bottom Footer */}
        <div className="sidebar-footer">
          {/* Operational Status (Compact, non-intrusive) */}
          {!isSidebarCollapsed ? (
            <div className="sidebar-health-status">
              <div className="health-left">
                <span className="health-dot" />
                <span className="health-text">Systems Operational</span>
              </div>
              <span className="health-latency font-mono tabular-nums">42ms</span>
            </div>
          ) : (
            <div className="collapsed-health-dot-wrap" title="All Systems Operational (42ms)">
              <span className="health-dot" />
            </div>
          )}

          {/* User Account Row */}
          <div
            className={`account-row ${screen === 'settings' ? 'active' : ''}`}
            onClick={() => {
              navigateTo('settings', 'profile');
              setMobileMenuOpen(false);
            }}
            title="Account Settings"
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
                <Settings size={14} />
              </div>
            )}
          </div>
        </div>
      </aside>

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          background-color: var(--bg-sidebar);
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          height: 100vh;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 100;
          transition: width 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
        }

        .sidebar.collapsed {
          width: var(--sidebar-collapsed-width);
        }

        .sidebar-brand {
          height: var(--header-height);
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-subtle);
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          overflow: hidden;
        }

        .brand-icon {
          width: 28px;
          height: 28px;
          background-color: var(--accent-subtle);
          border: 1px solid var(--accent-border);
          color: var(--accent-primary);
          border-radius: var(--radius-xs);
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
          font-size: 13.5px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .brand-badge {
          font-size: 9px;
          font-weight: 600;
          padding: 1.5px 5px;
          background-color: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-standard);
          color: var(--text-muted);
          border-radius: 3px;
          letter-spacing: 0.04em;
        }

        .sidebar-toggle-btn {
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-muted);
          width: 24px;
          height: 24px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .sidebar-toggle-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-standard);
          background-color: var(--bg-hover);
        }

        .sidebar-nav-scroll {
          flex: 1;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 18px 12px;
          display: flex;
          flex-direction: column;
          gap: 26px;
        }

        .nav-group-label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.38);
          letter-spacing: 0.06em;
          padding: 0 10px 8px 10px;
          text-transform: uppercase;
        }

        .nav-list {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 11px;
          height: 36px;
          padding: 0 12px;
          border-radius: 6px;
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          font-family: var(--font-sans);
          font-size: 13.5px;
          font-weight: 480;
          cursor: pointer;
          transition: background-color 0.12s ease, color 0.12s ease, border-color 0.12s ease;
          width: 100%;
          text-align: left;
        }

        .nav-item:hover {
          background-color: rgba(255, 255, 255, 0.04);
          color: var(--text-primary);
        }

        .nav-item.active {
          background-color: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.06);
          color: #ffffff;
          font-weight: 550;
        }

        .nav-item.active .nav-icon {
          color: var(--accent-primary);
        }

        .nav-icon {
          color: var(--text-muted);
          flex-shrink: 0;
          transition: color 0.12s ease;
        }

        .nav-item:hover .nav-icon {
          color: var(--text-secondary);
        }

        .nav-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.4;
        }

        .nav-badge-pill {
          font-size: 9.5px;
          padding: 1.5px 5.5px;
          background-color: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: 3px;
          color: var(--text-muted);
        }

        /* Sidebar Footer */
        .sidebar-footer {
          padding: 14px 12px;
          border-top: 1px solid var(--border-subtle);
          background-color: var(--bg-sidebar);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sidebar-health-status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          font-size: 11px;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
        }

        .health-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .health-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--status-success);
          box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
        }

        .health-text {
          color: var(--text-muted);
          font-size: 11px;
        }

        .health-latency {
          color: var(--text-tertiary);
          font-size: 10px;
        }

        .collapsed-health-dot-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px 0;
        }

        .account-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 10px;
          height: 44px;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.12s ease, border-color 0.12s ease;
          border: 1px solid transparent;
        }

        .account-row:hover {
          background-color: var(--bg-hover);
          border-color: var(--border-subtle);
        }

        .account-row.active {
          background-color: rgba(255, 255, 255, 0.05);
          border-color: var(--border-standard);
        }

        .account-avatar {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: linear-gradient(135deg, rgba(255, 100, 31, 0.18), rgba(255, 100, 31, 0.04));
          border: 1px solid rgba(255, 100, 31, 0.28);
          color: var(--accent-text);
          font-family: var(--font-mono);
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
          overflow: hidden;
        }

        .account-name {
          font-size: 12.5px;
          font-weight: 550;
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
          color: var(--text-tertiary);
          flex-shrink: 0;
        }

        /* Collapsed Sidebar Adjustments */
        .sidebar.collapsed .sidebar-brand {
          padding: 0;
          justify-content: center;
        }
        .sidebar.collapsed .brand-logo {
          justify-content: center;
        }
        .sidebar.collapsed .sidebar-nav-scroll {
          padding: 16px 8px;
          align-items: center;
        }
        .sidebar.collapsed .nav-list {
          align-items: center;
          width: 100%;
        }
        .sidebar.collapsed .nav-item {
          width: 38px;
          height: 38px;
          padding: 0;
          justify-content: center;
          margin: 0 auto;
        }
        .sidebar.collapsed .sidebar-footer {
          padding: 12px 8px;
          align-items: center;
        }
        .sidebar.collapsed .account-row {
          width: 38px;
          height: 38px;
          padding: 0;
          justify-content: center;
          margin: 0 auto;
        }

        .sidebar-close-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-standard);
          color: var(--text-secondary);
          width: 30px;
          height: 30px;
          border-radius: var(--radius-xs);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .sidebar-close-btn:hover {
          color: var(--text-primary);
          background-color: var(--bg-hover);
        }

        @media (max-width: 1024px) {
          .nav-item {
            padding: 8px 10px;
          }
        }

        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            left: -280px;
            top: 0;
            bottom: 0;
            width: 275px !important;
            max-width: 85vw;
            z-index: 1000;
            transition: left 0.22s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 12px 0 35px rgba(0, 0, 0, 0.75);
          }
          .sidebar.mobile-open {
            left: 0;
          }
          .desktop-only {
            display: none !important;
          }
          .mobile-only {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
};
