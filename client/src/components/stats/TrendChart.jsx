import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-mid)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
      fontFamily: 'var(--font-mono)',
    }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 3 }}>
          {p.name}: {p.value != null ? (typeof p.value === 'number' ? p.value.toFixed(1) : p.value) : '—'}
          {p.dataKey === 'rate' ? '%' : ''}
        </div>
      ))}
    </div>
  );
};

export default function TrendChart({ data = [] }) {
  const [showRate, setShowRate] = useState(true);
  const [showMood, setShowMood] = useState(true);
  const [showEnergy, setShowEnergy] = useState(true);

  const formatted = data.map(d => ({
    ...d,
    label: format(parseISO(d.date), 'MMM d'),
  }));

  return (
    <div>
      {/* Toggles */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { key: 'rate', label: 'Completion %', color: '#C8F135', active: showRate, toggle: () => setShowRate(v => !v) },
          { key: 'mood', label: 'Mood', color: '#A78BFA', active: showMood, toggle: () => setShowMood(v => !v) },
          { key: 'energy', label: 'Energy', color: '#2DD4BF', active: showEnergy, toggle: () => setShowEnergy(v => !v) },
        ].map(({ key, label, color, active, toggle }) => (
          <button
            key={key}
            onClick={toggle}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              border: `1px solid ${active ? color : 'var(--border-subtle)'}`,
              background: active ? `${color}18` : 'transparent',
              color: active ? color : 'var(--text-tertiary)',
              fontSize: 12,
              fontFamily: 'var(--font-body)',
              cursor: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, opacity: active ? 1 : 0.3 }} />
            {label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={formatted} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
            tickLine={false}
            axisLine={false}
            interval={6}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {showRate && (
            <Line
              type="monotone"
              dataKey="rate"
              name="Completion %"
              stroke="#C8F135"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#C8F135' }}
            />
          )}
          {showMood && (
            <Line
              type="monotone"
              dataKey="mood"
              name="Mood"
              stroke="#A78BFA"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#A78BFA' }}
            />
          )}
          {showEnergy && (
            <Line
              type="monotone"
              dataKey="energy"
              name="Energy"
              stroke="#2DD4BF"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#2DD4BF' }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
