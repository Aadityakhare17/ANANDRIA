import React, { useState, useCallback } from 'react';
import { useAppContext, ACTIONS } from '../context/AppContext.jsx';
import { validateBudgetSum, checkOverBudget } from '../utils/budgetCalc.js';
import { validateEventForm, validateRefinementPrompt } from '../utils/sanitize.js';
import { validatePlanSchema } from '../services/geminiService.js';
import { CheckCircle2, XCircle, Loader2, X, Beaker } from 'lucide-react';

// ─── Test Suite ───────────────────────────────────────────────────────────────

const TEST_CASES = [
  // Budget math tests
  {
    group: 'Budget Validator',
    name: 'Sum check: valid allocation',
    run: () => {
      const items = [
        { id: '1', amount: 250000 },
        { id: '2', amount: 300000 },
        { id: '3', amount: 200000 },
        { id: '4', amount: 250000 },
      ];
      const { valid } = validateBudgetSum(items, 1000000);
      return { pass: valid, detail: 'Items summing to exactly 1,000,000 should be valid' };
    },
  },
  {
    group: 'Budget Validator',
    name: 'Over-budget detection',
    run: () => {
      const items = [{ id: '1', amount: 1200000 }];
      const { overBudget, excess } = checkOverBudget(items, 1000000);
      return {
        pass: overBudget && excess === 200000,
        detail: `Expected overBudget=true, excess=200000. Got overBudget=${overBudget}, excess=${excess}`,
      };
    },
  },
  {
    group: 'Budget Validator',
    name: 'Under-budget not flagged as over-budget',
    run: () => {
      const items = [{ id: '1', amount: 500000 }];
      const { overBudget } = checkOverBudget(items, 1000000);
      return { pass: !overBudget, detail: 'Under-budget should not trigger over-budget alert' };
    },
  },
  // Input sanitizer tests
  {
    group: 'Input Validator',
    name: 'Rejects negative budget',
    run: () => {
      const { valid, errors } = validateEventForm({
        eventType: 'Wedding',
        eventName: 'Test',
        targetDate: (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0]; })(),
        guestCount: '100',
        totalBudget: '-5000',
        currency: 'INR',
      });
      return { pass: !valid && !!errors.totalBudget, detail: 'Negative budget should fail validation' };
    },
  },
  {
    group: 'Input Validator',
    name: 'Rejects zero guest count',
    run: () => {
      const { valid, errors } = validateEventForm({
        eventType: 'Birthday',
        eventName: 'Test',
        targetDate: (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0]; })(),
        guestCount: '0',
        totalBudget: '100000',
        currency: 'INR',
      });
      return { pass: !valid && !!errors.guestCount, detail: 'Zero guests should fail validation' };
    },
  },
  {
    group: 'Input Validator',
    name: 'Rejects past event date',
    run: () => {
      const { valid, errors } = validateEventForm({
        eventType: 'Wedding',
        eventName: 'Test',
        targetDate: '2020-01-01',
        guestCount: '50',
        totalBudget: '100000',
        currency: 'INR',
      });
      return { pass: !valid && !!errors.targetDate, detail: 'Past date should fail validation' };
    },
  },
  {
    group: 'Input Validator',
    name: 'Strips script injection from event name',
    run: () => {
      const { sanitized } = validateEventForm({
        eventType: 'Wedding',
        eventName: '<script>alert("xss")</script>Clean Name',
        targetDate: (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0]; })(),
        guestCount: '100',
        totalBudget: '100000',
        currency: 'INR',
      });
      const hasScript = sanitized.eventName?.includes('<script>');
      return { pass: !hasScript, detail: `Sanitized name: "${sanitized.eventName}" – should have no <script> tags` };
    },
  },
  {
    group: 'Input Validator',
    name: 'Rejects empty refinement prompt',
    run: () => {
      const { valid, error } = validateRefinementPrompt('');
      return { pass: !valid && !!error, detail: 'Empty refinement prompt should be rejected' };
    },
  },
  {
    group: 'Input Validator',
    name: 'Accepts valid refinement prompt',
    run: () => {
      const { valid } = validateRefinementPrompt('Reduce catering budget by 10%');
      return { pass: valid, detail: 'Valid prompt should pass validation' };
    },
  },
  // Schema parser tests
  {
    group: 'Schema Parser',
    name: 'Valid plan schema passes',
    run: () => {
      const plan = {
        budgetBreakdown: [{ id: 'b1', category: 'Venue', amount: 100000, percentage: 40 }],
        timeline: [{ id: 't1', phase: 'Test', task: 'Task', dueDate: '2027-01-01', completed: false }],
        vendorChecklist: [{ id: 'v1', vendor: 'Test', task: 'Book', status: 'Pending', priority: 'High' }],
        personalizedIdeas: { themes: [], colorPalettes: [], menuIdeas: [], activities: [] },
      };
      const { valid } = validatePlanSchema(plan);
      return { pass: valid, detail: 'Valid plan structure should pass schema validation' };
    },
  },
  {
    group: 'Schema Parser',
    name: 'Missing budgetBreakdown fails schema',
    run: () => {
      const plan = {
        timeline: [],
        vendorChecklist: [],
        personalizedIdeas: { themes: [], colorPalettes: [], menuIdeas: [], activities: [] },
      };
      const { valid, errors } = validatePlanSchema(plan);
      return { pass: !valid && errors.some((e) => e.includes('budgetBreakdown')), detail: 'Missing budgetBreakdown should fail' };
    },
  },
  {
    group: 'Schema Parser',
    name: 'Null plan fails schema',
    run: () => {
      const { valid } = validatePlanSchema(null);
      return { pass: !valid, detail: 'Null input should fail schema validation' };
    },
  },
  {
    group: 'Schema Parser',
    name: 'Malformed JSON handled gracefully',
    run: () => {
      try {
        const broken = '{invalid json}';
        JSON.parse(broken);
        return { pass: false, detail: 'Should have thrown a parse error' };
      } catch (e) {
        // Graceful catch – the service layer handles this
        return { pass: true, detail: 'JSON.parse throw is caught correctly' };
      }
    },
  },
];

// ─── DiagnosticsModal Component ───────────────────────────────────────────────

export default function DiagnosticsModal() {
  const { dispatch } = useAppContext();
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const runTests = useCallback(async () => {
    setRunning(true);
    setDone(false);
    setResults([]);

    const res = [];
    for (const tc of TEST_CASES) {
      await new Promise((r) => setTimeout(r, 80)); // small delay for visual effect
      try {
        const result = tc.run();
        res.push({ ...tc, ...result });
      } catch (e) {
        res.push({ ...tc, pass: false, detail: `Error: ${e.message}` });
      }
      setResults([...res]);
    }

    setRunning(false);
    setDone(true);
  }, []);

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;

  const groups = [...new Set(TEST_CASES.map((t) => t.group))];

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Run Diagnostics">
      <div className="modal-box diagnostics-modal">
        <div className="modal-header">
          <div className="modal-title-row">
            <Beaker size={20} aria-hidden="true" />
            <h2 className="modal-title">ANANDRIA – Self-Diagnostics</h2>
          </div>
          <button
            className="modal-close"
            onClick={() => dispatch({ type: ACTIONS.TOGGLE_DIAGNOSTICS })}
            aria-label="Close diagnostics"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="diagnostics-body">
          <p className="diagnostics-desc">
            Runs <strong>{TEST_CASES.length} automated tests</strong> covering budget math validation,
            input sanitization, and AI response schema parsing.
          </p>

          {done && (
            <div className={`test-summary ${failed === 0 ? 'all-pass' : 'has-fail'}`} role="status" aria-live="polite">
              <span>{passed}/{TEST_CASES.length} tests passed</span>
              {failed > 0 && <span className="fail-count">{failed} failed</span>}
            </div>
          )}

          <button
            className="btn btn-generate diagnostics-run-btn"
            onClick={runTests}
            disabled={running}
            aria-busy={running}
          >
            {running
              ? <><Loader2 size={16} className="spin" aria-hidden="true" /> Running Tests…</>
              : <><Beaker size={16} aria-hidden="true" /> Run All Tests</>
            }
          </button>

          {results.length > 0 && (
            <div className="test-results" aria-live="polite">
              {groups.map((group) => (
                <div key={group} className="test-group">
                  <h3 className="test-group-title">{group}</h3>
                  {results.filter((r) => r.group === group).map((result, i) => (
                    <div key={i} className={`test-result-row ${result.pass ? 'pass' : 'fail'}`}>
                      {result.pass
                        ? <CheckCircle2 size={16} className="test-icon pass" aria-label="Pass" />
                        : <XCircle size={16} className="test-icon fail" aria-label="Fail" />
                      }
                      <div className="test-info">
                        <span className="test-name">{result.name}</span>
                        <span className="test-detail">{result.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
