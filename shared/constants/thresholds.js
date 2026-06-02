/**
 * Clinical thresholds used by both the simulation engine (to drive alerts)
 * and the dashboard (to color-code the chart).
 *
 * Numbers are loosely modeled on resting adult ranges; they're for
 * demonstration, not clinical use.
 */

export const VITALS_THRESHOLDS = {
  heartRate: {
    resting: { min: 60, max: 80 },
    elevated: { min: 80, max: 100 },
    critical: { min: 100, max: 180 },
  },
  respiration: {
    resting: { min: 12, max: 18 },
    elevated: { min: 18, max: 24 },
    critical: { min: 24, max: 40 },
  },
  stress: {
    calm: 30,       // 0..30 — calm
    warning: 60,    // 30..60 — elevated
    critical: 100,  // 60..100 — panic
  },
};

export const SESSION = {
  RAMP_UP_DURATION_MS: 30_000,   // patient sees the calm ramp-up for 30s
  VITALS_INTERVAL_MS: 1_000,     // server emits vitals every second
  VITALS_WINDOW: 30,             // dashboard keeps last 30 samples
  RESET_PROTOCOL_MIN_WAIT_MS: 3_000, // sanitization can't complete instantly
};

export const PATIENT_INFO = {
  // Hard-coded for the demo. In a real product this would come from the EHR.
  name: 'Patient A',
  room: 'Room 4',
  sessionId: 'session-1',
};
