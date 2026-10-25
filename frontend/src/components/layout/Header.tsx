import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  Coins,
  Plus,
  Layers,
  Search,
  CreditCard,
  KeyRound,
  User,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

export const Header: React.FC = () => {
  const {
    screen,
    settingsTab,
    setMobileMenuOpen,
    navigateTo,
    subscription,
    userProfile
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
      case 'settings':
        return `Settings · ${settingsTab.charAt(0).toUpperCase() + settingsTab.slice(1)}`;
      case 'support':
        return 'Help & Support';
      default:
        return 'MailVerify';
    }
  };

  const userInitials = userProfile.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <TooltipProvider delayDuration={200}>
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

        {/* Middle Command Palette Search Trigger */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="header-search-hint desktop-only cursor-pointer"
              onClick={() => navigateTo('single')}
            >
              <Search size={13} className="search-hint-icon" />
              <span className="search-hint-text">Verify email or jump to...</span>
              <kbd className="search-hint-kbd">⌘K</kbd>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span>Quick Email Verification Command (⌘K)</span>
          </TooltipContent>
        </Tooltip>

        <div className="header-right">
          {/* Radix / shadcn Dropdown for Credits Counter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className="header-credit-pill cursor-pointer select-none"
                role="button"
                tabIndex={0}
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
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Credit Balance</span>
                <Badge variant="accent" className="text-[10px] py-0 px-1.5">
                  {subscription.tierName}
                </Badge>
              </DropdownMenuLabel>
              <div className="px-2 py-2 text-xs text-[#8E929D] bg-white/[0.02] rounded mx-1 mb-1">
                <div className="text-[15px] font-mono font-bold text-[#EDEDEF]">
                  {subscription.creditsRemaining.toLocaleString()}
                </div>
                <div className="text-[11px] text-[#5C606C]">credits remaining for verification</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigateTo('buy-credits')}>
                <Plus className="mr-2 h-3.5 w-3.5 text-[#FF641F]" />
                <span>Purchase Credit Packs</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigateTo('settings', 'billing')}>
                <CreditCard className="mr-2 h-3.5 w-3.5 text-[#8E929D]" />
                <span>Subscription & Billing</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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



          {/* Help & Support Quick Nav Icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={`header-help-btn cursor-pointer flex items-center justify-center h-7 w-7 rounded-full transition-colors ${
                  screen === 'support'
                    ? 'bg-[#FF641F]/20 text-[#FF641F] border border-[#FF641F]/30'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-[#8E929D] hover:text-[#EDEDEF] border border-white/5'
                }`}
                onClick={() => navigateTo('support')}
                aria-label="Help & Support"
              >
                <HelpCircle size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span>Help & Support Center</span>
            </TooltipContent>
          </Tooltip>

          {/* Radix / shadcn User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="header-user-btn ml-1 cursor-pointer flex items-center justify-center h-7 w-7 rounded-full bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-[#EDEDEF] transition-colors"
                aria-label="User Account Menu"
              >
                {userInitials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-0.5">
                  <div className="font-semibold text-[#EDEDEF] text-xs">{userProfile.name}</div>
                  <div className="text-[11px] text-[#8E929D] font-normal truncate">{userProfile.email}</div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigateTo('settings', 'profile')}>
                <User className="mr-2 h-3.5 w-3.5 text-[#8E929D]" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigateTo('api')}>
                <KeyRound className="mr-2 h-3.5 w-3.5 text-[#8E929D]" />
                <span>API Keys & Webhooks</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigateTo('settings', 'billing')}>
                <CreditCard className="mr-2 h-3.5 w-3.5 text-[#8E929D]" />
                <span>Plans & Invoices</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigateTo('support')}>
                <HelpCircle className="mr-2 h-3.5 w-3.5 text-[#8E929D]" />
                <span>Help & Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigateTo('roadmap')}>
                <ExternalLink className="mr-2 h-3.5 w-3.5 text-[#8E929D]" />
                <span>Changelog & Roadmap</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <style>{`
        .top-header {
          height: var(--header-height);
          background-color: rgba(8, 9, 10, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--space-6);
          position: sticky;
          top: 0;
          z-index: 90;
          transform: translate3d(0, 0, 0);
          -webkit-transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          will-change: transform;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .header-search-hint {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-sm);
          padding: 4px 10px;
          cursor: pointer;
          transition: all 0.12s ease;
          width: 260px;
          color: var(--text-muted);
        }
        .header-search-hint:hover {
          background-color: rgba(255, 255, 255, 0.06);
          border-color: var(--border-strong);
          color: var(--text-secondary);
        }
        .search-hint-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .search-hint-text {
          font-size: 12px;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .search-hint-kbd {
          font-family: var(--font-mono);
          font-size: 10px;
          padding: 1.5px 4.5px;
          border-radius: 3px;
          background-color: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-subtle);
          color: var(--text-tertiary);
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

        @media (max-width: 1024px) {
          .top-header {
            padding: 0 16px;
          }
          .header-search-hint {
            width: 180px;
          }
        }

        @media (max-width: 768px) {
          .top-header {
            padding: 0 12px;
          }
          .mobile-menu-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            border-radius: var(--radius-sm);
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--border-standard);
            color: var(--text-primary);
            cursor: pointer;
            flex-shrink: 0;
          }
          .breadcrumb-root,
          .breadcrumb-separator {
            display: none;
          }
          .breadcrumb-current {
            font-size: 13px;
            max-width: 130px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .credit-pill-label {
            display: none;
          }
          .header-search-hint {
            display: none !important;
          }
        }

        @media (max-width: 640px) {
          .header-right .btn {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .top-header {
            padding: 0 8px;
          }
          .breadcrumb-current {
            max-width: 95px;
            font-size: 12.5px;
          }
          .header-credit-pill {
            padding: 3px 6px;
            font-size: 11px;
          }
        }
      `}</style>
    </header>
  </TooltipProvider>
  );
};
