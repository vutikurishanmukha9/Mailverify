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
  Eye,
  X
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { DeliverabilityBadge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
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
    a.download = 'mailverify_sample_leads.csv';
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
        title: 'File Parsed',
        message: `Extracted ${finalEmails.length.toLocaleString()} unique contacts from ${file.name}.`
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
          message: 'Please provide a valid shareable spreadsheet link.'
        });
        return;
      }
      emailList = [
        'jordan.lead@enterprise.com',
        'marcus.growth@scaleup.co',
        'priya.eng@stripe.com',
        'dev.ops@catchall-company.io',
        'invalid.alias@nowhere-domain.xyz'
      ];
    }

    if (emailList.length === 0) {
      addToast({
        type: 'error',
        title: 'No Valid Emails Found',
        message: 'Please provide at least one valid recipient address.'
      });
      return;
    }

    if (subscription.creditsRemaining < emailList.length) {
      addToast({
        type: 'error',
        title: 'Insufficient Credits',
        message: `You need ${emailList.length} credits. You currently have ${subscription.creditsRemaining}.`
      });
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const newJob = createBulkJob(
        jobName || (uploadedFileName ? uploadedFileName.replace(/\.[^/.]+$/, '') : `List_${Date.now()}`),
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
      title: 'List Exported',
      message: `Downloaded ${recordsToExport.length.toLocaleString()} records (${filter}).`
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

  // Deliverability percentages
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
      {/* Hidden button for external trigger */}
      <button
        id="trigger-bulk-upload-btn"
        style={{ display: 'none' }}
        onClick={() => setIsModalOpen(true)}
      />

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-header-title">Bulk Email Verification</h1>
          <p className="page-header-description">
            Clean and verify CSV lead lists, connect Google Sheets, or paste contacts to scrub
            invalid mailboxes, disposable addresses, and protect domain deliverability.
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

      {/* Sleek Deliverability Metrics Overview Strip */}
      {currentJob && (
        <div className="overview-strip-container">
          <div className="overview-strip-header">
            <div className="overview-title-group">
              <span className="overview-file-name font-mono">{currentJob.name}</span>
              <span className="overview-meta-tag font-mono">
                {currentJob.sourceType.toUpperCase()}
              </span>
              <span className="overview-status-pill font-mono">
                <CheckCircle2 size={11} /> Completed
              </span>
            </div>
            <div className="overview-actions-group">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportJob(currentJob, 'deliverable')}
                leftIcon={<Download size={12} />}
              >
                Export Clean ({currentJob.deliverableCount.toLocaleString()})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExportJob(currentJob, 'all')}
              >
                Export All ({currentJob.totalCount.toLocaleString()})
              </Button>
            </div>
          </div>

          {/* 4 Partitioned Metric Columns with vertical hairline dividers */}
          <div className="overview-metrics-grid">
            <div className="overview-metric-col">
              <div className="metric-label-row">
                <span className="metric-dot dot-neutral" />
                <span className="metric-label">TOTAL ANALYZED</span>
              </div>
              <div className="metric-value font-mono tabular-nums">
                {currentJob.totalCount.toLocaleString()}
              </div>
              <div className="metric-subtext">
                100% processed · 0 syntax errors
              </div>
            </div>

            <div className="overview-metric-col">
              <div className="metric-label-row">
                <span className="metric-dot dot-success" />
                <span className="metric-label">DELIVERABLE</span>
              </div>
              <div className="metric-value font-mono tabular-nums text-success">
                {currentJob.deliverableCount.toLocaleString()}
              </div>
              <div className="metric-subtext">
                {deliverablePct}% · Safe for primary domain
              </div>
            </div>

            <div className="overview-metric-col">
              <div className="metric-label-row">
                <span className="metric-dot dot-warning" />
                <span className="metric-label">RISKY / CATCH-ALL</span>
              </div>
              <div className="metric-value font-mono tabular-nums text-warning">
                {currentJob.riskyCount.toLocaleString()}
              </div>
              <div className="metric-subtext">
                {riskyPct}% · Catch-all / low engagement
              </div>
            </div>

            <div className="overview-metric-col">
              <div className="metric-label-row">
                <span className="metric-dot dot-error" />
                <span className="metric-label">UNDELIVERABLE</span>
              </div>
              <div className="metric-value font-mono tabular-nums text-error">
                {currentJob.undeliverableCount.toLocaleString()}
              </div>
              <div className="metric-subtext">
                {undeliverablePct}% · Bounces prevented
              </div>
            </div>
          </div>

          {/* Ultra-thin deliverability distribution track */}
          <div className="overview-progress-track">
            <div
              className="track-segment track-deliverable"
              style={{ width: `${deliverablePct}%` }}
              title={`Deliverable: ${currentJob.deliverableCount.toLocaleString()} (${deliverablePct}%)`}
            />
            <div
              className="track-segment track-risky"
              style={{ width: `${riskyPct}%` }}
              title={`Risky: ${currentJob.riskyCount.toLocaleString()} (${riskyPct}%)`}
            />
            <div
              className="track-segment track-undeliverable"
              style={{ width: `${undeliverablePct}%` }}
              title={`Undeliverable: ${currentJob.undeliverableCount.toLocaleString()} (${undeliverablePct}%)`}
            />
          </div>
        </div>
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
            <button
              onClick={() => setIsModalOpen(true)}
              className="jobs-add-btn"
              title="Upload new verification list"
              aria-label="Upload new list"
            >
              <Plus size={13} />
            </button>
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
                    <span className="job-pill-done font-mono">100%</span>
                  </div>

                  <div className="job-card-meta tabular-nums font-mono">
                    <span>{job.totalCount.toLocaleString()} contacts</span>
                    <span className="meta-deliverable">{deliverableRatio}% clean</span>
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
                        <Download size={11} />
                      </button>
                      <button
                        className="job-action-btn delete-btn"
                        onClick={() => {
                          if (confirm(`Remove verification job "${job.name}"?`)) {
                            deleteBulkJob(job.id);
                            if (selectedJobId === job.id) {
                              const remaining = bulkJobs.filter((j) => j.id !== job.id);
                              setSelectedJobId(remaining.length > 0 ? remaining[0].id : null);
                            }
                          }
                        }}
                        title="Delete job"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Verification Records Table */}
        <div className="bulk-records-container">
          {currentJob ? (
            <Card className="records-card">
              {/* Table Toolbar */}
              <div className="records-toolbar">
                <div className="records-search-wrapper">
                  <Search size={14} className="records-search-icon" />
                  <input
                    type="text"
                    className="records-search-input"
                    placeholder="Search email address or mail host..."
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
                      aria-label="Clear search"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div className="records-filter-pills">
                  <button
                    className={`filter-pill ${recordsStatusFilter === 'all' ? 'active' : ''}`}
                    onClick={() => {
                      setRecordsStatusFilter('all');
                      setCurrentPage(1);
                    }}
                  >
                    All ({currentJob.totalCount.toLocaleString()})
                  </button>
                  <button
                    className={`filter-pill ${recordsStatusFilter === 'deliverable' ? 'active' : ''}`}
                    onClick={() => {
                      setRecordsStatusFilter('deliverable');
                      setCurrentPage(1);
                    }}
                  >
                    <span className="filter-dot dot-success" />
                    Deliverable ({currentJob.deliverableCount.toLocaleString()})
                  </button>
                  <button
                    className={`filter-pill ${recordsStatusFilter === 'risky' ? 'active' : ''}`}
                    onClick={() => {
                      setRecordsStatusFilter('risky');
                      setCurrentPage(1);
                    }}
                  >
                    <span className="filter-dot dot-warning" />
                    Risky ({currentJob.riskyCount.toLocaleString()})
                  </button>
                  <button
                    className={`filter-pill ${recordsStatusFilter === 'undeliverable' ? 'active' : ''}`}
                    onClick={() => {
                      setRecordsStatusFilter('undeliverable');
                      setCurrentPage(1);
                    }}
                  >
                    <span className="filter-dot dot-error" />
                    Undeliverable ({currentJob.undeliverableCount.toLocaleString()})
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '34%' }}>Recipient Address</th>
                      <th style={{ width: '18%' }}>Deliverability</th>
                      <th style={{ width: '12%' }}>Score</th>
                      <th style={{ width: '24%' }}>MX Host</th>
                      <th style={{ width: '12%', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.length > 0 ? (
                      paginatedRecords.map((record) => {
                        const emailParts = record.email.split('@');
                        const local = emailParts[0];
                        const domain = emailParts[1] ? `@${emailParts[1]}` : '';

                        return (
                          <tr
                            key={record.id}
                            className="record-row"
                            onClick={() => setInspectedRecord(record)}
                          >
                            <td className="primary-cell">
                              <div className="record-email-cell">
                                <span className="email-local">{local}</span>
                                <span className="email-domain">{domain}</span>
                                <button
                                  className="email-copy-icon-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyEmail(record.email);
                                  }}
                                  title="Copy address"
                                >
                                  {copiedEmail === record.email ? (
                                    <Check size={11} className="text-success" />
                                  ) : (
                                    <Copy size={11} />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td>
                              <DeliverabilityBadge status={record.status} />
                            </td>
                            <td>
                              <div className="record-score-cell tabular-nums font-mono">
                                <span>{record.score}</span>
                                <span className="score-max">/100</span>
                              </div>
                            </td>
                            <td>
                              <span className="record-mx-host font-mono" title={record.mxHost}>
                                {record.mxHost}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="inspect-row-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInspectedRecord(record);
                                }}
                              >
                                <Eye size={12} />
                                <span>Inspect</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="empty-table-cell">
                          <p>No records matched your search criteria.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="table-pagination">
                <span className="pagination-info">
                  Showing {Math.min((currentPage - 1) * pageSize + 1, filteredRecords.length)}–
                  {Math.min(currentPage * pageSize, filteredRecords.length)} of{' '}
                  {filteredRecords.length.toLocaleString()} records
                </span>
                <div className="pagination-controls">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="pagination-current font-mono">
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
            </Card>
          ) : (
            <Card className="records-card empty-state-card">
              <div className="empty-content">
                <Layers size={28} className="empty-icon" />
                <h3>No Verification Jobs Found</h3>
                <p>Upload a CSV file or paste email contacts to start your first batch scrub.</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  leftIcon={<Plus size={13} />}
                >
                  Create New Job
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Deep Telemetry Record Inspector Modal */}
      {inspectedRecord && (
        <Modal
          isOpen={true}
          onClose={() => setInspectedRecord(null)}
          title="Telemetry Diagnostics"
        >
          <div className="telemetry-inspector">
            <div className="telemetry-header">
              <div className="telemetry-email font-mono">{inspectedRecord.email}</div>
              <DeliverabilityBadge
                status={inspectedRecord.status}
                score={inspectedRecord.score}
              />
            </div>

            <div className="telemetry-reason-box">
              <div className="reason-label">Verdict:</div>
              <div className="reason-val">{inspectedRecord.reason}</div>
            </div>

            <div className="telemetry-grid">
              <div className="telemetry-stat-tile">
                <span className="tile-title">SMTP Mailbox</span>
                <span className={`tile-val ${inspectedRecord.status === 'deliverable' ? 'text-success' : inspectedRecord.status === 'risky' ? 'text-warning' : 'text-error'}`}>
                  {inspectedRecord.status === 'deliverable' ? '250 Handshake OK' : inspectedRecord.status === 'risky' ? 'Catch-all / Greylisted' : '550 User Unknown'}
                </span>
              </div>
              <div className="telemetry-stat-tile">
                <span className="tile-title">DNS MX Host</span>
                <span className="tile-val font-mono">{inspectedRecord.mxHost}</span>
              </div>
              <div className="telemetry-stat-tile">
                <span className="tile-title">Disposable Provider</span>
                <span className={`tile-val ${inspectedRecord.isDisposable ? 'text-error' : 'text-success'}`}>
                  {inspectedRecord.isDisposable ? 'High-Risk Disposable' : 'Verified Clean'}
                </span>
              </div>
              <div className="telemetry-stat-tile">
                <span className="tile-title">Role-based Account</span>
                <span className={`tile-val ${inspectedRecord.isRoleBased ? 'text-warning' : 'text-secondary'}`}>
                  {inspectedRecord.isRoleBased ? 'Role / Department (support@)' : 'Individual Employee'}
                </span>
              </div>
            </div>

            <div className="telemetry-actions">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyEmail(inspectedRecord.email)}
                leftIcon={<Copy size={12} />}
              >
                Copy Address
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setInspectedRecord(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* New Verification Job Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Verification Job"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isProcessing}
              onClick={handleStartVerification}
              leftIcon={<Play size={12} />}
            >
              Start Verification
            </Button>
          </>
        }
      >
        <div className="new-job-modal-body">
          {/* Method Selector Tabs */}
          <div className="tab-pill-nav" style={{ marginBottom: 16 }}>
            <button
              className={`tab-pill-btn ${creationTab === 'csv' ? 'active' : ''}`}
              onClick={() => setCreationTab('csv')}
            >
              CSV File Upload
            </button>
            <button
              className={`tab-pill-btn ${creationTab === 'manual' ? 'active' : ''}`}
              onClick={() => setCreationTab('manual')}
            >
              Paste Email List
            </button>
            <button
              className={`tab-pill-btn ${creationTab === 'sheets' ? 'active' : ''}`}
              onClick={() => setCreationTab('sheets')}
            >
              Google Sheets
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Job Reference Label</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Q4_Outreach_US_Tech_Leads"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
            />
          </div>

          {/* Tab 1: CSV Upload */}
          {creationTab === 'csv' && (
            <div className="tab-content-csv">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleCsvFile(e.target.files[0]);
                  }
                }}
              />

              <div
                className={`dropzone ${uploadedFileName ? 'has-file' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleCsvFile(e.dataTransfer.files[0]);
                  }
                }}
              >
                <UploadCloud size={24} className="dropzone-icon" />
                <div className="dropzone-text">
                  {uploadedFileName ? (
                    <div>
                      <strong className="dropzone-file-name">{uploadedFileName}</strong>
                      <p>{parsedEmails.length.toLocaleString()} valid contacts extracted</p>
                    </div>
                  ) : (
                    <div>
                      <strong>Click to upload or drag & drop CSV file</strong>
                      <p>Supports .csv and .txt with UTF-8 encoding</p>
                    </div>
                  )}
                </div>
              </div>

              {sampleRows.length > 0 && (
                <div className="sample-preview">
                  <div className="sample-title">Data Schema Preview:</div>
                  <div className="sample-rows">
                    {sampleRows.map((s, idx) => (
                      <div key={idx} className="sample-item font-mono">
                        <span className="sample-email">{s.email}</span>
                        <span className="sample-domain font-sans">{s.domain}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Manual Paste */}
          {creationTab === 'manual' && (
            <div className="tab-content-manual">
              <div className="form-group">
                <label className="form-label">Paste Email Addresses</label>
                <textarea
                  className="input font-mono"
                  rows={6}
                  placeholder="alex.vance@stripe.com&#10;sarah.connor@acme.corp&#10;elena.rostova@datadog.com"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  style={{ resize: 'vertical', fontSize: 12 }}
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
                  Ensure sheet link sharing is set to &ldquo;Anyone with the link can view&rdquo;.
                </span>
              </div>
            </div>
          )}

          {/* Options */}
          <div className="new-job-options">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={isDedupeEnabled}
                onChange={(e) => setIsDedupeEnabled(e.target.checked)}
              />
              <span>Deduplicate identical email addresses</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={isNormalizeEnabled}
                onChange={(e) => setIsNormalizeEnabled(e.target.checked)}
              />
              <span>Normalize domains and lowercase sanitize</span>
            </label>
          </div>
        </div>
      </Modal>

      <style>{`
        /* Deliverability Metrics Overview Strip */
        .overview-strip-container {
          background-color: var(--bg-panel);
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-4);
          overflow: hidden;
        }

        .overview-strip-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          border-bottom: 1px solid var(--border-subtle);
          background-color: #0E0F12;
          flex-wrap: wrap;
          gap: 10px;
        }

        .overview-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .overview-file-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .overview-meta-tag {
          font-size: 10.5px;
          color: var(--text-muted);
          background-color: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xs);
          padding: 1px 5px;
        }

        .overview-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          color: var(--status-success-text);
          background-color: var(--status-success-subtle);
          border: 1px solid var(--status-success-border);
          border-radius: var(--radius-full);
          padding: 1px 7px;
          font-weight: 500;
        }

        .overview-actions-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* 4-Metric Grid */
        .overview-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background-color: var(--bg-panel);
        }

        .overview-metric-col {
          padding: 12px 18px;
          border-right: 1px solid var(--border-subtle);
        }
        .overview-metric-col:last-child {
          border-right: none;
        }

        .metric-label-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 3px;
        }

        .metric-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }
        .dot-neutral { background-color: var(--text-muted); }
        .dot-success { background-color: var(--status-success); }
        .dot-warning { background-color: var(--status-warning); }
        .dot-error { background-color: var(--status-error); }

        .metric-label {
          font-size: 10.5px;
          font-weight: 500;
          color: var(--text-muted);
          letter-spacing: 0.04em;
        }

        .metric-value {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .metric-subtext {
          font-size: 11.5px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        /* Thin deliverability track */
        .overview-progress-track {
          display: flex;
          height: 3px;
          background-color: rgba(255, 255, 255, 0.04);
        }

        .track-segment {
          height: 100%;
          transition: width 0.25s ease;
        }
        .track-deliverable { background-color: var(--status-success); }
        .track-risky { background-color: var(--status-warning); }
        .track-undeliverable { background-color: var(--status-error); }

        /* Master-Detail Layout */
        .bulk-grid-layout {
          display: grid;
          grid-template-columns: 270px minmax(0, 1fr);
          gap: var(--space-4);
          align-items: start;
        }

        /* Left Column: Verification Jobs */
        .bulk-jobs-sidebar {
          background-color: var(--bg-panel);
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .jobs-sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-bottom: 1px solid var(--border-subtle);
          background-color: #0E0F12;
        }

        .jobs-header-title-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .jobs-sidebar-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .jobs-sidebar-count {
          font-size: 10.5px;
          color: var(--text-muted);
          background-color: var(--bg-input);
          border: 1px solid var(--border-subtle);
          padding: 1px 5px;
          border-radius: var(--radius-xs);
        }

        .jobs-add-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 4px;
          background: transparent;
          border: 1px solid var(--border-standard);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .jobs-add-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-strong);
          background-color: var(--bg-hover);
        }

        .jobs-list {
          display: flex;
          flex-direction: column;
          max-height: 600px;
          overflow-y: auto;
        }

        .job-card {
          padding: 10px 12px;
          border-bottom: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: background-color 0.12s ease;
          background-color: transparent;
        }

        .job-card:last-child {
          border-bottom: none;
        }

        .job-card:hover {
          background-color: var(--bg-hover);
        }

        .job-card.selected {
          background-color: var(--bg-panel-elevated);
        }

        .job-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .job-card-ident {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          flex: 1;
        }

        .job-file-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .job-card-name {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .job-pill-done {
          font-size: 10px;
          color: var(--text-muted);
          flex-shrink: 0;
          margin-left: 6px;
        }

        .job-card-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }

        .meta-deliverable {
          color: var(--status-success-text);
        }

        .job-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10.5px;
          color: var(--text-tertiary);
        }

        .job-card-actions {
          display: flex;
          gap: 4px;
        }

        .job-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 3px;
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .job-action-btn:hover {
          color: var(--text-primary);
          background-color: var(--bg-input);
          border-color: var(--border-standard);
        }
        .job-action-btn.delete-btn:hover {
          color: var(--status-error-text);
        }

        /* Right Column: Detailed Records */
        .bulk-records-container {
          min-width: 0;
        }

        .records-card {
          background-color: var(--bg-panel);
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .records-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border-subtle);
          background-color: #0E0F12;
          gap: 12px;
          flex-wrap: wrap;
        }

        .records-search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 220px;
          max-width: 360px;
        }

        .records-search-icon {
          position: absolute;
          left: 9px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .records-search-input {
          width: 100%;
          background-color: var(--bg-input);
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: 12px;
          padding: 5px 26px 5px 28px;
          outline: none;
          transition: border-color 0.12s ease;
        }
        .records-search-input:focus {
          border-color: var(--border-focus);
        }

        .search-clear-btn {
          position: absolute;
          right: 7px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
        }

        .records-filter-pills {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
        }

        .filter-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 8px;
          font-size: 11.5px;
          font-weight: 500;
          color: var(--text-muted);
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.12s ease;
        }

        .filter-pill:hover {
          color: var(--text-primary);
          background-color: var(--bg-hover);
        }

        .filter-pill.active {
          background-color: var(--bg-panel-elevated);
          border-color: var(--border-standard);
          color: var(--text-primary);
        }

        .filter-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }

        /* Record Row */
        .record-row {
          cursor: pointer;
        }

        .record-email-cell {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .email-local {
          font-weight: 600;
          color: var(--text-primary);
        }

        .email-domain {
          color: var(--text-muted);
        }

        .email-copy-icon-btn {
          opacity: 0;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 2px;
          display: inline-flex;
          align-items: center;
          transition: opacity 0.12s ease;
        }
        .record-row:hover .email-copy-icon-btn {
          opacity: 1;
        }
        .email-copy-icon-btn:hover {
          color: var(--text-primary);
          background-color: var(--bg-input);
        }

        .record-score-cell {
          font-size: 12px;
          color: var(--text-primary);
        }

        .score-max {
          font-size: 10.5px;
          color: var(--text-tertiary);
        }

        .record-mx-host {
          font-size: 11.5px;
          color: var(--text-muted);
          max-width: 180px;
          display: inline-block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .inspect-row-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 7px;
          background: transparent;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xs);
          color: var(--text-muted);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .inspect-row-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-standard);
          background-color: var(--bg-hover);
        }

        .empty-table-cell {
          text-align: center;
          padding: 36px 14px;
          color: var(--text-muted);
        }

        .pagination-info {
          font-size: 11.5px;
          color: var(--text-muted);
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pagination-current {
          font-size: 11.5px;
          color: var(--text-secondary);
        }

        /* Telemetry Modal */
        .telemetry-inspector {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .telemetry-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .telemetry-email {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .telemetry-reason-box {
          background-color: var(--bg-input);
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          font-size: 12.5px;
        }

        .reason-label {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 2px;
        }

        .reason-val {
          color: var(--text-primary);
        }

        .telemetry-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .telemetry-stat-tile {
          background-color: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .tile-title {
          font-size: 10.5px;
          color: var(--text-muted);
        }

        .tile-val {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .telemetry-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 8px;
        }

        /* Modal Body */
        .new-job-modal-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .dropzone {
          border: 1px dashed var(--border-strong);
          border-radius: var(--radius-md);
          background-color: var(--bg-input);
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.15s ease, background-color 0.15s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .dropzone:hover {
          border-color: var(--accent-primary);
          background-color: var(--bg-hover);
        }
        .dropzone.has-file {
          border-style: solid;
          border-color: var(--accent-border);
          background-color: var(--accent-subtle);
        }

        .dropzone-icon {
          color: var(--text-muted);
        }

        .dropzone-text strong {
          display: block;
          color: var(--text-primary);
          font-size: 13px;
        }
        .dropzone-text p {
          color: var(--text-muted);
          font-size: 11.5px;
          margin-top: 2px;
        }

        .sample-preview {
          margin-top: 8px;
          background-color: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 8px 10px;
        }

        .sample-title {
          font-size: 10.5px;
          color: var(--text-muted);
          margin-bottom: 4px;
        }

        .sample-rows {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sample-item {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-secondary);
        }

        .sample-domain {
          color: var(--text-muted);
        }

        .new-job-options {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-top: 8px;
          border-top: 1px solid var(--border-subtle);
        }

        .empty-state-card {
          padding: 40px 20px;
          text-align: center;
        }

        .empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          max-width: 360px;
          margin: 0 auto;
        }

        .empty-icon {
          color: var(--text-muted);
          margin-bottom: 4px;
        }

        .text-success { color: var(--status-success-text); }
        .text-warning { color: var(--status-warning-text); }
        .text-error { color: var(--status-error-text); }

        @media (max-width: 900px) {
          .bulk-grid-layout {
            grid-template-columns: 1fr;
          }
          .overview-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .overview-metric-col:nth-child(2) {
            border-right: none;
          }
          .overview-metric-col {
            border-bottom: 1px solid var(--border-subtle);
          }
        }
      `}</style>
    </div>
  );
};
