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
  X
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { DeliverabilityBadge } from '../components/common/Badge';
import { Card, CardBody } from '../components/common/Card';

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
          <Card className="result-card">
            {/* Header: Email, Deliverability Badge, Actions */}
            <div className="result-header">
              <div className="result-title-group">
                <span className="result-email-address font-mono">{currentResult.email}</span>
                <DeliverabilityBadge
                  status={currentResult.status}
                  score={currentResult.score}
                />
              </div>
              <div className="result-actions">
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

            {/* Verdict Summary Strip with Deliverability Score Gauge */}
            <div className="verdict-summary-strip">
              <div className="verdict-summary-left">
                <span className={`verdict-pip pip-${currentResult.status}`} />
                <span className="verdict-text">{currentResult.reason}</span>
              </div>
              
              {/* Deliverability Meter Gauge */}
              <div className="deliverability-score-gauge">
                <div className="gauge-label-row font-mono tabular-nums">
                  <span className="gauge-label">Deliverability Score:</span>
                  <span className={`gauge-value ${currentResult.score >= 80 ? 'text-success' : currentResult.score >= 50 ? 'text-warning' : 'text-error'}`}>
                    {currentResult.score}/100
                  </span>
                </div>
                <div className="gauge-track">
                  <div
                    className={`gauge-fill ${currentResult.score >= 80 ? 'fill-success' : currentResult.score >= 50 ? 'fill-warning' : 'fill-error'}`}
                    style={{ width: `${currentResult.score}%` }}
                  />
                </div>
              </div>

              <div className="verdict-meta-group font-mono tabular-nums">
                <span className="verdict-meta-item">
                  <Clock size={11} /> {currentResult.latencyMs}ms
                </span>
                <span className="verdict-meta-item">
                  <Server size={11} /> {currentResult.mxHost}
                </span>
              </div>
            </div>

            <CardBody compact>
              {/* 8-Point Diagnostic Checks Grid */}
              <div className="diagnostics-matrix">
                {/* 1. Syntax */}
                <div className="matrix-cell">
                  <div className="matrix-top">
                    <div className="matrix-title-wrap">
                      <FileCode size={13} className="matrix-icon text-muted" />
                      <span className="matrix-title">RFC 5322 Syntax</span>
                    </div>
                    <span className={`matrix-status ${currentResult.syntaxValid ? 'status-pass' : 'status-fail'}`}>
                      <span className={`matrix-dot ${currentResult.syntaxValid ? 'dot-pass' : 'dot-fail'}`} />
                      {currentResult.syntaxValid ? 'Valid' : 'Syntax Error'}
                    </span>
                  </div>
                  <div className="matrix-meta font-sans">Complies with IETF RFC mail standard.</div>
                </div>

                {/* 2. DNS MX */}
                <div className="matrix-cell">
                  <div className="matrix-top">
                    <div className="matrix-title-wrap">
                      <Server size={13} className="matrix-icon text-muted" />
                      <span className="matrix-title">DNS MX Resolution</span>
                    </div>
                    <span className={`matrix-status ${currentResult.mxRecordsFound ? 'status-pass' : 'status-fail'}`}>
                      <span className={`matrix-dot ${currentResult.mxRecordsFound ? 'dot-pass' : 'dot-fail'}`} />
                      {currentResult.mxRecordsFound ? 'Resolved' : 'No MX Records'}
                    </span>
                  </div>
                  <div className="matrix-meta font-mono" title={currentResult.mxHost}>
                    Host: {currentResult.mxHost}
                  </div>
                </div>

                {/* 3. SMTP Mailbox */}
                <div className="matrix-cell">
                  <div className="matrix-top">
                    <div className="matrix-title-wrap">
                      <Send size={13} className="matrix-icon text-muted" />
                      <span className="matrix-title">SMTP Mailbox Check</span>
                    </div>
                    <span className={`matrix-status ${currentResult.smtpCheck ? 'status-pass' : 'status-fail'}`}>
                      <span className={`matrix-dot ${currentResult.smtpCheck ? 'dot-pass' : 'dot-fail'}`} />
                      {currentResult.smtpCheck ? 'Accepted (250)' : 'Rejected (550)'}
                    </span>
                  </div>
                  <div className="matrix-meta font-mono">
                    {currentResult.smtpResponse}
                  </div>
                </div>

                {/* 4. Disposable */}
                <div className="matrix-cell">
                  <div className="matrix-top">
                    <div className="matrix-title-wrap">
                      <Trash2 size={13} className="matrix-icon text-muted" />
                      <span className="matrix-title">Disposable Email</span>
                    </div>
                    <span className={`matrix-status ${!currentResult.isDisposable ? 'status-pass' : 'status-fail'}`}>
                      <span className={`matrix-dot ${!currentResult.isDisposable ? 'dot-pass' : 'dot-fail'}`} />
                      {!currentResult.isDisposable ? 'Clean' : 'Disposable Burner'}
                    </span>
                  </div>
                  <div className="matrix-meta font-sans">
                    {!currentResult.isDisposable ? 'Verified clean domain.' : 'Temporary burner inbox.'}
                  </div>
                </div>

                {/* 5. Provider Type */}
                <div className="matrix-cell">
                  <div className="matrix-top">
                    <div className="matrix-title-wrap">
                      <Globe size={13} className="matrix-icon text-muted" />
                      <span className="matrix-title">Provider Type</span>
                    </div>
                    <span className="matrix-status status-neutral">
                      <span className="matrix-dot dot-neutral" />
                      {currentResult.isFreeMail ? 'Free Webmail' : 'Custom Corporate'}
                    </span>
                  </div>
                  <div className="matrix-meta font-sans">
                    {currentResult.isFreeMail ? 'Consumer mailbox (Gmail/Yahoo).' : 'Corporate business domain.'}
                  </div>
                </div>

                {/* 6. Role Account */}
                <div className="matrix-cell">
                  <div className="matrix-top">
                    <div className="matrix-title-wrap">
                      <Users size={13} className="matrix-icon text-muted" />
                      <span className="matrix-title">Role-based Mailbox</span>
                    </div>
                    <span className={`matrix-status ${!currentResult.isRoleBased ? 'status-pass' : 'status-warn'}`}>
                      <span className={`matrix-dot ${!currentResult.isRoleBased ? 'dot-pass' : 'dot-warn'}`} />
                      {!currentResult.isRoleBased ? 'Individual' : 'Team / Role'}
                    </span>
                  </div>
                  <div className="matrix-meta font-sans">
                    {!currentResult.isRoleBased ? 'Direct personal employee inbox.' : 'Shared team inbox (support@, billing@).'}
                  </div>
                </div>

                {/* 7. Catch-all Domain */}
                <div className="matrix-cell">
                  <div className="matrix-top">
                    <div className="matrix-title-wrap">
                      <Filter size={13} className="matrix-icon text-muted" />
                      <span className="matrix-title">Catch-all Config</span>
                    </div>
                    <span className={`matrix-status ${!currentResult.isCatchAll ? 'status-pass' : 'status-warn'}`}>
                      <span className={`matrix-dot ${!currentResult.isCatchAll ? 'dot-pass' : 'dot-warn'}`} />
                      {!currentResult.isCatchAll ? 'Explicit Routing' : 'Catch-all Active'}
                    </span>
                  </div>
                  <div className="matrix-meta font-sans">
                    {!currentResult.isCatchAll ? 'Mailbox verified explicitly.' : 'Server accepts all domain addresses.'}
                  </div>
                </div>

                {/* 8. Spam Trap */}
                <div className="matrix-cell">
                  <div className="matrix-top">
                    <div className="matrix-title-wrap">
                      <ShieldCheck size={13} className="matrix-icon text-muted" />
                      <span className="matrix-title">Spam Trap Assessment</span>
                    </div>
                    <span className={`matrix-status ${currentResult.spamTrapScore < 20 ? 'status-pass' : 'status-fail'}`}>
                      <span className={`matrix-dot ${currentResult.spamTrapScore < 20 ? 'dot-pass' : 'dot-fail'}`} />
                      {currentResult.spamTrapScore < 20 ? '0% Risk' : `${currentResult.spamTrapScore}% Trap Risk`}
                    </span>
                  </div>
                  <div className="matrix-meta font-sans">
                    {currentResult.spamTrapScore < 20 ? 'Zero honeypot signatures.' : 'High toxic trap probability.'}
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
                    <Code size={13} />
                    <span>Raw Telemetry Payload</span>
                  </div>
                  <span className="json-expand-label font-mono">
                    {isRawJsonExpanded ? 'Hide Payload' : 'Inspect JSON Payload'}
                  </span>
                </button>
                {isRawJsonExpanded && (
                  <pre className="raw-json-code font-mono">
                    {JSON.stringify(currentResult.rawJson, null, 2)}
                  </pre>
                )}
              </div>
            </CardBody>
          </Card>
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
          box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 4px 16px rgba(0, 0, 0, 0.4);
        }

        .result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-subtle);
          background-color: #0E0F12;
          flex-wrap: wrap;
          gap: 10px;
        }

        .result-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .result-email-address {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -0.015em;
        }

        .result-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .verdict-summary-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          border-bottom: 1px solid var(--border-subtle);
          background-color: rgba(255, 255, 255, 0.015);
          flex-wrap: wrap;
          gap: 12px;
        }

        .verdict-summary-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 240px;
        }

        .verdict-pip {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .pip-deliverable { background-color: var(--status-success); }
        .pip-risky { background-color: var(--status-warning); }
        .pip-undeliverable { background-color: var(--status-error); }

        .verdict-text {
          font-size: 12.5px;
          color: var(--text-primary);
          font-weight: 500;
        }

        /* Deliverability Gauge Meter */
        .deliverability-score-gauge {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 170px;
        }

        .gauge-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10.5px;
        }

        .gauge-label {
          color: var(--text-muted);
        }

        .gauge-value {
          font-weight: 600;
        }

        .gauge-track {
          width: 100%;
          height: 4px;
          background-color: rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .gauge-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width 0.3s ease;
        }
        .fill-success { background-color: var(--status-success); }
        .fill-warning { background-color: var(--status-warning); }
        .fill-error { background-color: var(--status-error); }

        .verdict-meta-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .verdict-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--text-muted);
        }

        /* 8-Point Diagnostics Matrix */
        .diagnostics-matrix {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 14px;
        }

        .matrix-cell {
          background-color: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: border-color 0.12s ease;
        }
        .matrix-cell:hover {
          border-color: var(--border-standard);
        }

        .matrix-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }

        .matrix-title-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }

        .matrix-icon {
          flex-shrink: 0;
        }

        .matrix-title {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .matrix-status {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          font-weight: 600;
          flex-shrink: 0;
        }
        .matrix-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          display: inline-block;
        }
        .dot-pass { background-color: var(--status-success); }
        .dot-fail { background-color: var(--status-error); }
        .dot-warn { background-color: var(--status-warning); }
        .dot-neutral { background-color: var(--text-muted); }

        .status-pass { color: var(--status-success-text); }
        .status-fail { color: var(--status-error-text); }
        .status-warn { color: var(--status-warning-text); }
        .status-neutral { color: var(--text-secondary); }

        .matrix-meta {
          font-size: 11px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 2px;
        }

        /* Developer JSON Drawer */
        .raw-json-panel {
          border-top: 1px solid var(--border-subtle);
          padding-top: 10px;
        }

        .raw-json-header-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-xs);
          color: var(--text-muted);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .raw-json-header-btn:hover {
          color: var(--text-primary);
          background-color: var(--bg-hover);
        }

        .json-btn-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .json-expand-label {
          font-size: 11px;
          color: var(--text-tertiary);
        }

        .raw-json-code {
          margin-top: 8px;
          padding: 12px;
          background-color: #070809;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          font-size: 11px;
          color: #B4B9C2;
          overflow-x: auto;
          line-height: 1.5;
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
          .diagnostics-matrix {
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
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            flex-wrap: nowrap;
            width: 100%;
            padding-bottom: 2px;
          }
          .preset-chip {
            flex-shrink: 0;
          }
          .result-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          .result-actions {
            width: 100%;
          }
          .verdict-summary-strip {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
          .history-card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          .history-filters {
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            flex-wrap: nowrap;
            padding-bottom: 2px;
          }
        }

        @media (max-width: 520px) {
          .diagnostics-matrix {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
