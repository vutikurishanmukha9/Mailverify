// Data Types for MailVerify Enterprise Application

export type ScreenId = 
  | 'single'
  | 'bulk'
  | 'integrations'
  | 'api'
  | 'buy-credits'
  | 'roadmap'
  | 'support'
  | 'settings';

export type SettingsTabId =
  | 'profile'
  | 'security'
  | 'preferences'
  | 'credits'
  | 'billing';

export type DeliverabilityStatus = 'deliverable' | 'undeliverable' | 'risky';

export interface DiagnosticCheck {
  id: string;
  name: string;
  passed: boolean;
  severity: 'good' | 'warning' | 'bad' | 'neutral';
  details: string;
}

export interface SingleVerificationResult {
  id: string;
  email: string;
  user: string;
  domain: string;
  status: DeliverabilityStatus;
  score: number; // 0 - 100
  reason: string;
  isDisposable: boolean;
  isFreeMail: boolean;
  isRoleBased: boolean;
  isCatchAll: boolean;
  mxRecordsFound: boolean;
  mxHost: string;
  smtpCheck: boolean;
  smtpResponse: string;
  spamTrapScore: number; // 0 - 100
  syntaxValid: boolean;
  latencyMs: number;
  verifiedAt: string;
  rawJson: Record<string, unknown>;
}

export interface BulkJobRecord {
  id: string;
  email: string;
  status: DeliverabilityStatus;
  score: number;
  reason: string;
  mxHost: string;
  isDisposable: boolean;
  isRoleBased: boolean;
  checkedAt: string;
}

export interface BulkVerificationJob {
  id: string;
  name: string;
  sourceType: 'csv' | 'sheets' | 'manual';
  totalCount: number;
  processedCount: number;
  deliverableCount: number;
  riskyCount: number;
  undeliverableCount: number;
  syntaxErrors: number;
  status: 'completed' | 'processing' | 'paused' | 'failed';
  createdAt: string;
  completedAt?: string;
  records: BulkJobRecord[];
}

export interface Integration {
  id: string;
  name: string;
  slug: 'reachinbox' | 'instantly' | 'smartlead' | 'sheets' | 'hubspot' | 'lemlist';
  description: string;
  category: 'Cold Outreach' | 'Spreadsheets' | 'CRM';
  status: 'connected' | 'disconnected' | 'coming_soon';
  lastSyncedAt?: string;
  leadsCleaned?: number;
  autoSyncEnabled?: boolean;
  syncInterval?: 'hourly' | 'daily' | 'manual';
  apiKeyMasked?: string;
  webhookUrl?: string;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: 'full' | 'verify_only' | 'read_only';
  rateLimitPerSec: number;
  createdAt: string;
  lastUsedAt: string;
  status: 'active' | 'revoked';
}

export interface CreditTransaction {
  id: string;
  date: string;
  description: string;
  type: 'usage' | 'purchase' | 'subscription_grant' | 'refund';
  amount: number; // negative for usage, positive for purchases/grants
  resultingBalance: number;
}

export interface UserProfile {
  name: string;
  email: string;
  company: string;
  role: string;
  timezone: string;
  avatarUrl?: string;
}

export interface UserSecuritySession {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface UserPreferences {
  notifyJobCompleted: boolean;
  notifyLowCredits: boolean;
  lowCreditThreshold: number;
  weeklyDigest: boolean;
  autoExportDeliverable: boolean;
  webhookOnJobComplete: boolean;
  webhookUrl: string;
}

export interface SubscriptionInfo {
  tier: 'starter' | 'growth' | 'enterprise';
  tierName: string;
  status: 'active' | 'trial' | 'past_due' | 'canceled';
  monthlyPrice: number;
  monthlyCreditAllowance: number;
  creditsRemaining: number;
  addonCredits: number;
  renewalDate: string;
  paymentMethod: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

export interface InvoiceItem {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  planName: string;
  pdfUrl?: string;
}

export interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  unitPrice: number;
  badge?: string;
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  category: 'Outreach' | 'API' | 'Integrations' | 'Security' | 'Performance';
  status: 'in_progress' | 'planned' | 'under_review' | 'completed';
  quarter: string;
  votes: number;
  hasVoted?: boolean;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: 'Deliverability' | 'API & Webhooks' | 'Billing & Credits' | 'Integration' | 'General';
  severity: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'awaiting_reply' | 'resolved';
  createdAt: string;
  lastUpdate: string;
  messages: Array<{
    sender: 'user' | 'support';
    senderName: string;
    time: string;
    text: string;
  }>;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}
