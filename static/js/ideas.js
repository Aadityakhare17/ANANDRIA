/**
 * ANANDRIA – Personalized Creative Ideas & Color Palettes
 */

const IdeasComponent = {
  render(plan) {
    if (!plan || !plan.personalized_ideas) return;

    const ideas = plan.personalized_ideas;

    // 1. Themes
    const themesContainer = document.getElementById('themes-grid');
    if (themesContainer && ideas.themes) {
      themesContainer.innerHTML = ideas.themes.map(t => `
        <div class="theme-card">
          <div class="theme-name">✦ ${t.name}</div>
          <p class="theme-desc">${t.description}</p>
        </div>
      `).join('');
    }

    // 2. Color Palettes
    const palettesContainer = document.getElementById('palettes-grid');
    if (palettesContainer && ideas.color_palettes) {
      palettesContainer.innerHTML = ideas.color_palettes.map(p => `
        <div class="palette-card">
          <div class="palette-name">${p.name}</div>
          <div class="palette-mood">${p.mood || ''}</div>
          <div class="swatches-row">
            ${(p.colors || []).map(hex => `
              <div class="color-swatch"
                   style="background-color: ${hex};"
                   data-hex="${hex}"
                   title="Click to copy ${hex}"
                   tabindex="0"
                   role="button"
                   aria-label="Color swatch ${hex}"></div>
            `).join('')}
          </div>
        </div>
      `).join('');

      // Swatch Click to Copy
      palettesContainer.querySelectorAll('.color-swatch').forEach(swatch => {
        const copyHandler = () => {
          const hex = swatch.dataset.hex;
          navigator.clipboard.writeText(hex).then(() => {
            window.AppToast.show(`Copied ${hex} to clipboard!`, 'success');
          }).catch(() => {
            window.AppToast.show(`Color code: ${hex}`, 'info');
          });
        };
        swatch.addEventListener('click', copyHandler);
        swatch.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            copyHandler();
          }
        });
      });
    }

    // 3. Menu Ideas
    const menuContainer = document.getElementById('menu-list');
    if (menuContainer && ideas.menu_ideas) {
      menuContainer.innerHTML = ideas.menu_ideas.map(m => `<li>${m}</li>`).join('');
    }

    // 4. Activities
    const actContainer = document.getElementById('activities-list');
    if (actContainer && ideas.activities) {
      actContainer.innerHTML = ideas.activities.map(a => `<li>${a}</li>`).join('');
    }

    // 5. Decor Tips
    const decorContainer = document.getElementById('decor-list');
    if (decorContainer && ideas.decor_tips) {
      decorContainer.innerHTML = ideas.decor_tips.map(d => `<li>${d}</li>`).join('');
    }
  }
};
