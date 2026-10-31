import React, { useState, useCallback, useMemo } from 'react';
import { useAppContext, ACTIONS } from '../context/AppContext.jsx';
import { formatCurrency, getCurrencySymbol, checkOverBudget, recalculateBudget } from '../utils/budgetCalc.js';
import { BUDGET_COLORS } from '../utils/constants.js';
import { debounce } from '../utils/storage.js';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { AlertTriangle, CheckCircle2, TrendingUp, Edit3 } from 'lucide-react';

function CustomTooltip({ active, payload, currency }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: item } = payload[0];
  return (
    <div className="chart-tooltip" role="tooltip">
      <p className="tooltip-label">{item.category}</p>
      <p className="tooltip-value">{formatCurrency(value, currency)}</p>
      <p className="tooltip-pct">{item.percentage?.toFixed(1)}% of budget</p>
    </div>
  );
}

function BudgetItemRow({ item, totalBudget, currency, onAmountChange }) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(String(Math.round(item.amount)));
  const symbol = getCurrencySymbol(currency);

  function commitEdit() {
    const val = parseFloat(editVal);
    if (!isNaN(val) && val >= 0) {
      onAmountChange(item.id, val);
    }
    setEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') { setEditVal(String(Math.round(item.amount))); setEditing(false); }
  }

  const pct = Math.min(100, (item.amount / totalBudget) * 100);

  return (
    <div className="budget-item-row">
      <div className="budget-item-info">
        <div
          className="budget-item-color"
          style={{ backgroundColor: item.color }}
          aria-hidden="true"
        />
        <div className="budget-item-details">
          <span className="budget-item-name">{item.category}</span>
          {item.notes && <span className="budget-item-note">{item.notes}</span>}
        </div>
      </div>

      <div className="budget-item-bar-wrap">
        <div className="budget-item-bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${item.category}: ${pct.toFixed(1)}%`}>
          <div className="budget-item-fill" style={{ width: `${pct}%`, backgroundColor: item.color }} />
        </div>
      </div>

      <div className="budget-item-amount">
        {editing ? (
          <div className="budget-edit-wrapper">
            <span className="budget-symbol">{symbol}</span>
            <input
              type="number"
              className="budget-edit-input"
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              autoFocus
              aria-label={`Edit ${item.category} amount`}
              min="0"
            />
          </div>
        ) : (
          <button
            className="budget-amount-btn"
            onClick={() => { setEditVal(String(Math.round(item.amount))); setEditing(true); }}
            aria-label={`Edit ${item.category} amount: currently ${formatCurrency(item.amount, currency)}`}
            title="Click to edit"
          >
            <span>{formatCurrency(item.amount, currency)}</span>
            <Edit3 size={13} aria-hidden="true" className="edit-icon" />
          </button>
        )}
        <span className="budget-item-pct">{item.percentage?.toFixed(1)}%</span>
      </div>

      {/* Actual spend */}
      <div className="actual-spend">
        <label className="actual-label" htmlFor={`actual-${item.id}`}>Actual:</label>
        <input
          id={`actual-${item.id}`}
          type="number"
          className="actual-input"
          placeholder="0"
          value={item.actualSpend || ''}
          onChange={(e) => onAmountChange(item.id, item.amount, parseFloat(e.target.value) || 0, true)}
          min="0"
          aria-label={`Actual spend for ${item.category}`}
        />
      </div>
    </div>
  );
}

export default function BudgetTab() {
  const { state, dispatch } = useAppContext();
  const { plan, formData } = state;
  const { totalBudget, currency } = formData;

  const budgetItems = useMemo(() =>
    (plan?.budgetBreakdown || []).map((item, i) => ({
      ...item,
      color: BUDGET_COLORS[i % BUDGET_COLORS.length],
    })),
    [plan?.budgetBreakdown]
  );

  const { overBudget, excess, sum } = checkOverBudget(budgetItems, parseFloat(totalBudget));

  // Debounced budget update dispatch
  const debouncedDispatch = useCallback(
    debounce((id, updates) => {
      dispatch({ type: ACTIONS.UPDATE_BUDGET_ITEM, payload: { id, updates } });
    }, 150),
    [dispatch]
  );

  function handleAmountChange(id, newAmount, newActual, isActual = false) {
    if (isActual) {
      dispatch({ type: ACTIONS.UPDATE_BUDGET_ITEM, payload: { id, updates: { actualSpend: newActual } } });
      return;
    }
    const rebalanced = recalculateBudget(budgetItems, id, newAmount, parseFloat(totalBudget));
    rebalanced.forEach((item) => {
      dispatch({ type: ACTIONS.UPDATE_BUDGET_ITEM, payload: { id: item.id, updates: { amount: item.amount, percentage: item.percentage } } });
    });
  }

  const pieData = budgetItems.map((item) => ({ name: item.category, value: item.amount, ...item }));
  const barData = budgetItems.map((item) => ({
    name: item.category.length > 10 ? item.category.slice(0, 10) + '…' : item.category,
    Budget: Math.round(item.amount),
    Actual: item.actualSpend || 0,
  }));

  const totalActual = budgetItems.reduce((s, i) => s + (i.actualSpend || 0), 0);
  const budget = parseFloat(totalBudget) || 0;

  if (!plan) return null;

  return (
    <section aria-labelledby="budget-tab-heading" className="tab-content">
      <h2 id="budget-tab-heading" className="sr-only">Budget Breakdown</h2>

      {/* Summary Cards */}
      <div className="budget-summary-cards">
        <div className="summary-card">
          <span className="summary-label">Total Budget</span>
          <span className="summary-value">{formatCurrency(budget, currency)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Allocated</span>
          <span className={`summary-value ${overBudget ? 'over' : ''}`}>{formatCurrency(sum, currency)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Actual Spend</span>
          <span className="summary-value secondary">{formatCurrency(totalActual, currency)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Remaining</span>
          <span className={`summary-value ${overBudget ? 'over' : 'safe'}`}>
            {formatCurrency(Math.max(0, budget - totalActual), currency)}
          </span>
        </div>
      </div>

      {/* Over-budget alert */}
      {overBudget && (
        <div className="alert alert-warning" role="alert" aria-live="polite">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>
            Allocations exceed total budget by <strong>{formatCurrency(excess, currency)}</strong>.
            Adjust line items to stay within budget.
          </span>
        </div>
      )}
      {!overBudget && sum > 0 && (
        <div className="alert alert-success" role="status" aria-live="polite">
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>Budget balanced! All allocations are within your total budget.</span>
        </div>
      )}

      {/* Charts */}
      <div className="charts-grid">
        {/* Pie chart */}
        <div className="chart-card" aria-label="Budget distribution pie chart">
          <h3 className="chart-title">Budget Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                aria-label="Budget distribution chart"
              >
                {pieData.map((entry, i) => (
                  <Cell key={entry.id} fill={BUDGET_COLORS[i % BUDGET_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Legend formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        <div className="chart-card" aria-label="Budget vs actual spend bar chart">
          <h3 className="chart-title">
            <TrendingUp size={16} aria-hidden="true" /> Budget vs Actual
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${getCurrencySymbol(currency)}${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(v, currency)} />
              <Bar dataKey="Budget" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line items */}
      <div className="budget-items-section">
        <h3 className="section-subtitle">Line Items <span className="subtle">(click amount to edit)</span></h3>
        <div className="budget-items-list" role="list" aria-label="Budget line items">
          {budgetItems.map((item) => (
            <div key={item.id} role="listitem">
              <BudgetItemRow
                item={item}
                totalBudget={parseFloat(totalBudget)}
                currency={currency}
                onAmountChange={handleAmountChange}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Per-head cost */}
      {plan.estimatedGuestCostPerHead && (
        <div className="per-head-note">
          Estimated cost per guest: <strong>{formatCurrency(plan.estimatedGuestCostPerHead, currency)}</strong>
        </div>
      )}
    </section>
  );
}
