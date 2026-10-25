import { searchFaqArticles } from './knowledgeBase';
import type { ScreenId, TicketCategory, TicketIssueType } from '../types';

export interface AssistantResponse {
  text: string;
  suggestedAction?: {
    label: string;
    screen: ScreenId | 'ticket_modal';
    prefillData?: {
      subject: string;
      category: TicketCategory;
      description: string;
      issueType: TicketIssueType;
    };
  };
  isEscalationSuggested?: boolean;
  groundedSource?: string;
  provider: 'gemini-live' | 'knowledge-engine';
}

/**
 * Helper to safely read env variables in both browser Vite and Node/test environments
 */
function getEnvVar(key: string): string {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return (import.meta.env as Record<string, string>)[key] || '';
    }
  } catch {}
  return '';
}

/**
 * Checks if a live AI provider API key is configured in the environment.
 */
export function getAiConfig() {
  const geminiKey = getEnvVar('VITE_GEMINI_API_KEY');
  const customEndpoint = getEnvVar('VITE_AI_ENDPOINT');

  return {
    isConfigured: Boolean(geminiKey || customEndpoint),
    providerName: geminiKey ? 'Google Gemini Pro' : customEndpoint ? 'Custom AI Endpoint' : 'MailVerify Grounded Knowledge Engine',
    hasKey: Boolean(geminiKey)
  };
}

/**
 * Core Assistant Answer Resolver.
 * Uses real Google Gemini API if VITE_GEMINI_API_KEY is present,
 * or our grounded RFC/knowledge base retrieval engine.
 */
export async function querySupportAssistant(
  userQuery: string,
  history: Array<{ sender: 'user' | 'bot' | 'assistant'; text: string }> = []
): Promise<AssistantResponse> {
  const query = userQuery.trim();
  const geminiKey = getEnvVar('VITE_GEMINI_API_KEY');

  // 1. If real Gemini API key is configured, perform real AI API call
  if (geminiKey) {
    try {
      const response = await callGeminiApi(query, history, geminiKey);
      return response;
    } catch (err) {
      console.warn('Gemini API call failed, gracefully falling back to grounded knowledge engine:', err);
    }
  }

  // 2. High-precision Grounded Retrieval Engine
  return generateGroundedAnswer(query);
}

/**
 * Real API call implementation for Google Gemini
 */
async function callGeminiApi(
  query: string,
  history: Array<{ sender: 'user' | 'bot' | 'assistant'; text: string }>,
  apiKey: string
): Promise<AssistantResponse> {
  const historyText = history.length > 0 
    ? `Recent Conversation Context:\n${history.map(h => `${h.sender}: ${h.text}`).join('\n')}\n\n`
    : '';

  const systemInstruction = `You are the MailVerify Technical Support Assistant. 
MailVerify is an enterprise email verification and deliverability platform that verifies emails via simulated SMTP handshakes (zero test emails sent), DNS MX lookups, catch-all server detection, and spam trap scoring.
Only answer questions regarding MailVerify, email deliverability, DNS (MX, SPF, DKIM, DMARC), SMTP response codes (250 OK, 550 User Unknown, 421/450 Greylisting), sequencer integrations (ReachInbox, Instantly, Smartlead), and API rate limits.
Never fabricate user data, pricing, or internal policies. If you are not confident, explain the limitation honestly and offer to escalate to an engineering support ticket.`;

  const contents = [
    {
      role: 'user',
      parts: [{ text: `${systemInstruction}\n\n${historyText}User Question: ${query}` }]
    }
  ];

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 500
      }
    })
  });

  if (!res.ok) {
    throw new Error(`Gemini API returned status ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  return {
    text: text.trim(),
    provider: 'gemini-live',
    groundedSource: 'Gemini 1.5 Flash Grounded Model'
  };
}

/**
 * High-precision knowledge-retrieval engine
 * Grounded in MailVerify's RFC 5321 specs, DNS rules, and product capabilities.
 */
function generateGroundedAnswer(query: string): AssistantResponse {
  const q = query.toLowerCase();

  // Search knowledge base articles first
  const matchedArticles = searchFaqArticles(query);

  // Specific high-frequency operational scenarios:
  if (q.includes('risky') || q.includes('catchall') || q.includes('catch-all') || q.includes('accept-all') || q.includes('microsoft 365')) {
    return {
      text: 'A "Risky" rating in MailVerify is assigned when a domain is configured as Catch-All (accepting any incoming mail address at the SMTP handshake stage regardless of mailbox existence), or when an address is role-based (like billing@, info@, support@).\n\n• Impact: Sending blindly to catch-alls increases bounce risk because invalid mailboxes cannot be 100% distinguished.\n• Best Practice: Segment risky leads and warm them separately with small daily batches (< 10% of campaign volume).',
      suggestedAction: {
        label: 'Test Address in Single Verify',
        screen: 'single'
      },
      groundedSource: 'RFC 5321 / Catch-All Detection Rulebase',
      provider: 'knowledge-engine'
    };
  }

  if (q.includes('smtp') || q.includes('handshake') || q.includes('test email') || q.includes('probe')) {
    return {
      text: 'MailVerify executes an authentic, zero-impact simulated SMTP handshake:\n1. We resolve authoritative MX hosts via DNS.\n2. We connect via TLS on port 25 using our verified edge IP cluster.\n3. We send EHLO, MAIL FROM, and query RCPT TO.\n4. We inspect the server status code (250 OK = Deliverable, 550 = Undeliverable).\n5. We send a clean QUIT command before any DATA payload is sent.\n\nResult: 100% verified mailboxes without any message ever landing in the recipient inbox.',
      suggestedAction: {
        label: 'Run Single Verification Probe',
        screen: 'single'
      },
      groundedSource: 'MailVerify SMTP Engine Specification',
      provider: 'knowledge-engine'
    };
  }

  if (q.includes('250') || q.includes('550') || q.includes('421') || q.includes('450') || q.includes('status code')) {
    return {
      text: 'Key SMTP Status Codes in MailVerify telemetry:\n• 250 2.1.5 Recipient OK: Mailbox confirmed active and accepting mail.\n• 550 5.1.1 User Unknown: Mailbox does not exist (Guaranteed hard bounce).\n• 421 / 450: Server busy or greylisting temporary deferral (Automatically retried by MailVerify).\n• 554: Transaction failed or rejected by spam policy.',
      suggestedAction: {
        label: 'Inspect Telemetry in Single Verify',
        screen: 'single'
      },
      groundedSource: 'RFC 5321 SMTP Telemetry Codes',
      provider: 'knowledge-engine'
    };
  }

  if (q.includes('instantly') || q.includes('smartlead') || q.includes('reachinbox') || q.includes('lemlist') || q.includes('connect')) {
    return {
      text: 'To connect cold outreach sequencers:\n1. Navigate to the "Integrations" page.\n2. Click "Connect" on Instantly, ReachInbox, or Smartlead.\n3. Paste your workspace API token and choose your sync schedule (Hourly, Daily, or Manual).\n\nMailVerify will automatically scrub campaigns, tag deliverability scores, and pause undeliverable prospects before campaigns dispatch.',
      suggestedAction: {
        label: 'Open Integrations Dashboard',
        screen: 'integrations'
      },
      groundedSource: 'Outreach Integrations Guide',
      provider: 'knowledge-engine'
    };
  }

  if (q.includes('credit') || q.includes('expire') || q.includes('rollover') || q.includes('refund') || q.includes('pricing')) {
    return {
      text: 'MailVerify Credit System details:\n• Monthly Plan Allowance: Refreshes on the 1st of each billing cycle.\n• Add-on Credit Packages: Never expire and roll over indefinitely, acting as your permanent safety reserve.\n• Consumption: Exactly 1 credit per verified email. Syntax-invalid addresses and duplicate emails verified within 24 hours are free.',
      suggestedAction: {
        label: 'View Credit Balance & Packages',
        screen: 'buy-credits'
      },
      groundedSource: 'MailVerify Billing & Credits Policy',
      provider: 'knowledge-engine'
    };
  }

  if (q.includes('rate limit') || q.includes('rps') || q.includes('api') || q.includes('concurrency')) {
    return {
      text: 'API Rate Limits:\n• Starter Tier: 25 requests/sec\n• Growth Tier: 50 requests/sec\n• Enterprise: 500+ requests/sec on dedicated IP clusters with 99.99% SLA.\n\nYou can generate scoped API keys and configure webhook callbacks in the API & Webhooks dashboard.',
      suggestedAction: {
        label: 'View API & Webhooks Dashboard',
        screen: 'api'
      },
      groundedSource: 'MailVerify Developer Documentation',
      provider: 'knowledge-engine'
    };
  }

  if (q.includes('spam trap') || q.includes('honeypot') || q.includes('blacklist')) {
    return {
      text: 'Spam traps are honeypots monitored by ISPs and security consortiums (like Spamhaus or Barracuda) to identify bulk senders with poor hygiene. MailVerify evaluates historical domain inactivity, mx patterns, and global honeypot datasets to calculate a 0–100% trap score so your cold outbound domains remain safe.',
      suggestedAction: {
        label: 'Check Spam Trap Score in Single Verify',
        screen: 'single'
      },
      groundedSource: 'Spam Trap & Honeypot Engine',
      provider: 'knowledge-engine'
    };
  }

  if (q.includes('disposable') || q.includes('temp mail') || q.includes('mailinator') || q.includes('10minutemail')) {
    return {
      text: 'MailVerify actively maintains an index of over 115,000 temporary and throwaway email providers (e.g. Temp-Mail, Mailinator, GuerrillaMail).\n\n• Scoring: Disposable addresses receive a deliverability score of 0 and an Undeliverable flag.\n• Recommendation: Never add disposable emails to CRM outreach or outbound campaigns, as they degrade sender reputation.',
      suggestedAction: {
        label: 'Test Disposable in Single Verify',
        screen: 'single'
      },
      groundedSource: 'Disposable Domain Registry (115k+ domains)',
      provider: 'knowledge-engine'
    };
  }

  if (q.includes('role') || q.includes('admin@') || q.includes('support@') || q.includes('info@') || q.includes('sales@')) {
    return {
      text: 'Role-based mailboxes (admin@, support@, sales@, billing@, info@) are team distribution inboxes rather than direct personal addresses.\n\n• Risk: Role mailboxes frequently change hands and trigger high spam complaint rates.\n• Best Practice: MailVerify identifies these addresses so you can filter them out of cold prospect sequences.',
      suggestedAction: {
        label: 'Run Single Check',
        screen: 'single'
      },
      groundedSource: 'RFC Role-Based Mailbox Classification',
      provider: 'knowledge-engine'
    };
  }

  if (q.includes('bulk') || q.includes('csv') || q.includes('tsv') || q.includes('upload') || q.includes('file format') || q.includes('100,000') || q.includes('50mb')) {
    return {
      text: 'MailVerify Bulk Verification specifications:\n• Supported Formats: CSV (.csv), TSV (.tsv), Plain Text (.txt), and copy-paste.\n• File Limits: Up to 50MB and up to 100,000 email addresses per batch.\n• Column Auto-Detection: Automatically parses columns named email, e-mail, contact, or recipient.\n• Deduplication & Sanitization: Duplicates and syntax errors are cleansed automatically and do not consume credits.',
      suggestedAction: {
        label: 'Go to Bulk Verify',
        screen: 'bulk'
      },
      groundedSource: 'Bulk Ingestion Engine Specification',
      provider: 'knowledge-engine'
    };
  }

  if (q.includes('webhook') || q.includes('hmac') || q.includes('signature') || q.includes('x-mailverify-signature')) {
    return {
      text: 'MailVerify Webhook Security (HMAC-SHA256):\n1. Each outgoing webhook payload contains the `X-MailVerify-Signature` header.\n2. Compute `crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawPayload).digest("hex")`.\n3. Compare the computed hex digest against `X-MailVerify-Signature` using constant-time comparison (`crypto.timingSafeEqual`) to prevent timing attacks.',
      suggestedAction: {
        label: 'View Webhook Settings in API Console',
        screen: 'api'
      },
      groundedSource: 'API & Webhooks Security Protocol',
      provider: 'knowledge-engine'
    };
  }

  if (q.includes('2fa') || q.includes('totp') || q.includes('authenticator') || q.includes('security') || q.includes('session')) {
    return {
      text: 'MailVerify Account Security:\n• Two-Factor Authentication (2FA): Supports standard RFC 6238 TOTP apps (Google Authenticator, 1Password, Authy).\n• Active Sessions: Inspect browser type, IP address, and location for all logged-in devices under Settings > Security. You can revoke any session remotely with one click.',
      suggestedAction: {
        label: 'Open Security Settings',
        screen: 'settings'
      },
      groundedSource: 'Enterprise Authentication & Security Policy',
      provider: 'knowledge-engine'
    };
  }

  // If a knowledge base article matched well:
  if (matchedArticles.length > 0) {
    const topArticle = matchedArticles[0];
    return {
      text: `${topArticle.answer}\n\nRelated Topic: ${topArticle.category}`,
      suggestedAction: topArticle.relatedLink
        ? { label: topArticle.relatedLink.label, screen: topArticle.relatedLink.screen }
        : undefined,
      groundedSource: `FAQ: ${topArticle.category}`,
      provider: 'knowledge-engine'
    };
  }

  // If question is not covered by knowledge base or system capabilities:
  // Honest explanation and direct escalation prefill.
  return {
    text: `I've checked our verified technical knowledge base, but I cannot confidently answer this specific inquiry:\n\n"${query}"\n\nTo ensure you receive accurate guidance without speculation, I recommend escalating this to our senior deliverability engineers. I can transfer our conversation directly into a support ticket so you don't have to retype your issue.`,
    isEscalationSuggested: true,
    suggestedAction: {
      label: 'Escalate to Engineering Ticket',
      screen: 'ticket_modal',
      prefillData: {
        subject: `Technical Inquiry: ${query.length > 50 ? query.substring(0, 47) + '...' : query}`,
        category: determineCategoryFromQuery(query),
        issueType: 'technical',
        description: `User asked the AI Assistant:\n"${query}"\n\nAssistant note: Question requires specialized review from the engineering team.`
      }
    },
    groundedSource: 'Unresolved Inquiry / Escalation Protocol',
    provider: 'knowledge-engine'
  };
}

function determineCategoryFromQuery(q: string): TicketCategory {
  const lower = q.toLowerCase();
  if (lower.includes('api') || lower.includes('webhook') || lower.includes('token') || lower.includes('key')) return 'API & Webhooks';
  if (lower.includes('instantly') || lower.includes('smartlead') || lower.includes('reachinbox') || lower.includes('hubspot')) return 'Cold Outreach Integrations';
  if (lower.includes('billing') || lower.includes('credit') || lower.includes('invoice') || lower.includes('payment')) return 'Billing & Credits';
  if (lower.includes('export') || lower.includes('import') || lower.includes('csv') || lower.includes('tsv')) return 'Data & Exports';
  if (lower.includes('login') || lower.includes('password') || lower.includes('session') || lower.includes('2fa')) return 'Account & Security';
  return 'Deliverability';
}

/**
 * Formats a chat history into a structured ticket description
 */
export function buildTicketPrefillFromHistory(
  messages: Array<{ sender: 'user' | 'bot' | 'assistant'; text: string }>
): { subject: string; description: string; category: TicketCategory } {
  const userMessages = messages.filter((m) => m.sender === 'user').map((m) => m.text);
  const lastUserQuestion = userMessages[userMessages.length - 1] || 'Assistance needed with deliverability inquiry';

  const category = determineCategoryFromQuery(lastUserQuestion);
  const subject = lastUserQuestion.length > 60 ? `${lastUserQuestion.substring(0, 57)}...` : lastUserQuestion;

  const conversationTranscript = messages
    .map((m) => `[${m.sender === 'user' ? 'User' : 'AI Assistant'}]: ${m.text}`)
    .join('\n\n');

  const description = `### Escalated from AI Support Chat\n\n**Primary Question / Issue:**\n${lastUserQuestion}\n\n**Conversation Summary:**\n${conversationTranscript}`;

  return {
    subject,
    description,
    category
  };
}
