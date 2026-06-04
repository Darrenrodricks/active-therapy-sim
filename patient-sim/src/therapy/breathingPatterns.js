/**
 * Named breathing patterns, each an array of phases.
 *
 * Every phase:
 *   { type: 'inhale' | 'hold' | 'exhale' | 'holdEmpty', seconds, label }
 *
 * "seconds" is the nominal duration at 1.0× speed. The pacer hook multiplies
 * by the user's chosen speed factor at runtime.
 */

export const PATTERNS = {
  /**
   * Coherent / resonance breathing — equal inhale and exhale at ~6 breaths/min.
   * Maximises HRV and is the clinically supported default for calming.
   */
  coherent: [
    { type: 'inhale',  seconds: 5, label: 'Breathe in' },
    { type: 'exhale',  seconds: 5, label: 'Breathe out' },
  ],

  /**
   * Box breathing — used in military/stress-inoculation contexts.
   * All four phases equal duration.
   */
  box: [
    { type: 'inhale',    seconds: 4, label: 'Breathe in' },
    { type: 'hold',      seconds: 4, label: 'Hold' },
    { type: 'exhale',    seconds: 4, label: 'Breathe out' },
    { type: 'holdEmpty', seconds: 4, label: 'Rest' },
  ],

  /**
   * 4-7-8 relaxing breath — longer exhale activates the parasympathetic
   * nervous system more aggressively than equal-ratio patterns.
   */
  relaxing: [
    { type: 'inhale', seconds: 4, label: 'Breathe in' },
    { type: 'hold',   seconds: 7, label: 'Hold' },
    { type: 'exhale', seconds: 8, label: 'Breathe out' },
  ],

  /**
   * Gentle — no holds, slightly longer exhale. A comfort-first fallback
   * for patients who find breath-holds distressing (common with this
   * population — comfort beats intensity).
   */
  gentle: [
    { type: 'inhale', seconds: 4, label: 'Breathe in' },
    { type: 'exhale', seconds: 6, label: 'Breathe out' },
  ],
};

/** Human-friendly labels for the pattern picker. */
export const PATTERN_LABELS = {
  coherent: 'Coherent',
  box: 'Box',
  relaxing: '4-7-8',
  gentle: 'Gentle',
};

/** The default pattern key. */
export const DEFAULT_PATTERN = 'coherent';
