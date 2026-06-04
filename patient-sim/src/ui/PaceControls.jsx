import { useState } from 'react';
import { PATTERNS, PATTERN_LABELS } from '../therapy/breathingPatterns.js';

/**
 * Small, unobtrusive control panel for pattern + speed selection.
 *
 * Bottom-left, glassy, matching the existing ExitButton/PauseHint aesthetic.
 * Recedes when not hovered so it doesn't pull focus during therapy.
 * Pointer targets are comfortably large for headset/touch use.
 */
export function PaceControls({
  selectedPattern,
  onPatternChange,
  speed,
  onSpeedChange,
}) {
  const [hovered, setHovered] = useState(false);

  const patternKeys = Object.keys(PATTERNS);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        bottom: 32,
        left: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '14px 18px',
        borderRadius: 16,
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        opacity: hovered ? 0.95 : 0.45,
        transition: 'opacity 400ms ease',
        zIndex: 6,
        pointerEvents: 'auto',
      }}
    >
      {/* Pattern selector — segmented buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        {patternKeys.map((key) => {
          const isActive = key === selectedPattern;
          return (
            <button
              key={key}
              onClick={() => onPatternChange(key)}
              style={{
                background: isActive
                  ? 'rgba(95, 168, 211, 0.18)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: isActive
                  ? '1px solid rgba(95, 168, 211, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                color: isActive ? '#cfe3f5' : '#a8b8c8',
                padding: '8px 14px',
                borderRadius: 20,
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                fontWeight: 400,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                minWidth: 48,
              }}
            >
              {PATTERN_LABELS[key]}
            </button>
          );
        })}
      </div>

      {/* Speed slider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 10,
            fontWeight: 300,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(168, 184, 200, 0.6)',
            minWidth: 36,
          }}
        >
          Speed
        </span>
        <input
          type="range"
          min={0.5}
          max={1.5}
          step={0.1}
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          style={{
            flex: 1,
            accentColor: '#5fa8d3',
            cursor: 'pointer',
            height: 20, // larger touch target
          }}
        />
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            fontWeight: 400,
            letterSpacing: '0.04em',
            color: '#a8b8c8',
            minWidth: 32,
            textAlign: 'right',
          }}
        >
          {speed.toFixed(1)}×
        </span>
      </div>
    </div>
  );
}
