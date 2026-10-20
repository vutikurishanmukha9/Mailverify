import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { SupportTicket } from '../types';
import {
  Send,
  Plus,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Modal } from '../components/common/Modal';

const FAQS = [
  {
    question: 'How does MailVerify verify email deliverability without sending a test email?',
    answer:
      'MailVerify executes a simulated SMTP handshake directly with the recipient domain’s designated MX mail server. We initiate a connection (HELO/EHLO), authenticate our verified enterprise probe IP, issue a MAIL FROM probe, and verify the RCPT TO response code. If the server returns HTTP/SMTP 250 2.1.5 OK, the mailbox is confirmed active. We terminate the transaction with RST/QUIT before any message payload is ever dispatched.'
  },
  {
    question: 'What is the operational difference between "Risky" and "Undeliverable"?',
    answer:
      'Undeliverable emails will definitely bounce (invalid syntax, nonexistent domain, dead MX records, or 550 User Unknown). "Risky" addresses fall into two categories: Catch-all mail servers (which accept any address regardless of whether the specific employee mailbox exists) and Role-based department accounts (support@, info@, billing@). Sending to risky addresses carries a lower open rate and slight bounce risk.'
  },
  {
    question: 'How do I connect MailVerify to ReachInbox, Instantly, or Smartlead?',
    answer:
      'Navigate to the Integrations tab in the left sidebar, select your cold outreach platform, and paste your API key or workspace token. MailVerify will automatically scan lead campaigns, tag deliverability scores, and pause undeliverable prospects before campaigns dispatch.'
  },
  {
    question: 'Do purchased Add-on Credits ever expire?',
    answer:
      'No. Add-on credit packages are non-expiring and roll over indefinitely. Your monthly plan allocation resets on the 1st of each month, but your add-on balance remains as a permanent safety reserve.'
  },
  {
    question: 'What are the default API rate limits and how can I request an increase?',
    answer:
      'Starter accounts support up to 25 requests per second, Growth accounts support 50 requests per second, and Enterprise plans feature custom dedicated IP clusters supporting 500+ requests per second with 99.99% SLA. To request a concurrency increase, submit a ticket below.'
  }
];

export const SupportPage: React.FC = () => {
  const { supportTickets, createSupportTicket, addToast } = useApp();

  // Search FAQ
  const [faqSearch, setFaqSearch] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // New Ticket Form state
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState<SupportTicket['category']>('Deliverability');
  const [ticketSeverity, setTicketSeverity] = useState<SupportTicket['severity']>('normal');
  const [ticketMessage, setTicketMessage] = useState('');

  // Selected Ticket Viewer
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      addToast({
        type: 'error',
        title: 'Fields Required',
        message: 'Please provide both a subject and detailed description.'
      });
      return;
    }

    createSupportTicket(ticketSubject, ticketCategory, ticketSeverity, ticketMessage);
    setTicketSubject('');
    setTicketMessage('');
    setIsTicketModalOpen(false);
  };

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.answer.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-header-title">Help & Technical Support</h1>
          <p className="page-header-description">
            Access developer guides, check real-time global infrastructure telemetry, or open an
            engineering support ticket.
          </p>
        </div>
        <div className="page-header-actions">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsTicketModalOpen(true)}
            leftIcon={<Plus size={13} />}
          >
            Open Support Ticket
          </Button>
        </div>
      </div>

      {/* Infrastructure Telemetry Health Banner */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-tile">
          <div className="stat-tile-label">GLOBAL API STATUS</div>
          <div className="stat-tile-value text-success" style={{ fontSize: 20 }}>
            Operational
          </div>
          <div className="stat-tile-meta font-mono">99.99% monthly uptime</div>
        </div>

        <div className="stat-tile">
          <div className="stat-tile-label">AVERAGE MX LATENCY</div>
          <div className="stat-tile-value font-mono tabular-nums" style={{ fontSize: 20 }}>
            42ms
          </div>
          <div className="stat-tile-meta">Edge resolver cluster</div>
        </div>

        <div className="stat-tile">
          <div className="stat-tile-label">SMTP PROBE FLEET</div>
          <div className="stat-tile-value text-success" style={{ fontSize: 20 }}>
            Healthy
          </div>
          <div className="stat-tile-meta">Zero IP blacklists reported</div>
        </div>

        <div className="stat-tile">
          <div className="stat-tile-label">SUPPORT SLA</div>
          <div className="stat-tile-value font-mono" style={{ fontSize: 20 }}>
            &lt; 2 hrs
          </div>
          <div className="stat-tile-meta">Dedicated engineering team</div>
        </div>
      </div>

      {/* Layout: FAQ Search on Left + Active Tickets on Right */}
      <div className="support-split-layout">
        {/* Knowledge Base FAQs */}
        <div className="support-faq-column">
          <Card>
            <CardHeader
              title="Frequently Answered Technical Questions"
              subtitle="Search deliverability rules, SMTP behavior, and integration documentation."
              action={
                <div className="input-with-icon" style={{ width: 220 }}>
                  <Search size={14} className="input-icon-left" />
                  <input
                    type="text"
                    className="input input-sm"
                    placeholder="Search docs..."
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                  />
                </div>
              }
            />
            <CardBody>
              <div className="faq-list">
                {filteredFaqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div key={idx} className="faq-item">
                      <button
                        className="faq-question-btn"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      >
                        <span className="faq-question-text">{faq.question}</span>
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      {isOpen && <div className="faq-answer-text">{faq.answer}</div>}
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Support Tickets Column */}
        <div className="support-tickets-column">
          <Card>
            <CardHeader
              title={`Your Support Tickets (${supportTickets.length})`}
              subtitle="Direct engineering conversation thread."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTicketModalOpen(true)}
                  leftIcon={<Plus size={12} />}
                  className="btn-sm"
                >
                  New Ticket
                </Button>
              }
            />
            <CardBody compact>
              <div className="tickets-list">
                {supportTickets.map((tick) => (
                  <div
                    key={tick.id}
                    className="ticket-card-row"
                    onClick={() => setActiveTicket(tick)}
                  >
                    <div className="ticket-top">
                      <span className="font-mono text-muted" style={{ fontSize: 11 }}>
                        {tick.id}
                      </span>
                      <Badge
                        variant={
                          tick.status === 'resolved'
                            ? 'success'
                            : tick.status === 'awaiting_reply'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {tick.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>

                    <div className="ticket-subject">{tick.subject}</div>

                    <div className="ticket-meta">
                      <span>{tick.category}</span>
                      <span>{tick.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Ticket Conversation Modal */}
      {activeTicket && (
        <Modal
          isOpen={true}
          onClose={() => setActiveTicket(null)}
          title={`Ticket ${activeTicket.id}: ${activeTicket.subject}`}
          maxWidth={560}
          footer={
            <Button variant="ghost" size="sm" onClick={() => setActiveTicket(null)}>
              Close
            </Button>
          }
        >
          <div className="ticket-modal-conversation">
            <div className="ticket-modal-meta">
              <Badge variant="neutral">Category: {activeTicket.category}</Badge>
              <Badge variant="neutral">Severity: {activeTicket.severity.toUpperCase()}</Badge>
              <Badge variant={activeTicket.status === 'resolved' ? 'success' : 'warning'}>
                {activeTicket.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            <div className="conversation-thread">
              {activeTicket.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`message-bubble ${
                    msg.sender === 'user' ? 'bubble-user' : 'bubble-support'
                  }`}
                >
                  <div className="bubble-header">
                    <span className="bubble-sender">{msg.senderName}</span>
                    <span className="bubble-time font-mono">{msg.time}</span>
                  </div>
                  <div className="bubble-text">{msg.text}</div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Create Ticket Modal */}
      <Modal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        title="Submit Engineering Support Ticket"
        maxWidth={500}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
            <Button variant="ghost" size="sm" onClick={() => setIsTicketModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleTicketSubmit} leftIcon={<Send size={12} />}>
              Submit Ticket
            </Button>
          </div>
        }
      >
        <form onSubmit={handleTicketSubmit}>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Question regarding Microsoft 365 catch-all scores"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="select"
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value as any)}
              >
                <option value="Deliverability">Deliverability & DNS</option>
                <option value="API & Webhooks">API & Webhooks</option>
                <option value="Billing & Credits">Billing & Credits</option>
                <option value="Integration">Outreach Integration</option>
                <option value="General">General Inquiry</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Severity Level</label>
              <select
                className="select"
                value={ticketSeverity}
                onChange={(e) => setTicketSeverity(e.target.value as any)}
              >
                <option value="low">Low (Question)</option>
                <option value="normal">Normal</option>
                <option value="high">High (Production Blocked)</option>
                <option value="urgent">Urgent (SLA)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Message Details</label>
            <textarea
              className="input"
              rows={4}
              placeholder="Please provide details, error messages, or affected email domains..."
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>

      <style>{`
        .support-split-layout {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: var(--space-4);
          align-items: start;
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .faq-item {
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 8px;
          margin-bottom: 8px;
        }
        .faq-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
          margin-bottom: 0;
        }

        .faq-question-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-family: var(--font-sans);
          font-size: 13.5px;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          transition: color 0.12s ease;
        }
        .faq-question-btn:hover {
          color: var(--accent-text);
        }

        .faq-answer-text {
          padding: 6px 0 10px;
          font-size: 12.5px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .tickets-list {
          display: flex;
          flex-direction: column;
        }

        .ticket-card-row {
          padding: 12px 14px;
          border-bottom: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: background-color 0.12s ease;
        }
        .ticket-card-row:hover {
          background-color: var(--bg-hover);
        }

        .ticket-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .ticket-subject {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .ticket-meta {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-muted);
        }

        .ticket-modal-conversation {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .ticket-modal-meta {
          display: flex;
          gap: 8px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .conversation-thread {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 380px;
          overflow-y: auto;
        }

        .message-bubble {
          padding: 12px 14px;
          border-radius: var(--radius-sm);
          font-size: 12.5px;
          line-height: 1.45;
        }

        .bubble-user {
          background-color: var(--bg-panel-elevated);
          border: 1px solid var(--border-standard);
        }

        .bubble-support {
          background-color: #12151B;
          border: 1px solid var(--border-strong);
          border-left: 3px solid var(--accent-primary);
        }

        .bubble-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .bubble-sender {
          font-weight: 600;
          color: var(--text-primary);
        }

        .bubble-time {
          font-size: 11px;
          color: var(--text-muted);
        }

        .bubble-text {
          color: var(--text-secondary);
        }

        @media (max-width: 900px) {
          .support-split-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
