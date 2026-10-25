import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  FAQ_ARTICLES,
  FAQ_CATEGORIES,
  searchFaqArticles,
  type FaqCategoryName
} from '../services/knowledgeBase';
import { querySupportAssistant, getAiConfig } from '../services/aiService';
import type {
  FaqArticle,
  TicketCategory,
  TicketIssueType,
  TicketPriority,
  ScreenId
} from '../types';
import {
  HelpCircle,
  Search,
  Bot,
  Ticket,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Activity,
  FileText,
  CheckCircle2,
  ArrowRight,
  Send,
  RotateCw,
  ThumbsUp,
  Inbox,
  X
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

type SupportTab = 'faqs' | 'assistant' | 'tickets';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  groundedSource?: string;
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
}

const STARTER_PROMPTS = [
  'What is Catch-All (Accept-All) detection and why is it scored as Risky?',
  'How does the simulated SMTP handshake verify without sending emails?',
  'Do purchased add-on credits expire at the end of the billing cycle?',
  'How do I verify webhook payloads with HMAC-SHA256 signatures?'
];

export const SupportPage: React.FC = () => {
  const {
    navigateTo,
    supportTickets,
    createSupportTicket,
    addTicketReply,
    reopenTicket,
    addToast,
    userProfile
  } = useApp();

  // Active top tab
  const [activeTab, setActiveTab] = useState<SupportTab>('faqs');

  // FAQ Knowledge Base state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FaqCategoryName>('All');
  const [expandedFaqIds, setExpandedFaqIds] = useState<Set<string>>(new Set(['faq-pf-1', 'faq-pf-2']));
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({});
  const [copiedFaqId, setCopiedFaqId] = useState<string | null>(null);

  // Chatbot / Technical Assistant state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: "Hello! I am the MailVerify Technical Assistant. I can answer technical questions regarding simulated SMTP handshakes (zero test emails), DNS MX records, catch-all detection, sequencer integrations (Instantly, Smartlead, ReachInbox), API rate limits, or billing and credit rollovers.",
      time: 'Just now',
      groundedSource: 'RFC 5321 & System Specification'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedChatId, setCopiedChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiConfig = getAiConfig();

  // Support Tickets state
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'in_progress' | 'waiting_user' | 'resolved'>('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Create Ticket Modal state
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState<TicketCategory>('Deliverability');
  const [ticketIssueType, setTicketIssueType] = useState<TicketIssueType>('technical');
  const [ticketPriority, setTicketPriority] = useState<TicketPriority>('normal');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketProductModule, setTicketProductModule] = useState('General');
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  // Filtered FAQ articles
  const filteredFaqs = useMemo(() => {
    return searchFaqArticles(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  // Selected ticket details
  const activeTicket = useMemo(() => {
    return supportTickets.find((t) => t.id === selectedTicketId) || null;
  }, [supportTickets, selectedTicketId]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (activeTab === 'assistant') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, activeTab]);

  // Toggle FAQ accordion expansion
  const toggleFaq = (id: string) => {
    setExpandedFaqIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Vote helpful on FAQ article
  const handleVoteHelpful = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHelpfulVotes((prev) => {
      if (prev[id]) return prev; // already voted
      return { ...prev, [id]: 1 };
    });
    addToast({
      type: 'success',
      title: 'Feedback Recorded',
      message: 'Thank you for helping us improve our knowledge base.'
    });
  };

  // Copy FAQ shareable link or snippet
  const handleCopyFaq = (article: FaqArticle, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${article.question}\n\n${article.answer}`);
    setCopiedFaqId(article.id);
    addToast({
      type: 'info',
      title: 'Copied to Clipboard',
      message: 'Article answer copied to clipboard.'
    });
    setTimeout(() => setCopiedFaqId(null), 2000);
  };

  // Jump from FAQ directly to Chatbot with pre-loaded prompt
  const handleAskAboutFaq = (questionText: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveTab('assistant');
    handleSendChat(questionText);
  };

  // Chatbot send handler
  const handleSendChat = async (customQuery?: string) => {
    const query = (customQuery || chatInput).trim();
    if (!query || isThinking) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setChatInput('');
    setIsThinking(true);

    try {
      const response = await querySupportAssistant(query, messages);
      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundedSource: response.groundedSource,
        suggestedAction: response.suggestedAction
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'An unexpected error occurred while querying the knowledge engine. Please retry or open a support ticket for specialized engineering assistance.',
          time: 'Just now'
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // Handle suggested action click inside chatbot
  const handleChatAction = (action: NonNullable<ChatMessage['suggestedAction']>) => {
    if (action.screen === 'ticket_modal') {
      if (action.prefillData) {
        setTicketSubject(action.prefillData.subject);
        setTicketCategory(action.prefillData.category);
        setTicketIssueType(action.prefillData.issueType);
        setTicketDescription(action.prefillData.description);
      }
      setIsCreateTicketOpen(true);
      return;
    }
    navigateTo(action.screen as ScreenId);
  };

  // Copy chat response
  const handleCopyChatMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedChatId(id);
    addToast({
      type: 'info',
      title: 'Copied',
      message: 'Message copied to clipboard.'
    });
    setTimeout(() => setCopiedChatId(null), 2000);
  };

  // Create ticket submission
  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) {
      addToast({
        type: 'error',
        title: 'Fields Required',
        message: 'Please provide both an issue title and description.'
      });
      return;
    }

    setIsCreatingTicket(true);
    try {
      const created = await createSupportTicket({
        contactEmail: userProfile.email,
        subject: ticketSubject.trim(),
        description: ticketDescription.trim(),
        category: ticketCategory,
        issueType: ticketIssueType,
        priority: ticketPriority,
        productModule: ticketProductModule
      });

      addToast({
        type: 'success',
        title: 'Ticket Submitted',
        message: `Ticket ${created.id} has been dispatched to engineering (< 2h SLA).`
      });

      setIsCreateTicketOpen(false);
      setTicketSubject('');
      setTicketDescription('');
      setActiveTab('tickets');
      setSelectedTicketId(created.id);
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: err instanceof Error ? err.message : 'Unable to create ticket.'
      });
    } finally {
      setIsCreatingTicket(false);
    }
  };

  // Send reply on selected ticket
  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !ticketReplyText.trim() || isSubmittingReply) return;

    setIsSubmittingReply(true);
    try {
      await addTicketReply(selectedTicketId, ticketReplyText.trim(), 'user');
      setTicketReplyText('');
      addToast({
        type: 'success',
        title: 'Reply Sent',
        message: 'Your update has been logged on the ticket timeline.'
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Reply Failed',
        message: 'Could not send update. Please retry.'
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Reopen resolved ticket
  const handleReopenTicket = async (ticketId: string) => {
    try {
      await reopenTicket(ticketId);
      addToast({
        type: 'info',
        title: 'Ticket Reopened',
        message: `Ticket ${ticketId} status has been updated to Open.`
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Could not reopen ticket.'
      });
    }
  };

  // Filtered support tickets
  const filteredTickets = useMemo(() => {
    return supportTickets.filter((t) => {
      if (ticketFilter === 'all') return true;
      return t.status === ticketFilter;
    });
  }, [supportTickets, ticketFilter]);

  // Open ticket count
  const openTicketCount = useMemo(() => {
    return supportTickets.filter((t) => t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting_user').length;
  }, [supportTickets]);

  return (
    <div className="page-container support-page">
      {/* Page Header */}
      <div className="page-header support-header">
        <div className="support-header-top">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#8E929D]">
                Knowledge & Assistance
              </span>
            </div>
            <h1 className="page-header-title">
              <HelpCircle size={22} className="text-[#FF641F]" strokeWidth={2.2} />
              Help & Support
            </h1>
          </div>

          <div className="page-header-actions">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateTicketOpen(true)}
              leftIcon={<Plus size={13} />}
            >
              New Support Ticket
            </Button>
          </div>
        </div>

        <p className="page-header-description support-header-description">
          Search verified RFC documentation and FAQs, chat with the MailVerify Technical Assistant,
          or submit an enterprise ticket to our deliverability engineers.
        </p>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="support-nav-bar">
        <div className="tab-pill-nav support-tab-pill-nav">
          <button
            className={`tab-pill-btn support-tab-pill-btn ${activeTab === 'faqs' ? 'active' : ''}`}
            onClick={() => setActiveTab('faqs')}
          >
            <FileText size={14} />
            <span>Knowledge Base & FAQs</span>
            <span className="tab-counter-badge">{FAQ_ARTICLES.length}</span>
          </button>

          <button
            className={`tab-pill-btn support-tab-pill-btn ${activeTab === 'assistant' ? 'active' : ''}`}
            onClick={() => setActiveTab('assistant')}
          >
            <Bot size={14} />
            <span>Technical Assistant</span>
            <span className="live-dot" />
          </button>

          <button
            className={`tab-pill-btn support-tab-pill-btn ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            <Ticket size={14} />
            <span>My Support Tickets</span>
            {openTicketCount > 0 && (
              <span className="tab-counter-badge active-counter">{openTicketCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: KNOWLEDGE BASE & FAQS                                              */}
      {/* ========================================================================= */}
      {activeTab === 'faqs' && (
        <div className="support-faqs-container">
          {/* Search Header Banner */}
          <div className="faq-search-wrapper">
            <div className="faq-search-bar">
              <Search size={16} className="faq-search-icon" />
              <input
                type="text"
                className="faq-search-input"
                placeholder="Search documentation, SMTP response codes (250, 550, 421), catch-all domains, webhook signatures, or credits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button
                  className="faq-search-clear"
                  onClick={() => setSearchQuery('')}
                  title="Clear search query"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="faq-search-meta">
              <span className="text-xs text-[#8E929D]">
                Showing {filteredFaqs.length} of {FAQ_ARTICLES.length} articles
                {selectedCategory !== 'All' && ` in "${selectedCategory}"`}
              </span>
              {searchQuery && (
                <button
                  className="text-xs text-[#FF641F] hover:underline cursor-pointer"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="faq-category-pills">
            {FAQ_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  className={`faq-cat-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* FAQ Accordion List */}
          {filteredFaqs.length > 0 ? (
            <div className="faq-accordion-list">
              {filteredFaqs.map((faq) => {
                const isExpanded = expandedFaqIds.has(faq.id);
                const votes = (faq.helpfulCount || 0) + (helpfulVotes[faq.id] || 0);
                const hasVoted = Boolean(helpfulVotes[faq.id]);

                return (
                  <div
                    key={faq.id}
                    className={`faq-accordion-item ${isExpanded ? 'expanded' : ''}`}
                  >
                    <div
                      className="faq-accordion-header"
                      onClick={() => toggleFaq(faq.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleFaq(faq.id);
                        }
                      }}
                    >
                      <div className="faq-header-left">
                        <Badge variant="neutral" className="text-[10px] font-mono uppercase tracking-wide">
                          {faq.category}
                        </Badge>
                        <h3 className="faq-question-text">{faq.question}</h3>
                      </div>
                      <div className="faq-header-right">
                        <span className="faq-toggle-icon">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="faq-accordion-body">
                        <div className="faq-answer-text">
                          {faq.answer.split('\n\n').map((paragraph, idx) => (
                            <p key={idx} className="mb-2.5 last:mb-0">
                              {paragraph}
                            </p>
                          ))}
                        </div>

                        <div className="faq-footer-actions">
                          <div className="faq-footer-left">
                            {faq.relatedLink && (
                              <button
                                className="faq-action-link"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateTo(faq.relatedLink!.screen);
                                }}
                              >
                                <span>{faq.relatedLink.label}</span>
                                <ArrowRight size={12} />
                              </button>
                            )}
                            <button
                              className="faq-ask-ai-link"
                              onClick={(e) => handleAskAboutFaq(faq.question, e)}
                              title="Ask the Technical Assistant about this topic"
                            >
                              <Bot size={12} className="text-[#FF641F]" />
                              <span>Ask Assistant about this</span>
                            </button>
                          </div>

                          <div className="faq-footer-right">
                            <button
                              className={`faq-helpful-btn ${hasVoted ? 'voted' : ''}`}
                              onClick={(e) => handleVoteHelpful(faq.id, e)}
                              disabled={hasVoted}
                              title="Mark as helpful"
                            >
                              <ThumbsUp size={12} />
                              <span>Helpful ({votes})</span>
                            </button>
                            <button
                              className="faq-copy-btn"
                              onClick={(e) => handleCopyFaq(faq, e)}
                              title="Copy answer text"
                            >
                              {copiedFaqId === faq.id ? <Check size={12} className="text-[#22C55E]" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="faq-empty-state">
              <div className="empty-icon-wrap">
                <Search size={22} className="text-[#8E929D]" />
              </div>
              <h3 className="empty-title">No matching knowledge base articles found</h3>
              <p className="empty-desc">
                We could not find an existing article matching &ldquo;{searchQuery}&rdquo;.
                You can ask the MailVerify Technical Assistant or create an engineering ticket.
              </p>
              <div className="empty-actions">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Bot size={13} />}
                  onClick={() => {
                    setActiveTab('assistant');
                    handleSendChat(searchQuery);
                  }}
                >
                  Ask Technical Assistant
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                >
                  Clear Search Filter
                </Button>
              </div>
            </div>
          )}

          {/* Quick Escalation Banner */}
          <div className="support-banner-row">
            <div className="banner-card">
              <div className="banner-icon-box">
                <Bot size={18} className="text-[#FF641F]" />
              </div>
              <div className="banner-content">
                <h4 className="banner-title">Interactive Technical Assistant</h4>
                <p className="banner-desc">
                  Need quick answers on SMTP codes, DNS MX telemetry, API payloads, or sequencer setup?
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('assistant')}
                rightIcon={<ChevronRight size={13} />}
              >
                Launch Assistant
              </Button>
            </div>

            <div className="banner-card">
              <div className="banner-icon-box">
                <Ticket size={18} className="text-[#38BDF8]" />
              </div>
              <div className="banner-content">
                <h4 className="banner-title">Enterprise Support Desk</h4>
                <p className="banner-desc">
                  Have a deliverability edge-case, batch query failure, or custom enterprise SLA request?
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateTicketOpen(true)}
                rightIcon={<Plus size={13} />}
              >
                Open Ticket
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TECHNICAL ASSISTANT (CHATBOT)                                      */}
      {/* ========================================================================= */}
      {activeTab === 'assistant' && (
        <div className="support-assistant-workbench">
          {/* Chat Console Header */}
          <div className="assistant-console-header">
            <div className="assistant-brand-info">
              <div className="assistant-avatar-box">
                <Bot size={16} className="text-[#FF641F]" />
              </div>
              <div>
                <div className="assistant-name-row">
                  <span className="assistant-title">MailVerify Technical Assistant</span>
                  <Badge variant="accent" className="text-[10px] py-0 px-1.5 font-mono">
                    RFC 5321 GROUNDED
                  </Badge>
                </div>
                <div className="assistant-subtitle">
                  Trained on RFC specs, DNS MX logic, sequencer integrations, and application documentation
                </div>
              </div>
            </div>

            <div className="assistant-header-actions">
              <div className="assistant-provider-pill font-mono">
                <span className="live-dot" />
                <span>{aiConfig.providerName}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMessages([
                    {
                      id: `init-${Date.now()}`,
                      sender: 'assistant',
                      text: "Conversation cleared. How can I help you with MailVerify verification, sequencer integrations, or API setups?",
                      time: 'Just now',
                      groundedSource: 'RFC 5321 & System Specification'
                    }
                  ]);
                }}
                leftIcon={<RotateCw size={12} />}
              >
                Clear History
              </Button>
            </div>
          </div>

          {/* Quick Starter Prompts Strip */}
          <div className="starter-prompts-row">
            <span className="starter-label">Recommended Queries:</span>
            <div className="starter-pills-list">
              {STARTER_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  className="starter-prompt-pill"
                  onClick={() => handleSendChat(prompt)}
                  disabled={isThinking}
                >
                  <span>{prompt}</span>
                  <ArrowRight size={11} className="starter-arrow" />
                </button>
              ))}
            </div>
          </div>

          {/* Message Stream */}
          <div className="chat-messages-viewport">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className={`chat-message-row ${isUser ? 'user-row' : 'assistant-row'}`}>
                  <div className="chat-message-avatar">
                    {isUser ? (
                      <div className="user-avatar-pill">
                        {userProfile.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    ) : (
                      <div className="bot-avatar-pill">
                        <Bot size={14} className="text-[#FF641F]" />
                      </div>
                    )}
                  </div>

                  <div className="chat-message-bubble">
                    <div className="bubble-header">
                      <span className="bubble-sender-name">
                        {isUser ? userProfile.name : 'Technical Assistant'}
                      </span>
                      <span className="bubble-time font-mono">{msg.time}</span>
                      {msg.groundedSource && (
                        <span className="grounded-tag font-mono">
                          Source: {msg.groundedSource}
                        </span>
                      )}
                    </div>

                    <div className="bubble-body">
                      {msg.text.split('\n\n').map((paragraph, pIdx) => {
                        // Check if paragraph contains bullet points
                        if (paragraph.includes('\n•') || paragraph.startsWith('•')) {
                          const bullets = paragraph.split('\n').filter(Boolean);
                          return (
                            <ul key={pIdx} className="bubble-bullet-list">
                              {bullets.map((b, bIdx) => (
                                <li key={bIdx} className="bubble-bullet-item">
                                  {b.replace(/^[•\-*]\s*/, '')}
                                </li>
                              ))}
                            </ul>
                          );
                        }
                        return (
                          <p key={pIdx} className="bubble-paragraph">
                            {paragraph}
                          </p>
                        );
                      })}
                    </div>

                    {/* Contextual Action Button (e.g. Jump to Single Verify, API, or Escalation) */}
                    {msg.suggestedAction && (
                      <div className="bubble-suggested-action">
                        <button
                          className="suggested-action-btn"
                          onClick={() => handleChatAction(msg.suggestedAction!)}
                        >
                          <ExternalLink size={12} />
                          <span>{msg.suggestedAction.label}</span>
                        </button>
                      </div>
                    )}

                    {/* Bubble Bottom Actions */}
                    <div className="bubble-actions">
                      <button
                        className="bubble-action-btn"
                        onClick={() => handleCopyChatMessage(msg.text, msg.id)}
                        title="Copy text"
                      >
                        {copiedChatId === msg.id ? (
                          <>
                            <Check size={11} className="text-[#22C55E]" />
                            <span className="text-[#22C55E]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {isThinking && (
              <div className="chat-message-row assistant-row">
                <div className="chat-message-avatar">
                  <div className="bot-avatar-pill">
                    <Bot size={14} className="text-[#FF641F]" />
                  </div>
                </div>
                <div className="chat-message-bubble thinking-bubble">
                  <div className="thinking-dots">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                  <span className="text-xs text-[#8E929D] font-mono">Analyzing knowledge base and RFC specification...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            className="assistant-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
          >
            <div className="assistant-input-container">
              <input
                type="text"
                className="assistant-input-field"
                placeholder="Ask any question regarding MailVerify, SMTP response codes, sequencer integrations, or API setups..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isThinking}
              />
              <button
                type="submit"
                className="assistant-send-btn"
                disabled={!chatInput.trim() || isThinking}
                aria-label="Send query"
              >
                <Send size={14} />
              </button>
            </div>
            <div className="assistant-input-hints">
              <span>Press <kbd className="hint-kbd">Enter</kbd> to submit query</span>
              <span>·</span>
              <span>Grounded in MailVerify RFC 5321 knowledge base</span>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SUPPORT TICKETS & TICKET MANAGEMENT                                */}
      {/* ========================================================================= */}
      {activeTab === 'tickets' && (
        <div className="support-tickets-workbench">
          {/* Top Filter & Action Bar */}
          <div className="tickets-control-row">
            <div className="tickets-filter-pills">
              <button
                className={`tab-pill-btn ${ticketFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTicketFilter('all')}
              >
                All Tickets ({supportTickets.length})
              </button>
              <button
                className={`tab-pill-btn ${ticketFilter === 'open' ? 'active' : ''}`}
                onClick={() => setTicketFilter('open')}
              >
                Open
              </button>
              <button
                className={`tab-pill-btn ${ticketFilter === 'in_progress' ? 'active' : ''}`}
                onClick={() => setTicketFilter('in_progress')}
              >
                In Progress
              </button>
              <button
                className={`tab-pill-btn ${ticketFilter === 'waiting_user' ? 'active' : ''}`}
                onClick={() => setTicketFilter('waiting_user')}
              >
                Waiting on User
              </button>
              <button
                className={`tab-pill-btn ${ticketFilter === 'resolved' ? 'active' : ''}`}
                onClick={() => setTicketFilter('resolved')}
              >
                Resolved
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={13} />}
              onClick={() => setIsCreateTicketOpen(true)}
            >
              Create New Ticket
            </Button>
          </div>

          {/* Tickets Main Content: Split Master-Detail or List */}
          <div className="tickets-layout-split">
            {/* Left: Tickets List */}
            <div className="tickets-master-column">
              {filteredTickets.length > 0 ? (
                <div className="tickets-items-list">
                  {filteredTickets.map((ticket) => {
                    const isSelected = ticket.id === selectedTicketId;
                    return (
                      <div
                        key={ticket.id}
                        className={`ticket-summary-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedTicketId(ticket.id)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="ticket-card-header">
                          <span className="ticket-ref-code font-mono">{ticket.id}</span>
                          <span className={`status-badge-chip status-${ticket.status}`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>

                        <h4 className="ticket-subject-text">{ticket.subject}</h4>
                        <p className="ticket-desc-snippet">{ticket.description}</p>

                        <div className="ticket-card-footer">
                          <Badge variant="neutral" className="text-[10px] font-mono">
                            {ticket.category}
                          </Badge>
                          <span className={`priority-tag priority-${ticket.priority}`}>
                            {ticket.priority} priority
                          </span>
                          <span className="ticket-date-text font-mono text-[11px] text-[#8E929D] ml-auto">
                            {ticket.lastUpdate}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="ticket-empty-box">
                  <Inbox size={24} className="text-[#8E929D] mb-2" />
                  <h4 className="text-sm font-semibold text-[#EDEDEF]">No tickets in this view</h4>
                  <p className="text-xs text-[#8E929D] mt-1 mb-3">
                    You have no tickets currently matching the &ldquo;{ticketFilter}&rdquo; status.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateTicketOpen(true)}
                    leftIcon={<Plus size={12} />}
                  >
                    Create Ticket
                  </Button>
                </div>
              )}
            </div>

            {/* Right: Selected Ticket Detail & Messages */}
            <div className="tickets-detail-column">
              {activeTicket ? (
                <div className="ticket-detail-view">
                  {/* Detail Header */}
                  <div className="ticket-detail-header">
                    <div className="detail-header-top">
                      <div className="flex items-center gap-2">
                        <span className="ticket-id-large font-mono">{activeTicket.id}</span>
                        <span className={`status-badge-chip status-${activeTicket.status}`}>
                          {activeTicket.status.replace('_', ' ')}
                        </span>
                        <span className={`priority-tag priority-${activeTicket.priority}`}>
                          {activeTicket.priority} priority
                        </span>
                      </div>

                      {activeTicket.status === 'resolved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReopenTicket(activeTicket.id)}
                        >
                          Reopen Ticket
                        </Button>
                      )}
                    </div>

                    <h2 className="detail-subject-title">{activeTicket.subject}</h2>

                    <div className="detail-meta-grid">
                      <div>
                        <span className="meta-label">Category:</span>
                        <span className="meta-val">{activeTicket.category}</span>
                      </div>
                      <div>
                        <span className="meta-label">Issue Type:</span>
                        <span className="meta-val font-mono">{activeTicket.issueType}</span>
                      </div>
                      <div>
                        <span className="meta-label">Module:</span>
                        <span className="meta-val">{activeTicket.productModule || 'General'}</span>
                      </div>
                      <div>
                        <span className="meta-label">Created:</span>
                        <span className="meta-val font-mono">{activeTicket.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Events Pill */}
                  {activeTicket.timeline && activeTicket.timeline.length > 0 && (
                    <div className="ticket-timeline-accordion">
                      <div className="timeline-title-row">
                        <Activity size={12} className="text-[#8E929D]" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#8E929D]">
                          Ticket Lifecycle & Timeline ({activeTicket.timeline.length} events)
                        </span>
                      </div>
                      <div className="timeline-items-flow">
                        {activeTicket.timeline.map((evt) => (
                          <div key={evt.id} className="timeline-event-item">
                            <span className="timeline-node" />
                            <div className="timeline-content">
                              <div className="timeline-desc">{evt.description}</div>
                              <div className="timeline-meta font-mono">
                                <span>{evt.actor}</span> · <span>{evt.timestamp}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Messages Stream */}
                  <div className="ticket-messages-stream">
                    {activeTicket.messages?.map((msg) => {
                      const isSupport = msg.sender === 'support';
                      return (
                        <div
                          key={msg.id}
                          className={`ticket-message-card ${isSupport ? 'support-message' : 'user-message'}`}
                        >
                          <div className="ticket-message-header">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-[#EDEDEF]">{msg.senderName}</span>
                              {msg.senderRole && (
                                <Badge variant="accent" className="text-[10px] py-0 px-1 font-mono">
                                  {msg.senderRole}
                                </Badge>
                              )}
                            </div>
                            <span className="font-mono text-[11px] text-[#8E929D]">{msg.time}</span>
                          </div>
                          <div className="ticket-message-body">
                            {msg.text.split('\n\n').map((p, pI) => (
                              <p key={pI} className="mb-2 last:mb-0">
                                {p}
                              </p>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply Form */}
                  {activeTicket.status !== 'resolved' && activeTicket.status !== 'closed' ? (
                    <form className="ticket-reply-box" onSubmit={handleSendTicketReply}>
                      <textarea
                        className="ticket-reply-textarea"
                        placeholder="Type your reply or additional diagnostic context here..."
                        rows={3}
                        value={ticketReplyText}
                        onChange={(e) => setTicketReplyText(e.target.value)}
                      />
                      <div className="ticket-reply-footer">
                        <span className="text-xs text-[#8E929D]">
                          Replies are routed directly to assigned deliverability staff
                        </span>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={!ticketReplyText.trim() || isSubmittingReply}
                          leftIcon={<Send size={12} />}
                        >
                          {isSubmittingReply ? 'Sending...' : 'Send Reply'}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="ticket-resolved-notice">
                      <CheckCircle2 size={16} className="text-[#22C55E]" />
                      <span>This ticket has been marked as resolved. If you still require help, click &ldquo;Reopen Ticket&rdquo;.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="tickets-empty-placeholder">
                  <Ticket size={28} className="text-[#8E929D] mb-3" />
                  <h3 className="text-sm font-semibold text-[#EDEDEF]">No ticket selected</h3>
                  <p className="text-xs text-[#8E929D] max-w-sm text-center mt-1">
                    Select a ticket from the left column to view the complete diagnostic timeline,
                    engineer notes, and conversation history.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE SUPPORT TICKET                                              */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateTicketOpen}
        onClose={() => setIsCreateTicketOpen(false)}
        title="Submit Engineering Support Ticket"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateTicketSubmit} className="create-ticket-form">
          <div className="form-group mb-4">
            <label className="form-label">Subject / Issue Summary *</label>
            <input
              type="text"
              className="input-standard"
              placeholder="e.g., Microsoft 365 Exchange Online catch-all false positives analysis"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="select-standard"
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value as TicketCategory)}
              >
                <option value="Deliverability">Deliverability</option>
                <option value="Cold Outreach Integrations">Cold Outreach Integrations</option>
                <option value="API & Webhooks">API & Webhooks</option>
                <option value="Billing & Credits">Billing & Credits</option>
                <option value="Account & Security">Account & Security</option>
                <option value="Data & Exports">Data & Exports</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Issue Type</label>
              <select
                className="select-standard"
                value={ticketIssueType}
                onChange={(e) => setTicketIssueType(e.target.value as TicketIssueType)}
              >
                <option value="technical">Technical Investigation</option>
                <option value="bug">Bug Report</option>
                <option value="account">Account Access</option>
                <option value="billing">Billing & Invoicing</option>
                <option value="feature">Feature Request</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="select-standard"
                value={ticketPriority}
                onChange={(e) => setTicketPriority(e.target.value as TicketPriority)}
              >
                <option value="low">Low (Standard SLA)</option>
                <option value="normal">Normal (Within 4 hrs)</option>
                <option value="high">High (Within 2 hrs)</option>
                <option value="urgent">Urgent (Critical Outage)</option>
              </select>
            </div>
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Related Product Module</label>
            <select
              className="select-standard"
              value={ticketProductModule}
              onChange={(e) => setTicketProductModule(e.target.value)}
            >
              <option value="Single Verify">Single Verify</option>
              <option value="Bulk Verify">Bulk Verify</option>
              <option value="Integrations">Integrations (Instantly, Smartlead, ReachInbox)</option>
              <option value="API & Webhooks">API & Webhooks</option>
              <option value="Billing">Billing & Credits</option>
              <option value="General">General</option>
            </select>
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Detailed Description & Steps to Reproduce *</label>
            <textarea
              className="textarea-standard"
              rows={5}
              placeholder="Provide specific details including recipient domain, SMTP response codes, batch job names, or error messages..."
              value={ticketDescription}
              onChange={(e) => setTicketDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-notice-box mb-5">
            <ShieldCheck size={14} className="text-[#22C55E] flex-shrink-0" />
            <span className="text-xs text-[#8E929D]">
              Tickets are routed with strict P95 SLAs to senior deliverability engineers. A copy will be sent to{' '}
              <span className="text-[#EDEDEF] font-mono">{userProfile.email}</span>.
            </span>
          </div>

          <div className="modal-actions-footer">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateTicketOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isCreatingTicket || !ticketSubject.trim() || !ticketDescription.trim()}
              leftIcon={<Plus size={13} />}
            >
              {isCreatingTicket ? 'Submitting...' : 'Dispatch Ticket'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Component Styles adhering to MailVerify Enterprise Aesthetics */}
      <style>{`
        .support-page {
          min-height: calc(100vh - var(--header-height));
        }

        .support-header {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          width: 100%;
          gap: 12px;
          margin-bottom: 24px;
        }

        .support-header-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          width: 100%;
          gap: 20px;
          flex-wrap: wrap;
        }

        .support-header-description {
          width: 100%;
          max-width: 100% !important;
          text-align: justify;
          text-justify: inter-word;
          margin-top: 4px;
          line-height: 1.65;
        }


        .support-nav-bar {
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 14px;
          width: 100%;
        }

        .support-tab-pill-nav {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          width: 100%;
          gap: 4px;
          padding: 4px;
          box-sizing: border-box;
        }

        @media (max-width: 850px) {
          .support-tab-pill-btn {
            padding: 8px 10px;
            font-size: 12.5px;
            gap: 6px;
          }
        }

        @media (max-width: 640px) {
          .support-tab-pill-nav {
            grid-template-columns: 1fr;
            gap: 6px;
          }
          .support-header-description {
            text-align: left !important;
          }
        }

        .support-tab-pill-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 10px 16px;
          font-size: 13.5px;
          border-radius: var(--radius-xs);
          transition: all 0.15s ease;
        }

        .tab-counter-badge {
          background-color: rgba(255, 255, 255, 0.08);
          color: var(--text-secondary);
          font-size: 10px;
          font-family: var(--font-mono);
          padding: 1px 6px;
          border-radius: var(--radius-full);
          margin-left: 4px;
        }

        .tab-counter-badge.active-counter {
          background-color: var(--accent-subtle);
          color: var(--accent-primary);
          border: 1px solid var(--accent-border);
        }

        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--status-success);
          margin-left: 2px;
        }

        /* FAQs Tab Styles */
        .faq-search-wrapper {
          margin-bottom: 20px;
        }

        .faq-search-bar {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .faq-search-icon {
          position: absolute;
          left: 16px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .faq-search-input {
          width: 100%;
          background-color: var(--bg-panel);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-md);
          padding: 14px 40px 14px 44px;
          font-size: 14px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .faq-search-input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 1px var(--accent-primary);
        }

        .faq-search-clear {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }

        .faq-search-clear:hover {
          color: var(--text-primary);
        }

        .faq-search-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
          padding: 0 4px;
        }

        .faq-category-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          padding-bottom: 4px;
          margin-bottom: 24px;
        }

        .faq-cat-pill {
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          padding: 6px 14px;
          border-radius: var(--radius-full);
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .faq-cat-pill:hover {
          background-color: rgba(255, 255, 255, 0.06);
          color: var(--text-primary);
          border-color: var(--border-standard);
        }

        .faq-cat-pill.active {
          background-color: var(--accent-subtle);
          border-color: var(--accent-border);
          color: var(--accent-text);
          font-weight: 600;
        }

        .faq-accordion-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 32px;
        }

        .faq-accordion-item {
          background-color: var(--bg-panel);
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: border-color 0.15s ease;
        }

        .faq-accordion-item:hover {
          border-color: var(--border-strong);
        }

        .faq-accordion-item.expanded {
          border-color: rgba(255, 100, 31, 0.35);
          background-color: var(--bg-panel-elevated);
        }

        .faq-accordion-header {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          user-select: none;
        }

        .faq-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .faq-question-text {
          font-size: 14.5px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .faq-toggle-icon {
          color: var(--text-muted);
        }

        .faq-accordion-body {
          padding: 0 20px 18px 20px;
          border-top: 1px solid var(--border-subtle);
          padding-top: 14px;
        }

        .faq-answer-text {
          font-size: 13.5px;
          line-height: 1.65;
          color: var(--text-secondary);
          text-align: justify;
          text-justify: inter-word;
        }

        .faq-footer-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid var(--border-subtle);
          flex-wrap: wrap;
          gap: 12px;
        }

        .faq-footer-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .faq-action-link {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: var(--accent-primary);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
        }

        .faq-action-link:hover {
          text-decoration: underline;
        }

        .faq-ask-ai-link {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xs);
          padding: 3px 8px;
          color: var(--text-secondary);
          font-size: 11.5px;
          cursor: pointer;
        }

        .faq-ask-ai-link:hover {
          color: var(--text-primary);
          border-color: var(--border-standard);
        }

        .faq-footer-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .faq-helpful-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xs);
          padding: 4px 10px;
          font-size: 11.5px;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .faq-helpful-btn:hover:not(:disabled) {
          border-color: var(--border-strong);
          color: var(--text-primary);
        }

        .faq-helpful-btn.voted {
          background-color: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.3);
          color: var(--status-success);
        }

        .faq-copy-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xs);
          padding: 5px 8px;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .faq-copy-btn:hover {
          border-color: var(--border-strong);
          color: var(--text-primary);
        }

        .faq-empty-state {
          background-color: var(--bg-panel);
          border: 1px dashed var(--border-strong);
          border-radius: var(--radius-lg);
          padding: 48px 24px;
          text-align: center;
          margin-bottom: 32px;
        }

        .empty-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px auto;
        }

        .empty-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 6px;
        }

        .empty-desc {
          font-size: 13px;
          color: var(--text-secondary);
          max-width: 480px;
          margin: 0 auto 20px auto;
          line-height: 1.5;
        }

        .empty-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .support-banner-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 768px) {
          .support-banner-row {
            grid-template-columns: 1fr;
          }
        }

        .banner-card {
          background-color: var(--bg-panel);
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-md);
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .banner-icon-box {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .banner-content {
          flex: 1;
        }

        .banner-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 3px;
        }

        .banner-desc {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        /* Assistant Workbench Tab */
        .support-assistant-workbench {
          background-color: var(--bg-panel);
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          height: 700px;
          overflow: hidden;
        }

        .assistant-console-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: rgba(255, 255, 255, 0.015);
        }

        .assistant-brand-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .assistant-avatar-box {
          width: 34px;
          height: 34px;
          border-radius: var(--radius-xs);
          background-color: var(--accent-subtle);
          border: 1px solid var(--accent-border);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .assistant-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .assistant-title {
          font-size: 14.5px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .assistant-subtitle {
          font-size: 11.5px;
          color: var(--text-secondary);
        }

        .assistant-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .assistant-provider-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          color: var(--text-secondary);
        }

        .starter-prompts-row {
          padding: 10px 20px;
          background-color: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .starter-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: var(--text-muted);
          white-space: nowrap;
        }

        .starter-pills-list {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .starter-prompt-pill {
          background-color: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          font-size: 11.5px;
          padding: 4px 10px;
          border-radius: var(--radius-xs);
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .starter-prompt-pill:hover {
          background-color: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
          border-color: var(--border-strong);
        }

        .starter-arrow {
          color: var(--text-muted);
        }

        .chat-messages-viewport {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background-color: var(--bg-canvas);
        }

        .chat-message-row {
          display: flex;
          gap: 12px;
          max-width: 85%;
        }

        .chat-message-row.user-row {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .chat-message-row.assistant-row {
          align-self: flex-start;
        }

        .user-avatar-pill {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--border-strong);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-primary);
          flex-shrink: 0;
        }

        .bot-avatar-pill {
          width: 30px;
          height: 30px;
          border-radius: var(--radius-xs);
          background-color: var(--accent-subtle);
          border: 1px solid var(--accent-border);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .chat-message-bubble {
          background-color: var(--bg-panel);
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-md);
          padding: 14px 18px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .user-row .chat-message-bubble {
          background-color: #1a1e29;
          border-color: rgba(255, 255, 255, 0.12);
        }

        .bubble-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11.5px;
        }

        .bubble-sender-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .bubble-time {
          color: var(--text-muted);
        }

        .grounded-tag {
          background-color: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          font-size: 10px;
          padding: 1px 6px;
          border-radius: var(--radius-xs);
          margin-left: auto;
        }

        .bubble-body {
          font-size: 13.5px;
          line-height: 1.6;
          color: var(--text-primary);
        }

        .bubble-bullet-list {
          margin: 6px 0;
          padding-left: 18px;
        }

        .bubble-bullet-item {
          margin-bottom: 4px;
        }

        .bubble-suggested-action {
          margin-top: 6px;
        }

        .suggested-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: var(--accent-subtle);
          border: 1px solid var(--accent-border);
          color: var(--accent-text);
          padding: 6px 12px;
          border-radius: var(--radius-xs);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .suggested-action-btn:hover {
          background-color: var(--accent-subtle-hover);
        }

        .bubble-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }

        .bubble-action-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          padding: 2px 4px;
        }

        .bubble-action-btn:hover {
          color: var(--text-primary);
        }

        .thinking-bubble {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
        }

        .thinking-dots {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .thinking-dots .dot {
          width: 5px;
          height: 5px;
          background-color: var(--accent-primary);
          border-radius: 50%;
          animation: dotPulse 1.2s infinite ease-in-out;
        }

        .thinking-dots .dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .thinking-dots .dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        .assistant-input-form {
          padding: 16px 20px;
          border-top: 1px solid var(--border-subtle);
          background-color: rgba(255, 255, 255, 0.015);
        }

        .assistant-input-container {
          display: flex;
          align-items: center;
          background-color: var(--bg-canvas);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-md);
          padding: 4px 6px 4px 14px;
          transition: border-color 0.15s ease;
        }

        .assistant-input-container:focus-within {
          border-color: var(--accent-primary);
        }

        .assistant-input-field {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 13.5px;
          padding: 8px 0;
        }

        .assistant-send-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-xs);
          background-color: var(--accent-primary);
          border: none;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .assistant-send-btn:hover:not(:disabled) {
          background-color: var(--accent-hover);
        }

        .assistant-send-btn:disabled {
          background-color: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          cursor: not-allowed;
        }

        .assistant-input-hints {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 8px;
          padding: 0 4px;
        }

        .hint-kbd {
          background-color: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-subtle);
          border-radius: 3px;
          padding: 1px 4px;
          font-family: var(--font-mono);
          font-size: 10px;
        }

        /* Tickets Workbench Tab */
        .support-tickets-workbench {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tickets-control-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .tickets-filter-pills {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .tickets-layout-split {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 16px;
          min-height: 600px;
        }

        @media (max-width: 900px) {
          .tickets-layout-split {
            grid-template-columns: 1fr;
          }
        }

        .tickets-master-column {
          background-color: var(--bg-panel);
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-lg);
          padding: 12px;
          overflow-y: auto;
          max-height: 700px;
        }

        .tickets-items-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ticket-summary-card {
          background-color: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 14px 16px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ticket-summary-card:hover {
          border-color: var(--border-strong);
          background-color: rgba(255, 255, 255, 0.04);
        }

        .ticket-summary-card.selected {
          border-color: var(--accent-border);
          background-color: var(--accent-subtle);
        }

        .ticket-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .ticket-ref-code {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--accent-primary);
        }

        .status-badge-chip {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          padding: 2px 7px;
          border-radius: var(--radius-xs);
        }

        .status-badge-chip.status-open {
          background-color: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.28);
          color: #38BDF8;
        }

        .status-badge-chip.status-in_progress {
          background-color: rgba(234, 179, 8, 0.12);
          border: 1px solid rgba(234, 179, 8, 0.28);
          color: #EAB308;
        }

        .status-badge-chip.status-waiting_user {
          background-color: rgba(168, 85, 247, 0.12);
          border: 1px solid rgba(168, 85, 247, 0.28);
          color: #C084FC;
        }

        .status-badge-chip.status-resolved {
          background-color: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.28);
          color: #22C55E;
        }

        .priority-tag {
          font-size: 10.5px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .priority-tag.priority-urgent {
          color: #EF4444;
        }

        .priority-tag.priority-high {
          color: #F97316;
        }

        .priority-tag.priority-normal {
          color: #94A3B8;
        }

        .priority-tag.priority-low {
          color: #64748B;
        }

        .ticket-subject-text {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.35;
          margin-bottom: 4px;
        }

        .ticket-desc-snippet {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .ticket-card-footer {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ticket-empty-box {
          padding: 40px 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .tickets-detail-column {
          background-color: var(--bg-panel);
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-lg);
          padding: 24px;
          display: flex;
          flex-direction: column;
          max-height: 700px;
          overflow-y: auto;
        }

        .ticket-detail-view {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .ticket-detail-header {
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .detail-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .ticket-id-large {
          font-size: 13px;
          font-weight: 700;
          color: var(--accent-primary);
        }

        .detail-subject-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.015em;
          margin-bottom: 12px;
        }

        .detail-meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          background-color: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xs);
          padding: 10px 14px;
          font-size: 12px;
        }

        @media (max-width: 640px) {
          .detail-meta-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .meta-label {
          color: var(--text-muted);
          margin-right: 6px;
        }

        .meta-val {
          color: var(--text-primary);
          font-weight: 500;
        }

        .ticket-timeline-accordion {
          background-color: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 14px 16px;
        }

        .timeline-title-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
        }

        .timeline-items-flow {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-left: 8px;
          border-left: 1px solid var(--border-strong);
        }

        .timeline-event-item {
          position: relative;
          padding-left: 14px;
        }

        .timeline-node {
          position: absolute;
          left: -13px;
          top: 5px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: var(--accent-primary);
        }

        .timeline-desc {
          font-size: 12px;
          color: var(--text-primary);
          font-weight: 500;
        }

        .timeline-meta {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .ticket-messages-stream {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .ticket-message-card {
          background-color: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 14px 16px;
        }

        .ticket-message-card.support-message {
          background-color: rgba(255, 100, 31, 0.04);
          border-color: rgba(255, 100, 31, 0.2);
        }

        .ticket-message-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .ticket-message-body {
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-primary);
        }

        .ticket-reply-box {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-top: 10px;
          border-top: 1px solid var(--border-subtle);
        }

        .ticket-reply-textarea {
          width: 100%;
          background-color: var(--bg-canvas);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          font-size: 13.5px;
          color: var(--text-primary);
          outline: none;
          resize: vertical;
        }

        .ticket-reply-textarea:focus {
          border-color: var(--accent-primary);
        }

        .ticket-reply-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ticket-resolved-notice {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          background-color: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.22);
          border-radius: var(--radius-md);
          font-size: 12.5px;
          color: var(--status-success);
        }

        .tickets-empty-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 300px;
        }

        /* Modal Styles */
        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }

        .input-standard, .select-standard, .textarea-standard {
          width: 100%;
          background-color: var(--bg-canvas);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          font-size: 13px;
          color: var(--text-primary);
          outline: none;
        }

        .input-standard:focus, .select-standard:focus, .textarea-standard:focus {
          border-color: var(--accent-primary);
        }

        .form-notice-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background-color: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
        }

        .modal-actions-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 14px;
          border-top: 1px solid var(--border-subtle);
        }

        /* Mobile & Tablet Overrides for Support Page */
        @media (max-width: 1024px) {
          .support-assistant-workbench {
            height: calc(100vh - 220px);
            min-height: 500px;
            max-height: 700px;
          }
          .tickets-layout-split {
            grid-template-columns: 320px 1fr;
          }
        }

        @media (max-width: 850px) {
          .tickets-layout-split {
            grid-template-columns: 1fr;
            min-height: auto;
          }
          .tickets-master-column {
            max-height: 380px;
          }
        }

        @media (max-width: 640px) {
          .assistant-console-header {
            padding: 12px 14px;
            flex-wrap: wrap;
            gap: 10px;
          }
          .assistant-header-actions {
            width: 100%;
            justify-content: space-between;
          }
          .chat-messages-viewport {
            padding: 16px 12px;
          }
          .chat-message-row {
            max-width: 96%;
          }
          .assistant-input-form {
            padding: 12px 14px;
          }
          .faq-footer-actions {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          .faq-footer-right {
            width: 100%;
            justify-content: space-between;
          }
          .detail-meta-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .detail-meta-grid {
            grid-template-columns: 1fr;
          }
          .assistant-input-hints {
            display: none;
          }
          .starter-prompts-row {
            padding: 8px 12px;
          }
        }
      `}</style>
    </div>
  );
};
