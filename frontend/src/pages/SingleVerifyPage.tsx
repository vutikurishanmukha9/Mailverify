import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { verifyEmailAddress } from '../utils/verifier';
import type { SingleVerificationResult } from '../types';
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  RotateCw,
  Search,
  Download,
  Trash2,
  Server,
  Zap,
  Clock,
  Code
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { DeliverabilityBadge } from '../components/common/Badge';
import { Card, CardBody, CardHeader } from '../components/common/Card';

const SAMPLE_PRESETS = [
  { label: 'Corporate Lead', email: 'elena.rostova@datadog.com' },
  { label: 'Gmail Account', email: 'alex.developer@gmail.com' },
  { label: 'Disposable Email', email: 'temp.user492@mailinator.com' },
  { label: 'Spam Trap Seed', email: 'trap.tester@honeypot-sec.org' },
  { label: 'Role Account', email: 'billing@enterprise.corp' },
  { label: 'Catch-all Domain', email: 'user@catchall-company.io' }
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
    // Simulate real network SMTP handshake & DNS MX roundtrip
    setTimeout(() => {
      const result = verifyEmailAddress(target);
      setCurrentResult(result);
      addSingleVerification(result);
      setIsLoading(false);
      setInputEmail(target);
    }, 420);
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

      {/* Input Verification Card */}
      <Card className="verify-input-card">
        <CardBody>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            className="verify-input-form"
          >
            <div className="verify-input-group">
              <Mail className="verify-input-icon" size={17} />
              <input
                type="text"
                className="verify-text-input"
                placeholder="Enter email to verify (e.g. alex.developer@datadoghq.com)..."
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                autoFocus
              />
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                leftIcon={<Zap size={14} />}
                className="verify-submit-btn"
              >
                Verify Mailbox
              </Button>
            </div>
          </form>

          {/* Preset Buttons for Quick Testing */}
          <div className="presets-row">
            <span className="presets-label">Quick Scenarios:</span>
            <div className="presets-list">
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className="preset-pill"
                  onClick={() => {
                    setInputEmail(preset.email);
                    handleVerify(preset.email);
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Result Display Section */}
      {currentResult && (
        <div className="result-section">
          {/* Main Verdict Card */}
          <Card className="result-verdict-card">
            <CardHeader
              title={
                <div className="verdict-header-row">
                  <span className="verdict-email font-mono">{currentResult.email}</span>
                  <DeliverabilityBadge
                    status={currentResult.status}
                    score={currentResult.score}
                  />
                </div>
              }
              action={
                <div className="verdict-actions">
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
                    variant="outline"
                    size="sm"
                    onClick={handleCopyJson}
                    leftIcon={copiedJson ? <Check size={12} /> : <Copy size={12} />}
                  >
                    {copiedJson ? 'Copied' : 'Copy JSON'}
                  </Button>
                </div>
              }
            />
            <CardBody>
              {/* Primary Reason Banner */}
              <div
                className={`verdict-reason-banner verdict-reason-${currentResult.status}`}
              >
                <div className="reason-icon-wrapper">
                  {currentResult.status === 'deliverable' && (
                    <CheckCircle2 size={16} />
                  )}
                  {currentResult.status === 'risky' && <AlertTriangle size={16} />}
                  {currentResult.status === 'undeliverable' && <XCircle size={16} />}
                </div>
                <div className="reason-text">
                  <strong>Verification Verdict:</strong> {currentResult.reason}
                </div>
                <div className="verdict-meta-pills">
                  <span className="meta-pill tabular-nums">
                    <Clock size={11} /> {currentResult.latencyMs}ms latency
                  </span>
                  <span className="meta-pill font-mono">
                    <Server size={11} /> {currentResult.mxHost}
                  </span>
                </div>
              </div>

              {/* 8-Point Diagnostic Checks Matrix */}
              <div className="diagnostics-grid">
                {/* 1. Syntax */}
                <div className="diagnostic-item">
                  <div className="diag-header">
                    <span className="diag-title">RFC 5322 Syntax</span>
                    {currentResult.syntaxValid ? (
                      <span className="diag-status text-success">Valid</span>
                    ) : (
                      <span className="diag-status text-error">Invalid</span>
                    )}
                  </div>
                  <div className="diag-desc">Format complies with IETF RFC mail standards.</div>
                </div>

                {/* 2. DNS MX Records */}
                <div className="diagnostic-item">
                  <div className="diag-header">
                    <span className="diag-title">DNS MX Resolution</span>
                    {currentResult.mxRecordsFound ? (
                      <span className="diag-status text-success">Resolved</span>
                    ) : (
                      <span className="diag-status text-error">Not Found</span>
                    )}
                  </div>
                  <div className="diag-desc font-mono">
                    Host: {currentResult.mxHost}
                  </div>
                </div>

                {/* 3. SMTP Handshake */}
                <div className="diagnostic-item">
                  <div className="diag-header">
                    <span className="diag-title">SMTP Mailbox Check</span>
                    {currentResult.smtpCheck ? (
                      <span className="diag-status text-success">Accepted</span>
                    ) : (
                      <span className="diag-status text-error">Rejected</span>
                    )}
                  </div>
                  <div className="diag-desc font-mono">
                    {currentResult.smtpResponse}
                  </div>
                </div>

                {/* 4. Disposable Detection */}
                <div className="diagnostic-item">
                  <div className="diag-header">
                    <span className="diag-title">Disposable Email</span>
                    {!currentResult.isDisposable ? (
                      <span className="diag-status text-success">Clean (Safe)</span>
                    ) : (
                      <span className="diag-status text-error">Disposable</span>
                    )}
                  </div>
                  <div className="diag-desc">
                    {currentResult.isDisposable
                      ? 'Temporary address from burner service.'
                      : 'Not listed in disposable provider database.'}
                  </div>
                </div>

                {/* 5. Free Mail Provider */}
                <div className="diagnostic-item">
                  <div className="diag-header">
                    <span className="diag-title">Provider Type</span>
                    <span className="diag-status text-neutral">
                      {currentResult.isFreeMail ? 'Free Webmail' : 'Custom Corporate'}
                    </span>
                  </div>
                  <div className="diag-desc">
                    {currentResult.isFreeMail
                      ? 'Consumer inbox (Gmail, Outlook, Yahoo).'
                      : 'Corporate business domain.'}
                  </div>
                </div>

                {/* 6. Role-based Account */}
                <div className="diagnostic-item">
                  <div className="diag-header">
                    <span className="diag-title">Role-based Mailbox</span>
                    {!currentResult.isRoleBased ? (
                      <span className="diag-status text-success">Individual</span>
                    ) : (
                      <span className="diag-status text-warning">Team / Role</span>
                    )}
                  </div>
                  <div className="diag-desc">
                    {currentResult.isRoleBased
                      ? 'Shared department inbox (sales@, info@, billing@).'
                      : 'Direct personal employee inbox.'}
                  </div>
                </div>

                {/* 7. Catch-all Domain */}
                <div className="diagnostic-item">
                  <div className="diag-header">
                    <span className="diag-title">Catch-all Status</span>
                    {!currentResult.isCatchAll ? (
                      <span className="diag-status text-success">Direct Mailbox</span>
                    ) : (
                      <span className="diag-status text-warning">Catch-all Active</span>
                    )}
                  </div>
                  <div className="diag-desc">
                    {currentResult.isCatchAll
                      ? 'Server accepts any address at this domain.'
                      : 'Explicit recipient mailbox routing.'}
                  </div>
                </div>

                {/* 8. Spam Trap Threat */}
                <div className="diagnostic-item">
                  <div className="diag-header">
                    <span className="diag-title">Spam Trap Threat</span>
                    {currentResult.spamTrapScore < 20 ? (
                      <span className="diag-status text-success">0% Risk</span>
                    ) : (
                      <span className="diag-status text-error">
                        {currentResult.spamTrapScore}% Trap Risk
                      </span>
                    )}
                  </div>
                  <div className="diag-desc">
                    {currentResult.spamTrapScore < 20
                      ? 'No honeypot or spam seed attributes.'
                      : 'High risk of toxic blacklist trap.'}
                  </div>
                </div>
              </div>

              {/* Developer Raw JSON Accordion */}
              <div className="raw-json-accordion">
                <button
                  type="button"
                  className="raw-json-toggle"
                  onClick={() => setIsRawJsonExpanded(!isRawJsonExpanded)}
                >
                  <Code size={14} />
                  <span>Developer Payload (RFC Response Inspection)</span>
                  <span className="raw-json-arrow">
                    {isRawJsonExpanded ? 'Collapse' : 'Expand'}
                  </span>
                </button>
                {isRawJsonExpanded && (
                  <pre className="raw-json-content font-mono">
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
        <div className="history-header-row">
          <div>
            <h2 className="history-section-title">Recent Verifications</h2>
            <p className="history-section-subtitle">
              Locally cached log of addresses checked during this session.
            </p>
          </div>
          <div className="history-controls">
            {/* Search */}
            <div className="input-with-icon history-search">
              <Search size={14} className="input-icon-left" />
              <input
                type="text"
                className="input input-sm"
                placeholder="Filter by email or domain..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>

            {/* Filter Tabs */}
            <div className="tab-pill-nav">
              <button
                className={`tab-pill-btn ${historyFilter === 'all' ? 'active' : ''}`}
                onClick={() => setHistoryFilter('all')}
              >
                All ({singleHistory.length})
              </button>
              <button
                className={`tab-pill-btn ${
                  historyFilter === 'deliverable' ? 'active' : ''
                }`}
                onClick={() => setHistoryFilter('deliverable')}
              >
                Deliverable
              </button>
              <button
                className={`tab-pill-btn ${historyFilter === 'risky' ? 'active' : ''}`}
                onClick={() => setHistoryFilter('risky')}
              >
                Risky
              </button>
              <button
                className={`tab-pill-btn ${
                  historyFilter === 'undeliverable' ? 'active' : ''
                }`}
                onClick={() => setHistoryFilter('undeliverable')}
              >
                Undeliverable
              </button>
            </div>

            {singleHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSingleHistory}
                leftIcon={<Trash2 size={13} />}
                className="text-muted"
                title="Clear verification history"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Email Address</th>
                <th>Status</th>
                <th>Score</th>
                <th>MX Provider</th>
                <th>Latency</th>
                <th>Verified At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px 14px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      No verifications found matching your filter criteria.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id}>
                    <td className="primary-cell font-mono">{item.email}</td>
                    <td>
                      <DeliverabilityBadge status={item.status} />
                    </td>
                    <td className="font-mono tabular-nums">
                      <span
                        style={{
                          fontWeight: 600,
                          color:
                            item.score > 80
                              ? 'var(--status-success-text)'
                              : item.score > 50
                              ? 'var(--status-warning-text)'
                              : 'var(--status-error-text)'
                        }}
                      >
                        {item.score}/100
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: 12 }}>
                      {item.mxHost}
                    </td>
                    <td className="tabular-nums font-mono" style={{ fontSize: 12 }}>
                      {item.latencyMs}ms
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(item.verifiedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCurrentResult(item);
                            setInputEmail(item.email);
                            window.scrollTo({ top: 120, behavior: 'smooth' });
                          }}
                          className="btn-sm"
                        >
                          Inspect
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSingleHistoryItem(item.id)}
                          className="btn-icon"
                          title="Delete from history"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .verify-input-card {
          margin-bottom: var(--space-6);
          border-color: var(--border-strong);
        }

        .verify-input-group {
          position: relative;
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background-color: var(--bg-input);
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-md);
          padding: 6px 6px 6px 14px;
          transition: border-color 0.15s ease;
        }

        .verify-input-group:focus-within {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 1px var(--accent-primary);
        }

        .verify-input-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .verify-text-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-family: var(--font-mono);
          font-size: 14px;
          outline: none;
          min-width: 0;
        }
        .verify-text-input::placeholder {
          font-family: var(--font-sans);
          color: var(--text-tertiary);
          font-size: 13.5px;
        }

        .verify-submit-btn {
          flex-shrink: 0;
        }

        .presets-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-top: var(--space-3);
          flex-wrap: wrap;
        }

        .presets-label {
          font-size: 11.5px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .presets-list {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .preset-pill {
          background-color: var(--bg-panel-elevated);
          border: 1px solid var(--border-standard);
          color: var(--text-secondary);
          font-size: 11.5px;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .preset-pill:hover {
          border-color: var(--border-strong);
          color: var(--text-primary);
          background-color: var(--bg-hover);
        }

        .result-section {
          margin-bottom: var(--space-8);
          animation: fadeIn 0.2s ease-out;
        }

        .verdict-header-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .verdict-email {
          font-size: 16px;
          color: var(--text-primary);
          font-weight: 600;
        }

        .verdict-actions {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .verdict-reason-banner {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          margin-bottom: var(--space-5);
          font-size: 13px;
        }

        .verdict-reason-deliverable {
          background-color: var(--status-success-subtle);
          border: 1px solid var(--status-success-border);
          color: var(--status-success-text);
        }

        .verdict-reason-risky {
          background-color: var(--status-warning-subtle);
          border: 1px solid var(--status-warning-border);
          color: var(--status-warning-text);
        }

        .verdict-reason-undeliverable {
          background-color: var(--status-error-subtle);
          border: 1px solid var(--status-error-border);
          color: var(--status-error-text);
        }

        .reason-icon-wrapper {
          flex-shrink: 0;
          display: flex;
        }

        .reason-text {
          flex: 1;
        }

        .verdict-meta-pills {
          display: flex;
          gap: var(--space-2);
          flex-shrink: 0;
        }

        .meta-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          padding: 2px 8px;
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: var(--radius-full);
          color: var(--text-secondary);
        }

        .diagnostics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: var(--space-3);
          margin-bottom: var(--space-5);
        }

        .diagnostic-item {
          background-color: #121316;
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-sm);
          padding: var(--space-3);
        }

        .diag-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .diag-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .diag-status {
          font-size: 11px;
          font-weight: 600;
        }

        .text-success { color: var(--status-success-text); }
        .text-warning { color: var(--status-warning-text); }
        .text-error { color: var(--status-error-text); }
        .text-neutral { color: var(--text-muted); }

        .diag-desc {
          font-size: 11.5px;
          color: var(--text-muted);
          line-height: 1.35;
        }

        .raw-json-accordion {
          border-top: 1px solid var(--border-subtle);
          padding-top: var(--space-3);
        }

        .raw-json-toggle {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 12px;
          cursor: pointer;
          width: 100%;
          padding: 4px 0;
        }
        .raw-json-toggle:hover {
          color: var(--text-primary);
        }

        .raw-json-arrow {
          margin-left: auto;
          font-size: 11px;
          color: var(--accent-text);
        }

        .raw-json-content {
          margin-top: var(--space-2);
          padding: var(--space-3);
          background-color: #0E0F12;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 11.5px;
          overflow-x: auto;
          max-height: 220px;
        }

        .history-section {
          margin-top: var(--space-8);
        }

        .history-header-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: var(--space-4);
          gap: var(--space-4);
          flex-wrap: wrap;
        }

        .history-section-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .history-section-subtitle {
          font-size: 12.5px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .history-controls {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .history-search {
          width: 220px;
        }
      `}</style>
    </div>
  );
};
