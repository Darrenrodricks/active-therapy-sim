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

const CHART_MARGIN = { top: 8, right: 16, left: 0, bottom: 4 };

export function VitalsChart({ vitalsLog, dataKey, stroke, name, unit, label, domain, ticks, bands, showXAxis }) {
  const data = prepData(vitalsLog);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div
        style={{
          fontSize: 10,
          fontFamily: 'JetBrains Mono, monospace',
          color: stroke,
          padding: '4px 0 2px 40px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          opacity: 0.85,
        }}
      >
        {label}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={CHART_MARGIN}>
            <CartesianGrid stroke="#2a3540" strokeDasharray="2 4" vertical={false} />

            {bands.map((band, i) => (
              <ReferenceArea
                key={i}
                y1={band.min}
                y2={band.max}
                fill={band.fill}
                fillOpacity={0.06}
                ifOverflow="extendDomain"
              />
            ))}

            <XAxis
              dataKey="secondsAgo"
              type="number"
              domain={[-30, 0]}
              ticks={[-30, -20, -10, 0]}
              tickFormatter={showXAxis ? (v) => (v === 0 ? 'now' : `${v}s`) : () => ''}
              stroke="#5a6673"
              tick={{
                fill: showXAxis ? '#8b98a5' : 'transparent',
                fontSize: 11,
                fontFamily: 'JetBrains Mono',
              }}
              axisLine={{ stroke: '#2a3540' }}
              height={showXAxis ? 20 : 6}
            />
            <YAxis
              domain={domain}
              ticks={ticks}
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
              formatter={(value) => [`${value} ${unit}`, name]}
            />

            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={stroke}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              name={name}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
