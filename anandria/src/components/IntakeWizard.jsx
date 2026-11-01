import React, { useState, useId } from 'react';
import { useAppContext, ACTIONS } from '../context/AppContext.jsx';
import { useEventPlan } from '../hooks/useEventPlan.js';
import { EVENT_TYPES, CURRENCIES } from '../utils/constants.js';
import { Calendar, Users, Wallet, MapPin, Sparkles, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';

const steps = [
  { id: 'type', label: 'Event Type' },
  { id: 'details', label: 'Event Details' },
  { id: 'budget', label: 'Budget' },
  { id: 'vibe', label: 'Vibe & Theme' },
];

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="field-error" aria-live="polite">
      <AlertCircle size={14} aria-hidden="true" />
      {message}
    </p>
  );
}

function StepIndicator({ currentStep, totalSteps }) {
  return (
    <div className="step-indicator" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={`Step ${currentStep + 1} of ${totalSteps}`}>
      {steps.map((step, i) => (
        <div key={step.id} className={`step-dot ${i <= currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}`}>
          <span className="step-num">{i + 1}</span>
          <span className="step-label">{step.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function IntakeWizard() {
  const { state, dispatch, updateFormData } = useAppContext();
  const { generate } = useEventPlan();
  const { formData, formErrors, isGenerating } = state;
  const [currentStep, setCurrentStep] = useState(0);
  const prefixId = useId();

  const id = (field) => `${prefixId}-${field}`;
  const errId = (field) => `${prefixId}-${field}-err`;

  function handleFieldChange(field, value) {
    updateFormData({ [field]: value });
    // Clear specific field error on change
    if (formErrors[field]) {
      dispatch({ type: ACTIONS.SET_FORM_ERRORS, payload: { ...formErrors, [field]: undefined } });
    }
  }

  // Validate current step before advancing
  function canAdvance() {
    if (currentStep === 0) return !!formData.eventType;
    if (currentStep === 1) return formData.eventName && formData.targetDate && formData.guestCount;
    if (currentStep === 2) return formData.totalBudget && formData.currency;
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await generate(formData);
  }

  // Quick-fill demo data
  function fillDemo() {
    const d = new Date();
    d.setMonth(d.getMonth() + 8);
    updateFormData({
      eventType: 'Wedding',
      eventName: 'Priya & Arjun Wedding',
      targetDate: d.toISOString().split('T')[0],
      guestCount: '250',
      totalBudget: '2500000',
      currency: 'INR',
      themeKeywords: 'royal, floral, traditional, elegant',
      specialRequirements: 'Jain-friendly catering required, 20% vegan options',
      location: 'Mumbai, India',
    });
  }

  const [minDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="wizard-overlay" role="dialog" aria-modal="true" aria-label="Event Planning Wizard">
      <div className="wizard-container">
        {/* Header */}
        <header className="wizard-header">
          <div className="wizard-logo">
            <span className="logo-sparkle" aria-hidden="true">✨</span>
            <span className="logo-text">ANANDRIA</span>
          </div>
          <p className="wizard-subtitle">Let's plan your perfect event</p>
          <StepIndicator currentStep={currentStep} totalSteps={steps.length} />
        </header>

        <form onSubmit={handleSubmit} noValidate>
          {/* Step 0: Event Type */}
          {currentStep === 0 && (
            <section aria-labelledby="step-type-heading">
              <h2 id="step-type-heading" className="step-heading">What are you celebrating?</h2>
              <div className="event-type-grid" role="radiogroup" aria-label="Event type selection">
                {Object.entries(EVENT_TYPES).map(([key, label]) => {
                  const icons = { WEDDING: '💍', BIRTHDAY: '🎂', COMMUNITY: '🎉' };
                  return (
                    <label key={key} className={`event-type-card ${formData.eventType === label ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="eventType"
                        value={label}
                        checked={formData.eventType === label}
                        onChange={() => handleFieldChange('eventType', label)}
                        className="sr-only"
                      />
                      <span className="event-icon" aria-hidden="true">{icons[key]}</span>
                      <span className="event-label">{label}</span>
                    </label>
                  );
                })}
              </div>
              <button type="button" className="demo-btn" onClick={fillDemo}>
                <Sparkles size={16} aria-hidden="true" /> Fill with Demo Data
              </button>
            </section>
          )}

          {/* Step 1: Event Details */}
          {currentStep === 1 && (
            <section aria-labelledby="step-details-heading">
              <h2 id="step-details-heading" className="step-heading">Event Details</h2>
              <div className="form-group">
                <label htmlFor={id('eventName')} className="form-label">
                  Event Name <span aria-hidden="true" className="required">*</span>
                </label>
                <input
                  id={id('eventName')}
                  type="text"
                  className={`form-input ${formErrors.eventName ? 'error' : ''}`}
                  placeholder="e.g. Priya & Arjun Wedding"
                  value={formData.eventName}
                  onChange={(e) => handleFieldChange('eventName', e.target.value)}
                  maxLength={100}
                  aria-required="true"
                  aria-describedby={formErrors.eventName ? errId('eventName') : undefined}
                  aria-invalid={!!formErrors.eventName}
                />
                <FieldError id={errId('eventName')} message={formErrors.eventName} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={id('targetDate')} className="form-label">
                    <Calendar size={16} aria-hidden="true" /> Target Date <span aria-hidden="true" className="required">*</span>
                  </label>
                  <input
                    id={id('targetDate')}
                    type="date"
                    className={`form-input ${formErrors.targetDate ? 'error' : ''}`}
                    value={formData.targetDate}
                    min={minDate}
                    onChange={(e) => handleFieldChange('targetDate', e.target.value)}
                    aria-required="true"
                    aria-describedby={formErrors.targetDate ? errId('targetDate') : undefined}
                    aria-invalid={!!formErrors.targetDate}
                  />
                  <FieldError id={errId('targetDate')} message={formErrors.targetDate} />
                </div>

                <div className="form-group">
                  <label htmlFor={id('guestCount')} className="form-label">
                    <Users size={16} aria-hidden="true" /> Guest Count <span aria-hidden="true" className="required">*</span>
                  </label>
                  <input
                    id={id('guestCount')}
                    type="number"
                    className={`form-input ${formErrors.guestCount ? 'error' : ''}`}
                    placeholder="e.g. 150"
                    value={formData.guestCount}
                    min="1"
                    max="10000"
                    onChange={(e) => handleFieldChange('guestCount', e.target.value)}
                    aria-required="true"
                    aria-describedby={formErrors.guestCount ? errId('guestCount') : undefined}
                    aria-invalid={!!formErrors.guestCount}
                  />
                  <FieldError id={errId('guestCount')} message={formErrors.guestCount} />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor={id('location')} className="form-label">
                  <MapPin size={16} aria-hidden="true" /> Location / Cultural Style
                </label>
                <input
                  id={id('location')}
                  type="text"
                  className="form-input"
                  placeholder="e.g. Mumbai, India – Maharashtrian style"
                  value={formData.location}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                  maxLength={100}
                />
              </div>
            </section>
          )}

          {/* Step 2: Budget */}
          {currentStep === 2 && (
            <section aria-labelledby="step-budget-heading">
              <h2 id="step-budget-heading" className="step-heading">Budget Planning</h2>
              <div className="form-row">
                <div className="form-group" style={{ flex: '0 0 140px' }}>
                  <label htmlFor={id('currency')} className="form-label">
                    Currency
                  </label>
                  <select
                    id={id('currency')}
                    className="form-input"
                    value={formData.currency}
                    onChange={(e) => handleFieldChange('currency', e.target.value)}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} {c.symbol}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor={id('totalBudget')} className="form-label">
                    <Wallet size={16} aria-hidden="true" /> Total Budget <span aria-hidden="true" className="required">*</span>
                  </label>
                  <input
                    id={id('totalBudget')}
                    type="number"
                    className={`form-input ${formErrors.totalBudget ? 'error' : ''}`}
                    placeholder="e.g. 2500000"
                    value={formData.totalBudget}
                    min="1"
                    onChange={(e) => handleFieldChange('totalBudget', e.target.value)}
                    aria-required="true"
                    aria-describedby={formErrors.totalBudget ? errId('totalBudget') : undefined}
                    aria-invalid={!!formErrors.totalBudget}
                  />
                  <FieldError id={errId('totalBudget')} message={formErrors.totalBudget} />
                </div>
              </div>
              {formData.totalBudget && formData.guestCount && (
                <div className="budget-hint" aria-live="polite">
                  ≈ {CURRENCIES.find((c) => c.code === formData.currency)?.symbol}
                  {Math.round(parseFloat(formData.totalBudget) / parseInt(formData.guestCount, 10)).toLocaleString()} per guest
                </div>
              )}
            </section>
          )}

          {/* Step 3: Vibe & Theme */}
          {currentStep === 3 && (
            <section aria-labelledby="step-vibe-heading">
              <h2 id="step-vibe-heading" className="step-heading">Vibe & Preferences</h2>
              <div className="form-group">
                <label htmlFor={id('themeKeywords')} className="form-label">
                  Theme / Vibe Keywords
                </label>
                <input
                  id={id('themeKeywords')}
                  type="text"
                  className={`form-input ${formErrors.themeKeywords ? 'error' : ''}`}
                  placeholder="e.g. royal, floral, traditional, outdoor"
                  value={formData.themeKeywords}
                  onChange={(e) => handleFieldChange('themeKeywords', e.target.value)}
                  maxLength={200}
                  aria-describedby={formErrors.themeKeywords ? errId('themeKeywords') : `${id('themeKeywords')}-hint`}
                />
                <span id={`${id('themeKeywords')}-hint`} className="field-hint">
                  Comma-separated keywords to personalize your plan
                </span>
                <FieldError id={errId('themeKeywords')} message={formErrors.themeKeywords} />
              </div>
              <div className="form-group">
                <label htmlFor={id('specialRequirements')} className="form-label">
                  Dietary / Special Requirements
                </label>
                <textarea
                  id={id('specialRequirements')}
                  className={`form-input form-textarea ${formErrors.specialRequirements ? 'error' : ''}`}
                  placeholder="e.g. Jain-friendly menu, 20% vegan options, wheelchair accessibility"
                  value={formData.specialRequirements}
                  onChange={(e) => handleFieldChange('specialRequirements', e.target.value)}
                  maxLength={500}
                  rows={3}
                  aria-describedby={formErrors.specialRequirements ? errId('specialRequirements') : undefined}
                />
                <FieldError id={errId('specialRequirements')} message={formErrors.specialRequirements} />
              </div>

              {/* Global error display */}
              {state.generationError && (
                <div className="error-banner" role="alert" aria-live="assertive">
                  <AlertCircle size={18} aria-hidden="true" />
                  <span>{state.generationError}</span>
                </div>
              )}
            </section>
          )}

          {/* Navigation */}
          <div className="wizard-nav">
            {currentStep > 0 && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setCurrentStep((s) => s - 1)}
                disabled={isGenerating}
              >
                ← Back
              </button>
            )}
            <div style={{ flex: 1 }} />
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={!canAdvance()}
                aria-disabled={!canAdvance()}
              >
                Next <ChevronRight size={18} aria-hidden="true" />
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-generate"
                disabled={isGenerating}
                aria-busy={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="spin" aria-hidden="true" />
                    <span>Generating your plan…</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} aria-hidden="true" />
                    <span>Generate My Plan</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Generating overlay */}
        {isGenerating && (
          <div className="generating-overlay" aria-live="polite" role="status">
            <div className="generating-content">
              <div className="generating-spinner" aria-hidden="true" />
              <p className="generating-text">ANANDRIA is crafting your perfect event plan…</p>
              <p className="generating-sub">Analyzing budget • Building timeline • Curating ideas</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
