import { THERAPY_STATE } from '../../../shared/types/therapyEvents.js';
import { VITALS_THRESHOLDS } from '../../../shared/constants/thresholds.js';

/**
 * Vitals generator. Produces a stream of (heartRate, respiration, stress)
 * samples that drift like real physiology — slowly toward a target dictated
 * by the current therapy state, with small random jitter.
 *
 * The point isn't medical realism; it's a believable demo. Watch the dashboard
 * and you should see numbers move the way a person's actually would: not
 * teleporting, not perfectly steady.
 */

// Where vitals want to settle for each therapy state.
const TARGETS = {
  [THERAPY_STATE.IDLE]:       { hr: 72, resp: 15, stress: 25 },
  [THERAPY_STATE.RAMP_UP]:    { hr: 68, resp: 14, stress: 20 },
  [THERAPY_STATE.ACTIVE]:     { hr: 64, resp: 12, stress: 15 },
  [THERAPY_STATE.PAUSED]:     { hr: 95, resp: 22, stress: 80 },
  [THERAPY_STATE.ENDED]:      { hr: 75, resp: 16, stress: 30 },
  [THERAPY_STATE.SANITIZING]: { hr: 72, resp: 15, stress: 25 },
  [THERAPY_STATE.READY]:      { hr: 72, resp: 15, stress: 25 },
};

// How fast vitals drift toward the target (0..1 per tick). Lower = slower.
const DRIFT_RATE = 0.08;

// Random jitter as a fraction of the value.
const JITTER = 0.03;

export function createVitalsGenerator() {
  // Starting state: relaxed but awake.
  let hr = 72;
  let resp = 15;
  let stress = 25;

  // External stress injection (from the nurse's "Inject Stress" button).
  // Decays over time so the effect is felt but not permanent.
  let stressBoost = 0;

  function jitter(value) {
    return value * (1 + (Math.random() - 0.5) * 2 * JITTER);
  }

  function driftToward(current, target) {
    return current + (target - current) * DRIFT_RATE;
  }

  return {
    /**
     * Get the next vitals sample given the current therapy state.
     */
    next(therapyState) {
      const target = TARGETS[therapyState] || TARGETS[THERAPY_STATE.IDLE];

      // Apply the stress boost to all three vitals, then decay it.
      const boostedHr = target.hr + stressBoost * 0.4;
      const boostedResp = target.resp + stressBoost * 0.1;
      const boostedStress = Math.min(100, target.stress + stressBoost);
      stressBoost *= 0.85; // decay

      hr = jitter(driftToward(hr, boostedHr));
      resp = jitter(driftToward(resp, boostedResp));
      stress = jitter(driftToward(stress, boostedStress));

      // Clamp to physiologically plausible ranges.
      hr = Math.max(40, Math.min(200, hr));
      resp = Math.max(6, Math.min(40, resp));
      stress = Math.max(0, Math.min(100, stress));

      return {
        heartRate: Math.round(hr),
        respiration: Math.round(resp * 10) / 10,
        stress: Math.round(stress),
        therapyState,
        timestamp: Date.now(),
      };
    },

    /**
     * Inject a stress spike. Magnitude is roughly the bpm bump you'll see
     * over the next few seconds before it decays.
     */
    injectStress(magnitude = 40) {
      stressBoost += magnitude;
    },

    /**
     * Classify a sample for alerting purposes.
     */
    classify(sample) {
      const t = VITALS_THRESHOLDS;
      if (
        sample.heartRate > t.heartRate.elevated.max ||
        sample.stress > t.stress.warning
      ) {
        return 'CRITICAL';
      }
      if (
        sample.heartRate > t.heartRate.resting.max ||
        sample.stress > t.stress.calm
      ) {
        return 'WARNING';
      }
      return 'INFO';
    },
  };
}
