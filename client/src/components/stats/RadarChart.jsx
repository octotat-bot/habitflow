import {
  RadarChart as RechartsRadar, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';

export default function RadarChartComponent({ habits = [] }) {
  const categories = ['Mind', 'Body', 'Work', 'Social', 'Creative', 'Finance', 'Spirit'];

  const data = categories.map(cat => {
    const catHabits = habits.filter(h => h.category === cat && !h.isArchived);
    const avgRate = catHabits.length > 0
      ? Math.round(catHabits.reduce((sum, h) => {
          const total = Math.max(h.totalCompletions || 0, 0);
          const days = Math.max(Math.floor((Date.now() - new Date(h.createdAt)) / 86400000), 1);
          return sum + Math.min(Math.round((total / days) * 100), 100);
        }, 0) / catHabits.length)
      : 0;
    return { category: cat, value: avgRate };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RechartsRadar data={data}>
        <PolarGrid stroke="var(--border-subtle)" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
        />
        <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
        <Radar
          name="Completion"
          dataKey="value"
          stroke="var(--accent)"
          fill="var(--accent)"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-mid)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}>
                {payload[0].payload.category}: {payload[0].value}%
              </div>
            );
          }}
        />
      </RechartsRadar>
    </ResponsiveContainer>
  );
}
