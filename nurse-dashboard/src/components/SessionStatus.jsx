import { THERAPY_STATE } from '../../../shared/types/therapyEvents.js';

const STATE_META = {
  [THERAPY_STATE.IDLE]:       { label: 'Idle',              color: 'var(--text-secondary)', dot: '#5a6673' },
  [THERAPY_STATE.RAMP_UP]:    { label: 'Ramp-up',           color: 'var(--info)',           dot: '#60a5fa' },
  [THERAPY_STATE.ACTIVE]:     { label: 'Active therapy',    color: 'var(--ok)',             dot: '#4ade80' },
  [THERAPY_STATE.PAUSED]:     { label: 'Patient paused',    color: 'var(--crit)',           dot: '#ef4444' },
  [THERAPY_STATE.ENDED]:      { label: 'Session ended',     color: 'var(--warn)',           dot: '#fbbf24' },
  [THERAPY_STATE.SANITIZING]: { label: 'Sanitizing',        color: 'var(--warn)',           dot: '#fbbf24' },
  [THERAPY_STATE.READY]:      { label: 'Ready',             color: 'var(--ok)',             dot: '#4ade80' },
};

export function SessionStatus({ therapyState, patient, connected }) {
  const meta = STATE_META[therapyState] || STATE_META[THERAPY_STATE.IDLE];

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontFamily: 'Inter',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}
        >
          Session
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'JetBrains Mono',
            fontSize: 10,
            color: connected ? 'var(--ok)' : 'var(--crit)',
            letterSpacing: '0.06em',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: connected ? 'var(--ok)' : 'var(--crit)',
            }}
          />
          {connected ? 'CONNECTED' : 'OFFLINE'}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: meta.dot,
            boxShadow: `0 0 12px ${meta.dot}`,
          }}
        />
        <div
          style={{
            fontFamily: 'Inter',
            fontSize: 20,
            fontWeight: 600,
            color: meta.color,
          }}
        >
          {meta.label}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          fontFamily: 'JetBrains Mono',
          fontSize: 12,
        }}
      >
        <div>
          <div style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>
            PATIENT
          </div>
          <div style={{ color: 'var(--text-primary)' }}>
            {patient?.name ?? '—'}
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>
            ROOM
          </div>
          <div style={{ color: 'var(--text-primary)' }}>
            {patient?.room ?? '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
