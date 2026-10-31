/**
 * ANANDRIA – Guest List & RSVP Manager Component
 */

const GuestsComponent = {
  getInitialGuests(eventType, guestCount) {
    if (eventType === 'Wedding') {
      return [
        { id: 'g-1', name: 'Dr. Ramesh & Sunita Sharma', group: 'Family', status: 'Confirmed', diet: 'Vegetarian', plus_ones: 1, table: 'T-1 (VIP)', notes: 'Arriving from Delhi' },
        { id: 'g-2', name: 'Pooja Verma & Family', group: 'Close Friends', status: 'Confirmed', diet: 'Jain', plus_ones: 2, table: 'T-2', notes: 'Strict Jain food without root vegetables' },
        { id: 'g-3', name: 'Vikram & Tanya Singhania', group: 'Family', status: 'Pending', diet: 'Vegetarian', plus_ones: 1, table: 'T-1 (VIP)', notes: 'Awaiting flight confirmation' },
        { id: 'g-4', name: 'Kavita Iyer', group: 'College Friends', status: 'Confirmed', diet: 'Vegan', plus_ones: 0, table: 'T-4', notes: 'Gluten-free preference' },
        { id: 'g-5', name: 'Aditya & Neha Mehra', group: 'Colleagues', status: 'Confirmed', diet: 'Non-Vegetarian', plus_ones: 1, table: 'T-5', notes: 'Attending evening reception' },
        { id: 'g-6', name: 'Rajeev Bansal', group: 'Family', status: 'Declined', diet: 'Vegetarian', plus_ones: 0, table: 'Unassigned', notes: 'Out of country' }
      ];
    } else if (eventType === 'Birthday') {
      return [
        { id: 'g-1', name: 'Aarav Mehta', group: 'School Friends', status: 'Confirmed', diet: 'Vegetarian', plus_ones: 0, table: 'Kids Zone', notes: 'Nut allergy' },
        { id: 'g-2', name: 'Diya Patel & Mom', group: 'Neighbors', status: 'Confirmed', diet: 'Vegetarian', plus_ones: 1, table: 'Family Table', notes: 'Early arrival' },
        { id: 'g-3', name: 'Kabir & Siya Roy', group: 'Friends', status: 'Confirmed', diet: 'Non-Vegetarian', plus_ones: 1, table: 'Party Table', notes: '' },
        { id: 'g-4', name: 'Tanvi Shah', group: 'Family', status: 'Pending', diet: 'Jain', plus_ones: 0, table: 'Family Table', notes: 'RSVP pending call' }
      ];
    } else if (eventType === 'College Event') {
      return [
        { id: 'g-1', name: 'Prof. Anirudh Kulkarni (Dean)', group: 'Faculty / VIP', status: 'Confirmed', diet: 'Vegetarian', plus_ones: 1, table: 'Front Row (Faculty)', notes: 'Chief Guest Felicitation' },
        { id: 'g-2', name: 'Student Council Core Committee (8 members)', group: 'Student Leads', status: 'Confirmed', diet: 'Vegetarian', plus_ones: 7, table: 'War Room Desk', notes: 'Stage coordination & logistics' },
        { id: 'g-3', name: 'Headline Band Crew & Sound Engineers', group: 'Performers', status: 'Confirmed', diet: 'Non-Vegetarian', plus_ones: 4, table: 'Green Room', notes: 'Sound check at 4 PM' },
        { id: 'g-4', name: 'Campus Alumni Mentors & Judges', group: 'Judges / Alumni', status: 'Pending', diet: 'Vegan', plus_ones: 2, table: 'Judges Booth', notes: 'Evaluating battle of bands' }
      ];
    } else if (eventType === 'Custom Event') {
      return [
        { id: 'g-1', name: 'Chief Guest / Key Host', group: 'VIP', status: 'Confirmed', diet: 'Vegetarian', plus_ones: 1, table: 'Table 1', notes: 'Welcome address speaker' },
        { id: 'g-2', name: 'Organizing Committee Members', group: 'Host Team', status: 'Confirmed', diet: 'Vegetarian', plus_ones: 3, table: 'Central Booth', notes: 'Event check-in marshals' },
        { id: 'g-3', name: 'Invited Attendees & Colleagues', group: 'Delegates', status: 'Confirmed', diet: 'Non-Vegetarian', plus_ones: 2, table: 'Table 2', notes: 'Special presentation' },
        { id: 'g-4', name: 'Visiting Guests / Associates', group: 'General', status: 'Pending', diet: 'Vegan', plus_ones: 1, table: 'Table 3', notes: 'Awaiting RSVP confirmation' }
      ];
    } else {
      return [
        { id: 'g-1', name: 'Ward Councilor Mrs. Desai', group: 'VIP Delegates', status: 'Confirmed', diet: 'Vegetarian', plus_ones: 1, table: 'Dais Row 1', notes: 'Keynote Speaker' },
        { id: 'g-2', name: 'GreenEarth Volunteers (Team of 5)', group: 'Volunteers', status: 'Confirmed', diet: 'Vegan', plus_ones: 4, table: 'Marshal Desk', notes: 'Eco-sorting coordination' },
        { id: 'g-3', name: 'Senior Citizens Cultural Club', group: 'Community', status: 'Confirmed', diet: 'Vegetarian', plus_ones: 8, table: 'Zone A', notes: 'Wheelchair access seating' }
      ];
    }
  },

  render() {
    const guests = window.AppState.guestList || [];
    const container = document.getElementById('guest-cards-grid');
    if (!container) return;

    // 1. Calculate Metrics
    const totalGuests = guests.reduce((acc, g) => acc + 1 + (Number(g.plus_ones) || 0), 0);
    const confirmed = guests.filter(g => g.status === 'Confirmed').reduce((acc, g) => acc + 1 + (Number(g.plus_ones) || 0), 0);
    const pending = guests.filter(g => g.status === 'Pending').reduce((acc, g) => acc + 1 + (Number(g.plus_ones) || 0), 0);
    const declined = guests.filter(g => g.status === 'Declined').reduce((acc, g) => acc + 1 + (Number(g.plus_ones) || 0), 0);

    const vegCount = guests.filter(g => g.diet === 'Vegetarian').length;
    const jainCount = guests.filter(g => g.diet === 'Jain').length;
    const veganCount = guests.filter(g => g.diet === 'Vegan').length;
    const nonVegCount = guests.filter(g => g.diet === 'Non-Vegetarian').length;

    // Update Metric Badges
    const setGuestStat = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setGuestStat('guest-metric-total', totalGuests);
    setGuestStat('guest-metric-confirmed', confirmed);
    setGuestStat('guest-metric-pending', pending);
    setGuestStat('guest-metric-declined', declined);

    setGuestStat('diet-veg-count', vegCount);
    setGuestStat('diet-jain-count', jainCount);
    setGuestStat('diet-vegan-count', veganCount);
    setGuestStat('diet-nonveg-count', nonVegCount);

    // 2. Filter & Search
    const searchVal = (document.getElementById('guest-search')?.value || '').toLowerCase().trim();
    const filterStatus = window.AppState.guestFilterStatus || 'All';

    const filtered = guests.filter(g => {
      const matchStatus = filterStatus === 'All' || g.status === filterStatus;
      const matchSearch = !searchVal ||
        g.name.toLowerCase().includes(searchVal) ||
        g.group.toLowerCase().includes(searchVal) ||
        g.table.toLowerCase().includes(searchVal) ||
        (g.notes && g.notes.toLowerCase().includes(searchVal));
      return matchStatus && matchSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-subtle);">
          No guests match the selected filter.
        </div>
      `;
      return;
    }

    // 3. Render Cards
    container.innerHTML = filtered.map(g => `
      <div class="guest-card status-${g.status.toLowerCase()}" data-id="${g.id}">
        <div class="guest-card-header">
          <div>
            <h4 class="guest-name">${g.name}</h4>
            <span class="guest-group-badge">${g.group}</span>
          </div>
          <span class="rsvp-pill ${g.status}">${g.status}</span>
        </div>

        <div class="guest-details-grid">
          <div><strong>Meal:</strong> <span class="diet-tag ${g.diet.toLowerCase()}">${g.diet}</span></div>
          <div><strong>Table:</strong> ${g.table || 'Unassigned'}</div>
          <div><strong>Plus-Ones:</strong> +${g.plus_ones || 0}</div>
        </div>

        ${g.notes ? `<div class="guest-note"><em>“${g.notes}”</em></div>` : ''}

        <div class="guest-card-actions">
          <div class="rsvp-btn-group" role="group" aria-label="Update RSVP for ${g.name}">
            <button class="rsvp-btn ${g.status === 'Confirmed' ? 'active Confirmed' : ''}" data-id="${g.id}" data-status="Confirmed">Confirm</button>
            <button class="rsvp-btn ${g.status === 'Pending' ? 'active Pending' : ''}" data-id="${g.id}" data-status="Pending">Tentative</button>
            <button class="rsvp-btn ${g.status === 'Declined' ? 'active Declined' : ''}" data-id="${g.id}" data-status="Declined">Decline</button>
          </div>
          <button class="btn-text-danger btn-delete-guest" data-id="${g.id}" title="Remove Guest">&times;</button>
        </div>
      </div>
    `).join('');

    // Attach RSVP status update listeners
    container.querySelectorAll('.rsvp-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const gid = e.target.dataset.id;
        const newStatus = e.target.dataset.status;
        this.updateRSVP(gid, newStatus);
      });
    });

    // Attach delete listeners
    container.querySelectorAll('.btn-delete-guest').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const gid = e.target.dataset.id;
        this.deleteGuest(gid);
      });
    });
  },

  updateRSVP(guestId, status) {
    const guests = window.AppState.guestList;
    const g = guests.find(it => it.id === guestId);
    if (g) {
      g.status = status;
      StorageService.saveGuestList(guests);
      this.render();
      window.AppToast.show(`Updated RSVP for ${g.name} to ${status}`, 'info');
    }
  },

  deleteGuest(guestId) {
    window.AppState.guestList = window.AppState.guestList.filter(g => g.id !== guestId);
    StorageService.saveGuestList(window.AppState.guestList);
    this.render();
    window.AppToast.show('Guest removed from list', 'info');
  },

  addGuest(newGuest) {
    newGuest.id = `guest-${Date.now()}`;
    window.AppState.guestList.unshift(newGuest);
    StorageService.saveGuestList(window.AppState.guestList);
    this.render();
    window.AppToast.show(`Added ${newGuest.name} to guest list!`, 'success');
  },

  initListeners() {
    // Search listener
    const searchEl = document.getElementById('guest-search');
    if (searchEl) {
      searchEl.addEventListener('input', () => this.render());
    }

    // Filter status buttons
    document.querySelectorAll('.guest-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.guest-filter-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        window.AppState.guestFilterStatus = e.currentTarget.dataset.status;
        this.render();
      });
    });

    // Add Guest Modal open
    document.getElementById('btn-open-add-guest')?.addEventListener('click', () => {
      document.getElementById('add-guest-modal')?.classList.remove('hidden');
    });

    // Add Guest Form Submit
    document.getElementById('add-guest-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('new-guest-name').value.trim();
      const group = document.getElementById('new-guest-group').value;
      const diet = document.getElementById('new-guest-diet').value;
      const status = document.getElementById('new-guest-status').value;
      const plus_ones = parseInt(document.getElementById('new-guest-plus').value || '0', 10);
      const table = document.getElementById('new-guest-table').value.trim() || 'General';
      const notes = document.getElementById('new-guest-notes').value.trim();

      if (name) {
        this.addGuest({ name, group, diet, status, plus_ones, table, notes });
        document.getElementById('add-guest-modal')?.classList.add('hidden');
        document.getElementById('add-guest-form').reset();
      }
    });

    // Close Modal Button
    document.getElementById('btn-close-guest-modal')?.addEventListener('click', () => {
      document.getElementById('add-guest-modal')?.classList.add('hidden');
    });

    // Export CSV
    document.getElementById('btn-export-guests-csv')?.addEventListener('click', () => {
      StorageService.exportGuestsToCSV(window.AppState.guestList, window.AppState.eventDetails);
      window.AppToast.show('Guest list exported to CSV!', 'success');
    });
  }
};
