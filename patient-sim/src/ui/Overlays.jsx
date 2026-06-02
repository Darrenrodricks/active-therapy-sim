/**
 * The pre-therapy screen. Centered, minimal, asks for a single action.
 */
export function StartScreen({ onStart, onReset, sessionState }) {
  const isWaiting = sessionState === 'ENDED' || sessionState === 'SANITIZING';
  const isReady = sessionState === 'IDLE' || sessionState === 'READY';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
        pointerEvents: isReady || isWaiting ? 'auto' : 'none',
      }}
    >
      <div
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 13,
          fontWeight: 400,
          letterSpacing: '0.4em',
          color: '#5a8aaf',
          textTransform: 'uppercase',
          marginBottom: 24,
        }}
      >
        SENSORA
      </div>
      <div
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 44,
          fontWeight: 300,
          letterSpacing: '0.01em',
          color: '#e8eef4',
          marginBottom: 12,
          textAlign: 'center',
          maxWidth: 560,
          lineHeight: 1.15,
        }}
      >
        {isReady && 'A few minutes for yourself.'}
        {isWaiting && 'Device sanitizing.'}
      </div>
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 14,
          fontWeight: 300,
          letterSpacing: '0.04em',
          color: '#7a8a9a',
          marginBottom: 48,
          textAlign: 'center',
          maxWidth: 420,
          lineHeight: 1.6,
        }}
      >
        {isReady &&
          'The session will begin with a gentle ramp-up. You can pause at any time by pressing the spacebar.'}
        {isWaiting &&
          'Awaiting nurse confirmation. Please wait.'}
      </div>

      {isWaiting && (
        <button
          onClick={onReset}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(168, 184, 200, 0.3)',
            color: '#a8b8c8',
            padding: '12px 32px',
            borderRadius: 40,
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            fontWeight: 400,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 300ms ease',
            backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.03)';
            e.currentTarget.style.borderColor = 'rgba(168, 184, 200, 0.6)';
            e.currentTarget.style.color = '#e8eef4';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.borderColor = 'rgba(168, 184, 200, 0.3)';
            e.currentTarget.style.color = '#a8b8c8';
          }}
        >
          Reset Session
        </button>
      )}

      {isReady && (
        <button
          onClick={onStart}
          style={{
            background:
              'linear-gradient(135deg, rgba(95, 168, 211, 0.18) 0%, rgba(95, 168, 211, 0.08) 100%)',
            border: '1px solid rgba(95, 168, 211, 0.4)',
            color: '#cfe3f5',
            padding: '16px 40px',
            borderRadius: 40,
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            fontWeight: 400,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 300ms ease',
            backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.03)';
            e.currentTarget.style.borderColor = 'rgba(95, 168, 211, 0.7)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.borderColor = 'rgba(95, 168, 211, 0.4)';
          }}
        >
          Begin
        </button>
      )}
    </div>
  );
}

/**
 * Always-visible exit affordance during therapy. Small, top-right,
 * doesn't compete with the scene for attention.
 */
export function ExitButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        top: 24,
        right: 24,
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        color: '#a8b8c8',
        padding: '8px 16px',
        borderRadius: 24,
        fontFamily: "'Inter', sans-serif",
        fontSize: 12,
        fontWeight: 400,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        zIndex: 6,
        transition: 'all 200ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.color = '#e8eef4';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
        e.currentTarget.style.color = '#a8b8c8';
      }}
    >
      End therapy
    </button>
  );
}

/**
 * Tiny hint at the bottom — tells the patient how to pause.
 * Fades in only when therapy is active.
 */
export function PauseHint({ visible }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: "'Inter', sans-serif",
        fontSize: 11,
        fontWeight: 300,
        letterSpacing: '0.18em',
        color: 'rgba(168, 184, 200, 0.5)',
        textTransform: 'uppercase',
        opacity: visible ? 1 : 0,
        transition: 'opacity 1500ms ease',
        pointerEvents: 'none',
        zIndex: 6,
      }}
    >
      Press space to pause
    </div>
  );
}
