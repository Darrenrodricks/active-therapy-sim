/**
 * The "Grounding Mode" overlay shown when the patient presses spacebar.
 * Designed to feel immediately safe: warm tones, lots of negative space,
 * a single slow-breathing visual cue, and a button to resume only when ready.
 */
export function GroundingOverlay({ onResume, onEnd }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(ellipse at 50% 50%, #1f2a1e 0%, #14180f 60%, #0a0d08 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        animation: 'fadeIn 600ms ease-out',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slowPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50%      { transform: scale(1.15); opacity: 0.8; }
        }
        @keyframes drift {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
      `}</style>

      {/* Slow-pulsing dot — a single point of focus for the eyes. */}
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 35% 35%, #d4b88a 0%, #8a7556 50%, #4a3f2d 100%)',
          boxShadow: '0 0 80px rgba(212, 184, 138, 0.35)',
          animation: 'slowPulse 5s ease-in-out infinite',
          marginBottom: 64,
        }}
      />

      <div
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 38,
          fontWeight: 300,
          letterSpacing: '0.01em',
          color: '#e8dcc1',
          marginBottom: 16,
          animation: 'drift 8s ease-in-out infinite',
        }}
      >
        Grounding Mode
      </div>

      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 15,
          fontWeight: 300,
          letterSpacing: '0.06em',
          color: '#a89e87',
          textTransform: 'uppercase',
          marginBottom: 64,
        }}
      >
        Therapy paused — take your time
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <button
          onClick={onResume}
          style={{
            background: 'rgba(232, 220, 193, 0.08)',
            border: '1px solid rgba(232, 220, 193, 0.3)',
            color: '#e8dcc1',
            padding: '14px 28px',
            borderRadius: 32,
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            fontWeight: 400,
            letterSpacing: '0.05em',
            cursor: 'pointer',
            transition: 'all 200ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(232, 220, 193, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(232, 220, 193, 0.08)';
          }}
        >
          Resume therapy
        </button>
        <button
          onClick={onEnd}
          style={{
            background: 'transparent',
            border: '1px solid rgba(168, 158, 135, 0.25)',
            color: '#a89e87',
            padding: '14px 28px',
            borderRadius: 32,
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            fontWeight: 400,
            letterSpacing: '0.05em',
            cursor: 'pointer',
            transition: 'all 200ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#e8dcc1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#a89e87';
          }}
        >
          End session
        </button>
      </div>
    </div>
  );
}
