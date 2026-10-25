import type { FaqArticle } from '../types';

export const FAQ_ARTICLES: FaqArticle[] = [
  // 1. Getting Started
  {
    id: 'faq-gs-1',
    category: 'Getting Started',
    question: 'How do I start verifying emails with MailVerify?',
    answer:
      'You can verify email addresses in two ways: (1) Use "Single Verify" for instant, ad-hoc mailbox checks with deep SMTP diagnostic telemetry; or (2) Use "Bulk Verify" to upload CSV or TSV lead lists with up to 100,000 prospects. You can also integrate directly with your outreach sequencer (Instantly, Smartlead, ReachInbox) via our Integrations tab.',
    relatedLink: { label: 'Go to Single Verify', screen: 'single' },
    helpfulCount: 84
  },
  {
    id: 'faq-gs-2',
    category: 'Getting Started',
    question: 'Do I need to install any software or desktop agents?',
    answer:
      'No. MailVerify is 100% cloud-hosted. Our verification probes run across distributed, high-reputation edge clusters in North America, Europe, and Asia to minimize network latency and avoid ISP rate-limiting.',
    relatedLink: { label: 'View Integrations', screen: 'integrations' },
    helpfulCount: 62
  },

  // 2. Account and Profile
  {
    id: 'faq-ap-1',
    category: 'Account and Profile',
    question: 'How do I update my company details, role, or notification email?',
    answer:
      'Go to Settings > Profile. There you can update your full name, primary email address, company organization name, job role, and local timezone. Updates take effect immediately across all verification receipts and notifications.',
    relatedLink: { label: 'Open Account Settings', screen: 'settings' },
    helpfulCount: 45
  },
  {
    id: 'faq-ap-2',
    category: 'Account and Profile',
    question: 'Can I invite team members or colleagues to my workspace?',
    answer:
      'Shared team workspaces and role-based permissions (Owner, Admin, Analyst, Read-only) are currently on our active product roadmap for Q1 2027. You can upvote this feature in the Roadmap tab to accelerate its release.',
    relatedLink: { label: 'View Roadmap', screen: 'roadmap' },
    helpfulCount: 39
  },

  // 3. Authentication and Security
  {
    id: 'faq-as-1',
    category: 'Authentication and Security',
    question: 'How does MailVerify secure API keys and active login sessions?',
    answer:
      'All API tokens are generated using cryptographically secure random bytes with prefix hashing (`mv_live_••••`). Raw tokens are shown only once upon generation. You can inspect all active sessions, IP addresses, and revoke credentials at any time in Settings > Security or the API & Webhooks dashboard.',
    relatedLink: { label: 'API Security Console', screen: 'api' },
    helpfulCount: 71
  },
  {
    id: 'faq-as-2',
    category: 'Authentication and Security',
    question: 'Does MailVerify support Two-Factor Authentication (2FA)?',
    answer:
      'Yes. Time-based One-Time Password (TOTP) 2FA can be configured via Google Authenticator, 1Password, or any standard RFC 6238 authenticator app under Settings > Security.',
    relatedLink: { label: 'Security Settings', screen: 'settings' },
    helpfulCount: 53
  },

  // 4. Product Features
  {
    id: 'faq-pf-1',
    category: 'Product Features',
    question: 'How does the simulated SMTP handshake verify a mailbox without sending an email?',
    answer:
      'MailVerify establishes an authentic socket connection to the authoritative MX server discovered via DNS lookups. We issue standard RFC 5321 commands (EHLO, MAIL FROM, and RCPT TO). If the receiving server returns status code `250 2.1.5 Recipient OK`, the mailbox exists and accepts messages. We terminate the session immediately with `RST/QUIT` without dispatching message headers or body.',
    relatedLink: { label: 'Test an Email in Single Verify', screen: 'single' },
    helpfulCount: 142
  },
  {
    id: 'faq-pf-2',
    category: 'Product Features',
    question: 'What is Catch-All (Accept-All) detection and why is it important?',
    answer:
      'A catch-all mail server is configured to accept incoming emails sent to any address on that domain, even if the specific mailbox does not exist (e.g. randomstring12345@domain.com). MailVerify tests the domain with an unpredictable randomized recipient probe. If the server accepts it, we flag the domain as Catch-All and assign a "Risky" rating rather than false "Deliverable".',
    relatedLink: { label: 'Single Verify Telemetry', screen: 'single' },
    helpfulCount: 119
  },
  {
    id: 'faq-pf-3',
    category: 'Product Features',
    question: 'How does Spam Trap and Honeypot detection protect my domain?',
    answer:
      'Spam traps are decoy email addresses created by ISPs and anti-spam consortiums (such as Spamhaus and Barracuda) to detect unverified scrapers and purchased lists. MailVerify cross-references multiple global honeypot databases and domain age markers, calculating a 0–100% spam trap risk score to keep you off DNS blacklists.',
    relatedLink: { label: 'Verify Single Lead', screen: 'single' },
    helpfulCount: 97
  },

  // 5. Usage and Limits
  {
    id: 'faq-ul-1',
    category: 'Usage and Limits',
    question: 'What are the default API rate limits and requests-per-second (RPS)?',
    answer:
      'Starter accounts support up to 25 requests per second; Growth accounts support up to 50 requests per second. Enterprise accounts receive dedicated IP pools capable of 500+ RPS with custom burst allowances and dedicated SLAs. Check your current allocation in the API & Webhooks console.',
    relatedLink: { label: 'View API Console', screen: 'api' },
    helpfulCount: 88
  },
  {
    id: 'faq-ul-2',
    category: 'Usage and Limits',
    question: 'What is the maximum file size and row limit for Bulk Verification?',
    answer:
      'You can upload CSV or TSV files up to 50MB containing up to 100,000 email addresses per batch. Bulk jobs process concurrently at roughly 10,000 addresses per minute across our edge nodes with automated deduplication.',
    relatedLink: { label: 'Go to Bulk Verify', screen: 'bulk' },
    helpfulCount: 64
  },

  // 6. Billing and Payments
  {
    id: 'faq-bp-1',
    category: 'Billing and Payments',
    question: 'Do purchased Add-on credits ever expire?',
    answer:
      'No. Purchased Add-on Credit packages never expire and roll over indefinitely. Your monthly plan allowance refreshes at the start of each billing cycle, while your add-on balance acts as a permanent safety buffer for seasonal outreach spikes.',
    relatedLink: { label: 'Buy Credits & Add-on Packs', screen: 'buy-credits' },
    helpfulCount: 156
  },
  {
    id: 'faq-bp-2',
    category: 'Billing and Payments',
    question: 'Are credits refunded if an email address is syntax-invalid or a duplicate?',
    answer:
      'Syntax errors and duplicate entries detected during bulk list parsing do not consume verification credits. Credits are only deducted when a live DNS MX lookup and SMTP probe are successfully performed. In addition, verifying the exact same email within a 24-hour cache window is free of charge.',
    relatedLink: { label: 'View Credit Balance', screen: 'buy-credits' },
    helpfulCount: 103
  },

  // 7. Data, Imports, and Exports
  {
    id: 'faq-de-1',
    category: 'Data, Imports, and Exports',
    question: 'What file formats are supported for bulk contact imports?',
    answer:
      'MailVerify supports CSV (`.csv`), TSV (`.tsv`), plain text lists (`.txt` with one email per line), and direct copy-paste. Our intelligent header parser automatically detects columns named `email`, `e-mail`, `contact`, or `recipient` regardless of column position.',
    relatedLink: { label: 'Upload a List in Bulk Verify', screen: 'bulk' },
    helpfulCount: 78
  },
  {
    id: 'faq-de-2',
    category: 'Data, Imports, and Exports',
    question: 'Can I export only Deliverable contacts to avoid polluting my CRM?',
    answer:
      'Yes. On the Bulk Verify results screen, you can filter by Deliverable, Risky, or Undeliverable, and click "Export Filtered CSV". You can also enable "Auto-export deliverable only" in Settings > Preferences.',
    relatedLink: { label: 'Preferences Settings', screen: 'settings' },
    helpfulCount: 82
  },

  // 8. Troubleshooting
  {
    id: 'faq-tb-1',
    category: 'Troubleshooting',
    question: 'Why does a Microsoft 365 or Outlook address return as Risky?',
    answer:
      'Microsoft 365 and Exchange Online domains often enable directory harvesting defense, configuring the mail server to accept any recipient during the initial SMTP handshake. Because the server returns 250 OK for nonexistent mailboxes as well, MailVerify flags them as "Risky (Catch-all)" to alert you that the mailbox cannot be 100% verified without sending an email. Best practice: segment catch-alls and send with gentle volume.',
    relatedLink: { label: 'Test in Single Verify', screen: 'single' },
    helpfulCount: 135
  },
  {
    id: 'faq-tb-2',
    category: 'Troubleshooting',
    question: 'What does "SMTP 421 / 450 Greylisting" mean in the verification telemetry?',
    answer:
      'Status codes in the 4xx range indicate temporary greylisting or rate-limiting by the recipient server. MailVerify automatically retries greylisted servers using secondary probe IPs and backoff strategies. If the server continues to defer the connection, the email is scored as Risky.',
    relatedLink: { label: 'Inspect Diagnostic Check', screen: 'single' },
    helpfulCount: 92
  },

  // 9. Privacy and Data Protection
  {
    id: 'faq-pd-1',
    category: 'Privacy and Data Protection',
    question: 'Does MailVerify store or resell verified email lists?',
    answer:
      'Never. MailVerify does not store, share, enrich, or monetize client email lists. Verification logs and results are stored encrypted in your private tenant and can be permanently deleted at any time with one click. We comply fully with GDPR, CCPA, and SOC 2 Type II audit requirements.',
    relatedLink: { label: 'Security & Compliance', screen: 'settings' },
    helpfulCount: 167
  },
  {
    id: 'faq-pd-2',
    category: 'Privacy and Data Protection',
    question: 'Will recipients know that MailVerify verified their mailbox?',
    answer:
      'No. Recipient mailboxes never receive any email, notification, or preview. Because our SMTP transaction terminates with a clean QUIT before any DATA command is issued, no message enters the recipient inbox or spam folder.',
    relatedLink: { label: 'Single Verify Diagnostics', screen: 'single' },
    helpfulCount: 121
  },

  // 10. Other Questions
  {
    id: 'faq-oq-1',
    category: 'Other Questions',
    question: 'Where can I check system uptime and incident history?',
    answer:
      'Live engine telemetry is displayed directly on the Help & Support page and Single Verify screens. Our core SMTP verification clusters maintain a 99.99% operational uptime track record across all regions.',
    relatedLink: { label: 'Single Verify & Telemetry', screen: 'single' },
    helpfulCount: 47
  },
  {
    id: 'faq-oq-2',
    category: 'Other Questions',
    question: 'How do I submit a feature request or upvote planned integrations?',
    answer:
      'Check the "Roadmap" tab in the left navigation. You can explore features under consideration, in progress, or recently launched (e.g. HubSpot CRM bi-directional sync, typo auto-correction), cast your upvotes, or submit new suggestions.',
    relatedLink: { label: 'Open Product Roadmap', screen: 'roadmap' },
    helpfulCount: 58
  },
  {
    id: 'faq-pf-4',
    category: 'Product Features',
    question: 'How does MailVerify identify disposable and temporary email addresses?',
    answer:
      'Our engine maintains an updated registry of over 115,000 ephemeral webmail domains (e.g., Mailinator, Temp-Mail, GuerrillaMail, 10MinuteMail). When an email is submitted with one of these domains, it is instantly flagged as disposable with a 0 deliverability score to prevent spam signups and burner lead wasting.',
    relatedLink: { label: 'Test Disposable in Single Verify', screen: 'single' },
    helpfulCount: 104
  },
  {
    id: 'faq-pf-5',
    category: 'Product Features',
    question: 'What are role-based addresses and should I send cold emails to them?',
    answer:
      'Role-based addresses (such as admin@, support@, sales@, billing@, info@, contact@) represent generic team distribution inboxes rather than individual decision-makers. They have high spam complaint rates and frequent turnover. MailVerify flags them so you can exclude them from cold outreach campaigns or route them to specialized inbound queues.',
    relatedLink: { label: 'Run Single Verify', screen: 'single' },
    helpfulCount: 89
  },
  {
    id: 'faq-pf-6',
    category: 'Product Features',
    question: 'How does automated syncing with Instantly, Smartlead, and ReachInbox work?',
    answer:
      'Once connected via your sequencer API key in the Integrations tab, MailVerify continuously checks your outreach campaigns on an automated schedule (Hourly, Daily, or Manual). Bounces are prevented proactively by auto-tagging leads and pausing undeliverable prospects before campaigns dispatch.',
    relatedLink: { label: 'Manage Integrations', screen: 'integrations' },
    helpfulCount: 112
  },
  {
    id: 'faq-as-3',
    category: 'Authentication and Security',
    question: 'How do I verify the HMAC-SHA256 signature on webhook notifications?',
    answer:
      'Every webhook payload includes the `X-MailVerify-Signature` header. Compute an HMAC using SHA-256 with your Webhook Secret Key as the secret and the raw request body string as the payload. Compare the hexadecimal digest against the header using a constant-time string comparison function to prevent timing attacks.',
    relatedLink: { label: 'View API & Webhooks Console', screen: 'api' },
    helpfulCount: 96
  },
  {
    id: 'faq-bp-3',
    category: 'Billing and Payments',
    question: 'How does the 24-hour verification cache save credits?',
    answer:
      'If you verify the exact same email address multiple times within a 24-hour rolling window (across single checks, bulk imports, or API requests), MailVerify serves the result instantly from high-speed edge cache without consuming any verification credits.',
    relatedLink: { label: 'View Credits & Packages', screen: 'buy-credits' },
    helpfulCount: 128
  }
];

export const FAQ_CATEGORIES = [
  'All',
  'Getting Started',
  'Account and Profile',
  'Authentication and Security',
  'Product Features',
  'Usage and Limits',
  'Billing and Payments',
  'Data, Imports, and Exports',
  'Troubleshooting',
  'Privacy and Data Protection',
  'Other Questions'
] as const;

export type FaqCategoryName = (typeof FAQ_CATEGORIES)[number];

export function searchFaqArticles(query: string, category: string = 'All'): FaqArticle[] {
  const q = query.trim().toLowerCase();

  return FAQ_ARTICLES.filter((item) => {
    const matchesCategory = category === 'All' || item.category === category;
    if (!matchesCategory) return false;

    if (!q) return true;

    const inQuestion = item.question.toLowerCase().includes(q);
    const inAnswer = item.answer.toLowerCase().includes(q);
    const inCategory = item.category.toLowerCase().includes(q);

    return inQuestion || inAnswer || inCategory;
  });
}
