import React from 'react';
import type { AudienceSegment } from '../services/ConversationState';
import { X, Plus } from 'lucide-react';

interface AudiencePanelProps {
  segments: AudienceSegment[];
  onRemoveSegment: (segmentId: string) => void;
  onAddCriteria: () => void;
  onGenerateQuery: () => void;
  currentQuery: string;
}

const AudiencePanel: React.FC<AudiencePanelProps> = ({
  segments,
  onRemoveSegment,
  onAddCriteria,
  onGenerateQuery,
  currentQuery
}) => {
  const getSegmentColor = (type: AudienceSegment['type']) => {
    switch (type) {
      case 'demographic': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'behavioral': return 'bg-green-100 text-green-800 border-green-200';
      case 'psychographic': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'geographic': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (segments.length === 0) {
    return (
      <div className="audience-panel empty">
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <div className="empty-title">No Audience Defined</div>
          <div className="empty-description">
            Start by describing your target audience. I'll help you build it step by step.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="audience-panel">
      <div className="panel-header">
        <h3 className="panel-title">
          Current Audience
          <span className="segment-count">({segments.length} segments)</span>
        </h3>
        <button 
          onClick={onAddCriteria}
          className="add-criteria-btn"
          title="Add more criteria"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="segments-list">
        {segments.map((segment) => (
          <div key={segment.id} className={`segment-card ${getSegmentColor(segment.type)}`}>
            <div className="segment-header">
              <div className="segment-type">{segment.type}</div>
              <button
                onClick={() => onRemoveSegment(segment.id)}
                className="remove-segment-btn"
                title="Remove this segment"
              >
                <X size={14} />
              </button>
            </div>
            <div className="segment-label">{segment.label}</div>
            <div className="segment-criteria">{segment.criteria}</div>
            <div className="segment-logic">{segment.booleanLogic}</div>
            <div className="segment-confidence">
              Confidence: {Math.round(segment.confidence * 100)}%
            </div>
          </div>
        ))}
      </div>

      <div className="panel-actions">
        <button 
          onClick={onGenerateQuery}
          className="generate-query-btn primary"
          disabled={segments.length === 0}
        >
          Generate Boolean Query
        </button>
      </div>

      {currentQuery && (
        <div className="current-query">
          <div className="query-header">
            <span className="query-title">Generated Query:</span>
            <button 
              onClick={() => navigator.clipboard.writeText(currentQuery)}
              className="copy-query-btn"
              title="Copy to clipboard"
            >
              📋
            </button>
          </div>
          <div className="query-content">{currentQuery}</div>
        </div>
      )}
    </div>
  );
};

export default AudiencePanel;