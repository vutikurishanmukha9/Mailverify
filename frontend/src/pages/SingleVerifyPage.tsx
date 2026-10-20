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
  Zap,
  Clock,
  Code
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { DeliverabilityBadge } from '../components/common/Badge';
import { Card, CardBody } from '../components/common/Card';

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
    }, 380);
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

      {/* Sleek Command-style Search Bar (NO card-in-card) */}
      <div className="verify-bar-container">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="verify-command-form"
        >
          <div className="verify-command-group">
            <Mail className="verify-command-icon" size={16} />
            <input
              type="text"
              className="verify-command-input font-mono"
              placeholder="Enter email to inspect (e.g. alex.developer@datadoghq.com)..."
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              autoFocus
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              leftIcon={<Zap size={13} />}
              className="verify-command-btn"
            >
              Verify Mailbox
            </Button>
          </div>
        </form>

        {/* Preset Quick Test Scenarios */}
        <div className="verify-presets-bar">
          <span className="presets-caption">Quick Scenarios:</span>
          <div className="presets-tags">
            {SAMPLE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="preset-chip"
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

            {/* Verdict Summary Strip */}
            <div className="verdict-summary-strip">
              <div className="verdict-summary-left">
                <span className={`verdict-pip pip-${currentResult.status}`} />
                <span className="verdict-text">{currentResult.reason}</span>
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
                    <span className="matrix-title">RFC 5322 Syntax</span>
                    <span className={`matrix-status ${currentResult.syntaxValid ? 'status-pass' : 'status-fail'}`}>
                      {currentResult.syntaxValid ? 'Valid' : 'Syntax Error'}
                    </span>
                  </div>
                  <div className="matrix-meta font-sans">Complies with IETF RFC mail standard.</div>
                </div>

                {/* 2. DNS MX */}
                <div className="matrix-cell">
                  <div className="matrix-top">
                    <span className="matrix-title">DNS MX Resolution</span>
                    <span className={`matrix-status ${currentResult.mxRecordsFound ? 'status-pass' : 'status-fail'}`}>
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
                    <span className="matrix-title">SMTP Mailbox Check</span>
                    <span className={`matrix-status ${currentResult.smtpCheck ? 'status-pass' : 'status-fail'}`}>
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
                    <span className="matrix-title">Disposable Email</span>
                    <span className={`matrix-status ${!currentResult.isDisposable ? 'status-pass' : 'status-fail'}`}>
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
                    <span className="matrix-title">Provider Type</span>
                    <span className="matrix-status status-neutral">
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
                    <span className="matrix-title">Role-based Mailbox</span>
                    <span className={`matrix-status ${!currentResult.isRoleBased ? 'status-pass' : 'status-warn'}`}>
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
                    <span className="matrix-title">Catch-all Configuration</span>
                    <span className={`matrix-status ${!currentResult.isCatchAll ? 'status-pass' : 'status-warn'}`}>
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
                    <span className="matrix-title">Spam Trap Assessment</span>
                    <span className={`matrix-status ${currentResult.spamTrapScore < 20 ? 'status-pass' : 'status-fail'}`}>
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
                    {isRawJsonExpanded ? 'Hide' : 'Inspect JSON'}
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
          background-color: var(--bg-panel);
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-md);
          padding: 14px 16px;
          margin-bottom: var(--space-4);
        }

        .verify-command-group {
          position: relative;
          display: flex;
          align-items: center;
          background-color: var(--bg-input);
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-sm);
          padding: 4px 4px 4px 12px;
          transition: border-color 0.12s ease;
          gap: 8px;
        }

        .verify-command-group:focus-within {
          border-color: var(--accent-primary);
        }

        .verify-command-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .verify-command-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
          min-width: 0;
        }
        .verify-command-input::placeholder {
          font-family: var(--font-sans);
          color: var(--text-tertiary);
          font-size: 12.5px;
        }

        .verify-command-btn {
          flex-shrink: 0;
        }

        .verify-presets-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          flex-wrap: wrap;
        }

        .presets-caption {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .presets-tags {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .preset-chip {
          background-color: var(--bg-panel-elevated);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          font-size: 11px;
          padding: 2px 7px;
          border-radius: var(--radius-xs);
          cursor: pointer;
          transition: all 0.1s ease;
        }
        .preset-chip:hover {
          color: var(--text-primary);
          border-color: var(--border-strong);
          background-color: var(--bg-hover);
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
          font-size: 14.5px;
          font-weight: 600;
          color: var(--text-primary);
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
          background-color: rgba(255, 255, 255, 0.02);
          flex-wrap: wrap;
          gap: 8px;
        }

        .verdict-summary-left {
          display: flex;
          align-items: center;
          gap: 8px;
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
        }

        .matrix-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .matrix-title {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-muted);
        }

        .matrix-status {
          font-size: 10.5px;
          font-weight: 600;
        }
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

        @media (max-width: 900px) {
          .diagnostics-matrix {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};
