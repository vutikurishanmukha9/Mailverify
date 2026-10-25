import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  ScreenId,
  SettingsTabId,
  SingleVerificationResult,
  BulkVerificationJob,
  BulkJobRecord,
  Integration,
  ApiKeyItem,
  CreditTransaction,
  UserProfile,
  UserSecuritySession,
  UserPreferences,
  SubscriptionInfo,
  InvoiceItem,
  CreditPackage,
  RoadmapItem,
  SupportTicket,
  TicketAttachment,
  ToastMessage
} from '../types';
import { verifyRecordForBulk } from '../utils/verifier';
import { SupportBackendService, type CreateTicketParams } from '../services/supportBackend';

interface AppContextType {
  // Navigation
  screen: ScreenId;
  settingsTab: SettingsTabId;
  isSidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  navigateTo: (screen: ScreenId, settingsTab?: SettingsTabId) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;

  // Verification & Bulk
  singleHistory: SingleVerificationResult[];
  addSingleVerification: (result: SingleVerificationResult) => void;
  clearSingleHistory: () => void;
  deleteSingleHistoryItem: (id: string) => void;
  bulkJobs: BulkVerificationJob[];
  createBulkJob: (name: string, sourceType: 'csv' | 'sheets' | 'manual', rawEmails: string[]) => BulkVerificationJob;
  deleteBulkJob: (id: string) => void;

  // Integrations & API
  integrations: Integration[];
  updateIntegration: (id: string, updates: Partial<Integration>) => void;
  disconnectIntegration: (id: string) => void;
  apiKeys: ApiKeyItem[];
  createApiKey: (name: string, permissions: 'full' | 'verify_only' | 'read_only') => { key: ApiKeyItem; rawToken: string };
  revokeApiKey: (id: string) => void;

  // Account, Settings & Credits
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  securitySessions: UserSecuritySession[];
  revokeSession: (id: string) => void;
  userPreferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  subscription: SubscriptionInfo;
  updateSubscriptionPlan: (tier: 'starter' | 'growth' | 'enterprise') => void;
  transactions: CreditTransaction[];
  invoices: InvoiceItem[];
  creditPackages: CreditPackage[];
  purchaseCredits: (packageId: string) => boolean;
  deductCredits: (count: number, reason: string) => boolean;

  // Roadmap & Support
  roadmapItems: RoadmapItem[];
  upvoteRoadmap: (id: string) => void;
  submitRoadmapSuggestion: (title: string, description: string, category: RoadmapItem['category']) => void;
  supportTickets: SupportTicket[];
  createSupportTicket: (
    subjectOrParams: string | CreateTicketParams,
    category?: SupportTicket['category'],
    severity?: SupportTicket['severity'],
    message?: string
  ) => Promise<SupportTicket>;
  addTicketReply: (
    ticketId: string,
    text: string,
    sender?: 'user' | 'support',
    attachments?: TicketAttachment[]
  ) => Promise<SupportTicket>;
  reopenTicket: (ticketId: string) => Promise<SupportTicket>;

  // Global Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial sample seed data
const INITIAL_SINGLE_HISTORY: SingleVerificationResult[] = [
  {
    id: 'ver_sample1',
    email: 'alex.vance@stripe.com',
    user: 'alex.vance',
    domain: 'stripe.com',
    status: 'deliverable',
    score: 98,
    reason: 'Direct SMTP connection verified; mailbox is active.',
    isDisposable: false,
    isFreeMail: false,
    isRoleBased: false,
    isCatchAll: false,
    mxRecordsFound: true,
    mxHost: 'aspmx.l.google.com',
    smtpCheck: true,
    smtpResponse: '250 2.1.5 Recipient OK',
    spamTrapScore: 0,
    syntaxValid: true,
    latencyMs: 54,
    verifiedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    rawJson: { status: 'deliverable', score: 98, mx_host: 'aspmx.l.google.com' }
  },
  {
    id: 'ver_sample2',
    email: 'marketing@linear.app',
    user: 'marketing',
    domain: 'linear.app',
    status: 'risky',
    score: 72,
    reason: 'Role-based address (generic team inbox). May experience low open rates or spam complaints.',
    isDisposable: false,
    isFreeMail: false,
    isRoleBased: true,
    isCatchAll: false,
    mxRecordsFound: true,
    mxHost: 'aspmx.l.google.com',
    smtpCheck: true,
    smtpResponse: '250 2.1.5 Recipient OK (Role Account)',
    spamTrapScore: 5,
    syntaxValid: true,
    latencyMs: 62,
    verifiedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    rawJson: { status: 'risky', score: 72, reason: 'Role-based' }
  },
  {
    id: 'ver_sample3',
    email: 'temp.user492@mailinator.com',
    user: 'temp.user492',
    domain: 'mailinator.com',
    status: 'undeliverable',
    score: 12,
    reason: 'Disposable or temporary email address detected.',
    isDisposable: true,
    isFreeMail: false,
    isRoleBased: false,
    isCatchAll: false,
    mxRecordsFound: true,
    mxHost: 'mx.mailinator.com',
    smtpCheck: true,
    smtpResponse: '250 2.1.5 Recipient OK (Disposable Provider)',
    spamTrapScore: 40,
    syntaxValid: true,
    latencyMs: 88,
    verifiedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    rawJson: { status: 'undeliverable', score: 12, reason: 'Disposable' }
  }
];

const INITIAL_BULK_JOBS: BulkVerificationJob[] = [
  {
    id: 'job_oct_b2b_saas',
    name: 'Q4_Outreach_US_Tech_Leads.csv',
    sourceType: 'csv',
    totalCount: 1420,
    processedCount: 1420,
    deliverableCount: 1248,
    riskyCount: 112,
    undeliverableCount: 60,
    syntaxErrors: 0,
    status: 'completed',
    createdAt: '2026-10-18T14:22:00Z',
    completedAt: '2026-10-18T14:26:40Z',
    records: [
      { id: 'rec_1', email: 'sarah.connor@acme.corp', status: 'deliverable', score: 98, reason: 'Verified mailbox', mxHost: 'mail.acme.corp', isDisposable: false, isRoleBased: false, checkedAt: '2026-10-18T14:23:00Z' },
      { id: 'rec_2', email: 'david.b@cloudscale.io', status: 'deliverable', score: 96, reason: 'Verified mailbox', mxHost: 'aspmx.l.google.com', isDisposable: false, isRoleBased: false, checkedAt: '2026-10-18T14:23:05Z' },
      { id: 'rec_3', email: 'sales@reachinbox.ai', status: 'risky', score: 70, reason: 'Role-based account', mxHost: 'aspmx.l.google.com', isDisposable: false, isRoleBased: true, checkedAt: '2026-10-18T14:23:12Z' },
      { id: 'rec_4', email: 'fakeuser99@trashmail.com', status: 'undeliverable', score: 10, reason: 'Disposable email', mxHost: 'mx.trashmail.com', isDisposable: true, isRoleBased: false, checkedAt: '2026-10-18T14:23:20Z' },
      { id: 'rec_5', email: 'elena.rostova@datadog.com', status: 'deliverable', score: 99, reason: 'Verified mailbox', mxHost: 'aspmx.l.google.com', isDisposable: false, isRoleBased: false, checkedAt: '2026-10-18T14:23:25Z' },
      { id: 'rec_6', email: 'catchall-test@bigfirm.com', status: 'risky', score: 65, reason: 'Catch-all domain', mxHost: 'mx.bigfirm.com', isDisposable: false, isRoleBased: false, checkedAt: '2026-10-18T14:23:30Z' }
    ]
  },
  {
    id: 'job_sheets_sync_oct',
    name: 'Google Sheets: Inbound Signups Oct 2026',
    sourceType: 'sheets',
    totalCount: 380,
    processedCount: 380,
    deliverableCount: 345,
    riskyCount: 22,
    undeliverableCount: 13,
    syntaxErrors: 0,
    status: 'completed',
    createdAt: '2026-10-19T09:10:00Z',
    completedAt: '2026-10-19T09:12:15Z',
    records: [
      { id: 'rec_s1', email: 'cto@seedstartup.dev', status: 'deliverable', score: 97, reason: 'Verified mailbox', mxHost: 'aspmx.l.google.com', isDisposable: false, isRoleBased: false, checkedAt: '2026-10-19T09:10:30Z' },
      { id: 'rec_s2', email: 'careers@enterprise.net', status: 'risky', score: 68, reason: 'Role-based address', mxHost: 'mail.enterprise.net', isDisposable: false, isRoleBased: true, checkedAt: '2026-10-19T09:10:45Z' }
    ]
  }
];

const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: 'int_reachinbox',
    name: 'ReachInbox',
    slug: 'reachinbox',
    description: 'Auto-verify outreach sequences before campaigns fire. Prevent sender reputation drops.',
    category: 'Cold Outreach',
    status: 'connected',
    lastSyncedAt: '2 hours ago',
    leadsCleaned: 4820,
    autoSyncEnabled: true,
    syncInterval: 'hourly',
    apiKeyMasked: 'ri_live_••••••••9a2b',
    webhookUrl: 'https://api.mailverify.io/hooks/reachinbox/wb_891'
  },
  {
    id: 'int_instantly',
    name: 'Instantly.ai',
    slug: 'instantly',
    description: 'Sync campaign lead lists directly and tag risky and undeliverable addresses automatically.',
    category: 'Cold Outreach',
    status: 'connected',
    lastSyncedAt: 'Yesterday at 18:30',
    leadsCleaned: 12300,
    autoSyncEnabled: true,
    syncInterval: 'daily',
    apiKeyMasked: 'inst_live_••••••••41ec',
    webhookUrl: 'https://api.mailverify.io/hooks/instantly/wb_330'
  },
  {
    id: 'int_smartlead',
    name: 'Smartlead.ai',
    slug: 'smartlead',
    description: 'Connect your warm-up and outreach mailboxes to protect high inbox placement rates.',
    category: 'Cold Outreach',
    status: 'disconnected'
  },
  {
    id: 'int_sheets',
    name: 'Google Sheets',
    slug: 'sheets',
    description: 'Verify emails live inside Google Sheets using our formulas or bi-directional sync.',
    category: 'Spreadsheets',
    status: 'disconnected'
  },
  {
    id: 'int_hubspot',
    name: 'HubSpot CRM',
    slug: 'hubspot',
    description: 'Bi-directional contact property sync and bounce prediction inside your HubSpot CRM.',
    category: 'CRM',
    status: 'coming_soon'
  },
  {
    id: 'int_lemlist',
    name: 'Lemlist',
    slug: 'lemlist',
    description: 'Clean outreach prospects and prevent bounce rates before personalized emails send.',
    category: 'Cold Outreach',
    status: 'coming_soon'
  }
];

const INITIAL_API_KEYS: ApiKeyItem[] = [
  {
    id: 'key_prod_main',
    name: 'Production Backend (App)',
    keyPrefix: 'mv_live_••••••••8e4a',
    permissions: 'full',
    rateLimitPerSec: 50,
    createdAt: '2026-08-15T10:00:00Z',
    lastUsedAt: '3 minutes ago',
    status: 'active'
  },
  {
    id: 'key_zapier_sync',
    name: 'Zapier / Webhook Gateway',
    keyPrefix: 'mv_live_••••••••2c91',
    permissions: 'verify_only',
    rateLimitPerSec: 20,
    createdAt: '2026-09-02T16:30:00Z',
    lastUsedAt: '2 hours ago',
    status: 'active'
  }
];

const INITIAL_TRANSACTIONS: CreditTransaction[] = [
  { id: 'tx_981a', date: '2026-10-19 14:22', description: "Bulk job: 'Q4_Outreach_US_Tech_Leads.csv' (1,420 records)", type: 'usage', amount: -1420, resultingBalance: 2450 },
  { id: 'tx_980f', date: '2026-10-18 10:15', description: 'Single API verification batch (80 requests)', type: 'usage', amount: -80, resultingBalance: 3870 },
  { id: 'tx_979d', date: '2026-10-15 09:30', description: 'Purchased Add-on Pack: 5,000 Credits', type: 'purchase', amount: 5000, resultingBalance: 3950 },
  { id: 'tx_978b', date: '2026-10-01 00:00', description: 'Monthly subscription allowance (Growth Plan)', type: 'subscription_grant', amount: 25000, resultingBalance: 26420 }
];

const INITIAL_ROADMAP: RoadmapItem[] = [
  {
    id: 'rm_hubspot',
    title: 'HubSpot Native Bi-directional Sync',
    description: 'Automatically scan new HubSpot contacts on creation and flag risky emails with custom properties.',
    category: 'Integrations',
    status: 'in_progress',
    quarter: 'Q4 2026',
    votes: 184,
    hasVoted: false
  },
  {
    id: 'rm_autocorrect',
    title: 'Typo Auto-Correction Suggestions',
    description: 'Suggest corrections for domain misspellings like gmial.com -> gmail.com or outlok.com -> outlook.com in single API verification.',
    category: 'Performance',
    status: 'in_progress',
    quarter: 'Q4 2026',
    votes: 142,
    hasVoted: true
  },
  {
    id: 'rm_smartlead_warmup',
    title: 'Smartlead Warmup Direct Integration',
    description: 'One-click connect with Smartlead to clean campaigns before warmup and outbound sequences launch.',
    category: 'Outreach',
    status: 'planned',
    quarter: 'Q1 2027',
    votes: 97,
    hasVoted: false
  },
  {
    id: 'rm_eu_residency',
    title: 'EU Dedicated Data Residency Region',
    description: 'Ensure all verification SMTP packets and DNS lookups are processed strictly within Frankfurt/Dublin AWS/GCP regions for strict GDPR compliance.',
    category: 'Security',
    status: 'planned',
    quarter: 'Q1 2027',
    votes: 79,
    hasVoted: false
  },
  {
    id: 'rm_soc2',
    title: 'SOC2 Type II Annual Compliance Audit',
    description: 'Formal third-party security verification report download in account settings for enterprise infosec teams.',
    category: 'Security',
    status: 'completed',
    quarter: 'Q3 2026',
    votes: 215,
    hasVoted: true
  }
];


export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [screen, setScreen] = useState<ScreenId>('single');
  const [settingsTab, setSettingsTab] = useState<SettingsTabId>('profile');
  const [isSidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Single History
  const [singleHistory, setSingleHistory] = useState<SingleVerificationResult[]>(() => {
    try {
      const saved = localStorage.getItem('mv_single_history');
      return saved ? JSON.parse(saved) : INITIAL_SINGLE_HISTORY;
    } catch {
      return INITIAL_SINGLE_HISTORY;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mv_single_history', JSON.stringify(singleHistory));
    } catch (e) {
      console.warn('Failed to save history to localStorage', e);
    }
  }, [singleHistory]);

  // Bulk Jobs
  const [bulkJobs, setBulkJobs] = useState<BulkVerificationJob[]>(() => {
    try {
      const saved = localStorage.getItem('mv_bulk_jobs');
      return saved ? JSON.parse(saved) : INITIAL_BULK_JOBS;
    } catch {
      return INITIAL_BULK_JOBS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mv_bulk_jobs', JSON.stringify(bulkJobs));
    } catch (e) {
      console.warn('Failed to save bulk jobs to localStorage', e);
    }
  }, [bulkJobs]);

  // Integrations
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS);

  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(INITIAL_API_KEYS);

  // Profile
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Shanmukh Vutikuri',
    email: 'shanmukh@mailverify.enterprise',
    company: 'Apex Growth Labs',
    role: 'Head of Engineering & Growth',
    timezone: 'UTC+05:30 (Asia/Kolkata)',
    avatarUrl: ''
  });

  // Security Sessions
  const [securitySessions, setSecuritySessions] = useState<UserSecuritySession[]>([
    {
      id: 'sess_current',
      device: 'Windows PC (x86_64)',
      browser: 'Chrome 129.0',
      ip: '103.156.19.42',
      location: 'Hyderabad, India',
      lastActive: 'Active now',
      isCurrent: true
    },
    {
      id: 'sess_laptop',
      device: 'MacBook Pro (M3)',
      browser: 'Safari 18.0',
      ip: '49.207.210.14',
      location: 'Bengaluru, India',
      lastActive: 'Yesterday, 18:24',
      isCurrent: false
    }
  ]);

  // Preferences
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    notifyJobCompleted: true,
    notifyLowCredits: true,
    lowCreditThreshold: 500,
    weeklyDigest: true,
    autoExportDeliverable: false,
    webhookOnJobComplete: true,
    webhookUrl: 'https://api.apexgrowth.internal/webhooks/mailverify'
  });

  // Subscription
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    tier: 'growth',
    tierName: 'Growth Plan',
    status: 'active',
    monthlyPrice: 79,
    monthlyCreditAllowance: 25000,
    creditsRemaining: 2450,
    addonCredits: 1450,
    renewalDate: 'November 1, 2026',
    paymentMethod: {
      brand: 'Visa',
      last4: '4242',
      expMonth: 8,
      expYear: 2028
    }
  });

  // Transactions
  const [transactions, setTransactions] = useState<CreditTransaction[]>(INITIAL_TRANSACTIONS);

  // Invoices
  const [invoices] = useState<InvoiceItem[]>([
    { id: 'INV-2026-010', date: 'Oct 01, 2026', amount: 79.00, status: 'paid', planName: 'Growth Plan (Monthly)' },
    { id: 'INV-2026-009', date: 'Sep 01, 2026', amount: 79.00, status: 'paid', planName: 'Growth Plan (Monthly)' },
    { id: 'INV-2026-008', date: 'Aug 01, 2026', amount: 79.00, status: 'paid', planName: 'Growth Plan (Monthly)' }
  ]);

  // Credit Packages
  const creditPackages: CreditPackage[] = [
    { id: 'pkg_2500', credits: 2500, price: 15, unitPrice: 0.006 },
    { id: 'pkg_10000', credits: 10000, price: 49, unitPrice: 0.0049, badge: 'Most Popular' },
    { id: 'pkg_50000', credits: 50000, price: 189, unitPrice: 0.0037, badge: 'Best Value' },
    { id: 'pkg_250000', credits: 250000, price: 699, unitPrice: 0.0027, badge: 'High Volume' }
  ];

  // Roadmap & Support
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>(INITIAL_ROADMAP);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
    try {
      const saved = localStorage.getItem('mv_support_tickets_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load tickets', e);
    }
    return [];
  });

  useEffect(() => {
    SupportBackendService.getTickets().then((ticks) => {
      setSupportTickets(ticks);
    });
  }, []);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast = { ...toast, id };
    setToasts(prev => [newToast, ...prev].slice(0, 5));
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const navigateTo = (newScreen: ScreenId, newSettingsTab?: SettingsTabId) => {
    setScreen(newScreen);
    if (newSettingsTab) {
      setSettingsTab(newSettingsTab);
    }
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addSingleVerification = (result: SingleVerificationResult) => {
    setSingleHistory(prev => [result, ...prev.filter(r => r.email !== result.email)].slice(0, 100));
    // Deduct 1 credit
    deductCredits(1, `Single verification: ${result.email}`);
  };

  const clearSingleHistory = () => {
    setSingleHistory([]);
    addToast({
      type: 'info',
      title: 'History Cleared',
      message: 'All single verification logs have been cleared.'
    });
  };

  const deleteSingleHistoryItem = (id: string) => {
    setSingleHistory(prev => prev.filter(item => item.id !== id));
  };

  const deductCredits = (count: number, reason: string): boolean => {
    if (subscription.creditsRemaining < count) {
      addToast({
        type: 'error',
        title: 'Insufficient Credits',
        message: `You need ${count} credits but only have ${subscription.creditsRemaining}. Please purchase add-on credits.`
      });
      return false;
    }

    const newBalance = subscription.creditsRemaining - count;
    setSubscription(prev => ({
      ...prev,
      creditsRemaining: newBalance
    }));

    const newTx: CreditTransaction = {
      id: `tx_${Math.random().toString(36).substring(2, 7)}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      description: reason,
      type: 'usage',
      amount: -count,
      resultingBalance: newBalance
    };

    setTransactions(prev => [newTx, ...prev]);
    return true;
  };

  const purchaseCredits = (packageId: string): boolean => {
    const pkg = creditPackages.find(p => p.id === packageId);
    if (!pkg) return false;

    const newBalance = subscription.creditsRemaining + pkg.credits;
    setSubscription(prev => ({
      ...prev,
      creditsRemaining: newBalance,
      addonCredits: prev.addonCredits + pkg.credits
    }));

    const newTx: CreditTransaction = {
      id: `tx_${Math.random().toString(36).substring(2, 7)}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      description: `Purchased Add-on Pack: ${pkg.credits.toLocaleString()} Credits ($${pkg.price})`,
      type: 'purchase',
      amount: pkg.credits,
      resultingBalance: newBalance
    };

    setTransactions(prev => [newTx, ...prev]);

    addToast({
      type: 'success',
      title: 'Credits Added Successfully',
      message: `${pkg.credits.toLocaleString()} credits added to your account balance.`
    });

    return true;
  };

  const createBulkJob = (name: string, sourceType: 'csv' | 'sheets' | 'manual', rawEmails: string[]): BulkVerificationJob => {
    // Deduct credits
    const totalCount = rawEmails.length;
    deductCredits(totalCount, `Bulk list verification: '${name}' (${totalCount} records)`);

    // Verify records
    const records: BulkJobRecord[] = rawEmails.map(verifyRecordForBulk);
    const deliverableCount = records.filter(r => r.status === 'deliverable').length;
    const riskyCount = records.filter(r => r.status === 'risky').length;
    const undeliverableCount = records.filter(r => r.status === 'undeliverable').length;
    const syntaxErrors = records.filter(r => r.score === 0).length;

    const newJob: BulkVerificationJob = {
      id: `job_${Math.random().toString(36).substring(2, 8)}`,
      name: name || `Bulk_List_${new Date().toLocaleDateString()}`,
      sourceType,
      totalCount,
      processedCount: totalCount,
      deliverableCount,
      riskyCount,
      undeliverableCount,
      syntaxErrors,
      status: 'completed',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      records
    };

    setBulkJobs(prev => [newJob, ...prev]);

    addToast({
      type: 'success',
      title: 'Verification Complete',
      message: `Processed ${totalCount} emails: ${deliverableCount} Deliverable, ${riskyCount} Risky, ${undeliverableCount} Undeliverable.`
    });

    return newJob;
  };

  const deleteBulkJob = (id: string) => {
    setBulkJobs(prev => prev.filter(j => j.id !== id));
    addToast({
      type: 'info',
      title: 'List Deleted',
      message: 'The verification job and its results have been removed.'
    });
  };

  const updateIntegration = (id: string, updates: Partial<Integration>) => {
    setIntegrations(prev => prev.map(int => int.id === id ? { ...int, ...updates } : int));
    addToast({
      type: 'success',
      title: 'Integration Updated',
      message: 'Connection settings and credentials have been updated.'
    });
  };

  const disconnectIntegration = (id: string) => {
    setIntegrations(prev => prev.map(int => int.id === id ? { ...int, status: 'disconnected', apiKeyMasked: undefined } : int));
    addToast({
      type: 'info',
      title: 'Integration Disconnected',
      message: 'Syncing paused and credentials cleared.'
    });
  };

  const createApiKey = (name: string, permissions: 'full' | 'verify_only' | 'read_only') => {
    const rawSecret = `mv_live_${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const keyPrefix = `mv_live_••••••••${rawSecret.slice(-4)}`;

    const newKey: ApiKeyItem = {
      id: `key_${Math.random().toString(36).substring(2, 8)}`,
      name: name.trim() || 'New API Key',
      keyPrefix,
      permissions,
      rateLimitPerSec: permissions === 'full' ? 50 : 25,
      createdAt: new Date().toISOString(),
      lastUsedAt: 'Never',
      status: 'active'
    };

    setApiKeys(prev => [newKey, ...prev]);

    addToast({
      type: 'success',
      title: 'API Key Created',
      message: `Key "${newKey.name}" is now active.`
    });

    return { key: newKey, rawToken: rawSecret };
  };

  const revokeApiKey = (id: string) => {
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'revoked' } : k));
    addToast({
      type: 'warning',
      title: 'API Key Revoked',
      message: 'Any requests using this key will immediately return 401 Unauthorized.'
    });
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...profile }));
    addToast({
      type: 'success',
      title: 'Profile Updated',
      message: 'Your personal information has been saved.'
    });
  };

  const revokeSession = (id: string) => {
    setSecuritySessions(prev => prev.filter(s => s.id !== id));
    addToast({
      type: 'info',
      title: 'Session Revoked',
      message: 'The selected device has been logged out.'
    });
  };

  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    setUserPreferences(prev => ({ ...prev, ...prefs }));
    addToast({
      type: 'success',
      title: 'Preferences Saved',
      message: 'Notification and webhook settings have been updated.'
    });
  };

  const updateSubscriptionPlan = (tier: 'starter' | 'growth' | 'enterprise') => {
    const tierMap = {
      starter: { name: 'Starter Plan', price: 29, credits: 5000 },
      growth: { name: 'Growth Plan', price: 79, credits: 25000 },
      enterprise: { name: 'Enterprise Plan', price: 199, credits: 100000 }
    };

    const target = tierMap[tier];
    setSubscription(prev => ({
      ...prev,
      tier,
      tierName: target.name,
      monthlyPrice: target.price,
      monthlyCreditAllowance: target.credits,
      creditsRemaining: prev.creditsRemaining + (target.credits - prev.monthlyCreditAllowance > 0 ? (target.credits - prev.monthlyCreditAllowance) : 0)
    }));

    addToast({
      type: 'success',
      title: 'Plan Updated',
      message: `You have successfully switched to the ${target.name}.`
    });
  };

  const upvoteRoadmap = (id: string) => {
    setRoadmapItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextVoted = !item.hasVoted;
        return {
          ...item,
          hasVoted: nextVoted,
          votes: nextVoted ? item.votes + 1 : item.votes - 1
        };
      }
      return item;
    }));
  };

  const submitRoadmapSuggestion = (title: string, description: string, category: RoadmapItem['category']) => {
    const newItem: RoadmapItem = {
      id: `rm_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      status: 'under_review',
      quarter: 'Considering',
      votes: 1,
      hasVoted: true
    };
    setRoadmapItems(prev => [newItem, ...prev]);
    addToast({
      type: 'success',
      title: 'Feature Suggested',
      message: 'Thank you for your feedback! Your feature is under review.'
    });
  };

  const createSupportTicket = async (
    subjectOrParams: string | CreateTicketParams,
    category?: SupportTicket['category'],
    severity?: SupportTicket['severity'],
    message?: string
  ): Promise<SupportTicket> => {
    let params: CreateTicketParams;

    if (typeof subjectOrParams === 'object') {
      params = subjectOrParams;
    } else {
      params = {
        subject: subjectOrParams,
        category: category || 'Deliverability',
        priority: severity || 'normal',
        description: message || '',
        issueType: 'technical',
        contactEmail: userProfile.email
      };
    }

    const newTicket = await SupportBackendService.createTicket(params);
    setSupportTickets(prev => [newTicket, ...prev]);

    addToast({
      type: 'success',
      title: 'Support Ticket Submitted',
      message: `Ticket #${newTicket.id} received. Response SLA is < 2 hours.`
    });

    return newTicket;
  };

  const addTicketReply = async (
    ticketId: string,
    text: string,
    sender: 'user' | 'support' = 'user',
    attachments?: TicketAttachment[]
  ): Promise<SupportTicket> => {
    const updated = await SupportBackendService.addReply(ticketId, text, sender, attachments);
    setSupportTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
    addToast({
      type: 'success',
      title: 'Reply Sent',
      message: 'Your reply has been added to the ticket thread.'
    });
    return updated;
  };

  const reopenTicket = async (ticketId: string): Promise<SupportTicket> => {
    const updated = await SupportBackendService.reopenTicket(ticketId);
    setSupportTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
    addToast({
      type: 'info',
      title: 'Ticket Reopened',
      message: `Ticket #${ticketId} has been reopened for additional investigation.`
    });
    return updated;
  };

  return (
    <AppContext.Provider
      value={{
        screen,
        settingsTab,
        isSidebarCollapsed,
        isMobileMenuOpen,
        navigateTo,
        setSidebarCollapsed,
        setMobileMenuOpen,
        singleHistory,
        addSingleVerification,
        clearSingleHistory,
        deleteSingleHistoryItem,
        bulkJobs,
        createBulkJob,
        deleteBulkJob,
        integrations,
        updateIntegration,
        disconnectIntegration,
        apiKeys,
        createApiKey,
        revokeApiKey,
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
        creditPackages,
        purchaseCredits,
        deductCredits,
        roadmapItems,
        upvoteRoadmap,
        submitRoadmapSuggestion,
        supportTickets,
        createSupportTicket,
        addTicketReply,
        reopenTicket,
        toasts,
        addToast,
        removeToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
