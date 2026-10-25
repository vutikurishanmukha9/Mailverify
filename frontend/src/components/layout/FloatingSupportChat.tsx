import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { querySupportAssistant, getAiConfig } from '../../services/aiService';
import type { TicketCategory, TicketIssueType } from '../../types';
import {
  MessageSquare,
  X,
  Send,
  RotateCw,
  Copy,
  Check,
  ChevronRight,
  Bot,
  User,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface FloatingMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  suggestedAction?: {
    label: string;
    screen: string;
    prefillData?: {
      subject: string;
      category: TicketCategory;
      description: string;
      issueType: TicketIssueType;
    };
  };
}

export const FloatingSupportChat: React.FC = () => {
  const { navigateTo, screen } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<FloatingMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: "Hi there! I'm your MailVerify AI Technical Assistant. Ask me about SMTP verification codes, catch-all domains, DNS MX lookups, or outreach sequencer integrations.",
      time: 'Just now'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiConfig = getAiConfig();

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isOpen]);

  // If already on the dedicated support page, the floating widget is omitted to prevent duplication
  if (screen === 'support') {
    return null;
  }

  // If already on the dedicated support page, the floating widget stays minimized unless clicked
  const handleSend = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = (customQuery || input).trim();
    if (!query || isThinking) return;

    const userMsg: FloatingMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      const response = await querySupportAssistant(query, messages);
      const assistantMsg: FloatingMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedAction: response.suggestedAction
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'An error occurred while analyzing the verification database. Please retry or escalate to a support ticket.',
          time: 'Just now'
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEscalateToTicket = () => {
    setIsOpen(false);
  };

  const suggestedPrompts = [
    'Why is an email marked as Risky?',
    'How do I connect Instantly or Smartlead?',
    'What does SMTP 250 OK vs 550 mean?',
    'Do purchased add-on credits expire?'
  ];

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[800]">
      {/* Expanded Floating Chat Panel */}
      {isOpen && (
        <div className="flex flex-col w-[calc(100vw-32px)] sm:w-[420px] max-w-[420px] h-[520px] sm:h-[580px] max-h-[calc(100vh-90px)] rounded-2xl bg-[#141724] border border-white/15 shadow-2xl overflow-hidden mb-3.5 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-[#10131E] border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-[#FF641F]/15 border border-[#FF641F]/30 flex items-center justify-center text-[#FF641F] shrink-0">
                <Bot size={17} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#F8FAFC] truncate">AI Support Assistant</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </div>
                <div className="text-[11px] text-[#94A3B8] truncate">
                  {aiConfig.providerName}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setMessages([
                    {
                      id: 'init-1',
                      sender: 'assistant',
                      text: "Session restarted. What email deliverability problem can I help you resolve?",
                      time: 'Just now'
                    }
                  ])
                }
                title="Restart Chat Session"
                className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <RotateCw size={14} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#0D0F18] text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="h-7 w-7 rounded-md bg-[#FF641F]/15 border border-[#FF641F]/30 flex items-center justify-center text-[#FF641F] shrink-0 mt-0.5">
                    <Bot size={14} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed space-y-2 ${
                    msg.sender === 'user'
                      ? 'bg-[#FF641F] text-white shadow-sm'
                      : 'bg-[#181C2B] border border-white/12 text-[#F1F5F9]'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Actions / Buttons inside message */}
                  {msg.suggestedAction && (
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (msg.suggestedAction?.screen === 'ticket_modal') {
                            handleEscalateToTicket();
                          } else {
                            setIsOpen(false);
                            navigateTo(msg.suggestedAction!.screen as any);
                          }
                        }}
                        className="h-7 text-xs px-2.5 bg-white/[0.06] hover:bg-white/[0.12]"
                        rightIcon={<ArrowUpRight size={12} />}
                      >
                        {msg.suggestedAction.label}
                      </Button>
                    </div>
                  )}

                  {/* Message Footer */}
                  <div className="flex items-center justify-between pt-0.5 text-[10px] text-[#64748B]">
                    <span>{msg.time}</span>
                    {msg.sender === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="hover:text-white flex items-center gap-1 cursor-pointer"
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check size={11} className="text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="h-7 w-7 rounded-md bg-white/[0.1] border border-white/15 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <User size={13} />
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="flex gap-2.5 justify-start">
                <div className="h-7 w-7 rounded-md bg-[#FF641F]/15 border border-[#FF641F]/30 flex items-center justify-center text-[#FF641F] shrink-0">
                  <Bot size={14} />
                </div>
                <div className="bg-[#181C2B] border border-white/12 rounded-xl px-3.5 py-2 text-xs text-[#94A3B8] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF641F] animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF641F] animate-bounce [animation-delay:0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF641F] animate-bounce [animation-delay:0.3s]" />
                  <span className="ml-1 text-[11px]">Consulting knowledge base...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel if conversation is fresh */}
          {messages.length <= 2 && (
            <div className="px-3.5 py-2 bg-[#10131E] border-t border-white/10 overflow-x-auto flex gap-1.5 no-scrollbar">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(undefined, prompt)}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-white/[0.04] hover:bg-white/[0.09] text-[#94A3B8] hover:text-white border border-white/10 whitespace-nowrap transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-[#10131E] border-t border-white/10 shrink-0">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input
                type="text"
                placeholder="Ask about SMTP, DNS MX, rates..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="h-10 text-xs bg-[#181C2B] border-white/15"
                disabled={isThinking}
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!input.trim() || isThinking}
                className="h-10 px-3.5"
              >
                <Send size={13} />
              </Button>
            </form>
            <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-[#64748B]">
              <button
                type="button"
                onClick={handleEscalateToTicket}
                className="text-[#FF7B3D] hover:underline cursor-pointer flex items-center gap-1 font-medium"
              >
                <span>Transfer conversation to ticket</span>
                <ChevronRight size={12} />
              </button>
              <span>RFC 5321 verified</span>
            </div>
          </div>
        </div>
      )}

      {/* Launcher Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xl border ${
          isOpen
            ? 'bg-[#1C2030] border-white/20 text-white rotate-90'
            : 'bg-[#FF641F] hover:bg-[#E55515] border-[#FF8248]/40 text-white hover:scale-105'
        }`}
        aria-label="Toggle Technical Support Chat"
        title="Open MailVerify AI Assistant"
      >
        {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
      </button>
    </div>
  );
};
