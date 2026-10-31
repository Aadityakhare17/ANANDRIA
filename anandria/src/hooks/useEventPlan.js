import { useCallback, useRef } from 'react';
import { useAppContext, ACTIONS } from '../context/AppContext.jsx';
import { generateEventPlan, refinePlan } from '../services/geminiService.js';
import { validateEventForm, validateRefinementPrompt } from '../utils/sanitize.js';
import { RATE_LIMIT_MS, STORAGE_KEYS } from '../utils/constants.js';
import { generateCacheKey, saveToStorage, removeFromStorage } from '../utils/storage.js';

export function useEventPlan() {
  const { state, dispatch } = useAppContext();
  const generatingRef = useRef(false);

  const generate = useCallback(async (formData) => {
    // Rate limiting
    const now = Date.now();
    if (now - state.lastApiCallTime < RATE_LIMIT_MS) {
      const wait = Math.ceil((RATE_LIMIT_MS - (now - state.lastApiCallTime)) / 1000);
      dispatch({
        type: ACTIONS.SET_GENERATION_ERROR,
        payload: `Please wait ${wait} second${wait > 1 ? 's' : ''} before generating again.`,
      });
      return false;
    }

    if (generatingRef.current) return false;

    // Validate inputs
    const { valid, errors, sanitized } = validateEventForm(formData);
    if (!valid) {
      dispatch({ type: ACTIONS.SET_FORM_ERRORS, payload: errors });
      return false;
    }

    dispatch({ type: ACTIONS.SET_FORM_ERRORS, payload: {} });

    // Check cache
    const cacheKey = generateCacheKey(sanitized);
    if (state.lastGeneratedKey === cacheKey && state.plan) {
      // Same inputs, use cached plan
      dispatch({ type: ACTIONS.TOGGLE_WIZARD, payload: false });
      return true;
    }

    generatingRef.current = true;
    dispatch({ type: ACTIONS.SET_GENERATING, payload: true });
    dispatch({ type: ACTIONS.SET_LAST_API_CALL, payload: now });

    try {
      const plan = await generateEventPlan(sanitized);
      dispatch({ type: ACTIONS.SET_PLAN, payload: plan });
      dispatch({ type: ACTIONS.TOGGLE_WIZARD, payload: false });
      saveToStorage(STORAGE_KEYS.EVENT_PLAN, plan);
      return true;
    } catch (err) {
      dispatch({
        type: ACTIONS.SET_GENERATION_ERROR,
        payload: err.message || 'Failed to generate plan. Please try again.',
      });
      return false;
    } finally {
      dispatch({ type: ACTIONS.SET_GENERATING, payload: false });
      generatingRef.current = false;
    }
  }, [state.lastApiCallTime, state.lastGeneratedKey, state.plan, dispatch]);

  const refine = useCallback(async (promptText) => {
    if (!state.plan) return false;

    const { valid, error, sanitized: cleanPrompt } = validateRefinementPrompt(promptText);
    if (!valid) {
      dispatch({ type: ACTIONS.SET_GENERATION_ERROR, payload: error });
      return false;
    }

    const now = Date.now();
    if (now - state.lastApiCallTime < RATE_LIMIT_MS) {
      const wait = Math.ceil((RATE_LIMIT_MS - (now - state.lastApiCallTime)) / 1000);
      dispatch({
        type: ACTIONS.SET_GENERATION_ERROR,
        payload: `Please wait ${wait}s before refining.`,
      });
      return false;
    }

    dispatch({ type: ACTIONS.SET_REFINING, payload: true });
    dispatch({ type: ACTIONS.SET_LAST_API_CALL, payload: now });

    try {
      const refined = await refinePlan(state.plan, cleanPrompt, state.formData);
      dispatch({ type: ACTIONS.SET_PLAN, payload: refined });
      dispatch({ type: ACTIONS.SET_REFINEMENT_PROMPT, payload: '' });
      saveToStorage(STORAGE_KEYS.EVENT_PLAN, refined);
      return true;
    } catch (err) {
      dispatch({
        type: ACTIONS.SET_GENERATION_ERROR,
        payload: err.message || 'Refinement failed. Please try again.',
      });
      return false;
    } finally {
      dispatch({ type: ACTIONS.SET_REFINING, payload: false });
    }
  }, [state.plan, state.formData, state.lastApiCallTime, dispatch]);

  const clearPlan = useCallback(() => {
    removeFromStorage(STORAGE_KEYS.EVENT_PLAN);
    dispatch({ type: ACTIONS.CLEAR_PLAN });
  }, [dispatch]);

  return { generate, refine, clearPlan };
}
