import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Smoothstep easing — identical to the one in useRampUp so the visual
 * language is consistent. Maps a linear 0→1 input to a gentle S-curve.
 */
function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

/**
 * Drives a breathing pacer through an array of phases on a rAF loop.
 *
 * @param {Array}   pattern  - Phase objects from breathingPatterns.js.
 * @param {number}  speed    - Multiplier (0.5–1.5). 1.0 = pattern's nominal seconds.
 * @param {boolean} active   - Only advance when true (gate to sceneActive).
 *
 * @returns {{ phase, phaseProgress, breathScale, cycleCount }}
 *   - phase:         current { type, label } (safe to read even when paused)
 *   - phaseProgress: 0→1 within the current phase
 *   - breathScale:   0→1 representing lung fullness (smoothstepped)
 *   - cycleCount:    full cycles completed since last pattern/speed change
 */
export function useBreathPacer(pattern, speed = 1.0, active = true) {
  const [state, setState] = useState(() => ({
    phase: pattern[0],
    phaseProgress: 0,
    breathScale: 0,
    cycleCount: 0,
  }));

  // Keep mutable refs so the rAF callback always reads the latest values
  // without re-registering the effect.
  const patternRef = useRef(pattern);
  const speedRef = useRef(speed);
  const activeRef = useRef(active);

  // Track position in the pattern.
  const phaseIndexRef = useRef(0);
  const phaseStartRef = useRef(null);  // performance.now() when phase began
  const cycleCountRef = useRef(0);
  const rafRef = useRef(null);

  // When the pattern itself changes, reset to the first phase.
  useEffect(() => {
    patternRef.current = pattern;
    phaseIndexRef.current = 0;
    phaseStartRef.current = null;
    cycleCountRef.current = 0;
  }, [pattern]);

  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { activeRef.current = active; }, [active]);

  /**
   * Compute breathScale from phase type and progress.
   * inhale:    rises 0→1 (smoothstepped)
   * hold:      stays 1
   * exhale:    falls 1→0 (smoothstepped)
   * holdEmpty: stays 0
   */
  const computeBreathScale = useCallback((type, progress) => {
    switch (type) {
      case 'inhale':    return smoothstep(progress);
      case 'hold':      return 1;
      case 'exhale':    return 1 - smoothstep(progress);
      case 'holdEmpty': return 0;
      default:          return 0;
    }
  }, []);

  useEffect(() => {
    const tick = (now) => {
      const pat = patternRef.current;
      const spd = speedRef.current;

      if (!activeRef.current || !pat || pat.length === 0) {
        // Paused — keep requesting frames so we resume instantly.
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Initialise phase start on first active tick.
      if (phaseStartRef.current === null) {
        phaseStartRef.current = now;
      }

      const idx = phaseIndexRef.current;
      const currentPhase = pat[idx];
      // Actual duration = nominal seconds / speed (slower speed = longer).
      const durationMs = (currentPhase.seconds / spd) * 1000;
      const elapsed = now - phaseStartRef.current;
      let progress = Math.min(1, elapsed / durationMs);

      if (progress >= 1) {
        // Advance to next phase.
        const nextIdx = (idx + 1) % pat.length;
        if (nextIdx === 0) {
          cycleCountRef.current += 1;
        }
        phaseIndexRef.current = nextIdx;
        phaseStartRef.current = now;
        progress = 0;

        const nextPhase = pat[nextIdx];
        setState({
          phase: { type: nextPhase.type, label: nextPhase.label },
          phaseProgress: 0,
          breathScale: computeBreathScale(nextPhase.type, 0),
          cycleCount: cycleCountRef.current,
        });
      } else {
        setState({
          phase: { type: currentPhase.type, label: currentPhase.label },
          phaseProgress: progress,
          breathScale: computeBreathScale(currentPhase.type, progress),
          cycleCount: cycleCountRef.current,
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [computeBreathScale]);

  return state;
}
