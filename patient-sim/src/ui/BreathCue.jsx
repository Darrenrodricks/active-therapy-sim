import { useEffect, useState, useRef } from 'react';

/**
 * Soft, centered phase label that tells the patient what to do.
 *
 * Crossfades gently (~400ms) between labels so transitions feel
 * predictable and calm. Predictability lowers anxiety for
 * neurodivergent users — no bouncing, no bright colours.
 *
 * Positioned in the upper third so it doesn't fight the sphere
 * for attention. Driven by the same scene opacity so it fades in
 * with the ramp-up.
 */
export function BreathCue({ phase, phaseProgress, opacity = 1 }) {
  // Crossfade: we keep the *displayed* label separate from the incoming
  // label so we can animate the transition.
  const [displayLabel, setDisplayLabel] = useState(phase?.label ?? '');
  const [fading, setFading] = useState(false);
  const prevLabelRef = useRef(phase?.label ?? '');

  useEffect(() => {
    const incoming = phase?.label ?? '';
    if (incoming === prevLabelRef.current) return;

    prevLabelRef.current = incoming;
    // Fade out, swap, fade in.
    setFading(true);
    const timer = setTimeout(() => {
      setDisplayLabel(incoming);
      setFading(false);
    }, 200); // half the 400ms crossfade — 200ms out, 200ms in
    return () => clearTimeout(timer);
  }, [phase?.label]);

  return (
    <div
      style={{
        position: 'absolute',
        top: '22%',
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 6,
        opacity: opacity,
        transition: 'opacity 600ms ease',
      }}
    >
      {/* Phase label */}
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 18,
          fontWeight: 300,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(168, 184, 200, 0.7)',
          opacity: fading ? 0 : 1,
          transition: 'opacity 200ms ease',
        }}
      >
        {displayLabel}
      </div>

      {/* Subtle progress bar — a thin line that fills with phaseProgress. */}
      <div
        style={{
          marginTop: 14,
          width: 80,
          height: 2,
          borderRadius: 1,
          background: 'rgba(168, 184, 200, 0.12)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${(phaseProgress ?? 0) * 100}%`,
            height: '100%',
            background: 'rgba(168, 184, 200, 0.35)',
            borderRadius: 1,
            // No transition — driven at ~60fps by rAF so it stays smooth.
          }}
        />
      </div>
    </div>
  );
}
