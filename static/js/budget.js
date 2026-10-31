/**
 * ANANDRIA – Dynamic Budget Breakdown & Visualizer
 */

const PALETTE = [
  '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
  '#06B6D4', '#6366F1', '#F43F5E', '#D97706', '#14B8A6'
];

let budgetDebounceTimer = null;

const BudgetComponent = {
  render(plan, details) {
    if (!plan || !plan.budget_breakdown) return;

    const breakdown = plan.budget_breakdown;
    const totalBudget = Number(details?.total_budget || 0);
    const curr = details?.currency || 'INR';
    const currSym = curr === 'INR' ? '₹' : curr === 'USD' ? '$' : curr === 'EUR' ? '€' : '£';

    // 1. Calculate Summary Numbers
    const allocatedSum = breakdown.reduce((acc, item) => acc + Number(item.amount || 0), 0);
    const actualSum = breakdown.reduce((acc, item) => acc + Number(item.actual_spend || 0), 0);
    const variance = totalBudget - actualSum;
    const isOver = allocatedSum > totalBudget + 1; // 1 unit tolerance

    // 2. Update Stats Grid (safe against any ID variations)
    const setStat = (id, val) => {
      const el = document.getElementById(id) || document.getElementById(id + '2');
      if (el) el.textContent = val;
    };
    setStat('stat-total-budget', `${currSym} ${totalBudget.toLocaleString()}`);
    setStat('stat-allocated-budget', `${currSym} ${Math.round(allocatedSum).toLocaleString()}`);
    setStat('stat-actual-budget', `${currSym} ${Math.round(actualSum).toLocaleString()}`);

    const statVarEl = document.getElementById('stat-variance') || document.getElementById('stat-variance2');
    if (statVarEl) {
      statVarEl.textContent = `${currSym} ${Math.round(variance).toLocaleString()}`;
      statVarEl.className = `stat-value ${variance < 0 ? 'over-budget' : 'in-budget'}`;
    }

    // 3. Update Warning Alert Box
    const alertBox = document.getElementById('budget-alert-box');
    const alertMsg = document.getElementById('budget-alert-msg');
    if (alertBox && alertMsg) {
      if (isOver) {
        alertBox.classList.remove('hidden');
        const excess = Math.round(allocatedSum - totalBudget);
        alertMsg.textContent = `Warning: Category allocations exceed total budget by ${currSym} ${excess.toLocaleString()}!`;
      } else if (variance < 0) {
        alertBox.classList.remove('hidden');
        alertMsg.textContent = `Alert: Actual spend exceeds total budget by ${currSym} ${Math.abs(Math.round(variance)).toLocaleString()}!`;
      } else {
        alertBox.classList.add('hidden');
      }
    }

    // 4. Render Donut Chart
    this.renderDonutChart(breakdown, currSym);

    // 5. Render Bar Charts
    this.renderBarChart(breakdown, totalBudget, currSym);

    // 6. Render Sliders List
    this.renderSlidersList(breakdown, totalBudget, currSym);
  },

  renderDonutChart(breakdown, currSym) {
    const container = document.getElementById('budget-donut-chart');
    if (!container) return;

    const total = breakdown.reduce((acc, item) => acc + Number(item.amount || 0), 0);
    if (total <= 0) {
      container.innerHTML = '<p class="text-subtle">No budget data to display.</p>';
      return;
    }

    const size = 200;
    const strokeWidth = 32;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    let accumulatedPct = 0;
    const slices = breakdown.map((item, idx) => {
      const pct = (Number(item.amount || 0) / total);
      const strokeDasharray = `${pct * circumference} ${circumference}`;
      const strokeDashoffset = -accumulatedPct * circumference;
      accumulatedPct += pct;
      const color = PALETTE[idx % PALETTE.length];

      return `
        <circle cx="${center}" cy="${center}" r="${radius}"
                fill="none" stroke="${color}" stroke-width="${strokeWidth}"
                stroke-dasharray="${strokeDasharray}" stroke-dashoffset="${strokeDashoffset}"
                aria-label="${item.category}: ${Math.round(pct * 100)}%">
          <title>${item.category}: ${currSym} ${Number(item.amount).toLocaleString()} (${Math.round(pct * 100)}%)</title>
        </circle>
      `;
    }).join('');

    const legend = `
      <div class="donut-legend" style="margin-left: 20px; display: flex; flex-direction: column; gap: 4px; font-size: 0.75rem;">
        ${breakdown.map((item, idx) => `
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="width: 10px; height: 10px; border-radius: 2px; background: ${PALETTE[idx % PALETTE.length]}; display: inline-block;"></span>
            <span style="color: var(--text-muted);">${item.category} (${item.percentage}%)</span>
          </div>
        `).join('')}
      </div>
    `;

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 14px;">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg); border-radius: 50%;">
          ${slices}
        </svg>
        ${legend}
      </div>
    `;
  },

  renderBarChart(breakdown, totalBudget, currSym) {
    const container = document.getElementById('budget-bar-chart');
    if (!container) return;

    container.innerHTML = breakdown.slice(0, 6).map((item, idx) => {
      const allocPct = Math.min(100, Math.round((Number(item.amount) / totalBudget) * 100));
      const actualPct = totalBudget > 0 ? Math.min(100, Math.round((Number(item.actual_spend || 0) / totalBudget) * 100)) : 0;

      return `
        <div class="bar-row">
          <div class="bar-label-group">
            <span style="color: var(--text-main); font-weight: 500;">${item.category}</span>
            <span style="color: var(--text-subtle);">
              Alloc: ${currSym} ${Number(item.amount).toLocaleString()} | Actual: ${currSym} ${Number(item.actual_spend || 0).toLocaleString()}
            </span>
          </div>
          <div class="bar-bg" title="Allocated: ${allocPct}%, Actual: ${actualPct}%">
            <div class="bar-fill-alloc" style="width: ${allocPct}%; background: ${PALETTE[idx % PALETTE.length]};"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderSlidersList(breakdown, totalBudget, currSym) {
    const container = document.getElementById('budget-items-list');
    if (!container) return;

    container.innerHTML = breakdown.map((item, idx) => {
      const color = PALETTE[idx % PALETTE.length];
      const maxVal = totalBudget;

      return `
        <div class="budget-item-card" data-id="${item.id}">
          <div>
            <div class="budget-cat-name" style="border-left: 3px solid ${color}; padding-left: 8px;">
              ${item.category}
            </div>
            <div class="budget-cat-note">${item.notes || ''}</div>
          </div>

          <div class="slider-group">
            <input type="range" class="budget-slider"
                   id="slider-${item.id}"
                   data-id="${item.id}"
                   min="0" max="${maxVal}" step="${Math.max(100, Math.round(totalBudget / 200))}"
                   value="${item.amount}"
                   aria-label="${item.category} budget slider">
            <span class="slider-pct" id="pct-${item.id}">${item.percentage}%</span>
          </div>

          <div class="budget-amount-display" id="amt-${item.id}">
            ${currSym} ${Math.round(item.amount).toLocaleString()}
          </div>

          <div class="actual-spend-input-group">
            <label for="actual-${item.id}" class="actual-spend-label">Actual:</label>
            <input type="number" class="actual-spend-field"
                   id="actual-${item.id}"
                   data-id="${item.id}"
                   min="0" step="100"
                   value="${item.actual_spend || 0}"
                   aria-label="${item.category} actual spend">
          </div>
        </div>
      `;
    }).join('');

    // Attach Debounced Event Listeners
    container.querySelectorAll('.budget-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const catId = e.target.dataset.id;
        const newAmt = parseFloat(e.target.value);
        this.handleSliderChangeDebounced(catId, newAmt);
      });
    });

    container.querySelectorAll('.actual-spend-field').forEach(input => {
      input.addEventListener('change', (e) => {
        const catId = e.target.dataset.id;
        const actualVal = parseFloat(e.target.value) || 0;
        this.handleActualSpendChange(catId, actualVal);
      });
    });
  },

  handleSliderChangeDebounced(changedId, newAmount) {
    if (budgetDebounceTimer) clearTimeout(budgetDebounceTimer);

    // Instant local preview for immediate responsive feedback
    const plan = window.AppState.currentPlan;
    const details = window.AppState.eventDetails;
    const totalBudget = Number(details?.total_budget || 0);

    const updatedBreakdown = this.rebalanceClientSide(plan.budget_breakdown, changedId, newAmount, totalBudget);
    plan.budget_breakdown = updatedBreakdown;

    // Instant DOM update for this line
    const catItem = updatedBreakdown.find(i => i.id === changedId);
    if (catItem) {
      const pctEl = document.getElementById(`pct-${changedId}`);
      const amtEl = document.getElementById(`amt-${changedId}`);
      const curr = details?.currency || 'INR';
      const currSym = curr === 'INR' ? '₹' : curr === 'USD' ? '$' : curr === 'EUR' ? '€' : '£';
      if (pctEl) pctEl.textContent = `${catItem.percentage}%`;
      if (amtEl) amtEl.textContent = `${currSym} ${Math.round(catItem.amount).toLocaleString()}`;
    }

    // Debounced full re-render & storage persistence
    budgetDebounceTimer = setTimeout(async () => {
      const serverRebalance = await ApiService.recalculateBudget(
        plan.budget_breakdown, changedId, newAmount, totalBudget
      );
      plan.budget_breakdown = serverRebalance;
      StorageService.savePlan(plan, details);
      this.render(plan, details);
    }, 120);
  },

  handleActualSpendChange(changedId, actualSpend) {
    const plan = window.AppState.currentPlan;
    const details = window.AppState.eventDetails;
    const item = plan.budget_breakdown.find(i => i.id === changedId);
    if (item) {
      item.actual_spend = Math.max(0, actualSpend);
      StorageService.savePlan(plan, details);
      this.render(plan, details);
    }
  },

  addCustomCategory(name, amount, notes) {
    const plan = window.AppState.currentPlan;
    const details = window.AppState.eventDetails;
    const totalBudget = Number(details?.total_budget || 0);

    const newId = `budget-custom-${Date.now()}`;
    const newCategory = {
      id: newId,
      category: name,
      amount: Math.min(amount, totalBudget),
      percentage: Number(((amount / totalBudget) * 100).toFixed(1)),
      notes: notes || 'Custom category',
      actual_spend: 0
    };

    plan.budget_breakdown.push(newCategory);
    plan.budget_breakdown = this.rebalanceClientSide(plan.budget_breakdown, newId, amount, totalBudget);
    StorageService.savePlan(plan, details);
    this.render(plan, details);
    window.AppToast.show(`Added "${name}" to budget breakdown!`, 'success');
  },

  rebalanceClientSide(breakdown, changedId, newAmount, totalBudget) {
    if (totalBudget <= 0) return breakdown;
    const targetAmount = Math.max(0, Math.min(newAmount, totalBudget));
    const remainingBudget = totalBudget - targetAmount;
    const otherItems = breakdown.filter(i => i.id !== changedId);
    const otherSum = otherItems.reduce((acc, i) => acc + Number(i.amount || 0), 0);

    const result = breakdown.map(item => {
      if (item.id === changedId) {
        return {
          ...item,
          amount: targetAmount,
          percentage: Number(((targetAmount / totalBudget) * 100).toFixed(1))
        };
      }
      let scaled = otherSum > 0 ? (Number(item.amount) / otherSum) * remainingBudget : (remainingBudget / otherItems.length);
      scaled = Math.max(0, Math.round(scaled));
      return {
        ...item,
        amount: scaled,
        percentage: Number(((scaled / totalBudget) * 100).toFixed(1))
      };
    });

    // Fix rounding discrepancies on last other item
    const lastOtherIdx = result.map((it, idx) => it.id !== changedId ? idx : -1).filter(idx => idx !== -1).pop();
    if (lastOtherIdx !== undefined) {
      const currentSum = result.reduce((s, it) => s + it.amount, 0);
      const diff = totalBudget - currentSum;
      result[lastOtherIdx].amount = Math.max(0, result[lastOtherIdx].amount + diff);
      result[lastOtherIdx].percentage = Number(((result[lastOtherIdx].amount / totalBudget) * 100).toFixed(1));
    }

    return result;
  },

  initListeners() {
    // Open Add Budget Category Modal
    document.getElementById('btn-open-add-budget')?.addEventListener('click', () => {
      document.getElementById('add-budget-modal')?.classList.remove('hidden');
    });

    // Add Budget Form Submit
    document.getElementById('add-budget-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('new-budget-name').value.trim();
      const amount = parseFloat(document.getElementById('new-budget-amount').value || '0');
      const notes = document.getElementById('new-budget-notes').value.trim();

      if (name && amount > 0) {
        this.addCustomCategory(name, amount, notes);
        document.getElementById('add-budget-modal')?.classList.add('hidden');
        document.getElementById('add-budget-form').reset();
      }
    });

    document.getElementById('btn-close-budget-modal')?.addEventListener('click', () => {
      document.getElementById('add-budget-modal')?.classList.add('hidden');
    });
  }
};
