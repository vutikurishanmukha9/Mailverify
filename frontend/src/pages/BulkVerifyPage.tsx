import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { BulkVerificationJob, BulkJobRecord } from '../types';
import {
  UploadCloud,
  Search,
  Download,
  Trash2,
  CheckCircle2,
  Layers,
  Plus,
  Play,
  FileText,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Eye,
  X
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { DeliverabilityBadge } from '../components/common/Badge';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Modal } from '../components/common/Modal';

export const BulkVerifyPage: React.FC = () => {
  const {
    bulkJobs,
    createBulkJob,
    deleteBulkJob,
    addToast,
    subscription
  } = useApp();

  // Selected job for detailed explorer view
  const [selectedJobId, setSelectedJobId] = useState<string | null>(
    bulkJobs.length > 0 ? bulkJobs[0].id : null
  );

  // New Job Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creationTab, setCreationTab] = useState<'csv' | 'sheets' | 'manual'>('csv');
  const [jobName, setJobName] = useState('');
  const [manualText, setManualText] = useState('');
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [isDedupeEnabled, setIsDedupeEnabled] = useState(true);
  const [isNormalizeEnabled, setIsNormalizeEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // CSV Drag and drop / file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [parsedEmails, setParsedEmails] = useState<string[]>([]);
  const [sampleRows, setSampleRows] = useState<{ email: string; name?: string; domain: string }[]>([]);

  // Detailed records table search & filter
  const [recordsSearch, setRecordsSearch] = useState('');
  const [recordsStatusFilter, setRecordsStatusFilter] = useState<'all' | 'deliverable' | 'risky' | 'undeliverable'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected single record for deep telemetry modal
  const [inspectedRecord, setInspectedRecord] = useState<BulkJobRecord | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const currentJob = bulkJobs.find((j) => j.id === selectedJobId) || (bulkJobs.length > 0 ? bulkJobs[0] : null);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 1500);
  };

  const handleDownloadSampleCsv = () => {
    const content = `first_name,last_name,email,company\nElena,Rostova,elena.rostova@datadog.com,Datadog\nDavid,B,david.b@cloudscale.io,Cloudscale\nAlex,Vance,alex.vance@stripe.com,Stripe\nSarah,Connor,sarah.connor@acme.corp,Acme Corp\nSupport,Team,support@startup.io,Startup Inc\nBurner,Test,temp.burner82@mailinator.com,Tester\nSpam,Honeypot,trap.catch@honeypot.org,Security\nJohn,Doe,john.invalid-nonexistent-domain.xyz,Ghost Corp`;
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mailverify_sample_lead_list.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    addToast({
      type: 'info',
      title: 'Sample CSV Downloaded',
      message: 'Standard template format with email, name, and company columns.'
    });
  };

  const handleCsvFile = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      addToast({
        type: 'error',
        title: 'Unsupported File Format',
        message: 'Please upload a standard .csv or .txt file.'
      });
      return;
    }

    setUploadedFileName(file.name);
    if (!jobName) {
      setJobName(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/[\r\n]+/);
      const emails: string[] = [];
      const samples: { email: string; name?: string; domain: string }[] = [];

      lines.forEach((line) => {
        const parts = line.split(/[,;\t]/);
        parts.forEach((p) => {
          const trimmed = p.replace(/['"]+/g, '').trim();
          if (trimmed.includes('@') && !trimmed.toLowerCase().includes('email')) {
            const normalized = isNormalizeEnabled ? trimmed.toLowerCase() : trimmed;
            emails.push(normalized);
            if (samples.length < 3) {
              const domain = normalized.split('@')[1] || '';
              samples.push({ email: normalized, domain });
            }
          }
        });
      });

      const finalEmails = isDedupeEnabled ? Array.from(new Set(emails)) : emails;
      setParsedEmails(finalEmails);
      setSampleRows(samples);

      addToast({
        type: 'success',
        title: 'File Parsed Successfully',
        message: `Extracted ${finalEmails.length.toLocaleString()} unique email addresses from ${file.name}.`
      });
    };
    reader.readAsText(file);
  };

  const handleStartVerification = () => {
    let emailList: string[] = [];

    if (creationTab === 'csv') {
      emailList = parsedEmails;
    } else if (creationTab === 'manual') {
      const lines = manualText.split(/[\r\n,;]+/);
      emailList = lines
        .map((l) => l.trim().toLowerCase())
        .filter((l) => l.includes('@'));
      if (isDedupeEnabled) {
        emailList = Array.from(new Set(emailList));
      }
    } else if (creationTab === 'sheets') {
      if (!sheetsUrl.trim()) {
        addToast({
          type: 'error',
          title: 'Google Sheets URL Required',
          message: 'Please paste a valid Google Sheets URL.'
        });
        return;
      }
      emailList = [
        'lead.founder@techstars.co',
        'sarah.vp@acmecloud.com',
        'support@inboxzero.app',
        'temp.burner99@mailinator.com',
        'contact@growthleads.io',
        'director@enterprise-corp.com',
        'johnny.test@invalid-domain-xyz.com',
        'alex.lead@venturefund.vc'
      ];
    }

    if (emailList.length === 0) {
      addToast({
        type: 'error',
        title: 'No Valid Emails Found',
        message: 'Please provide at least one valid email address to verify.'
      });
      return;
    }

    if (subscription.creditsRemaining < emailList.length) {
      addToast({
        type: 'error',
        title: 'Insufficient Credit Balance',
        message: `This job requires ${emailList.length.toLocaleString()} credits. Current balance: ${subscription.creditsRemaining.toLocaleString()}.`
      });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const newJob = createBulkJob(
        jobName || (creationTab === 'csv' ? uploadedFileName || 'CSV Batch' : 'Manual Outreach List'),
        creationTab,
        emailList
      );
      setSelectedJobId(newJob.id);
      setIsProcessing(false);
      setIsModalOpen(false);

      // Reset modal fields
      setJobName('');
      setManualText('');
      setSheetsUrl('');
      setUploadedFileName(null);
      setParsedEmails([]);
      setSampleRows([]);
    }, 600);
  };

  const handleExportJob = (job: BulkVerificationJob, filter: 'all' | 'deliverable' | 'risky_undeliverable') => {
    let recordsToExport = job.records;
    if (filter === 'deliverable') {
      recordsToExport = job.records.filter((r) => r.status === 'deliverable');
    } else if (filter === 'risky_undeliverable') {
      recordsToExport = job.records.filter((r) => r.status !== 'deliverable');
    }

    const headers = 'Email,Deliverability_Status,Score,Reason,MX_Host,Disposable,Role_Based,Checked_At\n';
    const rows = recordsToExport
      .map(
        (r) =>
          `"${r.email}","${r.status}","${r.score}","${r.reason.replace(/"/g, '""')}","${r.mxHost}","${
            r.isDisposable
          }","${r.isRoleBased}","${r.checkedAt}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${job.name.replace(/\.[^/.]+$/, '')}_${filter}_cleaned.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'Clean List Exported',
      message: `Downloaded ${recordsToExport.length.toLocaleString()} verified records (${filter}).`
    });
  };

  // Filtered records in selected job
  const filteredRecords = (currentJob?.records || []).filter((rec) => {
    const matchesSearch = rec.email.toLowerCase().includes(recordsSearch.toLowerCase()) ||
      rec.mxHost.toLowerCase().includes(recordsSearch.toLowerCase());
    const matchesStatus = recordsStatusFilter === 'all' || rec.status === recordsStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Proportions for segmented distribution bar
  const deliverablePct = currentJob
    ? ((currentJob.deliverableCount / (currentJob.totalCount || 1)) * 100).toFixed(1)
    : '0';
  const riskyPct = currentJob
    ? ((currentJob.riskyCount / (currentJob.totalCount || 1)) * 100).toFixed(1)
    : '0';
  const undeliverablePct = currentJob
    ? ((currentJob.undeliverableCount / (currentJob.totalCount || 1)) * 100).toFixed(1)
    : '0';

  return (
    <div className="page-container">
      {/* Hidden button for trigger */}
      <button
        id="trigger-bulk-upload-btn"
        style={{ display: 'none' }}
        onClick={() => setIsModalOpen(true)}
      />

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="bulk-badge-row">
            <span className="badge-technical">HIGH-THROUGHPUT ENGINE</span>
            <span className="badge-meta font-mono">12,000 / min capacity</span>
          </div>
          <h1 className="page-header-title">Bulk Email Verification</h1>
          <p className="page-header-description">
            Upload CSV lead lists, connect Google Sheets, or paste contacts to scrub invalid,
            disposable, and high-risk spam traps across high-volume outreach campaigns.
          </p>
        </div>
        <div className="page-header-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadSampleCsv}
            leftIcon={<Download size={13} />}
          >
            Sample CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus size={13} />}
          >
            New Verification Job
          </Button>
        </div>
      </div>

      {/* Unified Deliverability Breakdown & Projections Console */}
      {currentJob && (
        <Card className="distribution-console-card">
          <CardBody compact>
            <div className="distribution-top-row">
              <div className="distribution-heading-group">
                <span className="distribution-title">DELIVERABILITY PERFORMANCE & PROJECTIONS</span>
                <span className="distribution-job-name font-mono">{currentJob.name}</span>
              </div>
              <div className="distribution-badge-group">
                <span className="badge-status-completed font-mono">
                  <CheckCircle2 size={12} /> 100% PROCESSED
                </span>
                <span className="badge-source-tag font-mono">
                  {currentJob.sourceType.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Proportional Segmented Delivery Bar */}
            <div className="segmented-distribution-bar">
              <div
                className="seg-bar-fill deliverable"
                style={{ width: `${deliverablePct}%` }}
                title={`Deliverable: ${currentJob.deliverableCount.toLocaleString()} (${deliverablePct}%)`}
              />
              <div
                className="seg-bar-fill risky"
                style={{ width: `${riskyPct}%` }}
                title={`Risky / Catch-All: ${currentJob.riskyCount.toLocaleString()} (${riskyPct}%)`}
              />
              <div
                className="seg-bar-fill undeliverable"
                style={{ width: `${undeliverablePct}%` }}
                title={`Undeliverable: ${currentJob.undeliverableCount.toLocaleString()} (${undeliverablePct}%)`}
              />
            </div>

            {/* 4 Partitioned Stat Columns with Hairline Borders */}
            <div className="distribution-metrics-grid">
              <div className="distribution-col">
                <div className="distribution-col-label">
                  <span className="stat-dot dot-neutral" />
                  <span>TOTAL ANALYZED</span>
                </div>
                <div className="distribution-col-value font-mono tabular-nums">
                  {currentJob.totalCount.toLocaleString()}
                </div>
                <div className="distribution-col-meta">
                  100% completed · 0 syntax errors
                </div>
              </div>

              <div className="distribution-col">
                <div className="distribution-col-label">
                  <span className="stat-dot dot-success" />
                  <span>DELIVERABLE</span>
                </div>
                <div className="distribution-col-value font-mono tabular-nums text-success">
                  {currentJob.deliverableCount.toLocaleString()}
                </div>
                <div className="distribution-col-meta">
                  {deliverablePct}% · Safe for primary domain
                </div>
              </div>

              <div className="distribution-col">
                <div className="distribution-col-label">
                  <span className="stat-dot dot-warning" />
                  <span>RISKY / CATCH-ALL</span>
                </div>
                <div className="distribution-col-value font-mono tabular-nums text-warning">
                  {currentJob.riskyCount.toLocaleString()}
                </div>
                <div className="distribution-col-meta">
                  {riskyPct}% · Catch-all / low engagement
                </div>
              </div>

              <div className="distribution-col">
                <div className="distribution-col-label">
                  <span className="stat-dot dot-error" />
                  <span>UNDELIVERABLE</span>
                </div>
                <div className="distribution-col-value font-mono tabular-nums text-error">
                  {currentJob.undeliverableCount.toLocaleString()}
                </div>
                <div className="distribution-col-meta">
                  {undeliverablePct}% · Hard bounces prevented
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Two-Column Master-Detail Layout */}
      <div className="bulk-grid-layout">
        {/* Left Column: Verification Jobs Navigation */}
        <div className="bulk-jobs-sidebar">
          <div className="jobs-sidebar-header">
            <div className="jobs-header-title-row">
              <span className="jobs-sidebar-title">Verification Jobs</span>
              <span className="jobs-sidebar-count font-mono">{bulkJobs.length}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="btn-icon-sm"
              title="Upload new verification list"
            >
              <Plus size={12} />
            </Button>
          </div>

          <div className="jobs-list">
            {bulkJobs.map((job) => {
              const isSelected = job.id === selectedJobId;
              const deliverableRatio = Math.round(
                (job.deliverableCount / (job.totalCount || 1)) * 100
              );

              return (
                <div
                  key={job.id}
                  className={`job-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedJobId(job.id);
                    setCurrentPage(1);
                  }}
                >
                  <div className="job-card-top">
                    <div className="job-card-ident">
                      <FileText size={13} className="job-file-icon" />
                      <span className="job-card-name" title={job.name}>
                        {job.name}
                      </span>
                    </div>
                    <span className="job-badge-completed font-mono">Completed</span>
                  </div>

                  <div className="job-card-stats tabular-nums font-mono">
                    <span className="text-secondary">{job.totalCount.toLocaleString()} emails</span>
                    <span className="text-success font-bold">{deliverableRatio}% Deliverable</span>
                  </div>

                  {/* Micro delivery ratio bar */}
                  <div className="job-progress-split">
                    <div
                      style={{
                        width: `${(job.deliverableCount / job.totalCount) * 100}%`,
                        backgroundColor: 'var(--status-success)'
                      }}
                    />
                    <div
                      style={{
                        width: `${(job.riskyCount / job.totalCount) * 100}%`,
                        backgroundColor: 'var(--status-warning)'
                      }}
                    />
                    <div
                      style={{
                        width: `${(job.undeliverableCount / job.totalCount) * 100}%`,
                        backgroundColor: 'var(--status-error)'
                      }}
                    />
                  </div>

                  <div className="job-card-footer">
                    <span className="job-time font-mono">
                      {new Date(job.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <div className="job-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="job-action-btn"
                        onClick={() => handleExportJob(job, 'deliverable')}
                        title="Download clean emails"
                      >
                        <Download size={12} />
                      </button>
                      <button
                        className="job-action-btn delete-btn"
                        onClick={() => deleteBulkJob(job.id)}
                        title="Remove job"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Job Detailed Explorer */}
        <div className="bulk-records-main">
          {currentJob ? (
            <Card>
              <CardHeader
                title={
                  <div className="records-header-info">
                    <div className="records-title-group">
                      <span className="records-job-name font-mono">{currentJob.name}</span>
                      <span className="records-source-badge font-mono">
                        {currentJob.sourceType.toUpperCase()}
                      </span>
                      <span className="records-id-badge font-mono">{currentJob.id}</span>
                    </div>
                    <div className="records-time-meta font-mono">
                      Completed {new Date(currentJob.completedAt || currentJob.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                }
                action={
                  <div className="records-header-actions">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleExportJob(currentJob, 'deliverable')}
                      leftIcon={<Download size={13} />}
                      title="Export clean deliverable records"
                    >
                      Export Clean ({currentJob.deliverableCount.toLocaleString()})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportJob(currentJob, 'all')}
                      leftIcon={<Download size={13} />}
                      title="Export all original records"
                    >
                      Export All ({currentJob.totalCount.toLocaleString()})
                    </Button>
                  </div>
                }
              />
              <CardBody compact>
                {/* Search & Filter Toolbar */}
                <div className="table-filter-bar">
                  <div className="input-with-icon table-search-input">
                    <Search size={14} className="input-icon-left" />
                    <input
                      type="text"
                      className="input input-sm"
                      placeholder="Search email or mail host... (/)"
                      value={recordsSearch}
                      onChange={(e) => {
                        setRecordsSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                    {recordsSearch && (
                      <button
                        className="search-clear-btn"
                        onClick={() => setRecordsSearch('')}
                        title="Clear filter"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <div className="tab-pill-nav">
                    <button
                      className={`tab-pill-btn ${recordsStatusFilter === 'all' ? 'active' : ''}`}
                      onClick={() => {
                        setRecordsStatusFilter('all');
                        setCurrentPage(1);
                      }}
                    >
                      All ({currentJob.records.length})
                    </button>
                    <button
                      className={`tab-pill-btn ${recordsStatusFilter === 'deliverable' ? 'active' : ''}`}
                      onClick={() => {
                        setRecordsStatusFilter('deliverable');
                        setCurrentPage(1);
                      }}
                    >
                      <span className="filter-pill-dot dot-success" />
                      Deliverable ({currentJob.deliverableCount})
                    </button>
                    <button
                      className={`tab-pill-btn ${recordsStatusFilter === 'risky' ? 'active' : ''}`}
                      onClick={() => {
                        setRecordsStatusFilter('risky');
                        setCurrentPage(1);
                      }}
                    >
                      <span className="filter-pill-dot dot-warning" />
                      Risky ({currentJob.riskyCount})
                    </button>
                    <button
                      className={`tab-pill-btn ${recordsStatusFilter === 'undeliverable' ? 'active' : ''}`}
                      onClick={() => {
                        setRecordsStatusFilter('undeliverable');
                        setCurrentPage(1);
                      }}
                    >
                      <span className="filter-pill-dot dot-error" />
                      Undeliverable ({currentJob.undeliverableCount})
                    </button>
                  </div>
                </div>

                {/* High-Density Enterprise Data Table */}
                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: '28%' }}>Recipient Email</th>
                        <th style={{ width: '15%' }}>Verdict Status</th>
                        <th style={{ width: '15%' }}>Confidence</th>
                        <th style={{ width: '18%' }}>Mail Server (MX)</th>
                        <th style={{ width: '18%' }}>Flags & Diagnostics</th>
                        <th style={{ width: '6%', textAlign: 'right' }}>Inspect</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRecords.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '48px 14px' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                              No records found matching current search query or verdict filter.
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              style={{ marginTop: 8 }}
                              onClick={() => {
                                setRecordsSearch('');
                                setRecordsStatusFilter('all');
                              }}
                            >
                              Reset Active Filters
                            </Button>
                          </td>
                        </tr>
                      ) : (
                        paginatedRecords.map((rec) => (
                          <tr
                            key={rec.id}
                            className="clickable-row"
                            onClick={() => setInspectedRecord(rec)}
                          >
                            <td className="primary-cell font-mono">
                              <div className="email-cell-wrapper">
                                <span className="email-text" title={rec.email}>{rec.email}</span>
                                <button
                                  className="email-copy-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyEmail(rec.email);
                                  }}
                                  title="Copy address"
                                >
                                  {copiedEmail === rec.email ? (
                                    <Check size={12} className="text-success" />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td>
                              <DeliverabilityBadge status={rec.status} />
                            </td>
                            <td className="font-mono tabular-nums">
                              <div className="score-meter-cell">
                                <span
                                  style={{
                                    fontWeight: 600,
                                    color:
                                      rec.score > 80
                                        ? 'var(--status-success-text)'
                                        : rec.score > 50
                                        ? 'var(--status-warning-text)'
                                        : 'var(--status-error-text)'
                                  }}
                                >
                                  {rec.score}/100
                                </span>
                                <div className="mini-score-track">
                                  <div
                                    className="mini-score-fill"
                                    style={{
                                      width: `${rec.score}%`,
                                      backgroundColor:
                                        rec.score > 80
                                          ? 'var(--status-success)'
                                          : rec.score > 50
                                          ? 'var(--status-warning)'
                                          : 'var(--status-error)'
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="font-mono" style={{ fontSize: 12 }}>
                              <span className="mx-text" title={rec.mxHost}>
                                {rec.mxHost}
                              </span>
                            </td>
                            <td>
                              <div className="flags-diag-cell">
                                {rec.isDisposable && (
                                  <span className="badge-flag-error font-mono">
                                    <AlertTriangle size={10} /> Disposable
                                  </span>
                                )}
                                {rec.isRoleBased && (
                                  <span className="badge-flag-warning font-mono">
                                    Role
                                  </span>
                                )}
                                {!rec.isDisposable && !rec.isRoleBased && (
                                  <span className="diagnostic-summary-cell" title={rec.reason}>
                                    {rec.reason}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="row-inspect-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInspectedRecord(rec);
                                }}
                                title="Inspect diagnostic trace"
                              >
                                <Eye size={13} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Toolbar */}
                <div className="table-pagination">
                  <div className="font-mono" style={{ fontSize: 12 }}>
                    Showing {(currentPage - 1) * pageSize + 1} to{' '}
                    {Math.min(currentPage * pageSize, filteredRecords.length)} of{' '}
                    {filteredRecords.length} records
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className="pagination-page-indicator font-mono">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody style={{ textAlign: 'center', padding: '64px 20px' }}>
                <Layers size={36} style={{ color: 'var(--text-tertiary)', marginBottom: 12 }} />
                <h3>No Verification Jobs Available</h3>
                <p style={{ marginTop: 6, marginBottom: 16 }}>
                  Upload a CSV file or connect a Google Sheet to start your first verification job.
                </p>
                <Button
                  variant="primary"
                  onClick={() => setIsModalOpen(true)}
                  leftIcon={<Plus size={14} />}
                >
                  Create New Job
                </Button>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Record Deep Telemetry Inspection Modal */}
      {inspectedRecord && (
        <Modal
          isOpen={!!inspectedRecord}
          onClose={() => setInspectedRecord(null)}
          title="Diagnostic Verification Telemetry"
          maxWidth={540}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div className="font-mono text-muted" style={{ fontSize: 11.5 }}>
                Checked at {new Date(inspectedRecord.checkedAt).toLocaleTimeString()}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopyEmail(inspectedRecord.email)}
                  leftIcon={copiedEmail === inspectedRecord.email ? <Check size={12} /> : <Copy size={12} />}
                >
                  {copiedEmail === inspectedRecord.email ? 'Copied' : 'Copy Email'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setInspectedRecord(null)}>
                  Close
                </Button>
              </div>
            </div>
          }
        >
          <div className="telemetry-modal-body">
            {/* Header Identity Row */}
            <div className="telemetry-id-card">
              <div>
                <div className="telemetry-email font-mono">{inspectedRecord.email}</div>
                <div className="telemetry-mx font-mono text-muted">
                  MX: {inspectedRecord.mxHost}
                </div>
              </div>
              <DeliverabilityBadge status={inspectedRecord.status} />
            </div>

            {/* Score & Verdict Banner */}
            <div className="telemetry-score-banner">
              <div className="telemetry-score-box">
                <span className="telemetry-score-val font-mono">{inspectedRecord.score}/100</span>
                <span className="telemetry-score-lbl">Quality Score</span>
              </div>
              <div className="telemetry-reason-box">
                <div className="telemetry-reason-title">Primary Diagnostic Verdict</div>
                <div className="telemetry-reason-desc">{inspectedRecord.reason}</div>
              </div>
            </div>

            {/* 6-Point Inspection Checklist */}
            <div className="telemetry-checklist">
              <div className="checklist-row">
                <span className="checklist-label">RFC 5322 Syntax Standard</span>
                <span className="checklist-status text-success font-mono">
                  <ShieldCheck size={13} /> VALID
                </span>
              </div>
              <div className="checklist-row">
                <span className="checklist-label">DNS MX Record Resolution</span>
                <span className="checklist-status text-success font-mono">
                  <CheckCircle2 size={13} /> ACTIVE ({inspectedRecord.mxHost})
                </span>
              </div>
              <div className="checklist-row">
                <span className="checklist-label">Disposable / Burner Provider</span>
                <span
                  className={`checklist-status font-mono ${
                    inspectedRecord.isDisposable ? 'text-error' : 'text-success'
                  }`}
                >
                  {inspectedRecord.isDisposable ? (
                    <>
                      <XCircle size={13} /> FLAGGED
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} /> CLEAN
                    </>
                  )}
                </span>
              </div>
              <div className="checklist-row">
                <span className="checklist-label">Role-based Account Classification</span>
                <span
                  className={`checklist-status font-mono ${
                    inspectedRecord.isRoleBased ? 'text-warning' : 'text-success'
                  }`}
                >
                  {inspectedRecord.isRoleBased ? (
                    <>
                      <AlertTriangle size={13} /> ROLE / GENERIC
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} /> INDIVIDUAL
                    </>
                  )}
                </span>
              </div>
              <div className="checklist-row">
                <span className="checklist-label">SMTP RCPT TO Mailbox Handshake</span>
                <span
                  className={`checklist-status font-mono ${
                    inspectedRecord.status === 'deliverable'
                      ? 'text-success'
                      : inspectedRecord.status === 'risky'
                      ? 'text-warning'
                      : 'text-error'
                  }`}
                >
                  {inspectedRecord.status === 'deliverable'
                    ? '250 RECIPIENT OK'
                    : inspectedRecord.status === 'risky'
                    ? 'ACCEPT ALL DETECTED'
                    : '550 MAILBOX NOT FOUND'}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* New Bulk Job Ingestion Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Bulk Verification Job"
        maxWidth={620}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div className="job-credit-calc">
              <span className="text-secondary font-mono" style={{ fontSize: 12 }}>
                Job Size:{' '}
                <strong className="text-primary tabular-nums">
                  {creationTab === 'csv'
                    ? parsedEmails.length.toLocaleString()
                    : creationTab === 'manual'
                    ? manualText
                        .split(/[\r\n,;]+/)
                        .filter((l) => l.trim().includes('@')).length.toLocaleString()
                    : 8}{' '}
                  emails
                </strong>
              </span>
              <span className="credit-calc-balance font-mono">
                · Available:{' '}
                <strong style={{ color: 'var(--accent-text)' }}>
                  {subscription.creditsRemaining.toLocaleString()}
                </strong>
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartVerification}
                isLoading={isProcessing}
                leftIcon={<Play size={13} />}
              >
                Run Verification
              </Button>
            </div>
          </div>
        }
      >
        <div className="new-job-modal-content">
          {/* Job Name */}
          <div className="form-group">
            <label className="form-label">
              <span>List / Batch Identifier</span>
              <span className="text-muted" style={{ fontSize: 11 }}>Optional custom name</span>
            </label>
            <input
              type="text"
              className="input font-mono"
              placeholder="e.g. Q4_SaaS_Outreach_Leads.csv"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
            />
          </div>

          {/* Ingestion Source Tabs */}
          <div className="tab-pill-nav" style={{ width: '100%', marginBottom: 14 }}>
            <button
              className={`tab-pill-btn ${creationTab === 'csv' ? 'active' : ''}`}
              style={{ flex: 1, textAlign: 'center' }}
              onClick={() => setCreationTab('csv')}
            >
              CSV / TXT Upload
            </button>
            <button
              className={`tab-pill-btn ${creationTab === 'manual' ? 'active' : ''}`}
              style={{ flex: 1, textAlign: 'center' }}
              onClick={() => setCreationTab('manual')}
            >
              Manual Copy & Paste
            </button>
            <button
              className={`tab-pill-btn ${creationTab === 'sheets' ? 'active' : ''}`}
              style={{ flex: 1, textAlign: 'center' }}
              onClick={() => setCreationTab('sheets')}
            >
              Google Sheets Link
            </button>
          </div>

          {/* Tab 1: CSV Upload */}
          {creationTab === 'csv' && (
            <div className="tab-content-csv">
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".csv,.txt"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleCsvFile(e.target.files[0]);
                  }
                }}
              />
              <div
                className="dropzone-area"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={30} className="dropzone-icon" />
                <div className="dropzone-title">
                  {uploadedFileName ? (
                    <span className="text-success font-mono">{uploadedFileName}</span>
                  ) : (
                    'Click to upload or drag & drop CSV file'
                  )}
                </div>
                <div className="dropzone-desc font-mono">
                  Auto-detects email column · Comma or semicolon delimited · Up to 250,000 records
                </div>
              </div>

              {parsedEmails.length > 0 && (
                <div className="parsed-summary-box">
                  <div className="parsed-summary-header">
                    <CheckCircle2 size={15} className="text-success" />
                    <span>
                      Parsed <strong>{parsedEmails.length.toLocaleString()}</strong> valid email addresses
                    </span>
                  </div>

                  {sampleRows.length > 0 && (
                    <div className="parsed-samples-list">
                      {sampleRows.map((sample, idx) => (
                        <div key={idx} className="parsed-sample-row font-mono">
                          <span className="text-primary">{sample.email}</span>
                          <span className="text-muted">Domain: {sample.domain}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Manual Paste */}
          {creationTab === 'manual' && (
            <div className="tab-content-manual">
              <div className="form-group">
                <label className="form-label">
                  <span>Paste Contact Records</span>
                  <span className="text-muted" style={{ fontSize: 11 }}>
                    One email per line, or comma / semicolon separated
                  </span>
                </label>
                <textarea
                  className="input font-mono"
                  rows={6}
                  placeholder={`alex.vance@stripe.com\nelena.rostova@datadog.com\nsarah.connor@acme.corp\ntemp.user492@mailinator.com`}
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Tab 3: Google Sheets */}
          {creationTab === 'sheets' && (
            <div className="tab-content-sheets">
              <div className="form-group">
                <label className="form-label">Google Sheets Shareable Link</label>
                <input
                  type="url"
                  className="input font-mono"
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                  value={sheetsUrl}
                  onChange={(e) => setSheetsUrl(e.target.value)}
                />
                <span className="form-hint" style={{ marginTop: 4 }}>
                  Ensure sheet link sharing is set to &ldquo;Anyone with the link can view&rdquo; or connect Google Sheets in Integrations.
                </span>
              </div>
            </div>
          )}

          {/* Clean Pre-processing Options */}
          <div className="new-job-options">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={isDedupeEnabled}
                onChange={(e) => setIsDedupeEnabled(e.target.checked)}
              />
              <span>Deduplicate identical email addresses before processing</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={isNormalizeEnabled}
                onChange={(e) => setIsNormalizeEnabled(e.target.checked)}
              />
              <span>Normalize domains and lowercase sanitize all addresses</span>
            </label>
          </div>
        </div>
      </Modal>

      <style>{`
        /* Badge row in header */
        .bulk-badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .badge-technical {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding: 2px 7px;
          background-color: var(--accent-subtle);
          border: 1px solid var(--accent-border);
          color: var(--accent-text);
          border-radius: 4px;
        }

        .badge-meta {
          font-size: 11px;
          color: var(--text-muted);
        }

        /* Unified Deliverability Performance Card */
        .distribution-console-card {
          margin-bottom: var(--space-5);
          border: 1px solid var(--border-standard);
          background-color: var(--bg-panel);
        }

        .distribution-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px 10px;
          border-bottom: 1px solid var(--border-subtle);
          flex-wrap: wrap;
          gap: 8px;
        }

        .distribution-heading-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .distribution-title {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .distribution-job-name {
          font-size: 12px;
          color: var(--text-primary);
          background-color: var(--bg-canvas);
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid var(--border-subtle);
        }

        .distribution-badge-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .badge-status-completed {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10.5px;
          color: var(--status-success-text);
          background-color: var(--status-success-subtle);
          border: 1px solid var(--status-success-border);
          border-radius: var(--radius-full);
          padding: 2px 8px;
          font-weight: 600;
        }

        .badge-source-tag {
          font-size: 10.5px;
          color: var(--text-muted);
          background-color: var(--bg-input);
          border: 1px solid var(--border-standard);
          border-radius: 4px;
          padding: 2px 6px;
        }

        /* Segmented Proportional Delivery Bar */
        .segmented-distribution-bar {
          display: flex;
          height: 6px;
          margin: 12px 16px 14px;
          border-radius: 3px;
          overflow: hidden;
          background-color: #111214;
        }

        .seg-bar-fill {
          height: 100%;
          transition: width 0.3s ease;
        }
        .seg-bar-fill.deliverable {
          background-color: var(--status-success);
        }
        .seg-bar-fill.risky {
          background-color: var(--status-warning);
        }
        .seg-bar-fill.undeliverable {
          background-color: var(--status-error);
        }

        /* 4 Symmetrical Metric Columns */
        .distribution-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          padding: 0 16px 12px;
          gap: 16px;
        }

        .distribution-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-right: 12px;
          border-right: 1px solid var(--border-subtle);
        }
        .distribution-col:last-child {
          border-right: none;
          padding-right: 0;
        }

        .distribution-col-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .stat-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .stat-dot.dot-neutral {
          background-color: var(--text-muted);
        }
        .stat-dot.dot-success {
          background-color: var(--status-success);
        }
        .stat-dot.dot-warning {
          background-color: var(--status-warning);
        }
        .stat-dot.dot-error {
          background-color: var(--status-error);
        }

        .distribution-col-value {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .distribution-col-meta {
          font-size: 11.5px;
          color: var(--text-secondary);
        }

        /* Two-Column Master-Detail Layout */
        .bulk-grid-layout {
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          gap: var(--space-4);
          align-items: start;
          width: 100%;
          min-width: 0;
        }

        /* Left Column: Jobs Sidebar */
        .bulk-jobs-sidebar {
          background-color: var(--bg-panel);
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-md);
          overflow: hidden;
          width: 100%;
          min-width: 0;
        }

        /* Right Column: Records Explorer */
        .bulk-records-main {
          min-width: 0;
          width: 100%;
          max-width: 100%;
          overflow: hidden;
        }

        .jobs-sidebar-header {
          padding: 10px 14px;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #111215;
        }

        .jobs-header-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .jobs-sidebar-title {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .jobs-sidebar-count {
          font-size: 10.5px;
          background-color: var(--bg-canvas);
          border: 1px solid var(--border-subtle);
          padding: 1px 6px;
          border-radius: 10px;
          color: var(--text-muted);
        }

        .btn-icon-sm {
          padding: 4px 6px !important;
          min-height: auto !important;
        }

        .jobs-list {
          display: flex;
          flex-direction: column;
          max-height: 640px;
          overflow-y: auto;
        }

        .job-card {
          padding: 12px 14px;
          border-bottom: 1px solid var(--border-subtle);
          cursor: pointer;
          position: relative;
          background-color: transparent;
          transition: background-color 0.12s ease;
        }
        .job-card:hover {
          background-color: #15161A;
        }
        .job-card.selected {
          background-color: #17181D;
        }
        .job-card.selected::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background-color: var(--accent-primary);
        }

        .job-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .job-card-ident {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow: hidden;
        }

        .job-file-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .job-card-name {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 170px;
        }

        .job-badge-completed {
          font-size: 9.5px;
          color: var(--status-success-text);
          background-color: var(--status-success-subtle);
          border: 1px solid var(--status-success-border);
          border-radius: var(--radius-full);
          padding: 1px 6px;
          flex-shrink: 0;
        }

        .job-card-stats {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-muted);
          margin-bottom: 6px;
        }

        .job-progress-split {
          height: 3px;
          border-radius: 2px;
          display: flex;
          overflow: hidden;
          background-color: #1E2024;
          margin-bottom: 6px;
        }

        .job-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-muted);
        }

        .job-card-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .job-action-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 3px;
          border-radius: 3px;
          display: flex;
          align-items: center;
          transition: color 0.12s ease, background-color 0.12s ease;
        }
        .job-action-btn:hover {
          color: var(--text-primary);
          background-color: var(--bg-hover);
        }
        .job-action-btn.delete-btn:hover {
          color: var(--status-error-text);
        }

        /* Right Column: Records Explorer */
        .records-header-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .records-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .records-job-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .records-source-badge {
          font-size: 10px;
          padding: 1px 6px;
          background-color: var(--bg-input);
          border: 1px solid var(--border-standard);
          border-radius: 4px;
          color: var(--text-muted);
        }

        .records-id-badge {
          font-size: 10px;
          color: var(--text-tertiary);
        }

        .records-time-meta {
          font-size: 11px;
          color: var(--text-muted);
        }

        .records-header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .table-filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 14px;
          border-bottom: 1px solid var(--border-subtle);
          gap: var(--space-3);
          flex-wrap: wrap;
          background-color: #121316;
        }

        .table-search-input {
          width: 250px;
          position: relative;
        }

        .search-clear-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
        }

        .filter-pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 5px;
        }

        /* Table Specifics */
        .clickable-row {
          cursor: pointer;
          transition: background-color 0.12s ease;
        }
        .clickable-row:hover {
          background-color: #15171C !important;
        }

        .email-cell-wrapper {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }

        .email-text {
          max-width: 170px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: inline-block;
        }

        .email-copy-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.12s ease, color 0.12s ease;
          padding: 2px;
          display: flex;
          flex-shrink: 0;
        }
        .clickable-row:hover .email-copy-btn {
          opacity: 1;
        }
        .email-copy-btn:hover {
          color: var(--text-primary);
        }

        .score-meter-cell {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mini-score-track {
          width: 36px;
          height: 4px;
          background-color: #1E2024;
          border-radius: 2px;
          overflow: hidden;
        }

        .mini-score-fill {
          height: 100%;
        }

        .mx-text {
          max-width: 130px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: inline-block;
        }

        .flags-diag-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .badge-flag-error {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: var(--status-error-text);
          background-color: var(--status-error-subtle);
          border: 1px solid var(--status-error-border);
          border-radius: 4px;
          padding: 1px 5px;
          flex-shrink: 0;
        }

        .badge-flag-warning {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: var(--status-warning-text);
          background-color: var(--status-warning-subtle);
          border: 1px solid var(--status-warning-border);
          border-radius: 4px;
          padding: 1px 5px;
          flex-shrink: 0;
        }

        .diagnostic-summary-cell {
          font-size: 11.5px;
          color: var(--text-secondary);
          max-width: 140px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .row-inspect-btn {
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px 6px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          transition: all 0.12s ease;
        }
        .row-inspect-btn:hover {
          color: var(--text-primary);
          background-color: var(--bg-hover);
          border-color: var(--border-standard);
        }

        .pagination-page-indicator {
          font-size: 12px;
          color: var(--text-muted);
          padding: 0 6px;
        }

        /* Modal: Telemetry Body */
        .telemetry-modal-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .telemetry-id-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #101114;
          border: 1px solid var(--border-standard);
          padding: 12px 14px;
          border-radius: var(--radius-sm);
        }

        .telemetry-email {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .telemetry-mx {
          font-size: 11px;
          margin-top: 2px;
        }

        .telemetry-score-banner {
          display: flex;
          gap: 14px;
          background-color: #121316;
          border: 1px solid var(--border-standard);
          padding: 12px 14px;
          border-radius: var(--radius-sm);
          align-items: center;
        }

        .telemetry-score-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding-right: 14px;
          border-right: 1px solid var(--border-subtle);
        }

        .telemetry-score-val {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .telemetry-score-lbl {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .telemetry-reason-box {
          flex: 1;
        }

        .telemetry-reason-title {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 2px;
        }

        .telemetry-reason-desc {
          font-size: 13px;
          color: var(--text-primary);
        }

        .telemetry-checklist {
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }

        .checklist-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-bottom: 1px solid var(--border-subtle);
          font-size: 12.5px;
          background-color: #101114;
        }
        .checklist-row:last-child {
          border-bottom: none;
        }

        .checklist-label {
          color: var(--text-secondary);
        }

        .checklist-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
        }

        /* Ingestion Modal */
        .dropzone-area {
          border: 1px dashed var(--border-strong);
          border-radius: var(--radius-md);
          padding: 28px 16px;
          text-align: center;
          background-color: #101114;
          cursor: pointer;
          transition: border-color 0.15s ease, background-color 0.15s ease;
        }
        .dropzone-area:hover {
          border-color: var(--accent-primary);
          background-color: #131418;
        }

        .dropzone-icon {
          color: var(--accent-primary);
          margin-bottom: 8px;
        }

        .dropzone-title {
          font-size: 13.5px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .dropzone-desc {
          font-size: 11px;
          color: var(--text-muted);
        }

        .parsed-summary-box {
          background-color: #101114;
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-sm);
          padding: 12px 14px;
          margin-top: 12px;
        }

        .parsed-summary-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .parsed-samples-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-top: 1px solid var(--border-subtle);
          padding-top: 8px;
        }

        .parsed-sample-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }

        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-secondary);
          cursor: pointer;
          margin-top: 10px;
        }

        .job-credit-calc {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .credit-calc-balance {
          font-size: 11.5px;
          color: var(--text-muted);
        }

        @media (max-width: 1080px) {
          .distribution-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .distribution-col:nth-child(2) {
            border-right: none;
          }
          .bulk-grid-layout {
            grid-template-columns: 1fr;
          }
          .bulk-jobs-sidebar {
            max-height: 280px;
          }
        }
      `}</style>
    </div>
  );
};
