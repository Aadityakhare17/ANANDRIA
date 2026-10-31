import React, { useState } from 'react';
import { useAppContext, ACTIONS } from '../context/AppContext.jsx';
import { useEventPlan } from '../hooks/useEventPlan.js';
import { validateRefinementPrompt } from '../utils/sanitize.js';
import { Sparkles, Send, Loader2, X } from 'lucide-react';

const QUICK_PROMPTS = [
  'Reduce budget by 15%',
  'Make it eco-friendly',
  'Add outdoor rain backup tasks',
  'Add more vegetarian menu options',
  'Prioritize photography and decor',
  'Add a kids entertainment section',
];

export default function CoPilotBar() {
  const { state, dispatch } = useAppContext();
  const { refine } = useEventPlan();
  const { refinementPrompt, isRefining, plan } = state;
  const [localPrompt, setLocalPrompt] = useState('');
  const [error, setError] = useState('');
  const [showQuick, setShowQuick] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const prompt = localPrompt.trim();
    const { valid, error: valErr } = validateRefinementPrompt(prompt);
    if (!valid) {
      setError(valErr);
      return;
    }
    const success = await refine(prompt);
    if (success) setLocalPrompt('');
  }

  function applyQuickPrompt(p) {
    setLocalPrompt(p);
    setShowQuick(false);
  }

  if (!plan) return null;

  return (
    <aside className="copilot-bar" aria-label="AI Co-Pilot refinement bar">
      <div className="copilot-inner">
        <div className="copilot-header">
          <Sparkles size={16} aria-hidden="true" className="copilot-icon" />
          <span className="copilot-label">AI Co-Pilot</span>
          <button
            type="button"
            className="quick-prompts-btn"
            onClick={() => setShowQuick((v) => !v)}
            aria-expanded={showQuick}
            aria-label="Toggle quick prompts"
          >
            Quick Ideas ▾
          </button>
        </div>

        {showQuick && (
          <div className="quick-prompts" role="list" aria-label="Quick refinement prompts">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                role="listitem"
                className="quick-prompt-chip"
                onClick={() => applyQuickPrompt(p)}
                aria-label={`Apply quick prompt: ${p}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        <form className="copilot-form" onSubmit={handleSubmit} role="search" aria-label="Refine your plan">
          <div className="copilot-input-wrap">
            <input
              type="text"
              className="copilot-input"
              placeholder="e.g. Reduce catering by 10% and add a photo booth…"
              value={localPrompt}
              onChange={(e) => { setLocalPrompt(e.target.value); setError(''); }}
              maxLength={300}
              aria-label="Refinement prompt"
              aria-describedby={error ? 'copilot-error' : undefined}
              aria-invalid={!!error}
              disabled={isRefining}
            />
            {localPrompt && (
              <button
                type="button"
                className="copilot-clear"
                onClick={() => setLocalPrompt('')}
                aria-label="Clear prompt"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-copilot"
            disabled={isRefining || !localPrompt.trim()}
            aria-busy={isRefining}
            aria-label="Refine plan"
          >
            {isRefining
              ? <Loader2 size={16} className="spin" aria-hidden="true" />
              : <Send size={16} aria-hidden="true" />
            }
            <span>{isRefining ? 'Refining…' : 'Refine'}</span>
          </button>
        </form>

        {error && (
          <p id="copilot-error" className="copilot-error" role="alert" aria-live="polite">
            {error}
          </p>
        )}
      </div>
    </aside>
  );
}
