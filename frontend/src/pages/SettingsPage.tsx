import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Shield,
  Bell,
  Coins,
  CreditCard,
  AlertTriangle,
  Download,
  Smartphone,
  Globe,
  Plus,
  Search
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card, CardBody, CardHeader, CardFooter } from '../components/common/Card';
import { Modal } from '../components/common/Modal';

export const SettingsPage: React.FC = () => {
  const {
    settingsTab,
    navigateTo,
    userProfile,
    updateUserProfile,
    securitySessions,
    revokeSession,
    userPreferences,
    updatePreferences,
    subscription,
    updateSubscriptionPlan,
    transactions,
    invoices,
    addToast
  } = useApp();

  // Profile form state
  const [profileName, setProfileName] = useState(userProfile.name);
  const [profileCompany, setProfileCompany] = useState(userProfile.company);
  const [profileRole, setProfileRole] = useState(userProfile.role);
  const [profileTimezone, setProfileTimezone] = useState(userProfile.timezone);

  // Security password state
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Preferences local state
  const [prefs, setPrefs] = useState({ ...userPreferences });

  // Plan change modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlanTier, setSelectedPlanTier] = useState<'starter' | 'growth' | 'enterprise'>(subscription.tier);

  // Cancel subscription modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Add payment method modal
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Transactions search and filter
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'usage' | 'purchase' | 'subscription_grant'>('all');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: profileName,
      company: profileCompany,
      role: profileRole,
      timezone: profileTimezone
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currPassword || !newPassword) {
      addToast({
        type: 'error',
        title: 'Fields Missing',
        message: 'Please complete all password fields.'
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast({
        type: 'error',
        title: 'Mismatch',
        message: 'New password and confirmation do not match.'
      });
      return;
    }
    setCurrPassword('');
    setNewPassword('');
    setConfirmPassword('');
    addToast({
      type: 'success',
      title: 'Password Updated',
      message: 'Your account password has been updated securely.'
    });
  };

  const handleSavePreferences = () => {
    updatePreferences(prefs);
  };

  const handleExportTransactions = () => {
    const headers = 'Transaction_ID,Date,Description,Type,Amount,Resulting_Balance\n';
    const rows = transactions
      .map(
        (t) =>
          `"${t.id}","${t.date}","${t.description.replace(/"/g, '""')}","${t.type}","${t.amount}","${
            t.resultingBalance
          }"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mailverify_credit_transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'Transactions Exported',
      message: `Exported ${transactions.length} credit ledger records.`
    });
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.id.toLowerCase().includes(txSearch.toLowerCase());
    const matchesType = txTypeFilter === 'all' || t.type === txTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-header-title">Account Settings</h1>
          <p className="page-header-description">
            Manage your personal profile, team access, security policies, notification rules,
            and billing subscription.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${settingsTab === 'profile' ? 'active' : ''}`}
          onClick={() => navigateTo('settings', 'profile')}
        >
          <User size={15} />
          <span>Profile</span>
        </button>
        <button
          className={`tab-btn ${settingsTab === 'security' ? 'active' : ''}`}
          onClick={() => navigateTo('settings', 'security')}
        >
          <Shield size={15} />
          <span>Security & 2FA</span>
        </button>
        <button
          className={`tab-btn ${settingsTab === 'preferences' ? 'active' : ''}`}
          onClick={() => navigateTo('settings', 'preferences')}
        >
          <Bell size={15} />
          <span>Preferences</span>
        </button>
        <button
          className={`tab-btn ${settingsTab === 'credits' ? 'active' : ''}`}
          onClick={() => navigateTo('settings', 'credits')}
        >
          <Coins size={15} />
          <span>Credit History</span>
        </button>
        <button
          className={`tab-btn ${settingsTab === 'billing' ? 'active' : ''}`}
          onClick={() => navigateTo('settings', 'billing')}
        >
          <CreditCard size={15} />
          <span>Billing & Plan</span>
        </button>
      </div>

      {/* Tab 1: Profile */}
      {settingsTab === 'profile' && (
        <div className="settings-content-wrapper">
          <Card>
            <CardHeader
              title="Personal Information"
              subtitle="Your workspace display name and email address."
            />
            <form onSubmit={handleSaveProfile}>
              <CardBody>
                <div className="settings-form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="input"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="input"
                      value={userProfile.email}
                      disabled
                      title="Contact account admin to change email address"
                    />
                    <span className="form-hint" style={{ marginTop: 4 }}>
                      Verified primary account email.
                    </span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company / Organization</label>
                    <input
                      type="text"
                      className="input"
                      value={profileCompany}
                      onChange={(e) => setProfileCompany(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role / Job Title</label>
                    <input
                      type="text"
                      className="input"
                      value={profileRole}
                      onChange={(e) => setProfileRole(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Timezone</label>
                    <select
                      className="select"
                      value={profileTimezone}
                      onChange={(e) => setProfileTimezone(e.target.value)}
                    >
                      <option value="UTC+05:30 (Asia/Kolkata)">UTC+05:30 (Asia/Kolkata)</option>
                      <option value="UTC-08:00 (America/Los_Angeles)">UTC-08:00 (Pacific Time)</option>
                      <option value="UTC-05:00 (America/New_York)">UTC-05:00 (Eastern Time)</option>
                      <option value="UTC+00:00 (Europe/London)">UTC+00:00 (London, UTC)</option>
                      <option value="UTC+01:00 (Europe/Berlin)">UTC+01:00 (Central European)</option>
                      <option value="UTC+08:00 (Asia/Singapore)">UTC+08:00 (Singapore)</option>
                    </select>
                  </div>
                </div>
              </CardBody>
              <CardFooter>
                <span className="form-hint">Changes apply immediately across workspace.</span>
                <Button type="submit" variant="primary">
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* Tab 2: Security & Sessions */}
      {settingsTab === 'security' && (
        <div className="settings-content-wrapper">
          {/* Change Password */}
          <Card style={{ marginBottom: 20 }}>
            <CardHeader
              title="Change Password"
              subtitle="Ensure your account uses a strong, random password."
            />
            <form onSubmit={handleChangePassword}>
              <CardBody>
                <div className="settings-form-grid">
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input
                      type="password"
                      className="input"
                      value={currPassword}
                      onChange={(e) => setCurrPassword(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'none' }} />
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      className="input"
                      placeholder="Minimum 12 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </CardBody>
              <CardFooter>
                <span className="form-hint">Requires re-authentication on other devices.</span>
                <Button type="submit" variant="secondary">
                  Update Password
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Two-Factor Authentication */}
          <Card style={{ marginBottom: 20 }}>
            <CardHeader
              title="Two-Factor Authentication (2FA)"
              subtitle="Protect your workspace with an authenticator app (TOTP)."
            />
            <CardBody>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Smartphone size={24} style={{ color: 'var(--status-success)' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13.5 }}>
                      Authenticator App Verification (TOTP)
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Enabled via Google Authenticator or 1Password. Required for API key operations.
                    </div>
                  </div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    className="toggle-input"
                    checked={twoFactorEnabled}
                    onChange={(e) => {
                      setTwoFactorEnabled(e.target.checked);
                      addToast({
                        type: e.target.checked ? 'success' : 'warning',
                        title: e.target.checked ? '2FA Enabled' : '2FA Disabled',
                        message: e.target.checked
                          ? 'Two-factor protection is active.'
                          : 'Two-factor protection has been disabled.'
                      });
                    }}
                  />
                  <div className="toggle-track">
                    <div className="toggle-thumb" />
                  </div>
                </label>
              </div>
            </CardBody>
          </Card>

          {/* Active Sessions */}
          <Card>
            <CardHeader
              title="Active Login Sessions"
              subtitle="Devices currently authenticated to your MailVerify account."
            />
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Device & Browser</th>
                    <th>IP Address</th>
                    <th>Approximate Location</th>
                    <th>Last Active</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {securitySessions.map((sess) => (
                    <tr key={sess.id}>
                      <td className="primary-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Globe size={15} style={{ color: 'var(--text-muted)' }} />
                          <span>
                            {sess.device} · {sess.browser}
                          </span>
                          {sess.isCurrent && (
                            <Badge variant="success">Current Device</Badge>
                          )}
                        </div>
                      </td>
                      <td className="font-mono tabular-nums">{sess.ip}</td>
                      <td>{sess.location}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {sess.lastActive}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {!sess.isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => revokeSession(sess.id)}
                            className="text-muted"
                          >
                            Revoke
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Preferences */}
      {settingsTab === 'preferences' && (
        <div className="settings-content-wrapper">
          <Card>
            <CardHeader
              title="Notifications & Webhook Preferences"
              subtitle="Control email alerts, low-credit warning thresholds, and bulk verification callbacks."
            />
            <CardBody>
              <div className="prefs-list">
                {/* 1. Job Complete */}
                <div className="pref-row">
                  <div>
                    <div className="pref-title">Email on Bulk Job Completion</div>
                    <div className="pref-desc">
                      Send a summary email when a large CSV or Google Sheets verification batch finishes.
                    </div>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      className="toggle-input"
                      checked={prefs.notifyJobCompleted}
                      onChange={(e) =>
                        setPrefs((p) => ({ ...p, notifyJobCompleted: e.target.checked }))
                      }
                    />
                    <div className="toggle-track">
                      <div className="toggle-thumb" />
                    </div>
                  </label>
                </div>

                {/* 2. Low Credit Alert */}
                <div className="pref-row">
                  <div>
                    <div className="pref-title">Low Credit Warning Email</div>
                    <div className="pref-desc">
                      Receive an alert when your available credit balance drops below your chosen safety threshold.
                    </div>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      className="toggle-input"
                      checked={prefs.notifyLowCredits}
                      onChange={(e) =>
                        setPrefs((p) => ({ ...p, notifyLowCredits: e.target.checked }))
                      }
                    />
                    <div className="toggle-track">
                      <div className="toggle-thumb" />
                    </div>
                  </label>
                </div>

                {/* Low Credit Threshold input */}
                {prefs.notifyLowCredits && (
                  <div className="form-group" style={{ paddingLeft: 12, borderLeft: '2px solid var(--accent-primary)', marginBottom: 16 }}>
                    <label className="form-label">Warning Threshold (Credits)</label>
                    <input
                      type="number"
                      className="input tabular-nums"
                      style={{ maxWidth: 200 }}
                      value={prefs.lowCreditThreshold}
                      onChange={(e) =>
                        setPrefs((p) => ({ ...p, lowCreditThreshold: Number(e.target.value) || 0 }))
                      }
                    />
                  </div>
                )}

                {/* 3. Weekly Digest */}
                <div className="pref-row">
                  <div>
                    <div className="pref-title">Weekly Deliverability Digest</div>
                    <div className="pref-desc">
                      Weekly executive report detailing total verified leads, bounce risks avoided, and top domain health.
                    </div>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      className="toggle-input"
                      checked={prefs.weeklyDigest}
                      onChange={(e) =>
                        setPrefs((p) => ({ ...p, weeklyDigest: e.target.checked }))
                      }
                    />
                    <div className="toggle-track">
                      <div className="toggle-thumb" />
                    </div>
                  </label>
                </div>

                {/* 4. Webhook */}
                <div className="pref-row">
                  <div>
                    <div className="pref-title">Webhook Callbacks for Completed Jobs</div>
                    <div className="pref-desc">
                      Send a JSON POST webhook to your server endpoint whenever a verification batch completes.
                    </div>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      className="toggle-input"
                      checked={prefs.webhookOnJobComplete}
                      onChange={(e) =>
                        setPrefs((p) => ({ ...p, webhookOnJobComplete: e.target.checked }))
                      }
                    />
                    <div className="toggle-track">
                      <div className="toggle-thumb" />
                    </div>
                  </label>
                </div>

                {prefs.webhookOnJobComplete && (
                  <div className="form-group" style={{ paddingLeft: 12, borderLeft: '2px solid var(--accent-primary)' }}>
                    <label className="form-label">Webhook Endpoint URL</label>
                    <input
                      type="url"
                      className="input input-mono"
                      value={prefs.webhookUrl}
                      onChange={(e) =>
                        setPrefs((p) => ({ ...p, webhookUrl: e.target.value }))
                      }
                      placeholder="https://api.yourdomain.com/webhooks/mailverify"
                    />
                  </div>
                )}
              </div>
            </CardBody>
            <CardFooter>
              <span className="form-hint">Preferences are saved to your workspace profile.</span>
              <Button variant="primary" onClick={handleSavePreferences}>
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Tab 4: Credit Usage History */}
      {settingsTab === 'credits' && (
        <div className="settings-content-wrapper">
          {/* Summary Stat Tiles */}
          <div className="stat-grid">
            <div className="stat-tile">
              <span className="stat-tile-label">AVAILABLE BALANCE</span>
              <span className="stat-tile-value tabular-nums" style={{ color: 'var(--accent-text)' }}>
                {subscription.creditsRemaining.toLocaleString()}
              </span>
              <span className="stat-tile-meta">Ready for immediate verification</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">MONTHLY SUBSCRIPTION PLAN</span>
              <span className="stat-tile-value tabular-nums">
                {subscription.monthlyCreditAllowance.toLocaleString()}
              </span>
              <span className="stat-tile-meta">Renews on {subscription.renewalDate}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">NON-EXPIRING ADD-ON CREDITS</span>
              <span className="stat-tile-value tabular-nums">
                {subscription.addonCredits.toLocaleString()}
              </span>
              <span className="stat-tile-meta">Permanent rollover reserve</span>
            </div>
          </div>

          {/* Ledger Table */}
          <Card>
            <CardHeader
              title="Credit Ledger & Transaction Log"
              subtitle="Immutable record of credits consumed during verification jobs or added via plan renewals."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportTransactions}
                  leftIcon={<Download size={13} />}
                >
                  Export CSV
                </Button>
              }
            />
            <CardBody compact>
              <div className="table-filter-bar" style={{ padding: '8px 12px' }}>
                <div className="input-with-icon" style={{ width: 220 }}>
                  <Search size={14} className="input-icon-left" />
                  <input
                    type="text"
                    className="input input-sm"
                    placeholder="Search transaction..."
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                  />
                </div>

                <div className="tab-pill-nav">
                  <button
                    className={`tab-pill-btn ${txTypeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setTxTypeFilter('all')}
                  >
                    All ({transactions.length})
                  </button>
                  <button
                    className={`tab-pill-btn ${txTypeFilter === 'usage' ? 'active' : ''}`}
                    onClick={() => setTxTypeFilter('usage')}
                  >
                    Usage (Deductions)
                  </button>
                  <button
                    className={`tab-pill-btn ${txTypeFilter === 'purchase' ? 'active' : ''}`}
                    onClick={() => setTxTypeFilter('purchase')}
                  >
                    Purchases (Add-ons)
                  </button>
                  <button
                    className={`tab-pill-btn ${
                      txTypeFilter === 'subscription_grant' ? 'active' : ''
                    }`}
                    onClick={() => setTxTypeFilter('subscription_grant')}
                  >
                    Plan Grants
                  </button>
                </div>
              </div>

              <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Timestamp</th>
                      <th>Description</th>
                      <th>Activity Type</th>
                      <th>Credits</th>
                      <th style={{ textAlign: 'right' }}>Ending Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => {
                      const isNegative = tx.amount < 0;
                      return (
                        <tr key={tx.id}>
                          <td className="primary-cell font-mono">{tx.id}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tx.date}</td>
                          <td>{tx.description}</td>
                          <td>
                            <Badge
                              variant={
                                tx.type === 'purchase'
                                  ? 'accent'
                                  : tx.type === 'subscription_grant'
                                  ? 'success'
                                  : 'neutral'
                              }
                            >
                              {tx.type === 'usage'
                                ? 'Consumption'
                                : tx.type === 'purchase'
                                ? 'Add-on Pack'
                                : 'Monthly Grant'}
                            </Badge>
                          </td>
                          <td className="font-mono tabular-nums">
                            <span
                              style={{
                                fontWeight: 600,
                                color: isNegative
                                  ? 'var(--status-error-text)'
                                  : 'var(--status-success-text)'
                              }}
                            >
                              {isNegative
                                ? `${tx.amount.toLocaleString()} credits`
                                : `+${tx.amount.toLocaleString()} credits`}
                            </span>
                          </td>
                          <td
                            className="font-mono tabular-nums"
                            style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}
                          >
                            {tx.resultingBalance.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tab 5: Billing & Plans */}
      {settingsTab === 'billing' && (
        <div className="settings-content-wrapper">
          {/* Current Subscription Card */}
          <Card style={{ marginBottom: 20 }}>
            <CardHeader
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Current Subscription: {subscription.tierName}</span>
                  <Badge variant="success">Active</Badge>
                </div>
              }
              action={
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsPlanModalOpen(true)}
                  >
                    Change Plan
                  </Button>
                </div>
              }
            />
            <CardBody>
              <div className="billing-summary-grid">
                <div>
                  <div className="bill-label">MONTHLY RECURRING</div>
                  <div className="bill-val font-mono">${subscription.monthlyPrice}.00 / month</div>
                  <div className="bill-sub">Next renewal on {subscription.renewalDate}</div>
                </div>

                <div>
                  <div className="bill-label">MONTHLY INCLUDED CREDITS</div>
                  <div className="bill-val font-mono tabular-nums">
                    {subscription.monthlyCreditAllowance.toLocaleString()}
                  </div>
                  <div className="bill-sub">Resets on 1st of each month</div>
                </div>

                <div>
                  <div className="bill-label">CURRENT TOTAL BALANCE</div>
                  <div className="bill-val font-mono tabular-nums text-accent">
                    {subscription.creditsRemaining.toLocaleString()}
                  </div>
                  <div className="bill-sub">
                    Includes {subscription.addonCredits.toLocaleString()} non-expiring rollover
                  </div>
                </div>
              </div>
            </CardBody>
            <CardFooter>
              <span className="text-muted" style={{ fontSize: 12 }}>
                Need extra volume without changing your tier?
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateTo('buy-credits')}
                leftIcon={<Plus size={12} />}
              >
                Buy Add-on Pack
              </Button>
            </CardFooter>
          </Card>

          {/* Payment Method */}
          <Card style={{ marginBottom: 20 }}>
            <CardHeader
              title="Payment Method"
              subtitle="Default card used for monthly plan renewal and credit pack purchases."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddCardModalOpen(true)}
                  leftIcon={<Plus size={12} />}
                >
                  Update Card
                </Button>
              }
            />
            <CardBody>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="card-brand-box">
                    <CreditCard size={18} style={{ color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13.5 }}>
                      {subscription.paymentMethod.brand} ending in {subscription.paymentMethod.last4}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Expires {subscription.paymentMethod.expMonth}/{subscription.paymentMethod.expYear} · Default
                    </div>
                  </div>
                </div>
                <Badge variant="neutral">Primary</Badge>
              </div>
            </CardBody>
          </Card>

          {/* Invoices History */}
          <Card style={{ marginBottom: 20 }}>
            <CardHeader
              title="Billing History & Invoices"
              subtitle="Download PDF receipts for your accounting and tax compliance records."
            />
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice Number</th>
                    <th>Billing Date</th>
                    <th>Plan / Description</th>
                    <th>Amount Paid</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="primary-cell font-mono">{inv.id}</td>
                      <td>{inv.date}</td>
                      <td>{inv.planName}</td>
                      <td className="font-mono tabular-nums">${inv.amount.toFixed(2)}</td>
                      <td>
                        <Badge variant="success">Paid</Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            addToast({
                              type: 'info',
                              title: 'Invoice Downloaded',
                              message: `Invoice ${inv.id} PDF downloaded.`
                            });
                          }}
                          leftIcon={<Download size={12} />}
                        >
                          PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Danger Zone: Cancel Subscription */}
          <Card style={{ borderColor: 'var(--status-error-border)' }}>
            <CardHeader
              title={
                <span style={{ color: 'var(--status-error-text)' }}>
                  Cancel Subscription
                </span>
              }
              subtitle="Downgrade to Free tier at the end of the current billing cycle."
            />
            <CardBody>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 540 }}>
                  Canceling your plan will preserve your existing non-expiring add-on credits. However,
                  your monthly allocation of {subscription.monthlyCreditAllowance.toLocaleString()} credits
                  and multi-integration automated sync will be revoked on {subscription.renewalDate}.
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setIsCancelModalOpen(true)}
                >
                  Cancel Plan
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Plan Tier Selection Modal */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title="Change Subscription Tier"
        maxWidth={620}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
            <Button variant="ghost" size="sm" onClick={() => setIsPlanModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                updateSubscriptionPlan(selectedPlanTier);
                setIsPlanModalOpen(false);
              }}
            >
              Confirm Plan Switch
            </Button>
          </div>
        }
      >
        <div className="plan-tiers-modal-grid">
          {/* Starter */}
          <div
            className={`plan-modal-card ${selectedPlanTier === 'starter' ? 'selected' : ''}`}
            onClick={() => setSelectedPlanTier('starter')}
          >
            <div className="plan-modal-header">
              <span className="plan-name">Starter</span>
              <span className="plan-price font-mono">$29/mo</span>
            </div>
            <div className="plan-credits font-mono tabular-nums">5,000 credits/mo</div>
            <ul className="plan-features-list">
              <li>Single & Bulk Verification</li>
              <li>Developer API (25 req/sec)</li>
              <li>Google Sheets Sync</li>
              <li>Email Support</li>
            </ul>
          </div>

          {/* Growth */}
          <div
            className={`plan-modal-card ${selectedPlanTier === 'growth' ? 'selected' : ''}`}
            onClick={() => setSelectedPlanTier('growth')}
          >
            <div className="plan-modal-header">
              <span className="plan-name">Growth</span>
              <span className="plan-price font-mono">$79/mo</span>
            </div>
            <div className="plan-credits font-mono tabular-nums">25,000 credits/mo</div>
            <ul className="plan-features-list">
              <li>All Starter Features</li>
              <li>ReachInbox & Instantly Sync</li>
              <li>Developer API (50 req/sec)</li>
              <li>Priority Processing Queue</li>
              <li>10 Team Seats</li>
            </ul>
          </div>

          {/* Enterprise */}
          <div
            className={`plan-modal-card ${selectedPlanTier === 'enterprise' ? 'selected' : ''}`}
            onClick={() => setSelectedPlanTier('enterprise')}
          >
            <div className="plan-modal-header">
              <span className="plan-name">Enterprise</span>
              <span className="plan-price font-mono">$199/mo</span>
            </div>
            <div className="plan-credits font-mono tabular-nums">100,000 credits/mo</div>
            <ul className="plan-features-list">
              <li>All Growth Features</li>
              <li>Custom Webhook Routing</li>
              <li>Dedicated Verification IPs</li>
              <li>99.99% Uptime SLA</li>
              <li>Dedicated Account Manager</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Add Payment Method Modal */}
      <Modal
        isOpen={isAddCardModalOpen}
        onClose={() => setIsAddCardModalOpen(false)}
        title="Update Payment Method"
        maxWidth={460}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
            <Button variant="ghost" size="sm" onClick={() => setIsAddCardModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (!cardNumber || !cardExpiry || !cardCvc) {
                  addToast({
                    type: 'error',
                    title: 'Incomplete Card Details',
                    message: 'Please fill out all required card fields.'
                  });
                  return;
                }
                setIsAddCardModalOpen(false);
                addToast({
                  type: 'success',
                  title: 'Card Updated',
                  message: 'Your payment method has been verified and saved.'
                });
              }}
            >
              Save Card
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Card Number</label>
            <input
              type="text"
              className="input font-mono"
              placeholder="4242 •••• •••• 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Expiry MM/YY</label>
              <input
                type="text"
                className="input font-mono"
                placeholder="12/28"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">CVC / CVV</label>
              <input
                type="password"
                className="input font-mono"
                maxLength={4}
                placeholder="•••"
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Cancel Subscription Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Confirm Subscription Cancellation"
        maxWidth={460}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
            <Button variant="ghost" size="sm" onClick={() => setIsCancelModalOpen(false)}>
              Keep Subscription
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setIsCancelModalOpen(false);
                addToast({
                  type: 'warning',
                  title: 'Subscription Canceled',
                  message: `Your plan will remain active until ${subscription.renewalDate}.`
                });
              }}
            >
              Confirm Cancellation
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <AlertTriangle size={24} style={{ color: 'var(--status-error)', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 }}>
              Are you sure you want to cancel your <strong>{subscription.tierName}</strong>?
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              You will continue to have access to your remaining credits until the end of this billing
              cycle on {subscription.renewalDate}. After that, automated integration syncs will be paused.
            </p>
          </div>
        </div>
      </Modal>

      <style>{`
        .settings-content-wrapper {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .settings-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
        }

        .card-brand-box {
          width: 38px;
          height: 38px;
          background-color: #17181C;
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .billing-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
        }

        .bill-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .bill-val {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .bill-sub {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .text-accent {
          color: var(--accent-text);
        }

        .prefs-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .pref-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: var(--space-3);
          border-bottom: 1px solid var(--border-subtle);
        }

        .pref-title {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .pref-desc {
          font-size: 12px;
          color: var(--text-muted);
          max-width: 580px;
        }

        .plan-tiers-modal-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .plan-modal-card {
          background-color: #101114;
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-md);
          padding: 14px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .plan-modal-card:hover {
          border-color: var(--border-strong);
        }
        .plan-modal-card.selected {
          border-color: var(--accent-primary);
          background-color: #141519;
          box-shadow: 0 0 0 1px var(--accent-primary);
        }

        .plan-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .plan-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .plan-price {
          font-size: 13px;
          font-weight: 600;
          color: var(--accent-text);
        }

        .plan-credits {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .plan-features-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 11px;
          color: var(--text-muted);
        }
        .plan-features-list li::before {
          content: "✓ ";
          color: var(--status-success);
        }

        @media (max-width: 768px) {
          .settings-form-grid,
          .plan-tiers-modal-grid,
          .billing-summary-grid {
            grid-template-columns: 1fr;
          }
          .pref-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .pref-desc {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
