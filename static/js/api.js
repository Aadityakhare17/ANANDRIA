/**
 * ANANDRIA – API Client Service
 */

const ApiService = {
  async getHealth() {
    try {
      const resp = await fetch('/api/health');
      if (!resp.ok) throw new Error(`Health check failed: ${resp.status}`);
      return await resp.json();
    } catch (e) {
      console.warn('Backend offline or health unreachable:', e);
      return { status: 'offline', operational_mode: 'client_fallback' };
    }
  },

  async generatePlan(intakeData) {
    const resp = await fetch('/api/plan/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(intakeData)
    });

    if (!resp.ok) {
      let errDetail = 'Failed to generate plan.';
      try {
        const errorJson = await resp.json();
        if (resp.status === 429) {
          errDetail = errorJson.detail || 'Rate limit active. Please wait a few seconds.';
        } else if (resp.status === 422 && errorJson.detail?.errors) {
          const firstErrKey = Object.keys(errorJson.detail.errors)[0];
          errDetail = errorJson.detail.errors[firstErrKey];
        } else if (errorJson.detail) {
          errDetail = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch (_) {}
      throw new Error(errDetail);
    }

    return await resp.json();
  },

  async refinePlan(refinementPrompt, currentPlan, eventDetails) {
    const resp = await fetch('/api/plan/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refinement_prompt: refinementPrompt,
        current_plan: currentPlan,
        event_details: eventDetails
      })
    });

    if (!resp.ok) {
      let errDetail = 'Failed to refine plan.';
      try {
        const errJson = await resp.json();
        errDetail = errJson.detail || errDetail;
      } catch (_) {}
      throw new Error(errDetail);
    }

    return await resp.json();
  },

  async recalculateBudget(breakdown, changedId, newAmount, totalBudget) {
    try {
      const resp = await fetch('/api/budget/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          breakdown,
          changed_id: changedId,
          new_amount: newAmount,
          total_budget: totalBudget
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.breakdown;
      }
    } catch (e) {
      console.warn('Server recalculate failed, using client fallback:', e);
    }
    // Client-side fallback if server is unreachable
    return BudgetComponent.rebalanceClientSide(breakdown, changedId, newAmount, totalBudget);
  },

  async runDiagnostics() {
    const resp = await fetch('/api/diagnostics/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!resp.ok) {
      throw new Error(`Diagnostics failed with HTTP ${resp.status}`);
    }
    return await resp.json();
  },

  async saveApiKey(apiKey) {
    const resp = await fetch('/api/config/api-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey })
    });
    if (!resp.ok) {
      throw new Error(`Failed to save API key (HTTP ${resp.status})`);
    }
    return await resp.json();
  }
};

