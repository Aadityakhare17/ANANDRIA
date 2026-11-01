import React, { useState } from 'react';
import { useAppContext, ACTIONS } from '../context/AppContext.jsx';
import { useEventPlan } from '../hooks/useEventPlan.js';
import { TABS } from '../utils/constants.js';
import { exportToJSON, exportToMarkdown } from '../utils/storage.js';
import { DEMO_MODE } from '../services/geminiService.js';
import BudgetTab from './BudgetTab.jsx';
import TimelineTab from './TimelineTab.jsx';
import VendorChecklistTab from './VendorChecklistTab.jsx';
import IdeasTab from './IdeasTab.jsx';
import CoPilotBar from './CoPilotBar.jsx';
import {
  BarChart2, Calendar, CheckSquare, Lightbulb,
  Download, RefreshCw, Beaker, Loader2,
  FileJson, FileText, X, ChevronLeft
} from 'lucide-react';

const TAB_CONFIG = [
  { id: TABS.BUDGET,   label: 'Budget',    icon: BarChart2,    Component: BudgetTab },
  { id: TABS.TIMELINE, label: 'Timeline',  icon: Calendar,     Component: TimelineTab },
  { id: TABS.VENDORS,  label: 'Vendors',   icon: CheckSquare,  Component: VendorChecklistTab },
  { id: TABS.IDEAS,    label: 'Ideas',     icon: Lightbulb,    Component: IdeasTab },
];

export default function Dashboard() {
  const { state, dispatch, setActiveTab } = useAppContext();
  const { clearPlan } = useEventPlan();
  const { plan, formData, activeTab, showExportMenu, isRefining, generationError } = state;
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const activeConfig = TAB_CONFIG.find((t) => t.id === activeTab);
  const ActiveComponent = activeConfig?.Component || BudgetTab;

  function handleExport(format) {
    if (!plan) return;
    if (format === 'json') exportToJSON(plan, formData);
    if (format === 'markdown') exportToMarkdown(plan, formData);
    dispatch({ type: ACTIONS.TOGGLE_EXPORT_MENU });
  }

  const eventTypeEmoji = { Wedding: '💍', Birthday: '🎂', 'Community Event': '🎉' }[formData.eventType] || '✨';

  return (
    <div className="dashboard">
      {/* Demo mode banner */}
      {DEMO_MODE && (
        <div className="demo-banner" role="status">
          <Beaker size={16} aria-hidden="true" />
          <span>
            <strong>Demo Mode</strong> – Add <code>VITE_GEMINI_API_KEY</code> in <code>.env</code> for live AI generation.
          </span>
        </div>
      )}

      {/* Dashboard Header */}
      <header className="dashboard-header">
        <div className="dashboard-title-row">
          <button
            className="back-btn"
            onClick={() => dispatch({ type: ACTIONS.TOGGLE_WIZARD, payload: true })}
            aria-label="Back to event wizard"
          >
            <ChevronLeft size={18} aria-hidden="true" />
            <span className="sr-only">Back to Wizard</span>
          </button>

          <div className="dashboard-event-info">
            <span className="event-emoji" aria-hidden="true">{eventTypeEmoji}</span>
            <div>
              <h1 className="dashboard-event-name">{formData.eventName || 'My Event'}</h1>
              <p className="dashboard-event-meta">
                {formData.eventType} · {formData.guestCount} guests · {formData.currency}
                {Number(formData.totalBudget).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="dashboard-actions">
            {/* Export dropdown */}
            <div className="export-wrapper">
              <button
                className="btn btn-icon"
                onClick={() => dispatch({ type: ACTIONS.TOGGLE_EXPORT_MENU })}
                aria-label="Export event plan"
                aria-haspopup="menu"
                aria-expanded={showExportMenu}
              >
                <Download size={18} aria-hidden="true" />
              </button>
              {showExportMenu && (
                <div className="export-menu" role="menu" aria-label="Export options">
                  <button className="export-item" role="menuitem" onClick={() => handleExport('json')}>
                    <FileJson size={16} aria-hidden="true" /> Export as JSON
                  </button>
                  <button className="export-item" role="menuitem" onClick={() => handleExport('markdown')}>
                    <FileText size={16} aria-hidden="true" /> Export as Markdown
                  </button>
                </div>
              )}
            </div>

            {/* Diagnostics */}
            <button
              className="btn btn-icon"
              onClick={() => dispatch({ type: ACTIONS.TOGGLE_DIAGNOSTICS })}
              aria-label="Run diagnostics"
              title="Run Diagnostics"
            >
              <Beaker size={18} aria-hidden="true" />
            </button>

            {/* New Plan */}
            <button
              className="btn btn-icon btn-danger-ghost"
              onClick={() => setShowConfirmClear(true)}
              aria-label="Start a new event plan"
              title="New Plan"
            >
              <RefreshCw size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* AI summary */}
        {plan?.summary && (
          <p className="dashboard-summary">{plan.summary}</p>
        )}

        {/* Error display */}
        {generationError && !isRefining && (
          <div className="error-banner" role="alert" aria-live="assertive">
            <span>{generationError}</span>
            <button
              onClick={() => dispatch({ type: ACTIONS.SET_GENERATION_ERROR, payload: null })}
              className="error-dismiss"
              aria-label="Dismiss error"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}
      </header>

      {/* Tab Navigation */}
      <nav className="tab-nav" aria-label="Dashboard tabs">
        {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`tab-btn ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
            aria-selected={activeTab === id}
            role="tab"
            aria-controls={`tabpanel-${id}`}
            id={`tab-${id}`}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <main
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="tab-panel"
        aria-live="polite"
      >
        {isRefining && (
          <div className="refining-overlay" role="status" aria-live="polite">
            <Loader2 size={24} className="spin" aria-hidden="true" />
            <span>ANANDRIA is refining your plan…</span>
          </div>
        )}
        <ActiveComponent />
      </main>

      {/* AI Co-pilot bar */}
      <CoPilotBar />

      {/* Confirm clear modal */}
      {showConfirmClear && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Confirm new plan">
          <div className="modal-box">
            <h2 className="modal-title">Start a New Plan?</h2>
            <p className="modal-body">This will clear your current event plan and all adjustments. This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowConfirmClear(false)}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  clearPlan();
                  setShowConfirmClear(false);
                }}
              >
                Yes, Start Over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
