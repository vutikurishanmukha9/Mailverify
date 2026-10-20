import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { ApiKeyItem } from '../types';
import {
  Key,
  Copy,
  Check,
  Plus,
  Trash2,
  Play,
  FileCode,
  Terminal,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Modal } from '../components/common/Modal';

export const ApiPage: React.FC = () => {
  const { apiKeys, createApiKey, revokeApiKey, addToast } = useApp();

  // Create Key Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<'full' | 'verify_only' | 'read_only'>('verify_only');
  const [revealedKeySecret, setRevealedKeySecret] = useState<string | null>(null);

  // Revoke Key Confirmation
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyItem | null>(null);

  // Copy state
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Code snippets tab
  const [codeLanguage, setCodeLanguage] = useState<'curl' | 'node' | 'python' | 'go'>('curl');

  // Interactive playground state
  const [playgroundEmail, setPlaygroundEmail] = useState('alex.developer@stripe.com');
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundResponse, setPlaygroundResponse] = useState<string | null>(null);
  const [playgroundLatency, setPlaygroundLatency] = useState<number | null>(null);

  const handleGenerateKey = () => {
    if (!newKeyName.trim()) {
      addToast({
        type: 'error',
        title: 'Key Name Required',
        message: 'Please provide a descriptive identifier for this API key.'
      });
      return;
    }

    const { rawToken } = createApiKey(newKeyName, newKeyPermissions);
    setRevealedKeySecret(rawToken);
    setNewKeyName('');
  };

  const handleCopyKey = (keyString: string, id: string) => {
    navigator.clipboard.writeText(keyString);
    setCopiedKeyId(id);
    addToast({
      type: 'success',
      title: 'Copied to Clipboard',
      message: 'API key secret copied.'
    });
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleExecutePlayground = () => {
    setPlaygroundLoading(true);
    setTimeout(() => {
      const resp = {
        status: 200,
        data: {
          id: 'ver_api_91a02f',
          email: playgroundEmail,
          status: 'deliverable',
          score: 98,
          reason: 'Direct SMTP handshake successful. Mailbox active.',
          checks: {
            syntax_rfc5322: true,
            mx_records: true,
            mx_host: 'aspmx.l.google.com',
            smtp_handshake: '250 OK',
            is_disposable: false,
            is_free_mail: false,
            is_role_based: false,
            is_catch_all: false,
            spam_trap_score: 0
          },
          latency_ms: 48,
          timestamp: new Date().toISOString()
        }
      };
      setPlaygroundResponse(JSON.stringify(resp, null, 2));
      setPlaygroundLatency(48);
      setPlaygroundLoading(false);
    }, 450);
  };

  const getCodeSnippet = () => {
    if (codeLanguage === 'curl') {
      return `curl -X POST https://api.mailverify.io/v1/verify/single \\
  -H "Authorization: Bearer mv_live_YOUR_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "${playgroundEmail}"}'`;
    }
    if (codeLanguage === 'node') {
      return `import axios from 'axios';

const response = await axios.post(
  'https://api.mailverify.io/v1/verify/single',
  { email: '${playgroundEmail}' },
  {
    headers: {
      Authorization: 'Bearer mv_live_YOUR_SECRET_KEY',
      'Content-Type': 'application/json'
    }
  }
);

console.log(response.data);`;
    }
    if (codeLanguage === 'python') {
      return `import requests

url = "https://api.mailverify.io/v1/verify/single"
headers = {
    "Authorization": "Bearer mv_live_YOUR_SECRET_KEY",
    "Content-Type": "application/json"
}
payload = {"email": "${playgroundEmail}"}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;
    }
    return `package main

import (
    "bytes"
    "fmt"
    "net/http"
)

func main() {
    url := "https://api.mailverify.io/v1/verify/single"
    payload := []byte(\`{"email": "${playgroundEmail}"}\`)

    req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer mv_live_YOUR_SECRET_KEY")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()
    fmt.Println("Status:", resp.Status)
}`;
  };

  return (
    <div className="page-container">

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-header-title">Developer API & Webhooks</h1>
          <p className="page-header-description">
            Integrate high-speed email verification directly into your registration forms,
            backend workflows, or data ingestion pipelines with sub-100ms latency.
          </p>
        </div>
        <div className="page-header-actions">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setRevealedKeySecret(null);
              setIsCreateModalOpen(true);
            }}
            leftIcon={<Plus size={13} />}
          >
            Create API Key
          </Button>
        </div>
      </div>

      {/* API Keys Table */}
      <Card style={{ marginBottom: 24 }}>
        <CardHeader
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Key size={16} style={{ color: 'var(--accent-primary)' }} />
              <span>Active Secret API Keys</span>
            </div>
          }
          subtitle="Manage credentials used by your production servers and automated microservices."
        />
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Key Identifier</th>
                <th>Secret Token Prefix</th>
                <th>Permissions</th>
                <th>Rate Limit</th>
                <th>Created</th>
                <th>Last Active</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key) => {
                const isActive = key.status === 'active';
                return (
                  <tr key={key.id}>
                    <td className="primary-cell font-mono">{key.name}</td>
                    <td className="font-mono" style={{ color: 'var(--text-muted)' }}>
                      {key.keyPrefix}
                    </td>
                    <td>
                      <Badge variant="neutral">
                        {key.permissions === 'full'
                          ? 'Full Admin'
                          : key.permissions === 'verify_only'
                          ? 'Verification Only'
                          : 'Read Only'}
                      </Badge>
                    </td>
                    <td className="tabular-nums font-mono" style={{ fontSize: 12 }}>
                      {key.rateLimitPerSec} req/sec
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(key.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {key.lastUsedAt}
                    </td>
                    <td>
                      {isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="error">Revoked</Badge>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isActive && (
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyKey(key.keyPrefix, key.id)}
                            className="btn-icon"
                            title="Copy masked prefix"
                          >
                            {copiedKeyId === key.id ? <Check size={13} /> : <Copy size={13} />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRevokeTarget(key)}
                            className="btn-icon"
                            title="Revoke key"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Interactive API Request Playground */}
      <div className="api-playground-grid">
        {/* Left: Code Snippet & Interactive Tester */}
        <Card>
          <CardHeader
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Terminal size={16} style={{ color: 'var(--accent-primary)' }} />
                <span>Interactive Request Tester</span>
              </div>
            }
            action={
              <div className="tab-pill-nav">
                <button
                  className={`tab-pill-btn ${codeLanguage === 'curl' ? 'active' : ''}`}
                  onClick={() => setCodeLanguage('curl')}
                >
                  cURL
                </button>
                <button
                  className={`tab-pill-btn ${codeLanguage === 'node' ? 'active' : ''}`}
                  onClick={() => setCodeLanguage('node')}
                >
                  Node.js
                </button>
                <button
                  className={`tab-pill-btn ${codeLanguage === 'python' ? 'active' : ''}`}
                  onClick={() => setCodeLanguage('python')}
                >
                  Python
                </button>
                <button
                  className={`tab-pill-btn ${codeLanguage === 'go' ? 'active' : ''}`}
                  onClick={() => setCodeLanguage('go')}
                >
                  Go
                </button>
              </div>
            }
          />
          <CardBody>
            <div className="form-group">
              <label className="form-label">Test Email Address</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="email"
                  className="input input-mono"
                  value={playgroundEmail}
                  onChange={(e) => setPlaygroundEmail(e.target.value)}
                  placeholder="test@domain.com"
                />
                <Button
                  variant="primary"
                  onClick={handleExecutePlayground}
                  isLoading={playgroundLoading}
                  leftIcon={<Play size={13} />}
                >
                  Send
                </Button>
              </div>
            </div>

            <div className="code-display-block">
              <div className="code-block-header">
                <span className="font-mono text-muted" style={{ fontSize: 11 }}>
                  POST /v1/verify/single
                </span>
                <button
                  className="code-copy-btn"
                  onClick={() => handleCopyKey(getCodeSnippet(), 'snippet')}
                  title="Copy code snippet"
                >
                  {copiedKeyId === 'snippet' ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
              <pre className="code-pre font-mono">{getCodeSnippet()}</pre>
            </div>
          </CardBody>
        </Card>

        {/* Right: Simulated Real Response */}
        <Card>
          <CardHeader
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileCode size={16} style={{ color: 'var(--text-secondary)' }} />
                <span>JSON Response Payload</span>
              </div>
            }
            action={
              playgroundLatency !== null ? (
                <span className="font-mono text-success tabular-nums" style={{ fontSize: 12 }}>
                  200 OK · {playgroundLatency}ms
                </span>
              ) : undefined
            }
          />
          <CardBody>
            <div className="response-box">
              {playgroundResponse ? (
                <pre className="response-pre font-mono">{playgroundResponse}</pre>
              ) : (
                <div className="response-empty">
                  <Play size={20} style={{ color: 'var(--text-tertiary)', marginBottom: 8 }} />
                  <span>Click &ldquo;Send&rdquo; on the left to fire a live test verification.</span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Endpoints & Status Codes Reference */}
      <Card style={{ marginTop: 24 }}>
        <CardHeader
          title="HTTP Endpoints Reference"
          subtitle="All API endpoints require Authorization: Bearer <API_KEY> header and TLS 1.3 encryption."
        />
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Endpoint Path</th>
                <th>Description</th>
                <th>Rate Limit</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <Badge variant="accent">POST</Badge>
                </td>
                <td className="primary-cell font-mono">/v1/verify/single</td>
                <td>Perform synchronous RFC, MX, and SMTP mailbox verification</td>
                <td className="font-mono tabular-nums">50 req/sec</td>
                <td className="font-mono tabular-nums">1 credit</td>
              </tr>
              <tr>
                <td>
                  <Badge variant="accent">POST</Badge>
                </td>
                <td className="primary-cell font-mono">/v1/verify/bulk</td>
                <td>Initiate background verification job for array of up to 50,000 emails</td>
                <td className="font-mono tabular-nums">5 req/min</td>
                <td className="font-mono tabular-nums">1 credit / email</td>
              </tr>
              <tr>
                <td>
                  <Badge variant="neutral">GET</Badge>
                </td>
                <td className="primary-cell font-mono">/v1/jobs/{'{job_id}'}</td>
                <td>Fetch real-time progress or download completed verification records</td>
                <td className="font-mono tabular-nums">100 req/sec</td>
                <td>Free</td>
              </tr>
              <tr>
                <td>
                  <Badge variant="neutral">GET</Badge>
                </td>
                <td className="primary-cell font-mono">/v1/account/credits</td>
                <td>Retrieve remaining credit balance and current subscription usage</td>
                <td className="font-mono tabular-nums">100 req/sec</td>
                <td>Free</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Key Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setRevealedKeySecret(null);
        }}
        title={revealedKeySecret ? 'API Key Generated' : 'Generate New API Key'}
        maxWidth={500}
        footer={
          revealedKeySecret ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsCreateModalOpen(false);
                setRevealedKeySecret(null);
              }}
            >
              Done
            </Button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleGenerateKey}>
                Generate Key
              </Button>
            </div>
          )
        }
      >
        {revealedKeySecret ? (
          <div>
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: 'var(--status-warning-subtle)',
                border: '1px solid var(--status-warning-border)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 16
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--status-warning-text)',
                  fontWeight: 600,
                  fontSize: 12.5,
                  marginBottom: 4
                }}
              >
                <AlertTriangle size={15} />
                <span>Save this secret token immediately</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                For security reasons, this key will never be displayed in full again. If lost, you
                must revoke it and create a replacement.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Secret API Key</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  readOnly
                  className="input input-mono"
                  value={revealedKeySecret}
                />
                <Button
                  variant="outline"
                  onClick={() => handleCopyKey(revealedKeySecret, 'revealed')}
                  leftIcon={copiedKeyId === 'revealed' ? <Check size={14} /> : <Copy size={14} />}
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="form-group">
              <label className="form-label">Key Name / Description</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Production Next.js Signup Microservice"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Access Permissions</label>
              <select
                className="select"
                value={newKeyPermissions}
                onChange={(e) => setNewKeyPermissions(e.target.value as any)}
              >
                <option value="verify_only">
                  Verification Only (Single & Bulk Verify - Recommended)
                </option>
                <option value="full">Full Admin (Manage lists, keys, billing)</option>
                <option value="read_only">Read Only (Inspect job statuses)</option>
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* Revoke Key Confirmation Modal */}
      {revokeTarget && (
        <Modal
          isOpen={true}
          onClose={() => setRevokeTarget(null)}
          title={`Revoke API Key "${revokeTarget.name}"?`}
          maxWidth={440}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
              <Button variant="ghost" size="sm" onClick={() => setRevokeTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  revokeApiKey(revokeTarget.id);
                  setRevokeTarget(null);
                }}
              >
                Revoke Key Now
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <AlertTriangle size={24} style={{ color: 'var(--status-error)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 }}>
                This action is permanent and immediate.
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Any application or server using <code>{revokeTarget.keyPrefix}</code> will
                immediately receive HTTP 401 Unauthorized responses.
              </p>
            </div>
          </div>
        </Modal>
      )}

      <style>{`
        .api-playground-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
        }

        .code-display-block {
          background-color: #0E0F12;
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-sm);
          overflow: hidden;
          margin-top: 10px;
        }

        .code-block-header {
          padding: 6px 10px;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #121316;
        }

        .code-copy-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          padding: 2px;
        }
        .code-copy-btn:hover {
          color: var(--text-primary);
        }

        .code-pre {
          padding: 12px;
          color: var(--text-secondary);
          font-size: 12px;
          line-height: 1.5;
          overflow-x: auto;
          max-height: 250px;
        }

        .response-box {
          min-height: 290px;
          display: flex;
          flex-direction: column;
        }

        .response-pre {
          flex: 1;
          padding: 12px;
          background-color: #0E0F12;
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-sm);
          color: var(--status-success-text);
          font-size: 12px;
          line-height: 1.5;
          overflow-x: auto;
          max-height: 290px;
        }

        .response-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px dashed var(--border-standard);
          border-radius: var(--radius-sm);
          padding: 24px;
          color: var(--text-muted);
          font-size: 12.5px;
          text-align: center;
        }

        @media (max-width: 900px) {
          .api-playground-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
