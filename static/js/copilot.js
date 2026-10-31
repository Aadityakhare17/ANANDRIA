/**
 * ANANDRIA – AI Co-Pilot Refinement (sidebar AI Assistant view + chips)
 */

const CopilotComponent = {
  initListeners() {
    // All chip buttons (both in AI view and any other location)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip-btn');
      if (!btn) return;
      const prompt = btn.dataset.prompt;
      if (!prompt) return;
      const input = document.getElementById('copilot-input');
      if (input) input.value = prompt;
      this.submitRefinement(prompt);
    });

    // Form submission
    const form = document.getElementById('copilot-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('copilot-input');
        const text = input ? input.value.trim() : '';
        if (text) this.submitRefinement(text);
      });
    }
  },

  addChatMessage(role, text) {
    const messages = document.getElementById('ai-chat-messages');
    if (!messages) return;
    const div = document.createElement('div');
    div.className = role === 'user' ? 'ai-chat-msg-user' : 'ai-chat-msg-ai';
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  },

  async submitRefinement(promptText) {
    const currentPlan = window.AppState.currentPlan;
    const eventDetails = window.AppState.eventDetails;
    if (!currentPlan) {
      window.AppToast?.show('Generate an event plan first before refining.', 'error');
      return;
    }

    const btn = document.getElementById('btn-copilot-submit');
    const spinner = document.getElementById('copilot-spinner');
    const btnText = document.getElementById('copilot-btn-text');
    const input = document.getElementById('copilot-input');

    this.addChatMessage('user', promptText);

    try {
      if (btn) btn.disabled = true;
      if (spinner) spinner.classList.remove('hidden');
      if (btnText) btnText.textContent = 'Refining...';

      window.AppToast?.show(`Refining plan: "${promptText.slice(0, 35)}…"`, 'info');

      const refinedPlan = await ApiService.refinePlan(promptText, currentPlan, eventDetails);

      // Handle budget percentage adjustments
      if (promptText.toLowerCase().includes('15%')) {
        eventDetails.total_budget = Math.round(Number(eventDetails.total_budget) * 0.85);
      }

      window.AppState.currentPlan = refinedPlan;
      window.currentPlan = refinedPlan;
      StorageService.savePlan(refinedPlan, eventDetails);

      window.AppController.renderFullDashboard(refinedPlan, eventDetails);

      this.addChatMessage('ai', `✅ Done! Your plan has been updated: "${promptText}". Check Budget Planner, Timeline, and Vendors for the latest changes.`);
      window.AppToast?.show('Event plan successfully refined!', 'success');

      if (input) input.value = '';
    } catch (err) {
      console.error('Refinement error:', err);
      this.addChatMessage('ai', `❌ Refinement failed: ${err.message || 'Please try again.'}`);
      window.AppToast?.show(err.message || 'Could not refine plan.', 'error');
    } finally {
      if (btn) btn.disabled = false;
      if (spinner) spinner.classList.add('hidden');
      if (btnText) btnText.textContent = 'Send';
    }
  }
};

