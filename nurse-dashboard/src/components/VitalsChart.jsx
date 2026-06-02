import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceArea,
  Tooltip,
} from 'recharts';
import { VITALS_THRESHOLDS } from '../../../shared/constants/thresholds.js';

/**
 * Format a vitals sample for Recharts. We use the seconds-ago value as the x
 * axis so the chart visually scrolls right-to-left.
 */
function prepData(vitalsLog) {
  const now = Date.now();
  return vitalsLog.map((s) => ({
    secondsAgo: -Math.round((now - s.timestamp) / 1000),
    heartRate: s.heartRate,
    respiration: s.respiration,
    stress: s.stress,
  }));
}

export function VitalsChart({ vitalsLog }) {
  const data = prepData(vitalsLog);
  const t = VITALS_THRESHOLDS.heartRate;

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 280 }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 16, right: 24, left: 0, bottom: 8 }}
        >
          <CartesianGrid
            stroke="#2a3540"
            strokeDasharray="2 4"
            vertical={false}
          />

          {/* Threshold bands behind the line, so you can read where vitals are
              clinically without needing a legend. */}
          <ReferenceArea
            y1={t.resting.min}
            y2={t.resting.max}
            fill="#4ade80"
            fillOpacity={0.06}
            ifOverflow="extendDomain"
          />
          <ReferenceArea
            y1={t.elevated.min}
            y2={t.elevated.max}
            fill="#fbbf24"
            fillOpacity={0.06}
            ifOverflow="extendDomain"
          />
          <ReferenceArea
            y1={t.critical.min}
            y2={t.critical.max}
            fill="#ef4444"
            fillOpacity={0.06}
            ifOverflow="extendDomain"
          />

          <XAxis
            dataKey="secondsAgo"
            type="number"
            domain={[-30, 0]}
            ticks={[-30, -20, -10, 0]}
            tickFormatter={(v) => (v === 0 ? 'now' : `${v}s`)}
            stroke="#5a6673"
            tick={{ fill: '#8b98a5', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            axisLine={{ stroke: '#2a3540' }}
          />
          <YAxis
            domain={[40, 140]}
            ticks={[40, 60, 80, 100, 120, 140]}
            stroke="#5a6673"
            tick={{ fill: '#8b98a5', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            axisLine={{ stroke: '#2a3540' }}
            width={36}
          />

          <Tooltip
            contentStyle={{
              background: '#1c252e',
              border: '1px solid #3d4a57',
              borderRadius: 8,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12,
            }}
            labelStyle={{ color: '#8b98a5' }}
            labelFormatter={(v) => (v === 0 ? 'now' : `${v}s ago`)}
          />

          <Line
            type="monotone"
            dataKey="heartRate"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            name="HR (bpm)"
          />
          <Line
            type="monotone"
            dataKey="respiration"
            stroke="#a78bfa"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
            name="Resp (br/min)"
            yAxisId={0}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
