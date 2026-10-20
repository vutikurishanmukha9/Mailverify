import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HelpCircle, X, ExternalLink, MessageSquare, Send } from 'lucide-react';
import { Button } from '../common/Button';

export const SupportWidget: React.FC = () => {
  const { navigateTo, createSupportTicket, screen } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already on the support page, don't show the floating widget
  if (screen === 'support') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      createSupportTicket(subject, 'General', 'normal', message);
      setSubject('');
      setMessage('');
      setIsSubmitting(false);
      setIsOpen(false);
    }, 400);
  };

  return (
    <div className="support-widget-container">
      {isOpen && (
        <div className="support-popover">
          <div className="popover-header">
            <div className="popover-title">
              <MessageSquare size={15} style={{ color: 'var(--accent-primary)' }} />
              <span>Quick Technical Support</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="popover-close-btn"
              aria-label="Close support dialog"
            >
              <X size={15} />
            </button>
          </div>

          <div className="popover-body">
            <p className="popover-desc">
              Need assistance with DNS MX lookups, deliverability scoring, or API rate limits?
            </p>

            <form onSubmit={handleSubmit} className="popover-form">
              <input
                type="text"
                className="input input-sm"
                placeholder="Brief subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
              <textarea
                className="input input-sm"
                rows={3}
                placeholder="Describe your issue or question..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                style={{ resize: 'vertical' }}
              />
              <div className="popover-actions">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsOpen(false);
                    navigateTo('support');
                  }}
                  leftIcon={<ExternalLink size={12} />}
                >
                  Knowledge Base
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  leftIcon={<Send size={12} />}
                >
                  Send Ticket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <button
        className={`support-floating-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Quick Support & Documentation"
        aria-label="Toggle technical support"
      >
        {isOpen ? <X size={18} /> : <HelpCircle size={18} />}
      </button>

      <style>{`
        .support-widget-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 850;
        }

        .support-floating-trigger {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          background-color: var(--bg-panel-elevated);
          border: 1px solid var(--border-strong);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          transition: all 0.15s ease;
        }
        .support-floating-trigger:hover,
        .support-floating-trigger.active {
          color: var(--text-primary);
          border-color: var(--accent-primary);
          background-color: #202228;
          transform: translateY(-2px);
        }

        .support-popover {
          position: absolute;
          bottom: 50px;
          right: 0;
          width: 320px;
          background-color: var(--bg-panel);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-dropdown);
          overflow: hidden;
          animation: scaleUp 0.15s ease-out;
        }

        .popover-header {
          padding: 10px 14px;
          border-bottom: 1px solid var(--border-subtle);
          background-color: #121316;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .popover-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .popover-close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 2px;
          display: flex;
        }
        .popover-close-btn:hover {
          color: var(--text-primary);
        }

        .popover-body {
          padding: 14px;
        }

        .popover-desc {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 10px;
          line-height: 1.4;
        }

        .popover-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .popover-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
};
