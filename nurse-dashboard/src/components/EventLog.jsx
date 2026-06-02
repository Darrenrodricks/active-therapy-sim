/**
 * Event timeline. Shows recent alerts in reverse chronological order so
 * the nurse can audit what happened during the session.
 */

const LEVEL_COLORS = {
  INFO: 'var(--info)',
  WARNING: 'var(--warn)',
  CRITICAL: 'var(--crit)',
};

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function EventLog({ alerts }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px 0 12px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: '0 24px 16px',
          fontFamily: 'Inter',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        Event log
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 0',
        }}
      >
        {alerts.length === 0 && (
          <div
            style={{
              padding: '32px 24px',
              color: 'var(--text-tertiary)',
              fontFamily: 'JetBrains Mono',
              fontSize: 12,
              textAlign: 'center',
            }}
          >
            No events yet
          </div>
        )}

        {alerts.map((a, i) => (
          <div
            key={`${a.timestamp}-${i}`}
            style={{
              padding: '10px 24px',
              display: 'grid',
              gridTemplateColumns: '70px 8px 1fr',
              gap: 12,
              alignItems: 'start',
              borderBottom:
                i < alerts.length - 1 ? '1px solid rgba(42, 53, 64, 0.4)' : 'none',
            }}
          >
            <div
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 11,
                color: 'var(--text-tertiary)',
                paddingTop: 2,
              }}
            >
              {formatTime(a.timestamp)}
            </div>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: LEVEL_COLORS[a.level] || 'var(--text-tertiary)',
                marginTop: 6,
              }}
            />
            <div
              style={{
                fontFamily: 'Inter',
                fontSize: 13,
                color: 'var(--text-primary)',
                lineHeight: 1.4,
              }}
            >
              {a.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
