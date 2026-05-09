import { motion } from 'framer-motion';
import useAnalyticsStore from '../../stores/analyticsStore';

const CELL_SIZE = 13;
const GAP = 2;

const getRateColor = (rate) => {
  if (rate === null || rate === 0) return '#0F0F0F';
  if (rate <= 25) return '#2A3A00';
  if (rate <= 50) return '#5C7A00';
  if (rate <= 75) return '#8CB400';
  return '#C8F135';
};

export default function HeatmapGrid({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: '20px 0' }}>
        No data yet — start completing habits!
      </div>
    );
  }

  // Group into weeks (columns)
  const weeks = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <div style={{ display: 'flex', gap: GAP }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, paddingTop: 20 }}>
          {dayLabels.map(d => (
            <div key={d} style={{
              height: CELL_SIZE,
              fontSize: 9,
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              paddingRight: 4,
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'flex', gap: GAP, overflowX: 'auto' }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
              {/* Month label on first day of month */}
              <div style={{ height: 16, fontSize: 9, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                {week[0] && new Date(week[0].date).getDate() <= 7
                  ? new Date(week[0].date).toLocaleString('default', { month: 'short' })
                  : ''}
              </div>
              {week.map((day, di) => (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: (wi * 7 + di) * 0.008 }}
                  title={`${day.date}: ${day.rate}% (${day.count} completed)`}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    borderRadius: 3,
                    background: getRateColor(day.rate),
                    border: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'none',
                    transition: 'transform 0.1s ease',
                  }}
                  whileHover={{ scale: 1.4 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>Less</span>
        {[0, 10, 40, 65, 90].map(rate => (
          <div key={rate} style={{
            width: CELL_SIZE, height: CELL_SIZE,
            borderRadius: 3, background: getRateColor(rate),
            border: '1px solid rgba(255,255,255,0.04)',
          }} />
        ))}
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>More</span>
      </div>
    </div>
  );
}
