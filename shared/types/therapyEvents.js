/**
 * SENSORA therapy event schema.
 *
 * These are the events that flow over the WebSocket between the patient app,
 * the server, and the nurse dashboard. Keep this file in sync across all three
 * apps — it's the contract.
 *
 * Conventions:
 *  - Events from patient → server use the `patient:` prefix.
 *  - Events from nurse → server use the `nurse:` prefix.
 *  - Events from server → all clients use the `session:` or `vitals:` prefix.
 */

export const EVENTS = {
  // Patient → server
  PATIENT_JOIN: 'patient:join',
  PATIENT_START: 'patient:start_therapy',
  PATIENT_END: 'patient:end_therapy',
  PATIENT_PANIC: 'patient:panic',
  PATIENT_RESET: 'patient:reset',

  // Nurse → server
  NURSE_JOIN: 'nurse:join',
  NURSE_INJECT_STRESS: 'nurse:inject_stress',
  NURSE_VERIFY_SANITIZATION: 'nurse:verify_sanitization',

  // Server → all
  VITALS_UPDATE: 'vitals:update',
  SESSION_STATE: 'session:state',
  ALERT: 'session:alert',
};

/**
 * Therapy state machine values.
 *  IDLE        — no patient connected
 *  RAMP_UP     — first 30 seconds, slowly fading in environment
 *  ACTIVE      — full therapy in progress
 *  PAUSED      — patient triggered grounding mode
 *  ENDED       — session ended, device awaiting sanitization
 *  SANITIZING  — nurse acknowledged, sanitization in progress
 *  READY       — device ready for next patient (transitions back to IDLE)
 */
export const THERAPY_STATE = {
  IDLE: 'IDLE',
  RAMP_UP: 'RAMP_UP',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  ENDED: 'ENDED',
  SANITIZING: 'SANITIZING',
  READY: 'READY',
};

/**
 * Alert severity levels for the nurse dashboard.
 */
export const ALERT_LEVEL = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
};

/**
 * @typedef {Object} VitalsPayload
 * @property {number} heartRate     — bpm
 * @property {number} respiration   — breaths/min
 * @property {number} stress        — 0..100 normalized stress index
 * @property {string} therapyState  — one of THERAPY_STATE
 * @property {number} timestamp     — ms since epoch
 */

/**
 * @typedef {Object} AlertPayload
 * @property {string} level    — one of ALERT_LEVEL
 * @property {string} message  — human-readable
 * @property {string} room     — e.g. "Room 4"
 * @property {number} timestamp
 */
