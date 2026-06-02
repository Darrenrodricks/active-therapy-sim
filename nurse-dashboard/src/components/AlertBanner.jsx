/**
 * Critical alert modal. Shown over the dashboard when the patient interrupts
 * therapy. Designed to be impossible to miss — pulsing red background,
 * centered, with a clear acknowledgment action.
 *
 * Sound design: when this mounts, it plays a single soft "ping" via the
 * HTML5 Audio API. Subtle enough not to be alarming, distinct enough to
 * catch attention if the nurse isn't looking at the screen.
 */

import { useEffect } from 'react';

// Tiny WAV file synthesized at runtime so we don't need an external asset.
// It's a short C5 sine wave with a quick fade-out — sounds like a soft "ping".
function playPing() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(523, ctx.currentTime + 0.4); // down to C5

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.75);
  } catch {
    // Browsers that block audio without user interaction will throw here.
    // That's fine — the visual alert is the primary channel.
  }
}

export function AlertBanner({ alert, onDismiss }) {
  useEffect(() => {
    if (alert) playPing();
  }, [alert]);

  if (!alert) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(239, 68, 68, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        backdropFilter: 'blur(2px)',
      }}
      className="alert-flashing"
    >
      <div
        style={{
          background: 'var(--bg-elev)',
          border: '2px solid var(--crit)',
          borderRadius: 16,
          padding: '40px 56px',
          maxWidth: 560,
          textAlign: 'center',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(239, 68, 68, 0.3)',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '6px 14px',
            background: 'rgba(239, 68, 68, 0.18)',
            color: 'var(--crit)',
            fontFamily: 'JetBrains Mono',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.18em',
            borderRadius: 4,
            marginBottom: 20,
          }}
        >
          CRITICAL ALERT
        </div>

        <div
          style={{
            fontFamily: 'Inter',
            fontSize: 26,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 12,
            letterSpacing: '-0.01em',
          }}
        >
          {alert.message}
        </div>

        <div
          style={{
            fontFamily: 'JetBrains Mono',
            fontSize: 12,
            color: 'var(--text-secondary)',
            marginBottom: 32,
            letterSpacing: '0.05em',
          }}
        >
          {new Date(alert.timestamp).toLocaleTimeString()} · {alert.room}
        </div>

        <button
          onClick={onDismiss}
          style={{
            background: 'var(--crit)',
            border: 'none',
            color: '#fff',
            padding: '12px 32px',
            borderRadius: 6,
            fontFamily: 'Inter',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
}
