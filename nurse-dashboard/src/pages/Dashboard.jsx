import { useEffect, useState } from 'react';
import { useSession } from '../state/sessionStore.js';
import { send } from '../socket/client.js';
import { THERAPY_STATE } from '../../../shared/types/therapyEvents.js';
import { VITALS_THRESHOLDS } from '../../../shared/constants/thresholds.js';
import { SessionStatus } from '../components/SessionStatus.jsx';
import { VitalsReadout } from '../components/VitalsReadout.jsx';
import { VitalsChart } from '../components/VitalsChart.jsx';
import { EventLog } from '../components/EventLog.jsx';
import { AlertBanner } from '../components/AlertBanner.jsx';
import { ResetProtocol } from '../components/ResetProtocol.jsx';

export function Dashboard() {
  const {
    connected,
    therapyState,
    patient,
    latestVitals,
    vitalsLog,
    alerts,
    criticalAlert,
    dismissCriticalAlert,
  } = useSession();

  // Track when the session ended so the reset countdown has a stable start.
  const [endedAt, setEndedAt] = useState(null);
  useEffect(() => {
    if (therapyState === THERAPY_STATE.ENDED && !endedAt) {
      setEndedAt(Date.now());
    } else if (therapyState !== THERAPY_STATE.ENDED) {
      setEndedAt(null);
    }
  }, [therapyState, endedAt]);

  return (
    <div
      style={{
        height: '100vh',
        background: 'var(--bg-base)',
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        gridTemplateColumns: '320px 1fr 360px',
        gridTemplateAreas: `
          "header header header"
          "sidebar main eventlog"
        `,
        gap: 20,
        padding: 20,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* HEADER */}
      <header
        style={{
          gridArea: 'header',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.3em',
              color: 'var(--text-secondary)',
              padding: '6px 12px',
              border: '1px solid var(--border)',
              borderRadius: 4,
            }}
          >
            SENSORA
          </div>
          <div
            style={{
              fontFamily: 'Inter',
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            Nurse Station
          </div>
          <div
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 11,
              color: 'var(--text-tertiary)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Floor 3 · Bay B
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => send.injectStress()}
            disabled={
              therapyState !== THERAPY_STATE.ACTIVE &&
              therapyState !== THERAPY_STATE.RAMP_UP
            }
            style={{
              background: 'transparent',
              border: '1px solid var(--warn)',
              color: 'var(--warn)',
              padding: '8px 16px',
              borderRadius: 6,
              fontFamily: 'Inter',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.04em',
              cursor:
                therapyState === THERAPY_STATE.ACTIVE ||
                therapyState === THERAPY_STATE.RAMP_UP
                  ? 'pointer'
                  : 'not-allowed',
              opacity:
                therapyState === THERAPY_STATE.ACTIVE ||
                therapyState === THERAPY_STATE.RAMP_UP
                  ? 1
                  : 0.4,
              textTransform: 'uppercase',
              transition: 'all 200ms ease',
            }}
            title="Demo control: inject a stress event to test alerting"
          >
            ⚡ Inject Stress
          </button>
          <div
            style={{
              padding: '8px 12px',
              fontFamily: 'JetBrains Mono',
              fontSize: 11,
              color: 'var(--text-tertiary)',
              letterSpacing: '0.06em',
              border: '1px solid var(--border)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
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
            {connected ? 'LIVE' : 'OFFLINE'}
          </div>
        </div>
      </header>

      {/* SIDEBAR */}
      <aside
        style={{
          gridArea: 'sidebar',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <SessionStatus
          therapyState={therapyState}
          patient={patient}
          connected={connected}
        />
        <ResetProtocol therapyState={therapyState} endedAt={endedAt} />
      </aside>

      {/* MAIN */}
      <main
        style={{
          gridArea: 'main',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          minWidth: 0, // prevents grid blowout
        }}
      >
        <VitalsReadout vitals={
          therapyState === THERAPY_STATE.RAMP_UP ||
          therapyState === THERAPY_STATE.ACTIVE
            ? latestVitals
            : null
        } />

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 24,
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
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
              Vitals · last 30s
            </div>
            <div
              style={{
                display: 'flex',
                gap: 16,
                fontFamily: 'JetBrains Mono',
                fontSize: 11,
              }}
            >
              <Legend color="#60a5fa" label="HR" />
              <Legend color="#a78bfa" label="Resp" />
              <Legend color="#fb923c" label="Stress" />
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Heart Rate Chart */}
            <VitalsChart
              vitalsLog={vitalsLog}
              dataKey="heartRate"
              stroke="#60a5fa"
              name="Heart Rate"
              unit="bpm"
              label="Heart Rate (bpm)"
              domain={[40, 140]}
              ticks={[40, 60, 80, 100, 120, 140]}
              bands={[
                { min: VITALS_THRESHOLDS.heartRate.resting.min,  max: VITALS_THRESHOLDS.heartRate.resting.max,  fill: '#4ade80' },
                { min: VITALS_THRESHOLDS.heartRate.elevated.min, max: VITALS_THRESHOLDS.heartRate.elevated.max, fill: '#fbbf24' },
                { min: VITALS_THRESHOLDS.heartRate.critical.min, max: VITALS_THRESHOLDS.heartRate.critical.max, fill: '#ef4444' },
              ]}
              showXAxis={false}
            />

            {/* Respiration Chart */}
            <VitalsChart
              vitalsLog={vitalsLog}
              dataKey="respiration"
              stroke="#a78bfa"
              name="Respiration"
              unit="br/min"
              label="Respiration (br/min)"
              domain={[8, 40]}
              ticks={[8, 12, 18, 24, 32, 40]}
              bands={[
                { min: VITALS_THRESHOLDS.respiration.resting.min,  max: VITALS_THRESHOLDS.respiration.resting.max,  fill: '#4ade80' },
                { min: VITALS_THRESHOLDS.respiration.elevated.min, max: VITALS_THRESHOLDS.respiration.elevated.max, fill: '#fbbf24' },
                { min: VITALS_THRESHOLDS.respiration.critical.min, max: VITALS_THRESHOLDS.respiration.critical.max, fill: '#ef4444' },
              ]}
              showXAxis={false}
            />

            {/* Stress Index Chart */}
            <VitalsChart
              vitalsLog={vitalsLog}
              dataKey="stress"
              stroke="#fb923c"
              name="Stress Index"
              unit="/100"
              label="Stress Index (0–100)"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              bands={[
                { min: 0,                               max: VITALS_THRESHOLDS.stress.calm,     fill: '#4ade80' },
                { min: VITALS_THRESHOLDS.stress.calm,   max: VITALS_THRESHOLDS.stress.warning,  fill: '#fbbf24' },
                { min: VITALS_THRESHOLDS.stress.warning, max: VITALS_THRESHOLDS.stress.critical, fill: '#ef4444' },
              ]}
              showXAxis={true}
            />
          </div>
        </div>
      </main>

      {/* EVENT LOG */}
      <section
        style={{
          gridArea: 'eventlog',
          minHeight: 0,
        }}
      >
        <EventLog alerts={alerts} />
      </section>

      <AlertBanner alert={criticalAlert} onDismiss={dismissCriticalAlert} />
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 12,
          height: 2,
          background: color,
          borderRadius: 1,
        }}
      />
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  );
}
