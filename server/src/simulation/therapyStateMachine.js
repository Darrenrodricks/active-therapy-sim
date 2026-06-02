import { THERAPY_STATE } from '../../../shared/types/therapyEvents.js';
import { log } from '../utils/logger.js';

/**
 * Legal transitions for the therapy state machine.
 *
 *   IDLE → RAMP_UP → ACTIVE → ENDED → SANITIZING → READY → IDLE
 *                     ↓
 *                   PAUSED → ACTIVE   (patient resumes)
 *                          → ENDED    (nurse ends from paused)
 */
const TRANSITIONS = {
  [THERAPY_STATE.IDLE]: [THERAPY_STATE.RAMP_UP],
  [THERAPY_STATE.RAMP_UP]: [THERAPY_STATE.ACTIVE, THERAPY_STATE.PAUSED, THERAPY_STATE.ENDED],
  [THERAPY_STATE.ACTIVE]: [THERAPY_STATE.PAUSED, THERAPY_STATE.ENDED],
  [THERAPY_STATE.PAUSED]: [THERAPY_STATE.ACTIVE, THERAPY_STATE.ENDED],
  [THERAPY_STATE.ENDED]: [THERAPY_STATE.SANITIZING, THERAPY_STATE.IDLE],
  [THERAPY_STATE.SANITIZING]: [THERAPY_STATE.READY, THERAPY_STATE.IDLE],
  [THERAPY_STATE.READY]: [THERAPY_STATE.IDLE],
};

export function createStateMachine(initial = THERAPY_STATE.IDLE) {
  let current = initial;
  const listeners = new Set();

  return {
    get state() {
      return current;
    },

    transition(next) {
      const allowed = TRANSITIONS[current] || [];
      if (!allowed.includes(next)) {
        log.warn(`Illegal transition: ${current} → ${next}`);
        return false;
      }
      const prev = current;
      current = next;
      log.state(`Therapy state: ${prev} → ${next}`);
      listeners.forEach((fn) => fn(next, prev));
      return true;
    },

    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
