import React, { useMemo } from 'react';
import { useAppContext, ACTIONS } from '../context/AppContext.jsx';
import { daysUntilEvent, formatDate, calcTimelineCompletion } from '../utils/budgetCalc.js';
import { CheckSquare, Square, Calendar, Clock, AlertCircle } from 'lucide-react';

const PHASE_ICONS = {
  '6+ Months Out': '🗓️',
  '3-6 Months Out': '📋',
  '1-3 Months Out': '📌',
  '2-4 Weeks Out': '⚡',
  '1 Week Out': '🔥',
  'Day Before': '🌟',
  'Event Day': '🎉',
  'Post-Event': '🌹',
};

const PRIORITY_COLORS = {
  High: 'var(--color-error)',
  Medium: 'var(--color-warning)',
  Low: 'var(--color-success)',
};

function MilestoneCard({ item, onToggle }) {
  return (
    <div className={`milestone-card ${item.completed ? 'completed' : ''} priority-${item.priority?.toLowerCase()}`}>
      <button
        className="milestone-check"
        onClick={() => onToggle(item.id)}
        aria-label={`${item.completed ? 'Mark incomplete' : 'Mark complete'}: ${item.task}`}
        aria-pressed={item.completed}
      >
        {item.completed
          ? <CheckSquare size={20} className="check-icon checked" aria-hidden="true" />
          : <Square size={20} className="check-icon" aria-hidden="true" />
        }
      </button>
      <div className="milestone-body">
        <p className={`milestone-task ${item.completed ? 'done-text' : ''}`}>{item.task}</p>
        {item.description && <p className="milestone-desc">{item.description}</p>}
        <div className="milestone-meta">
          <span className="milestone-date">
            <Calendar size={12} aria-hidden="true" /> {formatDate(item.dueDate)}
          </span>
          {item.priority && (
            <span
              className="priority-badge"
              style={{ color: PRIORITY_COLORS[item.priority] }}
              aria-label={`Priority: ${item.priority}`}
            >
              {item.priority}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TimelineTab() {
  const { state, dispatch } = useAppContext();
  const { plan, formData } = state;

  const milestones = plan?.timeline || [];
  const daysLeft = formData.targetDate ? daysUntilEvent(formData.targetDate) : null;
  const completion = calcTimelineCompletion(milestones);

  // Group milestones by phase
  const phaseGroups = useMemo(() => {
    const groups = {};
    milestones.forEach((m) => {
      if (!groups[m.phase]) groups[m.phase] = [];
      groups[m.phase].push(m);
    });
    return groups;
  }, [milestones]);

  function toggleMilestone(id) {
    dispatch({ type: ACTIONS.TOGGLE_TIMELINE_ITEM, payload: id });
  }

  if (!plan) return null;

  return (
    <section aria-labelledby="timeline-tab-heading" className="tab-content">
      <h2 id="timeline-tab-heading" className="sr-only">Event Timeline</h2>

      {/* Header stats */}
      <div className="timeline-header">
        <div className="timeline-stats">
          {daysLeft !== null && (
            <div className="stat-card">
              <Clock size={20} aria-hidden="true" className="stat-icon" />
              <div>
                <span className="stat-value">{daysLeft > 0 ? daysLeft : 'Today!'}</span>
                <span className="stat-label">{daysLeft > 1 ? 'days until event' : daysLeft === 1 ? 'day until event' : ''}</span>
              </div>
            </div>
          )}
          {formData.targetDate && (
            <div className="stat-card">
              <Calendar size={20} aria-hidden="true" className="stat-icon" />
              <div>
                <span className="stat-value">{formatDate(formData.targetDate)}</span>
                <span className="stat-label">Event Date</span>
              </div>
            </div>
          )}
          <div className="stat-card">
            <CheckSquare size={20} aria-hidden="true" className="stat-icon" />
            <div>
              <span className="stat-value">{milestones.filter((m) => m.completed).length}/{milestones.length}</span>
              <span className="stat-label">tasks complete</span>
            </div>
          </div>
        </div>

        {/* Overall progress */}
        <div className="timeline-progress">
          <div className="progress-header">
            <span className="progress-label">Planning Progress</span>
            <span className="progress-pct" aria-live="polite">{completion}%</span>
          </div>
          <div
            className="progress-bar"
            role="progressbar"
            aria-valuenow={completion}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Planning progress: ${completion}%`}
          >
            <div className="progress-fill" style={{ width: `${completion}%` }} />
          </div>
        </div>
      </div>

      {/* Phase groups */}
      <div className="timeline-phases">
        {Object.entries(phaseGroups).map(([phase, items]) => {
          const phaseComplete = items.filter((i) => i.completed).length;
          const phaseTotal = items.length;
          return (
            <div key={phase} className="phase-group">
              <div className="phase-header">
                <span className="phase-icon" aria-hidden="true">{PHASE_ICONS[phase] || '📍'}</span>
                <h3 className="phase-title">{phase}</h3>
                <span className="phase-count">{phaseComplete}/{phaseTotal}</span>
              </div>
              <div className="phase-milestones" role="list" aria-label={`${phase} tasks`}>
                {items.map((item) => (
                  <div key={item.id} role="listitem">
                    <MilestoneCard item={item} onToggle={toggleMilestone} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {milestones.length === 0 && (
        <div className="empty-state">
          <AlertCircle size={48} aria-hidden="true" />
          <p>No timeline milestones found. Try regenerating your plan.</p>
        </div>
      )}
    </section>
  );
}
