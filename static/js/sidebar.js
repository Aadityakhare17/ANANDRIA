/**
 * sidebar.js – ANANDRIA Sidebar Navigation & Page Router
 * Manages: landing ↔ app transitions, sidebar navigation,
 * view switching, event list, mobile overlay, and collapse.
 */

(function () {
  'use strict';

  /* ── State ─────────────────────────────────────────────── */
  let currentView = 'dashboard';
  let sidebarCollapsed = false;
  let savedEvents = [];

  /* ── DOM Helpers ────────────────────────────────────────── */
  const $ = id => document.getElementById(id);
  const qs = sel => document.querySelector(sel);
  const qsa = sel => document.querySelectorAll(sel);

  /* ── Landing ↔ App transition ───────────────────────────── */
  function showApp(initialView = 'dashboard') {
    $('page-landing').className = 'page page-app-hidden';
    $('page-app').className = 'page page-app-visible';
    navigateTo(initialView);
    updateModeStatus();
  }

  function showLanding() {
    $('page-landing').className = 'page page-landing-visible';
    $('page-app').className = 'page page-app-hidden';
  }

  /* ── View Router ────────────────────────────────────────── */
  const VIEW_LABELS = {
    'dashboard':      'Dashboard',
    'my-events':      'My Events',
    'create-event':   'Create Event',
    'ai-assistant':   'AI Assistant',
    'budget-planner': 'Budget Planner',
    'tasks-timeline': 'Tasks & Timeline',
    'vendors':        'Vendor Checklist',
    'ideas-palettes': 'Ideas & Palettes',
    'guests':         'Guests & RSVPs',
    'settings':       'Settings',
  };

  const VIEW_EL_MAP = {
    'dashboard':      'view-dashboard',
    'my-events':      'view-my-events',
    'create-event':   'view-create-event',
    'ai-assistant':   'view-ai-assistant',
    'budget-planner': 'view-budget-planner',
    'tasks-timeline': 'view-tasks-timeline',
    'vendors':        'view-vendors',
    'ideas-palettes': 'view-ideas-palettes',
    'guests':         'view-guests',
    'settings':       'view-settings',
  };

  function navigateTo(viewKey) {
    if (!VIEW_EL_MAP[viewKey]) return;
    currentView = viewKey;

    // Hide all views
    qsa('.app-view').forEach(v => {
      v.classList.remove('view-active');
      v.classList.add('view-hidden');
    });

    // Show target view
    const target = $(VIEW_EL_MAP[viewKey]);
    if (target) {
      target.classList.remove('view-hidden');
      target.classList.add('view-active');
      target.focus?.();
    }

    // Update breadcrumb
    const lbl = $('breadcrumb-page-label');
    if (lbl) lbl.textContent = VIEW_LABELS[viewKey] || viewKey;

    // Update sidebar active state
    qsa('.sidebar-nav-item').forEach(btn => {
      const bv = btn.dataset.view;
      if (bv === viewKey) {
        btn.classList.add('active');
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.classList.remove('active');
        btn.removeAttribute('aria-current');
      }
    });

    // Close mobile sidebar on navigation
    closeMobileSidebar();

    // Special view actions
    if (viewKey === 'my-events') renderMyEventsList();
    if (viewKey === 'settings') syncSettingsPanel();
    if (viewKey === 'budget-planner') syncBudgetStats();
    if (viewKey === 'dashboard') syncDashboardState();
  }

  /* ── Sidebar Collapse ───────────────────────────────────── */
  function toggleSidebarCollapse() {
    sidebarCollapsed = !sidebarCollapsed;
    const sidebar = $('app-sidebar');
    const collapseBtn = $('btn-sidebar-collapse');
    if (sidebarCollapsed) {
      sidebar.classList.add('sidebar-collapsed');
      collapseBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
      collapseBtn.setAttribute('aria-label', 'Expand sidebar');
    } else {
      sidebar.classList.remove('sidebar-collapsed');
      collapseBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
      collapseBtn.setAttribute('aria-label', 'Collapse sidebar');
    }
  }

  /* ── Mobile Sidebar ─────────────────────────────────────── */
  function openMobileSidebar() {
    $('app-sidebar').classList.add('sidebar-mobile-open');
    $('sidebar-overlay').classList.remove('hidden');
    $('btn-sidebar-mobile-toggle').setAttribute('aria-expanded', 'true');
  }

  function closeMobileSidebar() {
    $('app-sidebar').classList.remove('sidebar-mobile-open');
    $('sidebar-overlay').classList.add('hidden');
    $('btn-sidebar-mobile-toggle').setAttribute('aria-expanded', 'false');
  }

  /* ── Active Event Tool Section ──────────────────────────── */
  function showActiveEventTools(show = true) {
    const tools = $('sidebar-event-tools');
    if (tools) {
      if (show) tools.classList.remove('hidden');
      else tools.classList.add('hidden');
    }
  }

  /* ── Topbar Event Info ──────────────────────────────────── */
  function updateTopbarEventInfo(plan, intake) {
    const topbar = $('topbar-event-info');
    if (!topbar || !plan || !intake) { if (topbar) topbar.innerHTML = ''; return; }

    const sym = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
    const cur = intake.currency || 'INR';
    const s = sym[cur] || cur;
    const budget = Number(intake.total_budget || 0).toLocaleString();

    topbar.innerHTML = `
      <div class="topbar-event-chip">
        <span class="topbar-event-type">${intake.event_type || '—'}</span>
        <span class="topbar-event-name">${intake.event_name || '—'}</span>
      </div>
      <div class="topbar-event-chip">
        <span class="topbar-event-meta">📅 ${intake.target_date || '—'}</span>
        <span class="topbar-event-meta">💰 ${s}${budget}</span>
        <span class="topbar-event-meta">👥 ${intake.guest_count || '—'} guests</span>
      </div>
    `;
  }

  /* ── My Events List ─────────────────────────────────────── */
  function loadSavedEvents() {
    try {
      const raw = localStorage.getItem('anandria_events');
      savedEvents = raw ? JSON.parse(raw) : [];
    } catch { savedEvents = []; }
    updateEventsCountBadge();
  }

  function saveEvent(plan, intake) {
    loadSavedEvents();
    const existing = savedEvents.findIndex(e => e.id === intake.event_name);
    const entry = {
      id: intake.event_name,
      intake,
      plan,
      savedAt: new Date().toISOString(),
    };
    if (existing >= 0) savedEvents[existing] = entry;
    else savedEvents.unshift(entry);
    localStorage.setItem('anandria_events', JSON.stringify(savedEvents));
    updateEventsCountBadge();
  }

  function updateEventsCountBadge() {
    const badge = $('events-count-badge');
    if (badge) badge.textContent = savedEvents.length;
  }

  function renderMyEventsList() {
    loadSavedEvents();
    const grid = $('my-events-grid');
    const empty = $('events-empty-state');
    if (!grid) return;

    // Remove all cards (keep empty state el)
    qsa('.event-list-card').forEach(el => el.remove());

    if (!savedEvents.length) {
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    savedEvents.forEach(entry => {
      const { intake, plan, savedAt } = entry;
      const sym = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
      const s = sym[intake?.currency] || '';
      const budget = Number(intake?.total_budget || 0).toLocaleString();
      const date = savedAt ? new Date(savedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

      const card = document.createElement('div');
      card.className = 'event-list-card';
      card.innerHTML = `
        <div class="event-card-header">
          <div class="event-card-type-badge">${intake?.event_type || 'Event'}</div>
          <span class="event-card-saved-date">${date}</span>
        </div>
        <h3 class="event-card-name">${intake?.event_name || 'Untitled Event'}</h3>
        <div class="event-card-meta">
          <span>📅 ${intake?.target_date || '—'}</span>
          <span>👥 ${intake?.guest_count || '—'} guests</span>
          <span>💰 ${s}${budget}</span>
        </div>
        <div class="event-card-actions">
          <button class="btn btn-primary btn-sm btn-open-event" data-event-id="${entry.id}">Open Plan</button>
          <button class="btn btn-outline btn-sm btn-delete-event" data-event-id="${entry.id}" style="border-color:var(--color-rose);color:var(--color-rose);">Delete</button>
        </div>
      `;

      // Open
      card.querySelector('.btn-open-event').addEventListener('click', () => {
        loadEventFromSaved(entry);
      });
      // Delete
      card.querySelector('.btn-delete-event').addEventListener('click', () => {
        savedEvents = savedEvents.filter(e => e.id !== entry.id);
        localStorage.setItem('anandria_events', JSON.stringify(savedEvents));
        renderMyEventsList();
        updateEventsCountBadge();
        if (typeof showToast === 'function') showToast('Event deleted', 'info');
      });

      grid.appendChild(card);
    });
  }

  function loadEventFromSaved(entry) {
    // Dispatch to app.js via a custom event
    document.dispatchEvent(new CustomEvent('anandria:load-plan', {
      detail: { plan: entry.plan, intake: entry.intake }
    }));
    navigateTo('dashboard');
  }

  /* ── Dashboard State Sync (Image 2 style) ────────────────── */
  function syncDashboardState() {
    loadSavedEvents();
    const plan = typeof window.currentPlan !== 'undefined' ? window.currentPlan : null;
    const activeDetails = $('dashboard-active-details');

    // 1. Compute summary metrics for the 4 stat cards
    const totalEvents = savedEvents.length > 0 ? savedEvents.length : (plan ? 1 : 0);
    const todayStr = new Date().toISOString().split('T')[0];

    let upcomingCount = 0;
    let totalBudgetSum = 0;
    let currencySymbol = '₹';
    let currencyCode = 'INR';

    savedEvents.forEach(e => {
      if (e.intake?.target_date && e.intake.target_date >= todayStr) {
        upcomingCount++;
      }
      totalBudgetSum += Number(e.intake?.total_budget || 0);
      if (e.intake?.currency) {
        currencyCode = e.intake.currency;
      }
    });

    if (savedEvents.length === 0 && plan && window.AppState?.eventDetails) {
      const d = window.AppState.eventDetails;
      if (d.target_date >= todayStr) upcomingCount = 1;
      totalBudgetSum = Number(d.total_budget || 0);
      currencyCode = d.currency || 'INR';
    }

    const symMap = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
    currencySymbol = symMap[currencyCode] || currencyCode;

    let tasksCompletedStr = '0/0';
    if (plan && Array.isArray(plan.timeline)) {
      const totalTasks = plan.timeline.length;
      const doneTasks = plan.timeline.filter(t => t.completed).length;
      tasksCompletedStr = `${doneTasks}/${totalTasks}`;
    }

    // Update 4 Stat Boxes (Image 2)
    if ($('dash-total-events-num')) $('dash-total-events-num').textContent = totalEvents;
    if ($('dash-upcoming-events-num')) $('dash-upcoming-events-num').textContent = upcomingCount;
    if ($('dash-total-budget-num')) $('dash-total-budget-num').textContent = `${currencySymbol}${Math.round(totalBudgetSum).toLocaleString()}`;
    if ($('dash-budget-curr')) $('dash-budget-curr').textContent = currencyCode;
    if ($('dash-tasks-completed-num')) $('dash-tasks-completed-num').textContent = tasksCompletedStr;

    // 2. Render Recent Events Panel (Image 2)
    const emptyBox = $('recent-events-empty');
    const listBox = $('recent-events-list');

    if (savedEvents.length === 0 && !plan) {
      if (emptyBox) emptyBox.classList.remove('hidden');
      if (listBox) {
        listBox.classList.add('hidden');
        listBox.innerHTML = '';
      }
    } else {
      if (emptyBox) emptyBox.classList.add('hidden');
      if (listBox) {
        listBox.classList.remove('hidden');
        listBox.innerHTML = '';

        const eventsToDisplay = savedEvents.length > 0 ? savedEvents.slice(0, 4) : [
          { id: window.AppState?.eventDetails?.event_name || 'current', intake: window.AppState?.eventDetails, plan, savedAt: new Date().toISOString() }
        ];

        eventsToDisplay.forEach(entry => {
          const { intake, savedAt } = entry;
          if (!intake) return;
          const s = symMap[intake?.currency] || '₹';
          const b = Number(intake?.total_budget || 0).toLocaleString();
          const d = savedAt ? new Date(savedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

          const row = document.createElement('div');
          row.className = 'recent-event-item';
          row.innerHTML = `
            <div class="recent-event-left">
              <span class="recent-event-badge badge-${(intake?.event_type || 'event').toLowerCase().replace(/\s+/g, '-')}">${intake?.event_type || 'Event'}</span>
              <div class="recent-event-meta-info">
                <h4 class="recent-event-name">${intake?.event_name || 'Untitled Event'}</h4>
                <span class="recent-event-sub">📅 ${intake?.target_date || '—'} · 👥 ${intake?.guest_count || 0} guests · 💰 ${s}${b}</span>
              </div>
            </div>
            <button class="btn btn-outline btn-sm btn-open-recent" data-event-id="${entry.id}">
              Open Plan →
            </button>
          `;
          row.querySelector('.btn-open-recent').addEventListener('click', () => {
            loadEventFromSaved(entry);
          });
          listBox.appendChild(row);
        });
      }
    }

    // 3. Show Active Event Section if an event plan is active
    if (activeDetails) {
      if (plan) {
        activeDetails.classList.remove('hidden');
        const h = $('active-event-heading');
        if (h && window.AppState?.eventDetails?.event_name) {
          h.textContent = `${window.AppState.eventDetails.event_name} · AI Blueprint`;
        }
      } else {
        activeDetails.classList.add('hidden');
      }
    }
  }

  /* ── Budget Stats Sync (duplicate IDs to budget-planner view) ── */
  function syncBudgetStats() {
    const pairs = [
      ['stat-total-budget', 'stat-total-budget2'],
      ['stat-allocated-budget', 'stat-allocated-budget2'],
      ['stat-actual-budget', 'stat-actual-budget2'],
      ['stat-variance', 'stat-variance2'],
    ];
    pairs.forEach(([src, dst]) => {
      const s = $(src), d = $(dst);
      if (s && d) d.textContent = s.textContent;
    });
  }

  /* ── Settings Panel Sync ────────────────────────────────── */
  function syncSettingsPanel() {
    // Mode
    const modeText = $('sidebar-mode-text');
    const sDot = $('settings-status-dot');
    const sText = $('settings-mode-text');
    if (modeText && sText) {
      sText.textContent = modeText.textContent;
    }
    // Currency
    const headerCur = $('header-currency-switch');
    const settingsCur = $('settings-currency');
    if (headerCur && settingsCur) settingsCur.value = headerCur.value;
  }

  /* ── Mode Status ────────────────────────────────────────── */
  async function updateModeStatus() {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error();
      const data = await res.json();
      const isLive = data.operational_mode === 'live';
      const dot = $('sidebar-status-dot');
      const txt = $('sidebar-mode-text');
      if (dot) dot.className = 'status-dot' + (isLive ? '' : ' demo');
      if (txt) txt.textContent = isLive ? '🟢 Live – Gemini 2.0 Flash' : '🟡 Demo / Simulator Mode';
    } catch {
      const txt = $('sidebar-mode-text');
      if (txt) txt.textContent = '🔴 Server Offline';
    }
  }

  /* ── Settings Actions ───────────────────────────────────── */
  function initSettingsActions() {
    const saveKeyBtn = $('btn-settings-save-key');
    const clearKeyBtn = $('btn-settings-clear-key');
    const statusEl = $('settings-api-status');

    saveKeyBtn?.addEventListener('click', async () => {
      const key = ($('settings-api-key')?.value || '').trim();
      if (!key) return;
      try {
        const res = await fetch('/api/config/api-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: key }),
        });
        const data = await res.json();
        if (statusEl) statusEl.innerHTML = data.operational_mode === 'live'
          ? '<span style="color:var(--color-emerald);">✅ Key saved — Live mode active</span>'
          : '<span style="color:var(--color-gold);">⚠️ Saved but running in demo mode</span>';
        updateModeStatus();
        if (typeof showToast === 'function') showToast('API Key saved!', 'success');
      } catch {
        if (statusEl) statusEl.innerHTML = '<span style="color:var(--color-rose);">❌ Failed to save key</span>';
      }
    });

    clearKeyBtn?.addEventListener('click', async () => {
      try {
        await fetch('/api/config/api-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: '' }),
        });
        if ($('settings-api-key')) $('settings-api-key').value = '';
        if (statusEl) statusEl.innerHTML = '<span style="color:var(--color-gold);">Demo mode active</span>';
        updateModeStatus();
      } catch {}
    });

    // Currency sync
    $('settings-currency')?.addEventListener('change', e => {
      const headerCur = $('header-currency-switch');
      if (headerCur) {
        headerCur.value = e.target.value;
        headerCur.dispatchEvent(new Event('change'));
      }
    });

    // Data management
    $('btn-settings-export-json')?.addEventListener('click', () => {
      if (typeof exportToJson === 'function') exportToJson();
      else $('export-json')?.click();
    });
    $('btn-settings-export-md')?.addEventListener('click', () => {
      if (typeof exportToMarkdown === 'function') exportToMarkdown();
      else $('export-md')?.click();
    });
    $('btn-settings-clear-data')?.addEventListener('click', () => {
      if (!confirm('Clear all saved event data from this browser? This cannot be undone.')) return;
      localStorage.removeItem('anandria_events');
      localStorage.removeItem('anandria_plan');
      localStorage.removeItem('anandria_intake');
      loadSavedEvents();
      if (typeof showToast === 'function') showToast('All data cleared', 'info');
    });
  }

  /* ── Wire All Navigation Clicks ─────────────────────────── */
  function wireNavClicks() {
    // Sidebar nav items
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-view]');
      if (!btn) return;
      const v = btn.dataset.view;
      if (!v) return;
      e.preventDefault();
      // Ensure app is visible
      if ($('page-app').className.includes('hidden') || $('page-app').className.includes('app-hidden')) {
        showApp(v);
      } else {
        navigateTo(v);
      }
    });
  }

  /* ── Landing page buttons & active plan banner ─────────── */
  function initLandingButtons() {
    // Nav & Hero Enter Dashboard buttons
    $('btn-landing-enter')?.addEventListener('click', () => showApp('dashboard'));
    $('btn-hero-enter')?.addEventListener('click', () => showApp('dashboard'));
    $('btn-bottom-enter')?.addEventListener('click', () => showApp('dashboard'));
    $('landing-preview-click')?.addEventListener('click', () => showApp('dashboard'));
    $('btn-landing-resume')?.addEventListener('click', () => showApp('dashboard'));

    // Image 1 style buttons:
    $('btn-get-started')?.addEventListener('click', () => showApp('create-event'));
    $('btn-view-dashboard')?.addEventListener('click', () => showApp('dashboard'));

    // Start Planning
    $('btn-start-planning')?.addEventListener('click', () => showApp('create-event'));

    // Load Demo Event
    $('btn-load-demo')?.addEventListener('click', () => {
      showApp('create-event');
      setTimeout(() => $('btn-prefill-demo')?.click(), 120);
    });

    // Preset Category cards on landing page
    document.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = e.currentTarget.dataset.preset;
        showApp('create-event');
        setTimeout(() => {
          const radioMap = {
            'Wedding': 'type-wedding',
            'Birthday': 'type-birthday',
            'Community Event': 'type-community',
            'College Event': 'type-college',
            'Custom Event': 'type-custom'
          };
          const rId = radioMap[preset];
          if (rId && $(rId)) {
            $(rId).checked = true;
            document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
            document.querySelector(`label[for="${rId}"]`)?.classList.add('selected');
          }
        }, 100);
      });
    });

    // Dashboard Internal buttons
    $('btn-dashboard-create')?.addEventListener('click', () => navigateTo('create-event'));
    $('btn-dashboard-demo')?.addEventListener('click', () => {
      navigateTo('create-event');
      setTimeout(() => $('btn-prefill-demo')?.click(), 100);
    });

    // API Key modal from landing
    $('btn-landing-apikey')?.addEventListener('click', () => {
      $('api-key-modal')?.classList.remove('hidden');
    });

    // Back to Landing from Dashboard topbar
    $('btn-back-to-landing')?.addEventListener('click', () => {
      showLanding();
    });
    $('btn-topbar-intro')?.addEventListener('click', () => {
      showLanding();
    });

    // Check for cached plan and populate active banner on landing page
    checkActivePlanForLanding();
  }

  function checkActivePlanForLanding() {
    try {
      const cachedPlan = localStorage.getItem('anandria_plan');
      const cachedIntake = localStorage.getItem('anandria_intake');
      if (cachedPlan && cachedIntake) {
        const plan = JSON.parse(cachedPlan);
        const intake = JSON.parse(cachedIntake);
        const banner = $('landing-active-plan-banner');
        const nameEl = $('landing-active-plan-name');
        const metaEl = $('landing-active-plan-meta');

        if (banner && nameEl && metaEl) {
          const sym = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
          const s = sym[intake.currency] || '₹';
          nameEl.textContent = intake.event_name || 'My Event';
          metaEl.textContent = `${s} ${Number(intake.total_budget || 0).toLocaleString()} · ${intake.guest_count || '0'} guests`;
          banner.classList.remove('hidden');
        }

        // Enable active event tools in sidebar so when user goes to app they are immediately ready
        showActiveEventTools(true);
        updateTopbarEventInfo(plan, intake);
      }
    } catch (e) {
      console.warn('Could not read cached plan for landing banner', e);
    }
  }

  /* ── Sidebar Controls ───────────────────────────────────── */
  function initSidebarControls() {
    $('btn-sidebar-collapse')?.addEventListener('click', toggleSidebarCollapse);
    $('btn-sidebar-mobile-toggle')?.addEventListener('click', openMobileSidebar);
    $('sidebar-overlay')?.addEventListener('click', closeMobileSidebar);
    $('sidebar-diagnostics-btn')?.addEventListener('click', () => {
      $('diagnostics-modal')?.classList.remove('hidden');
    });

    // Escape key closes mobile sidebar
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMobileSidebar();
    });
  }

  /* ── Listen for plan load events from app.js ─────────────── */
  function initPlanListeners() {
    document.addEventListener('anandria:plan-generated', (e) => {
      const { plan, intake } = e.detail || {};
      showActiveEventTools(true);
      updateTopbarEventInfo(plan, intake);
      saveEvent(plan, intake);
      // Navigate to dashboard
      navigateTo('dashboard');
      syncDashboardState();
    });

    document.addEventListener('anandria:plan-cleared', () => {
      showActiveEventTools(false);
      $('topbar-event-info').innerHTML = '';
      syncDashboardState();
    });
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    wireNavClicks();
    initLandingButtons();
    initSidebarControls();
    initSettingsActions();
    initPlanListeners();
    loadSavedEvents();

    // Always display the Intro / Landing page first on initial page load!
    showLanding();
    updateModeStatus();
  }

  document.addEventListener('DOMContentLoaded', init);

  /* ── Expose for app.js to call ──────────────────────────── */
  window.sidebarNav = {
    navigateTo,
    showApp,
    showLanding,
    showActiveEventTools,
    updateTopbarEventInfo,
    saveEvent,
    syncDashboardState,
    updateModeStatus,
  };
})();
