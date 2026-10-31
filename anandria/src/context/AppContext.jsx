import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { STORAGE_KEYS, TABS } from '../utils/constants.js';
import { saveToStorage, loadFromStorage } from '../utils/storage.js';

// ─── Initial State ────────────────────────────────────────────────────────────

const initialFormData = {
  eventType: 'Wedding',
  eventName: '',
  targetDate: '',
  guestCount: '',
  totalBudget: '',
  currency: 'INR',
  themeKeywords: '',
  specialRequirements: '',
  location: '',
};

const initialState = {
  // Form
  formData: loadFromStorage(STORAGE_KEYS.FORM_DATA, initialFormData),
  formErrors: {},
  
  // Plan
  plan: loadFromStorage(STORAGE_KEYS.EVENT_PLAN, null),
  isGenerating: false,
  isRefining: false,
  generationError: null,
  
  // Dashboard
  activeTab: loadFromStorage(STORAGE_KEYS.ACTIVE_TAB, TABS.BUDGET),
  
  // UI
  showWizard: !loadFromStorage(STORAGE_KEYS.EVENT_PLAN, null),
  showDiagnostics: false,
  showExportMenu: false,
  lastGeneratedKey: null,
  lastApiCallTime: 0,
  
  // Co-pilot
  refinementPrompt: '',
  
  // Vendor filters
  vendorFilter: '',
  vendorStatusFilter: 'All',
};

// ─── Action Types ─────────────────────────────────────────────────────────────

export const ACTIONS = {
  SET_FORM_DATA: 'SET_FORM_DATA',
  SET_FORM_ERRORS: 'SET_FORM_ERRORS',
  SET_PLAN: 'SET_PLAN',
  SET_GENERATING: 'SET_GENERATING',
  SET_REFINING: 'SET_REFINING',
  SET_GENERATION_ERROR: 'SET_GENERATION_ERROR',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  TOGGLE_WIZARD: 'TOGGLE_WIZARD',
  TOGGLE_DIAGNOSTICS: 'TOGGLE_DIAGNOSTICS',
  TOGGLE_EXPORT_MENU: 'TOGGLE_EXPORT_MENU',
  UPDATE_BUDGET_ITEM: 'UPDATE_BUDGET_ITEM',
  TOGGLE_TIMELINE_ITEM: 'TOGGLE_TIMELINE_ITEM',
  SET_VENDOR_STATUS: 'SET_VENDOR_STATUS',
  SET_VENDOR_FILTER: 'SET_VENDOR_FILTER',
  SET_VENDOR_STATUS_FILTER: 'SET_VENDOR_STATUS_FILTER',
  SET_REFINEMENT_PROMPT: 'SET_REFINEMENT_PROMPT',
  SET_LAST_API_CALL: 'SET_LAST_API_CALL',
  CLEAR_PLAN: 'CLEAR_PLAN',
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_FORM_DATA:
      return { ...state, formData: { ...state.formData, ...action.payload } };
    
    case ACTIONS.SET_FORM_ERRORS:
      return { ...state, formErrors: action.payload };
    
    case ACTIONS.SET_PLAN:
      return { ...state, plan: action.payload, generationError: null };
    
    case ACTIONS.SET_GENERATING:
      return { ...state, isGenerating: action.payload, generationError: null };
    
    case ACTIONS.SET_REFINING:
      return { ...state, isRefining: action.payload };
    
    case ACTIONS.SET_GENERATION_ERROR:
      return { ...state, generationError: action.payload, isGenerating: false, isRefining: false };
    
    case ACTIONS.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload };
    
    case ACTIONS.TOGGLE_WIZARD:
      return { ...state, showWizard: action.payload ?? !state.showWizard };
    
    case ACTIONS.TOGGLE_DIAGNOSTICS:
      return { ...state, showDiagnostics: !state.showDiagnostics };
    
    case ACTIONS.TOGGLE_EXPORT_MENU:
      return { ...state, showExportMenu: !state.showExportMenu };
    
    case ACTIONS.UPDATE_BUDGET_ITEM: {
      if (!state.plan) return state;
      const updatedBreakdown = state.plan.budgetBreakdown.map((item) =>
        item.id === action.payload.id ? { ...item, ...action.payload.updates } : item
      );
      return { ...state, plan: { ...state.plan, budgetBreakdown: updatedBreakdown } };
    }
    
    case ACTIONS.TOGGLE_TIMELINE_ITEM: {
      if (!state.plan) return state;
      const updatedTimeline = state.plan.timeline.map((item) =>
        item.id === action.payload ? { ...item, completed: !item.completed } : item
      );
      return { ...state, plan: { ...state.plan, timeline: updatedTimeline } };
    }
    
    case ACTIONS.SET_VENDOR_STATUS: {
      if (!state.plan) return state;
      const updatedVendors = state.plan.vendorChecklist.map((item) =>
        item.id === action.payload.id ? { ...item, status: action.payload.status } : item
      );
      return { ...state, plan: { ...state.plan, vendorChecklist: updatedVendors } };
    }
    
    case ACTIONS.SET_VENDOR_FILTER:
      return { ...state, vendorFilter: action.payload };
    
    case ACTIONS.SET_VENDOR_STATUS_FILTER:
      return { ...state, vendorStatusFilter: action.payload };
    
    case ACTIONS.SET_REFINEMENT_PROMPT:
      return { ...state, refinementPrompt: action.payload };
    
    case ACTIONS.SET_LAST_API_CALL:
      return { ...state, lastApiCallTime: action.payload };
    
    case ACTIONS.CLEAR_PLAN:
      return {
        ...state,
        plan: null,
        showWizard: true,
        formData: initialFormData,
        formErrors: {},
        activeTab: TABS.BUDGET,
      };
    
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Persist key state to localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.FORM_DATA, state.formData);
  }, [state.formData]);

  useEffect(() => {
    if (state.plan) saveToStorage(STORAGE_KEYS.EVENT_PLAN, state.plan);
  }, [state.plan]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ACTIVE_TAB, state.activeTab);
  }, [state.activeTab]);

  const updateFormData = useCallback((updates) => {
    dispatch({ type: ACTIONS.SET_FORM_DATA, payload: updates });
  }, []);

  const setActiveTab = useCallback((tab) => {
    dispatch({ type: ACTIONS.SET_ACTIVE_TAB, payload: tab });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, updateFormData, setActiveTab }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
