import { format, subDays } from 'date-fns';

/**
 * MiniDots — 7-day completion dots for habit cards
 */
export default function MiniDots({ habitId, color = '#C8F135', completionsRange = [] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const done = completionsRange.some(c => String(c.habitId) === String(habitId) && c.date === dateStr);
    return { dateStr, done };
  });

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {days.map(({ dateStr, done }, i) => (
        <div
          key={dateStr}
          title={dateStr}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: done ? color : 'var(--border-subtle)',
            border: done ? 'none' : '1px solid var(--border-mid)',
            boxShadow: done ? `0 0 4px ${color}80` : 'none',
            transition: 'all 0.2s ease',
          }}
        />
      ))}
    </div>
  );
}
