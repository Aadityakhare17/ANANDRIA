/**
 * ANANDRIA – Main Application Controller
 */

// Global App State
window.AppState = {
  currentPlan: null,
  eventDetails: null,
  guestList: null,
  activeTab: 'tab-budget',
  guestFilterStatus: 'All'
};

// Global toast alias used by sidebar.js and other modules
window.showToast = function(message, type = 'info', duration = 3500) {
  if (window.AppToast) window.AppToast.show(message, type, duration);
};

// Toast Notifications System
window.AppToast = {
  show(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✔' : type === 'error' ? '⚠️' : '✦';
    toast.innerHTML = `<span aria-hidden="true">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => container.removeChild(toast), 300);
    }, duration);
  }
};

window.AppController = {
  async init() {
    // 1. Initialize Subcomponents Listeners
    BudgetComponent.initListeners();
    TimelineComponent.initListeners();
    VendorsComponent.initListeners();
    GuestsComponent.initListeners();
    CopilotComponent.initListeners();
    DiagnosticsComponent.initListeners();

    this.initFormListeners();
    this.initExportListeners();
    this.initApiKeyModalListeners();
    this.initCurrencySwitcherListener();

    // 2. Listen for sidebar plan loading event
    document.addEventListener('anandria:load-plan', (e) => {
      const { plan, intake } = e.detail || {};
      if (plan && intake) {
        window.AppState.currentPlan = plan;
        window.AppState.eventDetails = intake;
        window.AppState.guestList = StorageService.loadGuestList() ||
          GuestsComponent.getInitialGuests(intake.event_type, intake.guest_count);
        this.renderFullDashboard(plan, intake);
        document.dispatchEvent(new CustomEvent('anandria:plan-generated', { detail: { plan, intake } }));
        window.AppToast.show('Event plan loaded!', 'success');
      }
    });

    // 3. Check Backend Health & Operational Mode
    await this.checkHealthStatus();

    // 4. Restore LocalStorage Session if available
    const savedPlan = StorageService.loadPlan();
    const savedDetails = StorageService.loadDetails();

    if (savedPlan && savedDetails) {
      window.AppState.guestList = StorageService.loadGuestList() || GuestsComponent.getInitialGuests(savedDetails.event_type, savedDetails.guest_count);
      this.renderFullDashboard(savedPlan, savedDetails);
      window.currentPlan = savedPlan;
      // sidebar will handle navigation based on cached plan (it checks localStorage directly)
    }
  },

  async checkHealthStatus() {
    const health = await ApiService.getHealth();

    if (health.operational_mode === 'live') {
      if (window.sidebarNav) window.sidebarNav.updateModeStatus?.();
    } else {
      if (window.sidebarNav) window.sidebarNav.updateModeStatus?.();
    }
  },

  initApiKeyModalListeners() {
    const modal = document.getElementById('api-key-modal');
    const openBtn = document.getElementById('btn-open-apikey');
    const closeBtn = document.getElementById('btn-close-apikey');
    const form = document.getElementById('api-key-form');
    const clearBtn = document.getElementById('btn-clear-api-key');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => modal.classList.remove('hidden'));
    }
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const key = document.getElementById('input-api-key').value.trim();
        try {
          const resp = await ApiService.saveApiKey(key);
          window.AppToast.show(resp.message, 'success');
          modal.classList.add('hidden');
          await this.checkHealthStatus();
        } catch (err) {
          window.AppToast.show(err.message || 'Could not save API key', 'error');
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        try {
          const resp = await ApiService.saveApiKey('');
          window.AppToast.show(resp.message, 'info');
          modal.classList.add('hidden');
          document.getElementById('input-api-key').value = '';
          await this.checkHealthStatus();
        } catch (err) {
          window.AppToast.show(err.message, 'error');
        }
      });
    }
  },

  initCurrencySwitcherListener() {
    const switchEl = document.getElementById('header-currency-switch');
    if (!switchEl) return;

    switchEl.addEventListener('change', (e) => {
      const newCurr = e.target.value;
      const details = window.AppState.eventDetails;
      const plan = window.AppState.currentPlan;
      if (!details || !plan) return;

      const oldCurr = details.currency || 'INR';
      if (oldCurr === newCurr) return;

      // Convert total budget
      details.total_budget = StorageService.convertCurrency(details.total_budget, oldCurr, newCurr);
      details.currency = newCurr;

      // Convert line items
      plan.budget_breakdown = plan.budget_breakdown.map(item => ({
        ...item,
        amount: StorageService.convertCurrency(item.amount, oldCurr, newCurr),
        actual_spend: StorageService.convertCurrency(item.actual_spend || 0, oldCurr, newCurr)
      }));

      // Convert vendors
      plan.vendor_checklist = plan.vendor_checklist.map(v => ({
        ...v,
        estimated_cost: StorageService.convertCurrency(v.estimated_cost, oldCurr, newCurr)
      }));

      // Convert cost per head
      plan.estimated_cost_per_head = StorageService.convertCurrency(plan.estimated_cost_per_head, oldCurr, newCurr);

      StorageService.savePlan(plan, details);
      this.renderFullDashboard(plan, details);
      window.AppToast.show(`Converted currency to ${newCurr}`, 'info');
    });
  },

  initFormListeners() {
    const form = document.getElementById('intake-form');
    const demoBtn = document.getElementById('btn-prefill-demo');

    // Pre-fill realistic sample wedding
    if (demoBtn) {
      demoBtn.addEventListener('click', () => {
        const nextYear = new Date();
        nextYear.setMonth(nextYear.getMonth() + 6);
        const dateStr = nextYear.toISOString().split('T')[0];

        document.getElementById('event_name').value = 'Maya & Kabir Royal Palace Wedding';
        document.getElementById('target_date').value = dateStr;
        document.getElementById('guest_count').value = 350;
        document.getElementById('total_budget').value = 3500000;
        document.getElementById('currency').value = 'INR';
        document.getElementById('location').value = 'Udaipur, Rajasthan – Royal Heritage Style';
        document.getElementById('theme_keywords').value = 'royal emerald, vintage gold, candlelit, palace, classical music';
        document.getElementById('special_requirements').value = 'Jain catering counter for 75 guests, organic compostable disposables, wheelchair ramp at stage.';

        // Select Wedding radio card
        document.getElementById('type-wedding').checked = true;
        document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
        document.querySelector('label[for="type-wedding"]').classList.add('selected');

        window.AppToast.show('Sample wedding parameters loaded!', 'success');
      });
    }

    // Category Card Radio selection visual toggle
    document.querySelectorAll('.category-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    });

    // Form Submission
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleFormSubmit();
      });
    }

    // New Plan button in header
    const newPlanBtn = document.getElementById('btn-new-plan');
    if (newPlanBtn) {
      newPlanBtn.addEventListener('click', () => {
        if (confirm('Start a new plan? This will clear your current view.')) {
          StorageService.clearPlan();
          this.showWizard();
          window.AppToast.show('Ready to design a new event!', 'info');
        }
      });
    }
  },

  async handleFormSubmit() {
    this.clearErrors();

    const event_type = document.querySelector('input[name="event_type"]:checked')?.value || 'Wedding';
    const event_name = document.getElementById('event_name').value.trim();
    const target_date = document.getElementById('target_date').value;
    const guest_count = parseInt(document.getElementById('guest_count').value, 10);
    const total_budget = parseFloat(document.getElementById('total_budget').value);
    const currency = document.getElementById('currency').value;
    const location = document.getElementById('location').value.trim();
    const theme_keywords = document.getElementById('theme_keywords').value.trim();
    const special_requirements = document.getElementById('special_requirements').value.trim();

    // Client-side validation checks
    let hasError = false;

    if (!event_name || event_name.length < 2) {
      this.showFieldError('err-event_name', 'Please enter a valid event name (at least 2 chars).');
      hasError = true;
    }

    if (!target_date) {
      this.showFieldError('err-target_date', 'Please choose a target date.');
      hasError = true;
    } else {
      const selected = new Date(target_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selected.setHours(0, 0, 0, 0);
      if (selected <= today) {
        this.showFieldError('err-target_date', 'Target date must be in the future.');
        hasError = true;
      }
    }

    if (isNaN(guest_count) || guest_count <= 0) {
      this.showFieldError('err-guest_count', 'Guest count must be greater than zero.');
      hasError = true;
    }

    if (isNaN(total_budget) || total_budget <= 0) {
      this.showFieldError('err-total_budget', 'Total budget must be a positive number.');
      hasError = true;
    }

    if (hasError) return;

    const intakePayload = {
      event_type,
      event_name,
      target_date,
      guest_count,
      total_budget,
      currency,
      location,
      theme_keywords,
      special_requirements
    };

    const genBtn = document.getElementById('btn-generate-plan');
    const spinner = document.getElementById('gen-spinner');
    const btnText = document.getElementById('gen-btn-text');

    try {
      if (genBtn) genBtn.disabled = true;
      if (spinner) spinner.classList.remove('hidden');
      if (btnText) btnText.textContent = 'Generating Blueprint...';

      window.AppToast.show('Formulating comprehensive event plan...', 'info');

      const plan = await ApiService.generatePlan(intakePayload);

      window.AppState.currentPlan = plan;
      window.AppState.eventDetails = intakePayload;
      window.AppState.guestList = GuestsComponent.getInitialGuests(event_type, guest_count);

      StorageService.savePlan(plan, intakePayload);
      StorageService.saveGuestList(window.AppState.guestList);

      this.renderFullDashboard(plan, intakePayload);

      // Notify sidebar of plan generation
      document.dispatchEvent(new CustomEvent('anandria:plan-generated', {
        detail: { plan, intake: intakePayload }
      }));

      window.AppToast.show('Event plan successfully formulated!', 'success');
    } catch (err) {
      console.error('Plan generation failed:', err);
      window.AppToast.show(err.message || 'Generation failed. Please try again.', 'error');
    } finally {
      if (genBtn) genBtn.disabled = false;
      if (spinner) spinner.classList.add('hidden');
      if (btnText) btnText.textContent = 'Generate AI Event Plan';
    }
  },

  showFieldError(elId, msg) {
    const el = document.getElementById(elId);
    if (el) {
      el.textContent = msg;
      el.classList.remove('hidden');
    }
  },

  clearErrors() {
    document.querySelectorAll('.field-error').forEach(el => {
      el.textContent = '';
      el.classList.add('hidden');
    });
  },

  showWizard() {
    // Navigate to create-event view if sidebar is available
    if (window.sidebarNav) {
      window.sidebarNav.navigateTo('create-event');
      window.sidebarNav.showActiveEventTools(false);
    }
    window.currentPlan = null;
  },

  renderFullDashboard(plan, details) {
    window.AppState.currentPlan = plan;
    window.AppState.eventDetails = details;
    window.currentPlan = plan; // expose for sidebar.js

    // Show AI loading state if we were on create event view
    const loadingState = document.getElementById('ai-loading-state');
    const wizardCard = document.getElementById('intake-wizard-card');
    if (loadingState) loadingState.classList.add('hidden');
    if (wizardCard) wizardCard.classList.remove('hidden');

    const curr = details?.currency || 'INR';
    const currSym = curr === 'INR' ? '₹' : curr === 'USD' ? '$' : curr === 'EUR' ? '€' : '£';

    // Update topbar currency switch
    const currSwitch = document.getElementById('header-currency-switch');
    if (currSwitch) currSwitch.value = curr;

    // Summary Banner
    const summaryText = document.getElementById('plan-summary-text');
    if (summaryText) summaryText.textContent = plan.summary || 'Your event plan is ready.';
    const badgeHead = document.getElementById('badge-head-cost');
    if (badgeHead) badgeHead.textContent = `Est. Cost: ${currSym} ${Math.round(plan.estimated_cost_per_head || 0).toLocaleString()} / head`;

    // Stat cards (dashboard & budget planner)
    const setEl = (id, val) => {
      const el = document.getElementById(id) || document.getElementById(id + '2');
      if (el) el.textContent = val;
    };
    const totalBudget = details?.total_budget || 0;
    const allocated = plan.budget_breakdown?.reduce((s, i) => s + (i.amount || 0), 0) || 0;
    const actualSpend = plan.budget_breakdown?.reduce((s, i) => s + (i.actual_spend || 0), 0) || 0;
    const variance = totalBudget - allocated;
    const fmt = (n) => `${currSym} ${Math.round(n).toLocaleString()}`;
    setEl('stat-total-budget', fmt(totalBudget));
    setEl('stat-allocated-budget', fmt(allocated));
    setEl('stat-actual-budget', fmt(actualSpend));
    setEl('stat-variance', fmt(variance));

    // Render Subcomponents
    BudgetComponent.render(plan, details);
    TimelineComponent.render(plan, details);
    VendorsComponent.render(plan, details);
    IdeasComponent.render(plan);
    GuestsComponent.render();

    // Expose currentPlan globally
    window.currentPlan = plan;
  },

  initTabListeners() {
    // No-op in new layout — tabs replaced by sidebar navigation
    // Keep method to avoid breaking any existing calls
  },

  switchTab(tabId) {
    // No-op in new layout — sidebar.js handles view switching
  },

  initExportListeners() {
    const exportBtn = document.getElementById('btn-export');
    const dropdown = document.getElementById('export-dropdown');

    if (exportBtn && dropdown) {
      exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = exportBtn.getAttribute('aria-expanded') === 'true';
        exportBtn.setAttribute('aria-expanded', !isExpanded);
        dropdown.classList.toggle('hidden', isExpanded);
      });

      document.addEventListener('click', () => {
        exportBtn.setAttribute('aria-expanded', 'false');
        dropdown.classList.add('hidden');
      });
    }

    document.getElementById('export-json')?.addEventListener('click', () => {
      StorageService.exportToJSON(window.AppState.currentPlan, window.AppState.eventDetails);
      window.AppToast.show('JSON Blueprint exported!', 'success');
    });

    document.getElementById('export-md')?.addEventListener('click', () => {
      StorageService.exportToMarkdown(window.AppState.currentPlan, window.AppState.eventDetails);
      window.AppToast.show('Markdown summary downloaded!', 'success');
    });

    document.getElementById('export-print')?.addEventListener('click', () => {
      StorageService.printOrSavePDF();
    });
  }
};

// Initialize Application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.AppController.init();
});
