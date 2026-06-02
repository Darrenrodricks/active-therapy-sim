import { useEffect, useState } from 'react';
import { THERAPY_STATE } from '../../../shared/types/therapyEvents.js';
import { SESSION } from '../../../shared/constants/thresholds.js';
import { send } from '../socket/client.js';

/**
 * The SENSORA Reset Protocol panel. This is the infection-control gate that
 * comes directly from the BIOE 107 stakeholder requirements: a device coming
 * off a patient cannot be used by the next patient until sanitization is
 * acknowledged.
 *
 * UX rules:
 *  - Only visible during ENDED / SANITIZING / READY states.
 *  - The "Verify" button is disabled until a minimum wait time has elapsed
 *    (we can't pretend sanitization happens instantly).
 *  - Once verified, the protocol cycles SANITIZING → READY → IDLE
 *    automatically on the server.
 */
export function ResetProtocol({ therapyState, endedAt }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (therapyState !== THERAPY_STATE.ENDED) {
      setElapsed(0);
      return;
    }
    const start = endedAt || Date.now();
    const tick = () => setElapsed(Date.now() - start);
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [therapyState, endedAt]);

  if (
    therapyState !== THERAPY_STATE.ENDED &&
    therapyState !== THERAPY_STATE.SANITIZING &&
    therapyState !== THERAPY_STATE.READY
  ) {
    return null;
  }

  const minWait = SESSION.RESET_PROTOCOL_MIN_WAIT_MS;
  const ready = elapsed >= minWait;
  const remaining = Math.max(0, Math.ceil((minWait - elapsed) / 1000));

  const steps = [
    { id: 1, label: 'Collection & Triage', time: '2 min', done: true },
    { id: 2, label: 'Disassembly & Liner Replacement', time: '3 min', done: true },
    { id: 3, label: 'Hospital-Grade Sanitization', time: '5 min', done: true },
    { id: 4, label: 'Functional Check & Recharge', time: '3 min', done: true },
    { id: 5, label: 'Sanitization Verification', time: '— required', done: therapyState !== THERAPY_STATE.ENDED },
  ];

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--warn)',
        borderRadius: 12,
        padding: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--warn)',
            boxShadow: '0 0 12px var(--warn)',
          }}
        />
        <div
          style={{
            fontFamily: 'Inter',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--warn)',
          }}
        >
          SENSORA Reset Protocol
        </div>
      </div>

      <div
        style={{
          fontFamily: 'Inter',
          fontSize: 14,
          color: 'var(--text-secondary)',
          marginBottom: 20,
          lineHeight: 1.5,
        }}
      >
        Device in triage. Complete the reset cycle before the next patient session.
      </div>

      <div style={{ marginBottom: 24 }}>
        {steps.map((s, i) => (
          <div
            key={s.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '24px 1fr auto',
              gap: 12,
              alignItems: 'center',
              padding: '10px 0',
              borderBottom:
                i < steps.length - 1 ? '1px solid rgba(42, 53, 64, 0.4)' : 'none',
              opacity: s.done ? 1 : 0.55,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: '1px solid',
                borderColor: s.done ? 'var(--ok)' : 'var(--text-tertiary)',
                background: s.done ? 'rgba(74, 222, 128, 0.15)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                color: s.done ? 'var(--ok)' : 'var(--text-tertiary)',
                fontFamily: 'JetBrains Mono',
              }}
            >
              {s.done ? '✓' : s.id}
            </div>
            <div
              style={{
                fontFamily: 'Inter',
                fontSize: 13,
                color: 'var(--text-primary)',
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 11,
                color: 'var(--text-tertiary)',
              }}
            >
              {s.time}
            </div>
          </div>
        ))}
      </div>

      {therapyState === THERAPY_STATE.ENDED && (
        <button
          onClick={() => send.verifySanitization()}
          disabled={!ready}
          style={{
            width: '100%',
            padding: '14px',
            background: ready ? 'var(--ok)' : 'rgba(74, 222, 128, 0.15)',
            color: ready ? '#0e1419' : 'var(--text-tertiary)',
            border: 'none',
            borderRadius: 8,
            fontFamily: 'Inter',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            cursor: ready ? 'pointer' : 'not-allowed',
            transition: 'all 200ms ease',
          }}
        >
          {ready
            ? '✓ Sanitization Verified'
            : `Awaiting protocol — ${remaining}s`}
        </button>
      )}

      {(therapyState === THERAPY_STATE.SANITIZING ||
        therapyState === THERAPY_STATE.READY) && (
        <div
          style={{
            padding: '14px',
            background: 'rgba(74, 222, 128, 0.1)',
            border: '1px solid var(--ok)',
            color: 'var(--ok)',
            borderRadius: 8,
            fontFamily: 'Inter',
            fontSize: 14,
            fontWeight: 500,
            textAlign: 'center',
          }}
        >
          ✓ Verified — device cleared for next patient
        </div>
      )}
    </div>
  );
}
