import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext.jsx';
import { Palette, Utensils, Music, Lightbulb, Star, ChevronDown, ChevronUp } from 'lucide-react';

function ColorSwatch({ color, index }) {
  const [showHex, setShowHex] = useState(false);
  return (
    <button
      className="color-swatch"
      style={{ backgroundColor: color }}
      onClick={() => setShowHex((v) => !v)}
      onMouseEnter={() => setShowHex(true)}
      onMouseLeave={() => setShowHex(false)}
      aria-label={`Color: ${color}`}
      title={color}
    >
      {showHex && (
        <span className="hex-tooltip" aria-hidden="true">{color}</span>
      )}
    </button>
  );
}

function ColorPaletteCard({ palette }) {
  return (
    <div className="palette-card">
      <div className="palette-swatches" role="list" aria-label={`Color palette: ${palette.name}`}>
        {(palette.colors || []).map((color, i) => (
          <div key={i} role="listitem">
            <ColorSwatch color={color} index={i} />
          </div>
        ))}
      </div>
      <div className="palette-info">
        <h4 className="palette-name">{palette.name}</h4>
        {palette.mood && <p className="palette-mood">{palette.mood}</p>}
      </div>
    </div>
  );
}

function ThemeCard({ theme }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="theme-card">
      <div className="theme-gradient" aria-hidden="true" />
      <div className="theme-content">
        <div className="theme-header">
          <Star size={16} className="theme-star" aria-hidden="true" />
          <h4 className="theme-name">{theme.name}</h4>
          <button
            className="theme-expand-btn"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${theme.name} details`}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
        {expanded && (
          <p className="theme-description">{theme.description}</p>
        )}
        {!expanded && (
          <p className="theme-preview">{theme.description?.slice(0, 80)}…</p>
        )}
      </div>
    </div>
  );
}

function IdeaList({ items, icon, emptyText }) {
  return (
    <ul className="idea-list" role="list">
      {(items || []).length === 0 ? (
        <li className="idea-empty">{emptyText}</li>
      ) : (
        (items || []).map((item, i) => (
          <li key={i} className="idea-item">
            <span className="idea-bullet" aria-hidden="true">{icon}</span>
            <span>{item}</span>
          </li>
        ))
      )}
    </ul>
  );
}

export default function IdeasTab() {
  const { state } = useAppContext();
  const { plan } = state;
  const ideas = plan?.personalizedIdeas;

  if (!plan || !ideas) return null;

  return (
    <section aria-labelledby="ideas-tab-heading" className="tab-content">
      <h2 id="ideas-tab-heading" className="sr-only">Ideas & Inspiration</h2>

      {/* Themes */}
      <div className="ideas-section">
        <div className="ideas-section-header">
          <Lightbulb size={20} aria-hidden="true" className="section-icon" />
          <h3 className="ideas-section-title">Theme Concepts</h3>
        </div>
        <div className="themes-grid" role="list" aria-label="Theme concepts">
          {(ideas.themes || []).map((theme, i) => (
            <div key={i} role="listitem">
              <ThemeCard theme={theme} />
            </div>
          ))}
        </div>
      </div>

      {/* Color Palettes */}
      <div className="ideas-section">
        <div className="ideas-section-header">
          <Palette size={20} aria-hidden="true" className="section-icon" />
          <h3 className="ideas-section-title">Color Palettes</h3>
          <span className="ideas-hint">(click swatches to see hex codes)</span>
        </div>
        <div className="palettes-grid" role="list" aria-label="Color palettes">
          {(ideas.colorPalettes || []).map((palette, i) => (
            <div key={i} role="listitem">
              <ColorPaletteCard palette={palette} />
            </div>
          ))}
        </div>
      </div>

      {/* Two-column grid for lists */}
      <div className="ideas-two-col">
        {/* Menu Ideas */}
        <div className="ideas-section">
          <div className="ideas-section-header">
            <Utensils size={20} aria-hidden="true" className="section-icon" />
            <h3 className="ideas-section-title">Menu Ideas</h3>
          </div>
          <IdeaList items={ideas.menuIdeas} icon="🍽️" emptyText="No menu ideas generated." />
        </div>

        {/* Activities */}
        <div className="ideas-section">
          <div className="ideas-section-header">
            <Music size={20} aria-hidden="true" className="section-icon" />
            <h3 className="ideas-section-title">Guest Activities</h3>
          </div>
          <IdeaList items={ideas.activities} icon="🎊" emptyText="No activities generated." />
        </div>

        {/* Decor Tips */}
        {ideas.decorTips && ideas.decorTips.length > 0 && (
          <div className="ideas-section">
            <div className="ideas-section-header">
              <Star size={20} aria-hidden="true" className="section-icon" />
              <h3 className="ideas-section-title">Décor Tips</h3>
            </div>
            <IdeaList items={ideas.decorTips} icon="✨" emptyText="" />
          </div>
        )}

        {/* Entertainment */}
        {ideas.entertainmentIdeas && ideas.entertainmentIdeas.length > 0 && (
          <div className="ideas-section">
            <div className="ideas-section-header">
              <Music size={20} aria-hidden="true" className="section-icon" />
              <h3 className="ideas-section-title">Entertainment Ideas</h3>
            </div>
            <IdeaList items={ideas.entertainmentIdeas} icon="🎵" emptyText="" />
          </div>
        )}
      </div>
    </section>
  );
}
