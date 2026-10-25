import type {
  SupportTicket,
  TicketMessage,
  TicketAttachment,
  TicketTimelineEvent,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketIssueType
} from '../types';

const STORAGE_KEY = 'mv_support_tickets_v3';

// Initial realistic enterprise tickets demonstrating different lifecycle states
const INITIAL_ENTERPRISE_TICKETS: SupportTicket[] = [
  {
    id: 'TICK-8492',
    ticketNumber: 'TICK-8492',
    userId: 'usr_shanmukh_01',
    contactEmail: 'shanmukh@mailverify.enterprise',
    subject: 'Microsoft 365 Exchange Online catch-all false positives analysis',
    description:
      'We noticed during our Q4 outreach run that certain Microsoft 365 corporate domains are scored as Risky due to directory harvesting defense. Can we get recommendations on safe sending thresholds for these specific accounts?',
    category: 'Deliverability',
    issueType: 'technical',
    productModule: 'Single Verify',
    priority: 'high',
    severity: 'high',
    status: 'in_progress',
    createdAt: '2026-10-23 09:15',
    lastUpdate: '2026-10-23 11:30',
    updatedAt: '2026-10-23 11:30',
    timeline: [
      {
        id: 'tl_1',
        type: 'created',
        description: 'Ticket created via Support Portal',
        timestamp: '2026-10-23 09:15',
        actor: 'Shanmukh Vutikuri (You)'
      },
      {
        id: 'tl_2',
        type: 'assigned',
        description: 'Assigned to Marcus Sterling (Senior Deliverability Engineer)',
        timestamp: '2026-10-23 09:30',
        actor: 'MailVerify Dispatch Automation'
      },
      {
        id: 'tl_3',
        type: 'support_reply',
        description: 'Support response sent with Microsoft 365 guidance',
        timestamp: '2026-10-23 11:30',
        actor: 'Marcus Sterling (Deliverability)'
      }
    ],
    messages: [
      {
        id: 'msg_1',
        sender: 'user',
        senderName: 'Shanmukh Vutikuri',
        time: '09:15 AM',
        text: 'Hello team, our outbound outreach team has 1,400 leads on Microsoft 365. The verification engine flagged 18% as Risky (Catch-all). What are the safest sending thresholds?'
      },
      {
        id: 'msg_2',
        sender: 'support',
        senderName: 'Marcus Sterling',
        senderRole: 'Senior Deliverability Engineer',
        time: '11:30 AM',
        text: 'Hi Shanmukh,\n\nMicrosoft 365 frequently enables tenant-level Catch-all to thwart directory harvesting. This causes their MX servers to return `250 2.1.5 Recipient OK` for any probed recipient string.\n\nOur recommendation:\n1. Separate Catch-all leads from confirmed `Deliverable` leads.\n2. Keep catch-all volume below 8–10% of your daily mailbox dispatch quota.\n3. Utilize our typo-correction engine to catch obvious domain misspellings first.\n\nWe are currently analyzing your recent batch job `Q4_Outreach_US_Tech_Leads.csv` to evaluate bounce risk telemetry.'
      }
    ]
  },
  {
    id: 'TICK-6140',
    ticketNumber: 'TICK-6140',
    userId: 'usr_shanmukh_01',
    contactEmail: 'shanmukh@mailverify.enterprise',
    subject: 'Webhook callback payload signature verification assistance',
    description:
      'We are integrating MailVerify bulk webhook notifications into our internal lead ingestion pipeline. We need clarification on the HMAC-SHA256 signature header format.',
    category: 'API & Webhooks',
    issueType: 'technical',
    productModule: 'API & Webhooks',
    priority: 'normal',
    severity: 'normal',
    status: 'waiting_user',
    createdAt: '2026-10-21 14:00',
    lastUpdate: '2026-10-21 16:45',
    updatedAt: '2026-10-21 16:45',
    timeline: [
      {
        id: 'tl_11',
        type: 'created',
        description: 'Ticket created via API Console',
        timestamp: '2026-10-21 14:00',
        actor: 'Shanmukh Vutikuri (You)'
      },
      {
        id: 'tl_12',
        type: 'support_reply',
        description: 'Technical explanation provided with sample Node.js code',
        timestamp: '2026-10-21 16:45',
        actor: 'Elena Rostova (API Platform)'
      }
    ],
    messages: [
      {
        id: 'msg_11',
        sender: 'user',
        senderName: 'Shanmukh Vutikuri',
        time: '02:00 PM',
        text: 'Could you share an example of validating the `X-MailVerify-Signature` header in Node.js/TypeScript?'
      },
      {
        id: 'msg_12',
        sender: 'support',
        senderName: 'Elena Rostova',
        senderRole: 'API Platform Specialist',
        time: '04:45 PM',
        text: 'Hi Shanmukh,\n\nThe webhook signature is an HMAC-SHA256 hash of the raw JSON request payload using your webhook secret key.\n\nHere is the verification snippet:\n```ts\nconst hash = crypto.createHmac(\'sha256\', secret).update(rawBody).digest(\'hex\');\nconst isValid = crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));\n```\nCould you confirm if you are parsing the raw body buffer before JSON parsing middleware runs?'
      }
    ]
  },
  {
    id: 'TICK-3912',
    ticketNumber: 'TICK-3912',
    userId: 'usr_shanmukh_01',
    contactEmail: 'shanmukh@mailverify.enterprise',
    subject: 'Request for dedicated IP cluster quota increase for Q4 campaigns',
    description:
      'We plan to scale our verification volume from 50 RPS to 150 RPS next week. Requesting provisioned concurrency allocation.',
    category: 'Billing & Credits',
    issueType: 'feature',
    productModule: 'API & Webhooks',
    priority: 'urgent',
    severity: 'urgent',
    status: 'resolved',
    createdAt: '2026-10-15 10:00',
    lastUpdate: '2026-10-15 12:10',
    updatedAt: '2026-10-15 12:10',
    resolvedAt: '2026-10-15 12:10',
    timeline: [
      {
        id: 'tl_21',
        type: 'created',
        description: 'Ticket created',
        timestamp: '2026-10-15 10:00',
        actor: 'Shanmukh Vutikuri (You)'
      },
      {
        id: 'tl_22',
        type: 'status_change',
        description: 'Concurrency upgraded to 200 RPS across European & US Edge nodes',
        timestamp: '2026-10-15 12:10',
        actor: 'DevOps / Infrastructure Cluster'
      }
    ],
    messages: [
      {
        id: 'msg_21',
        sender: 'user',
        senderName: 'Shanmukh Vutikuri',
        time: '10:00 AM',
        text: 'We are launching our Q4 enterprise outreach push and need our API rate limits expanded from 50 to 150 RPS.'
      },
      {
        id: 'msg_22',
        sender: 'support',
        senderName: 'DevOps Engineering',
        senderRole: 'Infrastructure Ops',
        time: '12:10 PM',
        text: 'Limit provisioned! Your production key `mv_live_••••8e4a` is now allocated 200 RPS across our global edge nodes. You can verify this in your API settings.'
      }
    ]
  }
];

export interface CreateTicketParams {
  subject: string;
  category: TicketCategory;
  issueType: TicketIssueType;
  priority: TicketPriority;
  productModule?: string;
  description: string;
  contactEmail: string;
  userId?: string;
  attachments?: TicketAttachment[];
  conversationSummary?: string;
}

export class SupportBackendService {
  private static loadTickets(): SupportTicket[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ENTERPRISE_TICKETS));
        return INITIAL_ENTERPRISE_TICKETS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to read tickets from persistent storage', e);
      return INITIAL_ENTERPRISE_TICKETS;
    }
  }

  private static saveTickets(tickets: SupportTicket[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    } catch (e) {
      console.error('Failed to persist tickets to storage', e);
    }
  }

  /**
   * Retrieves all tickets for the authenticated user, sorted by most recently updated.
   */
  public static async getTickets(userId: string = 'usr_shanmukh_01'): Promise<SupportTicket[]> {
    const all = this.loadTickets();
    // Security ownership check: In single-user enterprise workspace, returns user's tickets
    const userTickets = all.filter((t) => !t.userId || t.userId === userId);
    return userTickets.sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime());
  }

  /**
   * Retrieves a specific ticket with ownership authorization check.
   */
  public static async getTicketById(ticketId: string, userId: string = 'usr_shanmukh_01'): Promise<SupportTicket | null> {
    const all = this.loadTickets();
    const ticket = all.find((t) => t.id === ticketId);
    if (!ticket) return null;
    if (ticket.userId && ticket.userId !== userId) {
      throw new Error('403 Forbidden: You do not have authorization to view this support ticket.');
    }
    return ticket;
  }

  /**
   * Creates and persists a new support ticket with full validation.
   */
  public static async createTicket(params: CreateTicketParams): Promise<SupportTicket> {
    // 1. Validation
    if (!params.subject || params.subject.trim().length < 3) {
      throw new Error('Issue title must be at least 3 characters.');
    }
    if (!params.description || params.description.trim().length < 10) {
      throw new Error('Issue description must be at least 10 characters.');
    }
    if (!params.contactEmail || !params.contactEmail.includes('@')) {
      throw new Error('A valid contact email is required.');
    }

    // 2. Generate unique human-readable ticket reference
    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const existing = this.loadTickets();
    let uniqueRef = '';
    do {
      uniqueRef = `TICK-${Math.floor(1000 + Math.random() * 9000)}`;
    } while (existing.some((t) => t.id === uniqueRef));

    const initialMessage: TicketMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      senderName: 'Shanmukh Vutikuri',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: params.description.trim(),
      attachments: params.attachments
    };

    const initialTimeline: TicketTimelineEvent[] = [
      {
        id: `tl_${Date.now()}_1`,
        type: 'created',
        description: `Ticket created: [${params.issueType.toUpperCase()}] ${params.subject.trim()}`,
        timestamp: timestampStr,
        actor: 'Shanmukh Vutikuri'
      },
      {
        id: `tl_${Date.now()}_2`,
        type: 'assigned',
        description: `Routed to ${params.category} Engineering Cluster (< 2h SLA)`,
        timestamp: timestampStr,
        actor: 'Automated Dispatch'
      }
    ];

    const newTicket: SupportTicket = {
      id: uniqueRef,
      ticketNumber: uniqueRef,
      userId: params.userId || 'usr_shanmukh_01',
      contactEmail: params.contactEmail,
      subject: params.subject.trim(),
      description: params.description.trim(),
      category: params.category,
      issueType: params.issueType,
      productModule: params.productModule || 'General',
      priority: params.priority,
      severity: params.priority,
      status: 'open',
      createdAt: timestampStr,
      lastUpdate: 'Just now',
      updatedAt: timestampStr,
      conversationSummary: params.conversationSummary,
      attachments: params.attachments || [],
      timeline: initialTimeline,
      messages: [initialMessage]
    };

    const updated = [newTicket, ...existing];
    this.saveTickets(updated);

    return newTicket;
  }

  /**
   * Adds a reply to an existing ticket with ownership check.
   */
  public static async addReply(
    ticketId: string,
    text: string,
    sender: 'user' | 'support' = 'user',
    attachments?: TicketAttachment[],
    userId: string = 'usr_shanmukh_01'
  ): Promise<SupportTicket> {
    const all = this.loadTickets();
    const index = all.findIndex((t) => t.id === ticketId);
    if (index === -1) {
      throw new Error(`Ticket ${ticketId} not found.`);
    }

    const ticket = all[index];
    if (ticket.userId && ticket.userId !== userId && sender === 'user') {
      throw new Error('403 Forbidden: You do not have authorization to reply to this ticket.');
    }

    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newMsg: TicketMessage = {
      id: `msg_${Date.now()}`,
      sender,
      senderName: sender === 'user' ? 'Shanmukh Vutikuri' : 'Deliverability Specialist',
      senderRole: sender === 'support' ? 'Senior Support Engineer' : undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: text.trim(),
      attachments
    };

    const newTimelineEvent: TicketTimelineEvent = {
      id: `tl_${Date.now()}`,
      type: sender === 'user' ? 'user_reply' : 'support_reply',
      description: sender === 'user' ? 'User submitted a reply' : 'Support team replied',
      timestamp: timestampStr,
      actor: sender === 'user' ? 'Shanmukh Vutikuri' : 'Support Engineer'
    };

    // If ticket was waiting for user response, automatically move to in_progress
    let nextStatus: TicketStatus = ticket.status;
    if (sender === 'user' && (ticket.status === 'waiting_user' || ticket.status === 'awaiting_reply')) {
      nextStatus = 'in_progress';
    }

    const updatedTicket: SupportTicket = {
      ...ticket,
      status: nextStatus,
      lastUpdate: 'Just now',
      updatedAt: timestampStr,
      messages: [...ticket.messages, newMsg],
      timeline: [...ticket.timeline, newTimelineEvent]
    };

    all[index] = updatedTicket;
    this.saveTickets(all);

    return updatedTicket;
  }

  /**
   * Reopens a resolved ticket
   */
  public static async reopenTicket(ticketId: string, userId: string = 'usr_shanmukh_01'): Promise<SupportTicket> {
    const all = this.loadTickets();
    const index = all.findIndex((t) => t.id === ticketId);
    if (index === -1) throw new Error('Ticket not found');

    const ticket = all[index];
    if (ticket.userId && ticket.userId !== userId) {
      throw new Error('403 Forbidden');
    }

    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updatedTicket: SupportTicket = {
      ...ticket,
      status: 'open',
      lastUpdate: 'Just now',
      updatedAt: timestampStr,
      timeline: [
        ...ticket.timeline,
        {
          id: `tl_${Date.now()}`,
          type: 'reopened',
          description: 'Ticket reopened by user for additional investigation',
          timestamp: timestampStr,
          actor: 'Shanmukh Vutikuri'
        }
      ]
    };

    all[index] = updatedTicket;
    this.saveTickets(all);
    return updatedTicket;
  }
}
