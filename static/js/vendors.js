/**
 * ANANDRIA – Interactive Vendor Checklist & Custom Vendor Addition
 */

let vendorSearchDebounce = null;
let currentStatusFilter = 'All';
let currentSearchQuery = '';

const VendorsComponent = {
  render(plan, details) {
    if (!plan || !plan.vendor_checklist) return;

    const vendors = plan.vendor_checklist;
    const curr = details?.currency || 'INR';
    const currSym = curr === 'INR' ? '₹' : curr === 'USD' ? '$' : curr === 'EUR' ? '€' : '£';

    // 1. Calculate Progress & Counts
    const totalCount = vendors.length;
    const bookedCount = vendors.filter(v => v.status === 'Booked').length;
    const contactedCount = vendors.filter(v => v.status === 'Contacted').length;
    const pendingCount = vendors.filter(v => v.status === 'Pending').length;
    const pct = totalCount > 0 ? Math.round((bookedCount / totalCount) * 100) : 0;

    // Update Counts on Filter Buttons
    const elAll = document.getElementById('count-all');
    const elPending = document.getElementById('count-pending');
    const elContacted = document.getElementById('count-contacted');
    const elBooked = document.getElementById('count-booked');
    if (elAll) elAll.textContent = totalCount;
    if (elPending) elPending.textContent = pendingCount;
    if (elContacted) elContacted.textContent = contactedCount;
    if (elBooked) elBooked.textContent = bookedCount;

    // Update Progress Bar
    const fillEl = document.getElementById('vendor-progress-fill');
    const textEl = document.getElementById('vendor-progress-text');
    const badgeEl = document.getElementById('badge-vendor-progress');
    const barBg = document.getElementById('vendor-progress-bar');

    if (fillEl) fillEl.style.width = `${pct}%`;
    if (textEl) textEl.textContent = `${pct}% Booked (${bookedCount}/${totalCount})`;
    if (badgeEl) badgeEl.textContent = `Vendors: ${pct}% Booked`;
    if (barBg) barBg.setAttribute('aria-valuenow', pct);

    // 2. Filter Vendors
    const filtered = vendors.filter(v => {
      const matchesStatus = currentStatusFilter === 'All' || v.status === currentStatusFilter;
      const matchesSearch = !currentSearchQuery ||
        v.vendor.toLowerCase().includes(currentSearchQuery) ||
        v.task.toLowerCase().includes(currentSearchQuery) ||
        (v.category && v.category.toLowerCase().includes(currentSearchQuery));
      return matchesStatus && matchesSearch;
    });

    // 3. Render Cards
    const container = document.getElementById('vendor-cards-grid');
    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-subtle);">
          No vendor tasks match your filter criteria.
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(v => `
      <div class="vendor-card" data-id="${v.id}">
        <div class="vendor-header">
          <div>
            <div class="vendor-name">${v.vendor}</div>
            <div class="vendor-cat">${v.category || 'Vendor'}</div>
          </div>
          <span class="priority-tag ${v.priority}">${v.priority}</span>
        </div>

        <div class="vendor-task">${v.task}</div>

        ${v.notes ? `<div style="font-size: 0.75rem; color: var(--text-subtle);">${v.notes}</div>` : ''}

        <div class="vendor-footer">
          <div class="vendor-cost">
            ${v.estimated_cost ? `${currSym} ${Number(v.estimated_cost).toLocaleString()}` : 'Custom Quote'}
          </div>

          <div class="status-toggle-group" role="group" aria-label="Status for ${v.vendor}">
            <button class="status-btn ${v.status === 'Pending' ? 'active Pending' : ''}"
                    data-id="${v.id}" data-status="Pending">Pending</button>
            <button class="status-btn ${v.status === 'Contacted' ? 'active Contacted' : ''}"
                    data-id="${v.id}" data-status="Contacted">Contacted</button>
            <button class="status-btn ${v.status === 'Booked' ? 'active Booked' : ''}"
                    data-id="${v.id}" data-status="Booked">Booked</button>
          </div>
        </div>
      </div>
    `).join('');

    // Attach Status Button Listeners
    container.querySelectorAll('.status-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const vendorId = e.target.dataset.id;
        const newStatus = e.target.dataset.status;
        this.updateVendorStatus(vendorId, newStatus);
      });
    });
  },

  updateVendorStatus(vendorId, newStatus) {
    const plan = window.AppState.currentPlan;
    const details = window.AppState.eventDetails;
    const vendor = plan.vendor_checklist.find(v => v.id === vendorId);
    if (vendor) {
      vendor.status = newStatus;
      StorageService.savePlan(plan, details);
      this.render(plan, details);
      window.AppToast.show(`Updated ${vendor.vendor} to ${newStatus}`, 'info');
    }
  },

  addCustomVendor(vendor, task, category, status, priority, estimatedCost, notes) {
    const plan = window.AppState.currentPlan;
    const details = window.AppState.eventDetails;

    const newVendor = {
      id: `vend-custom-${Date.now()}`,
      vendor,
      task,
      category: category || 'Custom',
      status: status || 'Pending',
      priority: priority || 'Medium',
      estimated_cost: parseFloat(estimatedCost) || 0,
      notes: notes || ''
    };

    plan.vendor_checklist.push(newVendor);
    StorageService.savePlan(plan, details);
    this.render(plan, details);
    window.AppToast.show(`Added "${vendor}" to checklist!`, 'success');
  },

  initListeners() {
    // Search Listener (debounced)
    const searchInput = document.getElementById('vendor-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        if (vendorSearchDebounce) clearTimeout(vendorSearchDebounce);
        vendorSearchDebounce = setTimeout(() => {
          currentSearchQuery = e.target.value.trim().toLowerCase();
          VendorsComponent.render(window.AppState.currentPlan, window.AppState.eventDetails);
        }, 150);
      });
    }

    // Filter Buttons
    document.querySelectorAll('.filter-group .filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-group .filter-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        currentStatusFilter = e.currentTarget.dataset.status;
        VendorsComponent.render(window.AppState.currentPlan, window.AppState.eventDetails);
      });
    });

    // Open Add Vendor Modal
    document.getElementById('btn-open-add-vendor')?.addEventListener('click', () => {
      document.getElementById('add-vendor-modal')?.classList.remove('hidden');
    });

    // Add Vendor Form Submit
    document.getElementById('add-vendor-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const vendor = document.getElementById('new-vendor-name').value.trim();
      const category = document.getElementById('new-vendor-cat').value;
      const task = document.getElementById('new-vendor-task').value.trim();
      const status = document.getElementById('new-vendor-status').value;
      const priority = document.getElementById('new-vendor-priority').value;
      const cost = document.getElementById('new-vendor-cost').value;
      const notes = document.getElementById('new-vendor-notes').value.trim();

      if (vendor && task) {
        this.addCustomVendor(vendor, task, category, status, priority, cost, notes);
        document.getElementById('add-vendor-modal')?.classList.add('hidden');
        document.getElementById('add-vendor-form').reset();
      }
    });

    document.getElementById('btn-close-vendor-modal')?.addEventListener('click', () => {
      document.getElementById('add-vendor-modal')?.classList.add('hidden');
    });
  }
};
