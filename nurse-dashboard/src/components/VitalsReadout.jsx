import { VITALS_THRESHOLDS } from '../../../shared/constants/thresholds.js';

function classifyHR(hr) {
  const t = VITALS_THRESHOLDS.heartRate;
  if (hr >= t.critical.min) return 'crit';
  if (hr >= t.elevated.min) return 'warn';
  return 'ok';
}

function classifyStress(s) {
  const t = VITALS_THRESHOLDS.stress;
  if (s >= t.warning) return 'crit';
  if (s >= t.calm) return 'warn';
  return 'ok';
}

const COLORS = {
  ok: 'var(--ok)',
  warn: 'var(--warn)',
  crit: 'var(--crit)',
};

function Readout({ label, value, unit, klass }) {
  return (
    <div
      style={{
        flex: 1,
        padding: '20px 24px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Status indicator strip on the left edge */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: COLORS[klass],
        }}
      />
      <div
        style={{
          fontFamily: 'Inter',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 38,
            fontWeight: 500,
            color: COLORS[klass],
            lineHeight: 1,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12,
            color: 'var(--text-secondary)',
            letterSpacing: '0.04em',
          }}
        >
          {unit}
        </div>
      </div>
    </div>
  );
}

export function VitalsReadout({ vitals }) {
  if (!vitals) {
    return (
      <div style={{ display: 'flex', gap: 12 }}>
        <Readout label="Heart Rate" value="--" unit="bpm" klass="ok" />
        <Readout label="Respiration" value="--" unit="br/min" klass="ok" />
        <Readout label="Stress Index" value="--" unit="/ 100" klass="ok" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <Readout
        label="Heart Rate"
        value={vitals.heartRate}
        unit="bpm"
        klass={classifyHR(vitals.heartRate)}
      />
      <Readout
        label="Respiration"
        value={vitals.respiration.toFixed(1)}
        unit="br/min"
        klass="ok"
      />
      <Readout
        label="Stress Index"
        value={vitals.stress}
        unit="/ 100"
        klass={classifyStress(vitals.stress)}
      />
    </div>
  );
}
