import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { verifyEmailAddress } from '../utils/verifier';
import type { SingleVerificationResult } from '../types';
import {
  Mail,
  Copy,
  Check,
  RotateCw,
  Search,
  Download,
  Trash2,
  Server,
  Send,
  Clock,
  Code,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Users,
  Filter,
  Building2,
  FileCode,
  X,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeliverabilityBadge } from '@/components/ui/badge';

const SAMPLE_PRESETS = [
  { label: 'Corporate Lead', email: 'elena.rostova@datadog.com', icon: Building2 },
  { label: 'Gmail Account', email: 'alex.developer@gmail.com', icon: Mail },
  { label: 'Disposable Email', email: 'temp.user492@mailinator.com', icon: Trash2 },
  { label: 'Spam Trap Seed', email: 'trap.tester@honeypot-sec.org', icon: ShieldAlert },
  { label: 'Role Account', email: 'billing@enterprise.corp', icon: Users },
  { label: 'Catch-all Domain', email: 'user@catchall-company.io', icon: Globe }
];

export const SingleVerifyPage: React.FC = () => {
  const {
    singleHistory,
    addSingleVerification,
    clearSingleHistory,
    deleteSingleHistoryItem,
    addToast,
    subscription
  } = useApp();

  const [inputEmail, setInputEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inspectionStage, setInspectionStage] = useState<string>('');
  const [currentResult, setCurrentResult] = useState<SingleVerificationResult | null>(
    singleHistory.length > 0 ? singleHistory[0] : null
  );
  const [copiedJson, setCopiedJson] = useState(false);
  const [isRawJsonExpanded, setIsRawJsonExpanded] = useState(false);

  // History table filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'deliverable' | 'risky' | 'undeliverable'>('all');

  const handleVerify = (emailToVerify?: string) => {
    const target = (emailToVerify || inputEmail).trim();
    if (!target) {
      addToast({
        type: 'error',
        title: 'Email Required',
        message: 'Please enter an email address to verify.'
      });
      return;
    }

    if (subscription.creditsRemaining <= 0) {
      addToast({
        type: 'error',
        title: 'Zero Credits Remaining',
        message: 'Please purchase add-on credits to verify emails.'
      });
      return;
    }

    setIsLoading(true);
    setInspectionStage('Querying root DNS & resolving MX records...');

    setTimeout(() => {
      setInspectionStage('Initiating TLS handshake & SMTP RCPT TO simulation...');
    }, 220);

    setTimeout(() => {
      setInspectionStage('Evaluating disposable hashes & spam trap heuristics...');
    }, 450);

    setTimeout(() => {
      const result = verifyEmailAddress(target);
      setCurrentResult(result);
      addSingleVerification(result);
      setIsLoading(false);
      setInspectionStage('');
      setInputEmail(target);
    }, 700);
  };

  const handleCopyJson = () => {
    if (!currentResult) return;
    navigator.clipboard.writeText(JSON.stringify(currentResult.rawJson, null, 2));
    setCopiedJson(true);
    addToast({
      type: 'success',
      title: 'Copied to Clipboard',
      message: 'Raw JSON verification payload copied.'
    });
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleExportHistory = () => {
    if (singleHistory.length === 0) return;
    const headers = 'Email,Status,Score,Reason,MX_Host,Latency_ms,Verified_At\n';
    const rows = singleHistory
      .map(
        (item) =>
          `"${item.email}","${item.status}","${item.score}","${item.reason.replace(/"/g, '""')}","${
            item.mxHost
          }","${item.latencyMs}","${item.verifiedAt}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mailverify_single_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'Export Generated',
      message: `Exported ${singleHistory.length} verification records.`
    });
  };

  // Filtered history
  const filteredHistory = singleHistory.filter((item) => {
    const matchesSearch = item.email.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.domain.toLowerCase().includes(historySearch.toLowerCase());
    const matchesStatus = historyFilter === 'all' || item.status === historyFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-header-title">Single Email Verification</h1>
          <p className="page-header-description">
            Inspect any recipient mailbox with RFC 5322 syntax validation, live DNS MX resolution,
            and real-time SMTP handshake simulation without sending a test email.
          </p>
        </div>
        <div className="page-header-actions">
          {singleHistory.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportHistory}
              leftIcon={<Download size={13} />}
            >
              Export History
            </Button>
          )}
        </div>
      </div>

      {/* Sleek Command-style Search Bar */}
      <div className="verify-bar-container">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="verify-command-form"
        >
          <div className="verify-command-group">
            <Mail className="verify-command-icon" size={17} />
            <input
              type="text"
              className="verify-command-input"
              placeholder="Enter email to inspect (e.g. alex.developer@datadoghq.com)..."
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              autoFocus
            />
            {inputEmail && (
              <button
                type="button"
                className="verify-clear-btn"
                onClick={() => setInputEmail('')}
                title="Clear input"
                aria-label="Clear email input"
              >
                <X size={13} />
              </button>
            )}
            <kbd className="verify-kbd-hint">↵ Enter</kbd>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              className="verify-command-btn"
            >
              Verify Mailbox
            </Button>
          </div>
        </form>

        {/* Live Multi-Stage Engine Feedback */}
        {isLoading && (
          <div className="inspection-live-bar">
            <div className="inspection-live-left">
              <span className="live-pulse-dot" />
              <span className="inspection-live-stage font-mono">{inspectionStage}</span>
            </div>
            <span className="inspection-live-tag font-mono">RFC-5322 Engine Active</span>
          </div>
        )}

        {/* Preset Quick Test Scenarios */}
        <div className="verify-presets-bar">
          <span className="presets-caption">Quick Scenarios:</span>
          <div className="presets-tags">
            {SAMPLE_PRESETS.map((preset) => {
              const PresetIcon = preset.icon;
              return (
                <button
                  key={preset.label}
                  type="button"
                  className="preset-chip"
                  onClick={() => {
                    setInputEmail(preset.email);
                    handleVerify(preset.email);
                  }}
                >
                  <PresetIcon size={11} className="preset-chip-icon" />
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Result & Inspection Console */}
      {currentResult && (
        <div className="result-console">
          <div className="result-card">
            {/* 1. Executive Hero Overview Banner */}
            <div className="result-hero-banner">
              <div className="hero-main-col">
                <div className="hero-identity-row">
                  <h2 className="hero-email font-mono">{currentResult.email}</h2>
                  <DeliverabilityBadge
                    status={currentResult.status}
                    score={currentResult.score}
                  />
                </div>

                <div className="hero-verdict-row">
                  <span className={`verdict-pip pip-${currentResult.status}`} />
                  <span className="hero-verdict-text">{currentResult.reason}</span>
                </div>

                <div className="hero-meta-pills">
                  <span className="hero-meta-pill" title="Round-trip handshake latency">
                    <Clock size={11} className="hero-pill-icon" />
                    <span>{currentResult.latencyMs}ms latency</span>
                  </span>
                  <span className="hero-meta-pill" title={`Designated MX: ${currentResult.mxHost}`}>
                    <Server size={11} className="hero-pill-icon" />
                    <span className="font-mono">{currentResult.mxHost}</span>
                  </span>
                  <span className="hero-meta-pill" title="IETF RFC-5322 Syntax Specification">
                    <FileCode size={11} className="hero-pill-icon" />
                    <span>RFC 5322 Compliant</span>
                  </span>
                </div>
              </div>

              {/* Right Side: Action Buttons */}
              <div className="hero-actions-row">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVerify(currentResult.email)}
                  leftIcon={<RotateCw size={12} />}
                  isLoading={isLoading}
                >
                  Re-verify
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyJson}
                  leftIcon={copiedJson ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                >
                  {copiedJson ? 'Copied' : 'Copy JSON'}
                </Button>
              </div>
            </div>

            {/* 2. Diagnostic Inspection Sections */}
            <div className="result-body-content">
              {/* Category A: Server & Handshake Validation */}
              <div className="diag-group">
                <div className="diag-group-header">
                  <Server size={12} className="diag-group-icon" />
                  <span>MAIL SERVER & PROTOCOL VALIDATION</span>
                </div>
                <div className="diag-grid">
                  {/* 1. Syntax */}
                  <div className="diag-card">
                    <div className="diag-card-top">
                      <div className="diag-title-wrap">
                        <div className="diag-icon-box">
                          <FileCode size={12} />
                        </div>
                        <span className="diag-title">RFC 5322 Syntax</span>
                      </div>
                      <span className={`diag-badge ${currentResult.syntaxValid ? 'badge-pass' : 'badge-fail'}`}>
                        <span className="diag-dot" />
                        {currentResult.syntaxValid ? 'Valid' : 'Syntax Error'}
                      </span>
                    </div>
                    <div className="diag-value">
                      {currentResult.syntaxValid ? 'Compliant Format' : 'Malformed Address'}
                    </div>
                    <div className="diag-desc">
                      Verified against official IETF mail standard syntax.
                    </div>
                  </div>

                  {/* 2. DNS MX */}
                  <div className="diag-card">
                    <div className="diag-card-top">
                      <div className="diag-title-wrap">
                        <div className="diag-icon-box">
                          <Server size={12} />
                        </div>
                        <span className="diag-title">DNS MX Records</span>
                      </div>
                      <span className={`diag-badge ${currentResult.mxRecordsFound ? 'badge-pass' : 'badge-fail'}`}>
                        <span className="diag-dot" />
                        {currentResult.mxRecordsFound ? 'Resolved' : 'No Records'}
                      </span>
                    </div>
                    <div className="diag-value font-mono" title={currentResult.mxHost}>
                      {currentResult.mxHost}
                    </div>
                    <div className="diag-desc">
                      Authoritative mail exchangers active and routing mail.
                    </div>
                  </div>

                  {/* 3. SMTP Mailbox */}
                  <div className="diag-card">
                    <div className="diag-card-top">
                      <div className="diag-title-wrap">
                        <div className="diag-icon-box">
                          <Send size={12} />
                        </div>
                        <span className="diag-title">SMTP Mailbox Check</span>
                      </div>
                      <span className={`diag-badge ${currentResult.smtpCheck ? 'badge-pass' : 'badge-fail'}`}>
                        <span className="diag-dot" />
                        {currentResult.smtpCheck ? 'Accepted' : 'Rejected'}
                      </span>
                    </div>
                    <div className="diag-value font-mono">
                      {currentResult.smtpResponse}
                    </div>
                    <div className="diag-desc">
                      Direct handshake simulated without sending a test message.
                    </div>
                  </div>

                  {/* 4. Catch-all */}
                  <div className="diag-card">
                    <div className="diag-card-top">
                      <div className="diag-title-wrap">
                        <div className="diag-icon-box">
                          <Filter size={12} />
                        </div>
                        <span className="diag-title">Catch-all Config</span>
                      </div>
                      <span className={`diag-badge ${!currentResult.isCatchAll ? 'badge-pass' : 'badge-warn'}`}>
                        <span className="diag-dot" />
                        {!currentResult.isCatchAll ? 'Explicit' : 'Catch-all'}
                      </span>
                    </div>
                    <div className="diag-value">
                      {!currentResult.isCatchAll ? 'Explicit Mailbox' : 'Domain Accepts All'}
                    </div>
                    <div className="diag-desc">
                      {!currentResult.isCatchAll ? 'Server only accepts verified recipient accounts.' : 'Server accepts any address on this domain.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Category B: Reputation & Safety Checks */}
              <div className="diag-group">
                <div className="diag-group-header">
                  <ShieldCheck size={12} className="diag-group-icon" />
                  <span>REPUTATION & INBOX ATTRIBUTES</span>
                </div>
                <div className="diag-grid">
                  {/* 5. Disposable */}
                  <div className="diag-card">
                    <div className="diag-card-top">
                      <div className="diag-title-wrap">
                        <div className="diag-icon-box">
                          <Trash2 size={12} />
                        </div>
                        <span className="diag-title">Disposable Email</span>
                      </div>
                      <span className={`diag-badge ${!currentResult.isDisposable ? 'badge-pass' : 'badge-fail'}`}>
                        <span className="diag-dot" />
                        {!currentResult.isDisposable ? 'Clean' : 'Disposable'}
                      </span>
                    </div>
                    <div className="diag-value">
                      {!currentResult.isDisposable ? 'Legitimate Domain' : 'Temporary Burner'}
                    </div>
                    <div className="diag-desc">
                      {!currentResult.isDisposable ? 'Not registered on temporary or burner inbox lists.' : 'Temporary burner address that will expire.'}
                    </div>
                  </div>

                  {/* 6. Provider Type */}
                  <div className="diag-card">
                    <div className="diag-card-top">
                      <div className="diag-title-wrap">
                        <div className="diag-icon-box">
                          <Globe size={12} />
                        </div>
                        <span className="diag-title">Provider Type</span>
                      </div>
                      <span className="diag-badge badge-neutral">
                        <span className="diag-dot" />
                        {currentResult.isFreeMail ? 'Free' : 'Corporate'}
                      </span>
                    </div>
                    <div className="diag-value">
                      {currentResult.isFreeMail ? 'Consumer Webmail' : 'Custom Corporate'}
                    </div>
                    <div className="diag-desc">
                      {currentResult.isFreeMail ? 'Standard public provider (Gmail, Yahoo, Outlook).' : 'Enterprise business infrastructure on private domain.'}
                    </div>
                  </div>

                  {/* 7. Role Account */}
                  <div className="diag-card">
                    <div className="diag-card-top">
                      <div className="diag-title-wrap">
                        <div className="diag-icon-box">
                          <Users size={12} />
                        </div>
                        <span className="diag-title">Recipient Type</span>
                      </div>
                      <span className={`diag-badge ${!currentResult.isRoleBased ? 'badge-pass' : 'badge-warn'}`}>
                        <span className="diag-dot" />
                        {!currentResult.isRoleBased ? 'Individual' : 'Role Account'}
                      </span>
                    </div>
                    <div className="diag-value">
                      {!currentResult.isRoleBased ? 'Direct Personal Mailbox' : 'Shared Department Role'}
                    </div>
                    <div className="diag-desc">
                      {!currentResult.isRoleBased ? 'Specific individual employee or recipient account.' : 'Shared team inbox (support@, billing@, sales@).'}
                    </div>
                  </div>

                  {/* 8. Spam Trap */}
                  <div className="diag-card">
                    <div className="diag-card-top">
                      <div className="diag-title-wrap">
                        <div className="diag-icon-box">
                          <ShieldCheck size={12} />
                        </div>
                        <span className="diag-title">Spam Trap Risk</span>
                      </div>
                      <span className={`diag-badge ${currentResult.spamTrapScore < 20 ? 'badge-pass' : 'badge-fail'}`}>
                        <span className="diag-dot" />
                        {currentResult.spamTrapScore < 20 ? '0% Risk' : `${currentResult.spamTrapScore}% Risk`}
                      </span>
                    </div>
                    <div className="diag-value">
                      {currentResult.spamTrapScore < 20 ? 'Zero Honeypot Risk' : 'High Trap Probability'}
                    </div>
                    <div className="diag-desc">
                      {currentResult.spamTrapScore < 20 ? 'Domain has zero known spam trap or honeypot signatures.' : 'Address flagged as potential honeypot trap.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Developer Raw JSON Payload Drawer */}
              <div className="raw-json-panel">
                <button
                  type="button"
                  className="raw-json-header-btn"
                  onClick={() => setIsRawJsonExpanded(!isRawJsonExpanded)}
                >
                  <div className="json-btn-left">
                    <Code size={13} className="text-muted" />
                    <span className="json-title">Raw Telemetry Payload</span>
                    <span className="json-badge">JSON</span>
                  </div>
                  <div className="json-btn-right">
                    <span className="json-expand-label font-mono">
                      {isRawJsonExpanded ? 'Hide Payload' : 'Inspect JSON Payload'}
                    </span>
                    <ChevronDown size={13} className={`json-chevron ${isRawJsonExpanded ? 'open' : ''}`} />
                  </div>
                </button>
                {isRawJsonExpanded && (
                  <div className="raw-json-body">
                    <pre className="raw-json-code font-mono">
                      {JSON.stringify(currentResult.rawJson, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification History Table */}
      <div className="history-section">
        <div className="history-header">
          <div>
            <h2 className="history-title">Recent Verifications</h2>
            <p className="history-subtitle">
              Locally cached log of mailboxes tested during this session.
            </p>
          </div>
          <div className="history-controls">
            <div className="tab-pill-nav">
              <button
                type="button"
                className={`tab-pill-btn ${historyFilter === 'all' ? 'active' : ''}`}
                onClick={() => setHistoryFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`tab-pill-btn ${historyFilter === 'deliverable' ? 'active' : ''}`}
                onClick={() => setHistoryFilter('deliverable')}
              >
                Deliverable
              </button>
              <button
                type="button"
                className={`tab-pill-btn ${historyFilter === 'risky' ? 'active' : ''}`}
                onClick={() => setHistoryFilter('risky')}
              >
                Risky
              </button>
              <button
                type="button"
                className={`tab-pill-btn ${historyFilter === 'undeliverable' ? 'active' : ''}`}
                onClick={() => setHistoryFilter('undeliverable')}
              >
                Undeliverable
              </button>
            </div>
            <div className="history-search-wrap">
              <Search size={13} className="search-icon-left" />
              <input
                type="text"
                className="history-search-input"
                placeholder="Filter history..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>
            {singleHistory.length > 0 && (
              <button
                className="clear-history-btn"
                onClick={() => {
                  if (confirm('Clear all local single verification history?')) {
                    clearSingleHistory();
                  }
                }}
                title="Clear history"
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* History Table */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '38%' }}>Recipient Address</th>
                <th style={{ width: '20%' }}>Status</th>
                <th style={{ width: '12%' }}>Score</th>
                <th style={{ width: '20%' }}>MX Host</th>
                <th style={{ width: '10%', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item) => (
                  <tr
                    key={item.id}
                    className="history-row"
                    onClick={() => {
                      setCurrentResult(item);
                      setInputEmail(item.email);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <td className="primary-cell font-mono">
                      {item.email}
                    </td>
                    <td>
                      <DeliverabilityBadge status={item.status} />
                    </td>
                    <td>
                      <span className="font-mono tabular-nums">{item.score}%</span>
                    </td>
                    <td>
                      <span className="font-mono history-mx" title={item.mxHost}>
                        {item.mxHost}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="history-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSingleHistoryItem(item.id);
                        }}
                        title="Delete from history"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="empty-history-cell">
                    <p>No verification history found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        /* Command Input Bar */
        .verify-bar-container {
          background: linear-gradient(180deg, rgba(18, 19, 24, 0.95) 0%, rgba(13, 14, 18, 0.98) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: var(--space-4);
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.04);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .verify-command-group {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(8, 9, 12, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 9px;
          height: 50px;
          padding: 0 6px 0 14px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          gap: 10px;
        }

        .verify-command-group:hover {
          border-color: rgba(255, 255, 255, 0.15);
          background: rgba(8, 9, 12, 0.85);
        }

        .verify-command-group:focus-within {
          background: #08090D;
          border-color: rgba(255, 255, 255, 0.22);
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08), 0 8px 24px -4px rgba(0, 0, 0, 0.5);
        }

        .verify-command-icon {
          color: var(--text-tertiary);
          flex-shrink: 0;
          transition: color 0.18s ease;
        }
        .verify-command-group:focus-within .verify-command-icon {
          color: var(--accent-primary);
        }

        .verify-command-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 14px;
          font-family: var(--font-sans);
          font-weight: 450;
          outline: none;
          min-width: 0;
          height: 100%;
          padding: 0;
          letter-spacing: -0.01em;
        }
        .verify-command-input::placeholder {
          font-family: var(--font-sans);
          color: rgba(255, 255, 255, 0.32);
          font-size: 13.5px;
          font-weight: 400;
        }

        .verify-clear-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-tertiary);
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
          padding: 0;
        }
        .verify-clear-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #FFFFFF;
        }

        .verify-kbd-hint {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 4px 7px;
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 500;
          color: var(--text-tertiary);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 5px;
          letter-spacing: -0.01em;
          flex-shrink: 0;
          line-height: 1;
        }

        .verify-command-btn {
          flex-shrink: 0;
          height: 38px !important;
          padding: 0 18px !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          letter-spacing: -0.01em;
          border-radius: 7px !important;
          background: linear-gradient(180deg, #FF641F 0%, #EA4C00 100%) !important;
          border: 1px solid rgba(255, 255, 255, 0.18) !important;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 2px 8px rgba(234, 76, 0, 0.35) !important;
          transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .verify-command-btn:hover:not(:disabled) {
          background: linear-gradient(180deg, #FF7533 0%, #F55500 100%) !important;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 4px 14px rgba(234, 76, 0, 0.45) !important;
          transform: translateY(-0.5px);
        }
        .verify-command-btn:active:not(:disabled) {
          transform: translateY(0.5px);
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3) !important;
        }

        /* Live Multi-Stage Engine Feedback Bar */
        .inspection-live-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 12px;
          padding: 8px 12px;
          background-color: rgba(255, 100, 31, 0.06);
          border: 1px solid rgba(255, 100, 31, 0.22);
          border-radius: var(--radius-sm);
          animation: fadeIn 0.15s ease-out;
        }

        .inspection-live-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .live-pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: var(--accent-primary);
          box-shadow: 0 0 8px var(--accent-primary);
          animation: pulseDot 1.2s infinite ease-in-out;
          flex-shrink: 0;
        }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }

        .inspection-live-stage {
          font-size: 11.5px;
          color: var(--accent-text);
          font-weight: 500;
        }

        .inspection-live-tag {
          font-size: 10.5px;
          color: var(--text-muted);
        }

        .verify-presets-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          flex-wrap: wrap;
        }

        .presets-caption {
          font-size: 10.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
        }

        .presets-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .preset-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.07);
          color: var(--text-secondary);
          font-size: 11.5px;
          font-weight: 450;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .preset-chip:hover {
          color: #FFFFFF;
          border-color: rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.07);
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
        }
        .preset-chip:active {
          transform: translateY(0);
        }

        .preset-chip-icon {
          color: var(--text-tertiary);
          transition: color 0.15s ease;
        }
        .preset-chip:hover .preset-chip-icon {
          color: var(--accent-primary);
        }

        /* Result Console */
        .result-console {
          margin-bottom: var(--space-5);
          animation: fadeIn 0.15s ease-out;
        }

        .result-card {
          background-color: var(--bg-panel);
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 8px 24px rgba(0, 0, 0, 0.45);
        }

        /* 1. Executive Hero Overview Banner */
        .result-hero-banner {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 18px 24px;
          background: linear-gradient(180deg, #121418 0%, #0D0E11 100%);
          border-bottom: 1px solid var(--border-subtle);
          gap: 20px;
        }

        .hero-main-col {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }

        .hero-identity-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .hero-email {
          font-size: 18.5px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          word-break: break-all;
        }

        .hero-verdict-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .verdict-pip {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .pip-deliverable {
          background-color: var(--status-success);
          box-shadow: 0 0 6px var(--status-success);
        }
        .pip-risky {
          background-color: var(--status-warning);
          box-shadow: 0 0 6px var(--status-warning);
        }
        .pip-undeliverable {
          background-color: var(--status-error);
          box-shadow: 0 0 6px var(--status-error);
        }

        .hero-verdict-text {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.4;
        }

        .hero-meta-pills {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 4px;
        }

        .hero-meta-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 8px;
          background-color: rgba(255, 255, 255, 0.035);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xs);
          font-size: 11px;
          color: var(--text-secondary);
        }

        .hero-pill-icon {
          color: var(--text-tertiary);
          flex-shrink: 0;
        }

        /* Right Hero Column: Action Buttons */
        .hero-actions-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        /* 2. Diagnostic Inspection Sections */
        .result-body-content {
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .diag-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .diag-group-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--text-tertiary);
        }

        .diag-group-icon {
          color: var(--text-tertiary);
        }

        .diag-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .diag-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: border-color 0.12s ease, background-color 0.12s ease;
        }
        .diag-card:hover {
          border-color: var(--border-standard);
          background-color: var(--bg-input);
        }

        .diag-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .diag-title-wrap {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
        }

        .diag-icon-box {
          width: 22px;
          height: 22px;
          border-radius: var(--radius-xs);
          background-color: rgba(255, 255, 255, 0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          flex-shrink: 0;
        }

        .diag-title {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
        }

        .diag-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 7px;
          border-radius: var(--radius-full);
          font-size: 10px;
          font-weight: 600;
          flex-shrink: 0;
        }
        .diag-badge.badge-pass {
          background-color: var(--status-success-bg);
          color: var(--status-success-text);
          border: 1px solid var(--status-success-border);
        }
        .diag-badge.badge-fail {
          background-color: var(--status-error-bg);
          color: var(--status-error-text);
          border: 1px solid var(--status-error-border);
        }
        .diag-badge.badge-warn {
          background-color: var(--status-warning-bg);
          color: var(--status-warning-text);
          border: 1px solid var(--status-warning-border);
        }
        .diag-badge.badge-neutral {
          background-color: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          border: 1px solid var(--border-subtle);
        }

        .diag-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: currentColor;
          display: inline-block;
        }

        .diag-value {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 2px;
        }

        .diag-desc {
          font-size: 11px;
          color: var(--text-muted);
          line-height: 1.4;
        }

        /* 3. Developer JSON Drawer */
        .raw-json-panel {
          border-top: 1px solid var(--border-subtle);
          padding-top: 12px;
          margin-top: 2px;
        }

        .raw-json-header-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .raw-json-header-btn:hover {
          background-color: var(--bg-hover);
          color: var(--text-primary);
          border-color: var(--border-standard);
        }

        .json-btn-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .json-title {
          font-weight: 500;
        }

        .json-badge {
          font-size: 9.5px;
          font-weight: 700;
          padding: 1px 5px;
          background-color: rgba(255, 255, 255, 0.06);
          border-radius: var(--radius-xs);
          color: var(--text-muted);
        }

        .json-btn-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .json-expand-label {
          font-size: 11px;
          color: var(--text-tertiary);
        }

        .json-chevron {
          transition: transform 0.2s ease;
        }
        .json-chevron.open {
          transform: rotate(180deg);
        }

        .raw-json-body {
          margin-top: 8px;
        }

        .raw-json-code {
          padding: 14px;
          background-color: #060709;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          font-size: 11px;
          color: #B4B9C2;
          overflow-x: auto;
          line-height: 1.55;
        }

        /* History Section */
        .history-section {
          margin-top: var(--space-6);
        }

        .history-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: var(--space-3);
          flex-wrap: wrap;
          gap: 10px;
        }

        .history-title {
          font-size: 14.5px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .history-subtitle {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .history-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .history-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon-left {
          position: absolute;
          left: 8px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .history-search-input {
          background-color: var(--bg-input);
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: 12px;
          padding: 4px 10px 4px 26px;
          outline: none;
          width: 190px;
          transition: border-color 0.12s ease;
        }
        .history-search-input:focus {
          border-color: var(--border-focus);
        }

        .clear-history-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: transparent;
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          font-size: 11.5px;
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .clear-history-btn:hover {
          color: var(--status-error-text);
          border-color: var(--status-error-border);
        }

        .history-row {
          cursor: pointer;
        }

        .history-mx {
          color: var(--text-muted);
          font-size: 11.5px;
          max-width: 170px;
          display: inline-block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .history-action-btn {
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 4px;
          border-radius: 3px;
          transition: color 0.12s ease;
        }
        .history-row:hover .history-action-btn {
          color: var(--text-muted);
        }
        .history-action-btn:hover {
          color: var(--status-error-text) !important;
        }

        .empty-history-cell {
          text-align: center;
          padding: 30px;
          color: var(--text-muted);
        }

        @media (max-width: 960px) {
          .result-hero-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
          }
          .hero-actions-row {
            width: 100%;
            justify-content: flex-start;
          }
          .diag-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .verify-bar-container {
            padding: 12px;
          }
          .verify-command-group {
            height: auto;
            min-height: 48px;
            flex-direction: column;
            align-items: stretch;
            padding: 10px;
            gap: 10px;
          }
          .verify-command-group .verify-command-input {
            padding: 4px 0;
            font-size: 14px;
          }
          .verify-command-btn {
            width: 100%;
            justify-content: center;
            height: 38px;
          }
          .verify-kbd-hint {
            display: none;
          }
          .presets-tags {
            flex-wrap: wrap;
            gap: 6px;
            width: 100%;
          }
          .preset-chip {
            font-size: 11px;
            padding: 4px 8px;
          }
          .result-hero-banner {
            padding: 14px 16px;
          }
          .hero-email {
            font-size: 16px;
          }
          .hero-actions-row {
            width: 100%;
            justify-content: flex-start;
          }
          .result-body-content {
            padding: 14px 16px;
            gap: 16px;
          }
          .history-card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          .history-filters {
            width: 100%;
            flex-wrap: wrap;
            gap: 6px;
          }
        }

        @media (max-width: 520px) {
          .diag-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
