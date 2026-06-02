import { useEffect, useState, useRef } from 'react';
import { SESSION } from '../../../shared/constants/thresholds.js';

/**
 * Drives a 0 → 1 opacity ramp over SESSION.RAMP_UP_DURATION_MS.
 *
 * Reset back to 0 when `active` flips false (e.g. patient hit panic and we
 * want to fade the scene out before showing the grounding overlay, or the
 * session ended). Easing is a smoothstep so the curve feels organic rather
 * than mechanical.
 */
export function useRampUp(active) {
  const [opacity, setOpacity] = useState(0);
  const startedAt = useRef(null);
  const rafId = useRef(null);

  useEffect(() => {
    if (!active) {
      // Fade out faster than we fade in.
      const fadeStart = performance.now();
      const fadeFrom = opacity;
      const fadeDuration = 600;

      const tick = (now) => {
        const t = Math.min(1, (now - fadeStart) / fadeDuration);
        setOpacity(fadeFrom * (1 - t));
        if (t < 1) rafId.current = requestAnimationFrame(tick);
      };
      rafId.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafId.current);
    }

    // Ramp up from current opacity to 1 over the configured duration.
    startedAt.current = performance.now();
    const fromOpacity = opacity;
    const remaining = SESSION.RAMP_UP_DURATION_MS * (1 - fromOpacity);

    const tick = (now) => {
      const elapsed = now - startedAt.current;
      const linear = Math.min(1, fromOpacity + elapsed / SESSION.RAMP_UP_DURATION_MS);
      // smoothstep easing
      const eased = linear * linear * (3 - 2 * linear);
      setOpacity(eased);
      if (linear < 1) rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return opacity;
}
