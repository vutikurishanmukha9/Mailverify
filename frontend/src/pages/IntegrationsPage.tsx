import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Integration } from '../types';
import {
  Zap,
  CheckCircle2,
  Clock,
  Settings2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card, CardBody } from '../components/common/Card';
import { Modal } from '../components/common/Modal';

export const IntegrationsPage: React.FC = () => {
  const {
    integrations,
    updateIntegration,
    disconnectIntegration,
    addToast
  } = useApp();

  const [filterTab, setFilterTab] = useState<'all' | 'connected' | 'available' | 'upcoming'>('all');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [disconnectCandidate, setDisconnectCandidate] = useState<Integration | null>(null);

  // Modal configuration states
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [syncInterval, setSyncInterval] = useState<'hourly' | 'daily' | 'manual'>('hourly');
  const [autoSync, setAutoSync] = useState(true);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const openConfigModal = (int: Integration) => {
    setSelectedIntegration(int);
    setApiKeyInput(int.apiKeyMasked || '');
    setSyncInterval(int.syncInterval || 'hourly');
    setAutoSync(int.autoSyncEnabled !== undefined ? int.autoSyncEnabled : true);
  };

  const handleSaveConfig = () => {
    if (!selectedIntegration) return;

    if (!apiKeyInput.trim()) {
      addToast({
        type: 'error',
        title: 'API Key Required',
        message: 'Please provide a valid platform API key or workspace token.'
      });
      return;
    }

    const masked = apiKeyInput.startsWith('••')
      ? apiKeyInput
      : `${apiKeyInput.slice(0, 4)}_live_••••••••${apiKeyInput.slice(-4)}`;

    updateIntegration(selectedIntegration.id, {
      status: 'connected',
      apiKeyMasked: masked,
      autoSyncEnabled: autoSync,
      syncInterval: syncInterval,
      lastSyncedAt: 'Just now'
    });

    setSelectedIntegration(null);
  };

  const handleTestConnection = () => {
    setIsTestingConnection(true);
    setTimeout(() => {
      setIsTestingConnection(false);
      addToast({
        type: 'success',
        title: 'Handshake Successful',
        message: `Connected to ${selectedIntegration?.name} API gateway. Token valid.`
      });
    }, 500);
  };

  const handleConfirmDisconnect = () => {
    if (!disconnectCandidate) return;
    disconnectIntegration(disconnectCandidate.id);
    setDisconnectCandidate(null);
  };

  const filteredIntegrations = integrations.filter((int) => {
    if (filterTab === 'connected') return int.status === 'connected';
    if (filterTab === 'available') return int.status === 'disconnected';
    if (filterTab === 'upcoming') return int.status === 'coming_soon';
    return true;
  });

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-header-title">Platform Integrations</h1>
          <p className="page-header-description">
            Directly connect your cold email sequencer, CRM, or spreadsheets to scrub email lists
            automatically before outreach campaigns dispatch.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="tab-pill-nav" style={{ marginBottom: 20 }}>
        <button
          className={`tab-pill-btn ${filterTab === 'all' ? 'active' : ''}`}
          onClick={() => setFilterTab('all')}
        >
          All Platforms ({integrations.length})
        </button>
        <button
          className={`tab-pill-btn ${filterTab === 'connected' ? 'active' : ''}`}
          onClick={() => setFilterTab('connected')}
        >
          Connected ({integrations.filter((i) => i.status === 'connected').length})
        </button>
        <button
          className={`tab-pill-btn ${filterTab === 'available' ? 'active' : ''}`}
          onClick={() => setFilterTab('available')}
        >
          Available ({integrations.filter((i) => i.status === 'disconnected').length})
        </button>
        <button
          className={`tab-pill-btn ${filterTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilterTab('upcoming')}
        >
          Roadmapped ({integrations.filter((i) => i.status === 'coming_soon').length})
        </button>
      </div>

      {/* Integrations Grid */}
      <div className="integrations-grid">
        {filteredIntegrations.map((int) => {
          const isConnected = int.status === 'connected';
          const isComingSoon = int.status === 'coming_soon';

          return (
            <Card key={int.id} className="integration-card">
              <CardBody>
                <div className="integration-top-row">
                  <div className="integration-info">
                    <div className="integration-avatar">
                      {int.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="integration-name">{int.name}</h3>
                      <span className="integration-category">{int.category}</span>
                    </div>
                  </div>

                  <div>
                    {isConnected && (
                      <Badge variant="success">
                        <CheckCircle2 size={11} /> Connected
                      </Badge>
                    )}
                    {int.status === 'disconnected' && (
                      <Badge variant="neutral">Available</Badge>
                    )}
                    {isComingSoon && (
                      <Badge variant="accent">
                        <Clock size={11} /> In Development
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="integration-description">{int.description}</p>

                {/* Connection Details / Telemetry */}
                {isConnected && (
                  <div className="integration-telemetry-box font-mono">
                    <div className="telemetry-item">
                      <span className="telemetry-label">SYNC CADENCE</span>
                      <span className="telemetry-value">
                        {int.syncInterval ? int.syncInterval.toUpperCase() : 'HOURLY'}
                      </span>
                    </div>
                    <div className="telemetry-item">
                      <span className="telemetry-label">LEADS CLEANED</span>
                      <span className="telemetry-value text-success tabular-nums">
                        {int.leadsCleaned?.toLocaleString()}
                      </span>
                    </div>
                    <div className="telemetry-item">
                      <span className="telemetry-label">LAST RUN</span>
                      <span className="telemetry-value">{int.lastSyncedAt}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="integration-action-row">
                  {isConnected && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openConfigModal(int)}
                        leftIcon={<Settings2 size={12} />}
                      >
                        Configure
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDisconnectCandidate(int)}
                        className="text-muted"
                      >
                        Disconnect
                      </Button>
                    </>
                  )}

                  {int.status === 'disconnected' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openConfigModal(int)}
                      leftIcon={<Zap size={13} />}
                    >
                      Connect {int.name}
                    </Button>
                  )}

                  {isComingSoon && (
                    <div className="coming-soon-info">
                      <Clock size={13} className="text-muted" />
                      <span>Roadmapped for Q4 2026</span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Configuration Modal */}
      {selectedIntegration && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedIntegration(null)}
          title={`Configure ${selectedIntegration.name} Integration`}
          maxWidth={500}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                isLoading={isTestingConnection}
                leftIcon={<RefreshCw size={12} />}
              >
                Test Connection
              </Button>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="ghost" size="sm" onClick={() => setSelectedIntegration(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveConfig}>
                  Save & Activate
                </Button>
              </div>
            </div>
          }
        >
          <div className="config-form">
            <div className="form-group">
              <label className="form-label">API Key or Workspace Access Token</label>
              <input
                type="password"
                className="input input-mono"
                placeholder="e.g. ri_live_9a8b7c6d5e4f3a2b1c"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
              <span className="form-hint" style={{ marginTop: 4 }}>
                Generate from your {selectedIntegration.name} settings under Developer / API Keys.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Automatic Verification Frequency</label>
              <select
                className="select"
                value={syncInterval}
                onChange={(e) => setSyncInterval(e.target.value as any)}
              >
                <option value="hourly">Hourly (Recommended for high volume)</option>
                <option value="daily">Once Daily at 00:00 UTC</option>
                <option value="manual">Manual Trigger Only</option>
              </select>
            </div>

            <div className="form-group">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                />
                <span>Automatically tag and pause risky leads in {selectedIntegration.name}</span>
              </label>
            </div>

            {selectedIntegration.webhookUrl && (
              <div className="form-group">
                <label className="form-label">Incoming Webhook Callback URL</label>
                <input
                  type="text"
                  readOnly
                  className="input input-mono"
                  value={selectedIntegration.webhookUrl}
                />
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Disconnect Confirmation Modal */}
      {disconnectCandidate && (
        <Modal
          isOpen={true}
          onClose={() => setDisconnectCandidate(null)}
          title={`Disconnect ${disconnectCandidate.name}?`}
          maxWidth={440}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
              <Button variant="ghost" size="sm" onClick={() => setDisconnectCandidate(null)}>
                Keep Connected
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmDisconnect}>
                Confirm Disconnect
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <AlertTriangle size={24} style={{ color: 'var(--status-error)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 }}>
                Are you sure you want to disconnect <strong>{disconnectCandidate.name}</strong>?
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Scheduled synchronization will be halted and stored API credentials will be
                immediately wiped. No existing leads in your sequencer will be altered.
              </p>
            </div>
          </div>
        </Modal>
      )}

      <style>{`
        .integrations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--space-4);
        }

        .integration-card {
          display: flex;
          flex-direction: column;
        }

        .integration-top-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: var(--space-3);
        }

        .integration-info {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .integration-avatar {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
          background-color: #1A1C20;
          border: 1px solid var(--border-strong);
          color: var(--accent-text);
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .integration-name {
          font-size: 14.5px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .integration-category {
          font-size: 11px;
          color: var(--text-muted);
        }

        .integration-description {
          font-size: 12.5px;
          color: var(--text-secondary);
          margin-bottom: var(--space-4);
          line-height: 1.4;
          min-height: 35px;
        }

        .integration-telemetry-box {
          background-color: #111215;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 8px 10px;
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--space-4);
        }

        .telemetry-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .telemetry-label {
          font-size: 9.5px;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .telemetry-value {
          font-size: 11.5px;
          color: var(--text-primary);
          font-weight: 600;
        }

        .integration-action-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-top: auto;
          padding-top: var(--space-2);
        }

        .coming-soon-info {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-muted);
        }

        .config-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        @media (max-width: 768px) {
          .integrations-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
