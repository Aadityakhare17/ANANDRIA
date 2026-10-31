/**
 * ANANDRIA – Actionable Timeline, Precision Countdown & Custom Milestones
 */

let countdownInterval = null;

const TimelineComponent = {
  render(plan, details) {
    if (!plan || !plan.timeline) return;

    const timeline = plan.timeline;
    const targetDateStr = details?.target_date;

    // 1. Live Precision Countdown Ticker
    this.startLiveCountdown(targetDateStr);

    // 2. Calculate Progress
    const totalTasks = timeline.length;
    const completedTasks = timeline.filter(t => t.completed).length;
    const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const badge = document.getElementById('badge-timeline-progress');
    if (badge) {
      badge.textContent = `Tasks: ${pct}% Done (${completedTasks}/${totalTasks})`;
    }

    // 3. Group by Phase
    const groups = {};
    timeline.forEach(item => {
      const phase = item.phase || 'General Planning';
      if (!groups[phase]) groups[phase] = [];
      groups[phase].push(item);
    });

    const container = document.getElementById('timeline-container');
    if (!container) return;

    container.innerHTML = Object.entries(groups).map(([phase, tasks]) => {
      const phaseCompleted = tasks.filter(t => t.completed).length;
      return `
        <div class="timeline-phase-group">
          <div class="phase-header-badge">
            <span>📅 ${phase}</span>
            <span style="font-size: 0.75rem; color: var(--text-subtle);">(${phaseCompleted}/${tasks.length})</span>
          </div>

          <div class="timeline-items-list">
            ${tasks.map(task => `
              <div class="timeline-task-card ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <input type="checkbox"
                       id="check-${task.id}"
                       data-id="${task.id}"
                       class="task-checkbox"
                       ${task.completed ? 'checked' : ''}
                       aria-label="Mark task '${task.task}' as completed">
                <div class="task-content">
                  <label for="check-${task.id}" class="task-title">${task.task}</label>
                  ${task.description ? `<p class="task-desc">${task.description}</p>` : ''}
                  <div class="task-meta">
                    <span>Due: <strong>${task.due_date}</strong></span>
                    <span class="priority-tag ${task.priority}">${task.priority} Priority</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');

    // Attach checkbox listeners
    container.querySelectorAll('.task-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const taskId = e.target.dataset.id;
        const isChecked = e.target.checked;
        this.toggleTaskCompletion(taskId, isChecked);
      });
    });
  },

  startLiveCountdown(targetDateStr) {
    if (countdownInterval) clearInterval(countdownInterval);

    const updateTicker = () => {
      const daysEl = document.getElementById('countdown-days');
      const hoursEl = document.getElementById('countdown-hours');
      const minsEl = document.getElementById('countdown-mins');
      const secsEl = document.getElementById('countdown-secs');
      if (!daysEl || !targetDateStr) return;

      const target = new Date(`${targetDateStr}T09:00:00`);
      const now = new Date();
      const diff = target - now;

      if (diff <= 0) {
        daysEl.textContent = '0';
        if (hoursEl) hoursEl.textContent = '0';
        if (minsEl) minsEl.textContent = '0';
        if (secsEl) secsEl.textContent = '0';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      daysEl.textContent = days;
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
      if (minsEl) minsEl.textContent = String(mins).padStart(2, '0');
      if (secsEl) secsEl.textContent = String(secs).padStart(2, '0');
    };

    updateTicker();
    countdownInterval = setInterval(updateTicker, 1000);
  },

  toggleTaskCompletion(taskId, isCompleted) {
    const plan = window.AppState.currentPlan;
    const details = window.AppState.eventDetails;
    const task = plan.timeline.find(t => t.id === taskId);
    if (task) {
      task.completed = isCompleted;
      StorageService.savePlan(plan, details);
      this.render(plan, details);
    }
  },

  addCustomMilestone(phase, task, dueDate, priority, description) {
    const plan = window.AppState.currentPlan;
    const details = window.AppState.eventDetails;

    const newMilestone = {
      id: `time-custom-${Date.now()}`,
      phase,
      task,
      description: description || 'Custom milestone task',
      due_date: dueDate || details?.target_date,
      completed: false,
      priority
    };

    plan.timeline.push(newMilestone);
    StorageService.savePlan(plan, details);
    this.render(plan, details);
    window.AppToast.show(`Added milestone: "${task}"!`, 'success');
  },

  initListeners() {
    // Open Add Milestone Modal
    document.getElementById('btn-open-add-milestone')?.addEventListener('click', () => {
      document.getElementById('add-milestone-modal')?.classList.remove('hidden');
    });

    // Add Milestone Form Submit
    document.getElementById('add-milestone-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const phase = document.getElementById('new-milestone-phase').value;
      const task = document.getElementById('new-milestone-task').value.trim();
      const dueDate = document.getElementById('new-milestone-date').value;
      const priority = document.getElementById('new-milestone-priority').value;
      const desc = document.getElementById('new-milestone-desc').value.trim();

      if (task) {
        this.addCustomMilestone(phase, task, dueDate, priority, desc);
        document.getElementById('add-milestone-modal')?.classList.add('hidden');
        document.getElementById('add-milestone-form').reset();
      }
    });

    document.getElementById('btn-close-milestone-modal')?.addEventListener('click', () => {
      document.getElementById('add-milestone-modal')?.classList.add('hidden');
    });
  }
};
