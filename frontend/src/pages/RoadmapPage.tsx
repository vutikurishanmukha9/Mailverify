import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { RoadmapItem } from '../types';
import {
  ChevronUp,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card, CardBody } from '../components/common/Card';
import { Modal } from '../components/common/Modal';

export const RoadmapPage: React.FC = () => {
  const { roadmapItems, upvoteRoadmap, submitRoadmapSuggestion, addToast } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'planned' | 'under_review' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Suggest Feature Modal
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [suggestTitle, setSuggestTitle] = useState('');
  const [suggestDesc, setSuggestDesc] = useState('');
  const [suggestCategory, setSuggestCategory] = useState<RoadmapItem['category']>('Outreach');

  const handleSuggest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestTitle.trim() || !suggestDesc.trim()) {
      addToast({
        type: 'error',
        title: 'Fields Required',
        message: 'Please provide both a title and description.'
      });
      return;
    }
    submitRoadmapSuggestion(suggestTitle, suggestDesc, suggestCategory);
    setSuggestTitle('');
    setSuggestDesc('');
    setIsSuggestModalOpen(false);
  };

  const filteredItems = roadmapItems.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesStatus && matchesCategory;
  });

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-header-title">Product Roadmap & Changelog</h1>
          <p className="page-header-description">
            Vote on upcoming features, track active development milestones, and help shape our
            engineering roadmap.
          </p>
        </div>
        <div className="page-header-actions">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsSuggestModalOpen(true)}
            leftIcon={<Plus size={13} />}
          >
            Suggest Feature
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="roadmap-filters-row">
        <div className="tab-pill-nav">
          <button
            className={`tab-pill-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Statuses ({roadmapItems.length})
          </button>
          <button
            className={`tab-pill-btn ${statusFilter === 'in_progress' ? 'active' : ''}`}
            onClick={() => setStatusFilter('in_progress')}
          >
            In Progress
          </button>
          <button
            className={`tab-pill-btn ${statusFilter === 'planned' ? 'active' : ''}`}
            onClick={() => setStatusFilter('planned')}
          >
            Planned
          </button>
          <button
            className={`tab-pill-btn ${statusFilter === 'under_review' ? 'active' : ''}`}
            onClick={() => setStatusFilter('under_review')}
          >
            Under Review
          </button>
          <button
            className={`tab-pill-btn ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('completed')}
          >
            Completed
          </button>
        </div>

        <select
          className="select"
          style={{ width: 'auto', paddingRight: 28 }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="Integrations">Integrations</option>
          <option value="Outreach">Outreach</option>
          <option value="API">API & Dev Tools</option>
          <option value="Security">Security & Compliance</option>
          <option value="Performance">Performance</option>
        </select>
      </div>

      {/* Roadmap Items Grid / List */}
      <div className="roadmap-items-grid">
        {filteredItems.map((item) => {
          const isCompleted = item.status === 'completed';
          const isInProgress = item.status === 'in_progress';
          const isPlanned = item.status === 'planned';

          return (
            <Card key={item.id} className="roadmap-card">
              <CardBody>
                <div className="roadmap-card-layout">
                  {/* Upvote Button */}
                  <button
                    className={`upvote-btn ${item.hasVoted ? 'voted' : ''}`}
                    onClick={() => upvoteRoadmap(item.id)}
                    title={item.hasVoted ? 'Remove your vote' : 'Upvote this feature'}
                  >
                    <ChevronUp size={16} />
                    <span className="font-mono tabular-nums">{item.votes}</span>
                  </button>

                  {/* Content */}
                  <div className="roadmap-card-content">
                    <div className="roadmap-card-top">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="roadmap-cat-badge">{item.category}</span>
                        <span className="roadmap-quarter font-mono">{item.quarter}</span>
                      </div>

                      <div>
                        {isInProgress && (
                          <Badge variant="accent">
                            <span className="badge-dot" style={{ backgroundColor: 'var(--accent-primary)' }} />
                            In Progress
                          </Badge>
                        )}
                        {isPlanned && (
                          <Badge variant="neutral">Planned</Badge>
                        )}
                        {item.status === 'under_review' && (
                          <Badge variant="warning">Under Review</Badge>
                        )}
                        {isCompleted && (
                          <Badge variant="success">
                            <CheckCircle2 size={11} /> Shipped
                          </Badge>
                        )}
                      </div>
                    </div>

                    <h3 className="roadmap-item-title">{item.title}</h3>
                    <p className="roadmap-item-desc">{item.description}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Suggest Feature Modal */}
      <Modal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        title="Suggest a Product Feature"
        maxWidth={500}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
            <Button variant="ghost" size="sm" onClick={() => setIsSuggestModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSuggest}>
              Submit for Review
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSuggest}>
          <div className="form-group">
            <label className="form-label">Feature Title</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Native Clay.com Enrichments Table Connector"
              value={suggestTitle}
              onChange={(e) => setSuggestTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="select"
              value={suggestCategory}
              onChange={(e) => setSuggestCategory(e.target.value as any)}
            >
              <option value="Integrations">Integrations</option>
              <option value="Outreach">Outreach & Sequencing</option>
              <option value="API">Developer API & Webhooks</option>
              <option value="Security">Security & Enterprise</option>
              <option value="Performance">Performance & Accuracy</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Problem & Proposed Solution</label>
            <textarea
              className="input"
              rows={4}
              placeholder="How would this improvement help your email verification and outbound deliverability workflows?"
              value={suggestDesc}
              onChange={(e) => setSuggestDesc(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>

      <style>{`
        .roadmap-filters-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-5);
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .roadmap-items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: var(--space-4);
        }

        .roadmap-card-layout {
          display: flex;
          gap: var(--space-4);
          align-items: flex-start;
        }

        .upvote-btn {
          width: 48px;
          height: 52px;
          border-radius: var(--radius-sm);
          background-color: var(--bg-panel-elevated);
          border: 1px solid var(--border-standard);
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .upvote-btn:hover {
          border-color: var(--accent-primary);
          color: var(--text-primary);
          background-color: var(--bg-hover);
        }
        .upvote-btn.voted {
          background-color: var(--accent-subtle);
          border-color: var(--accent-border);
          color: var(--accent-text);
        }

        .roadmap-card-content {
          flex: 1;
          min-width: 0;
        }

        .roadmap-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .roadmap-cat-badge {
          font-size: 10px;
          text-transform: uppercase;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.04em;
        }

        .roadmap-quarter {
          font-size: 11px;
          color: var(--text-tertiary);
        }

        .roadmap-item-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 6px;
          line-height: 1.35;
        }

        .roadmap-item-desc {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.45;
        }

        @media (max-width: 1024px) {
          .roadmap-items-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
        }

        @media (max-width: 768px) {
          .roadmap-items-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .roadmap-filters-row {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .roadmap-filters-row > * {
            width: 100%;
          }
          .roadmap-filters-row .tab-pill-nav {
            flex-wrap: wrap;
            gap: 4px;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
