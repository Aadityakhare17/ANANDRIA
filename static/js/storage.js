/**
 * ANANDRIA – Local Storage, Currency Conversion & Export Helpers
 */

const STORAGE_KEYS = {
  CURRENT_PLAN: 'anandria_current_plan',
  EVENT_DETAILS: 'anandria_event_details',
  LAST_TAB: 'anandria_active_tab',
  GUEST_LIST: 'anandria_guest_list'
};

// Base conversion rates to INR
const CURRENCY_RATES = {
  INR: 1.0,
  USD: 85.0,
  EUR: 92.0,
  GBP: 108.0
};

const StorageService = {
  savePlan(plan, details) {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_PLAN, JSON.stringify(plan));
      if (details) {
        localStorage.setItem(STORAGE_KEYS.EVENT_DETAILS, JSON.stringify(details));
      }
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  },

  loadPlan() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_PLAN);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  loadDetails() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EVENT_DETAILS);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  clearPlan() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PLAN);
    localStorage.removeItem(STORAGE_KEYS.EVENT_DETAILS);
    localStorage.removeItem(STORAGE_KEYS.GUEST_LIST);
  },

  saveActiveTab(tabId) {
    localStorage.setItem(STORAGE_KEYS.LAST_TAB, tabId);
  },

  loadActiveTab() {
    return localStorage.getItem(STORAGE_KEYS.LAST_TAB) || 'tab-budget';
  },

  saveGuestList(list) {
    try {
      localStorage.setItem(STORAGE_KEYS.GUEST_LIST, JSON.stringify(list));
    } catch (e) {}
  },

  loadGuestList() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GUEST_LIST);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  convertCurrency(amount, fromCurr, toCurr) {
    if (fromCurr === toCurr) return amount;
    const inINR = amount * (CURRENCY_RATES[fromCurr] || 1.0);
    const target = inINR / (CURRENCY_RATES[toCurr] || 1.0);
    return Math.round(target);
  },

  exportToJSON(plan, details) {
    const exportData = {
      app: 'ANANDRIA GenAI Event Planning Assistant',
      exported_at: new Date().toISOString(),
      event_details: details,
      event_plan: plan,
      guests: window.AppState.guestList || []
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (details?.event_name || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `anandria_plan_${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  exportToMarkdown(plan, details) {
    const curr = details?.currency || 'INR';
    const currSym = curr === 'INR' ? '₹' : curr === 'USD' ? '$' : curr === 'EUR' ? '€' : '£';

    let md = `# ANANDRIA Event Blueprint: ${details?.event_name || 'Event Plan'}\n\n`;
    md += `**Event Type:** ${details?.event_type || 'Wedding'}\n`;
    md += `**Target Date:** ${details?.target_date || 'N/A'}\n`;
    md += `**Guest Count:** ${details?.guest_count || 0} attendees\n`;
    md += `**Total Budget:** ${currSym} ${Number(details?.total_budget || 0).toLocaleString()}\n`;
    md += `**Location:** ${details?.location || 'Not specified'}\n\n`;
    md += `## Executive Summary\n${plan.summary}\n\n`;

    md += `## 1. Dynamic Budget Allocation\n`;
    md += `| Category | Allocation (${currSym}) | % Share | Actual Spend | Notes |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    (plan.budget_breakdown || []).forEach(item => {
      md += `| ${item.category} | ${currSym} ${Number(item.amount).toLocaleString()} | ${item.percentage}% | ${currSym} ${Number(item.actual_spend || 0).toLocaleString()} | ${item.notes || ''} |\n`;
    });
    md += `\n`;

    md += `## 2. Timeline & Milestones\n`;
    (plan.timeline || []).forEach(item => {
      const check = item.completed ? '[x]' : '[ ]';
      md += `- ${check} **${item.phase}** (${item.due_date}) - **${item.task}** [Priority: ${item.priority}]\n  _${item.description || ''}_\n`;
    });
    md += `\n`;

    md += `## 3. Vendor Checklist\n`;
    md += `| Vendor / Service | Category | Status | Priority | Estimated Cost |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    (plan.vendor_checklist || []).forEach(v => {
      md += `| ${v.vendor} - ${v.task} | ${v.category} | ${v.status} | ${v.priority} | ${currSym} ${Number(v.estimated_cost).toLocaleString()} |\n`;
    });
    md += `\n`;

    md += `## 4. Personalized Creative Ideas\n`;
    md += `### Themes\n`;
    (plan.personalized_ideas?.themes || []).forEach(t => {
      md += `- **${t.name}:** ${t.description}\n`;
    });
    md += `\n### Color Palettes\n`;
    (plan.personalized_ideas?.color_palettes || []).forEach(p => {
      md += `- **${p.name}:** ${(p.colors || []).join(', ')} (${p.mood || ''})\n`;
    });
    md += `\n### Curated Menu Ideas\n`;
    (plan.personalized_ideas?.menu_ideas || []).forEach(m => {
      md += `- ${m}\n`;
    });
    md += `\n### Guest Activities\n`;
    (plan.personalized_ideas?.activities || []).forEach(a => {
      md += `- ${a}\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (details?.event_name || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `anandria_plan_${safeName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  exportGuestsToCSV(guests, details) {
    if (!guests || guests.length === 0) return;
    let csv = 'Guest Name,Group,RSVP Status,Diet Preference,Plus Ones,Assigned Table,Notes\n';
    guests.forEach(g => {
      const name = `"${(g.name || '').replace(/"/g, '""')}"`;
      const group = `"${(g.group || '').replace(/"/g, '""')}"`;
      const status = g.status;
      const diet = g.diet;
      const plus = g.plus_ones || 0;
      const table = `"${(g.table || '').replace(/"/g, '""')}"`;
      const notes = `"${(g.notes || '').replace(/"/g, '""')}"`;
      csv += `${name},${group},${status},${diet},${plus},${table},${notes}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (details?.event_name || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `anandria_guests_${safeName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  printOrSavePDF() {
    window.print();
  }
};
