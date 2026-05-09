import { useEffect } from 'react';
import { motion } from 'framer-motion';
import useStatsStore from '../../stores/statsStore';
import useHabitStore from '../../stores/habitStore';
import HeatmapGrid from '../../components/stats/HeatmapGrid';
import TrendChart from '../../components/stats/TrendChart';
import WeeklyChart from '../../components/stats/WeeklyChart';
import RadarChartComponent from '../../components/stats/RadarChart';
import CountUp from '../../components/ui/CountUp';
import PageTransition from '../../components/layout/PageTransition';
import { StatsPageSkeleton } from '../../components/ui/Skeletons';
import RescheduleSuggestions from '../../components/analytics/RescheduleSuggestions';
import CascadeInsights from '../../components/analytics/CascadeInsights';
import MoodCorrelationChart from '../../components/analytics/MoodCorrelationChart';

const METRIC_CARDS = [
  { key: 'completionRate30d', label: '30D COMPLETION', suffix: '%', color: 'var(--accent)' },
  { key: 'activeStreaks', label: 'ACTIVE STREAKS', suffix: '', color: 'var(--teal)' },
  { key: 'totalXP', label: 'TOTAL XP', suffix: '', color: 'var(--violet)' },
  { key: 'weeklyScore', label: 'WEEKLY SCORE', suffix: '', color: 'var(--amber)' },
];

export default function Stats() {
  const { overview, heatmap, trends, weekly, fetchOverview, fetchHeatmap, fetchTrends, fetchWeekly, loading } = useStatsStore();
  const { habits } = useHabitStore();

  useEffect(() => {
    fetchOverview();
    fetchHeatmap();
    fetchTrends();
    fetchWeekly();
  }, []);

  if (loading?.overview && !overview) {
    return (
      <PageTransition>
        <div className="page-content"><StatsPageSkeleton /></div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="page-content">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.1em', marginBottom: 6 }}>PERFORMANCE METRICS</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--text-primary)', margin: 0 }}>Analytics</h1>
        </div>

        {/* Metric Cards Row */}
        <div className="stats-metric-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {METRIC_CARDS.map((card, i) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{
                padding: '20px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderTop: `2px solid ${card.color}`,
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.1em', marginBottom: 8 }}>
                {card.label}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 28, color: card.color }}>
                <CountUp value={overview?.[card.key] || 0} suffix={card.suffix} duration={1400} />
              </div>
              {card.key === 'weeklyScore' && overview?.lastWeekScore > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                  Last week: {overview.lastWeekScore}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* AI: Reschedule Suggestions */}
        <RescheduleSuggestions />

        {/* AI: Cascade / Habit Correlations */}
        <CascadeInsights />

        {/* Mood × Habits Correlation */}
        <MoodCorrelationChart />

        {/* Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ padding: 24, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', marginBottom: 16, overflowX: 'auto' }}
        >
          <SectionHeader label="84-DAY ACTIVITY" />
          <HeatmapGrid data={heatmap} />
        </motion.div>

        {/* Trend + Weekly */}
        <div className="stats-chart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ padding: 24, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}
          >
            <SectionHeader label="30-DAY TREND" />
            <TrendChart data={trends} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            style={{ padding: 24, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}
          >
            <SectionHeader label="DAY OF WEEK" />
            <WeeklyChart data={weekly} />
          </motion.div>
        </div>

        {/* Radar + Category Stats */}
        <div className="stats-chart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ padding: 24, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}
          >
            <SectionHeader label="CATEGORY RADAR" />
            <RadarChartComponent habits={habits} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            style={{ padding: 24, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}
          >
            <SectionHeader label="HABIT BREAKDOWN" />
            <HabitStatsTable habits={habits} />
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}

function SectionHeader({ label }) {
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 16 }}>
      {label}
    </div>
  );
}

function HabitStatsTable({ habits }) {
  const active = habits.filter(h => !h.isArchived);
  if (active.length === 0) return <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No habits yet.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 240, overflowY: 'auto' }}>
      {active.map(h => {
        const days = Math.max(1, Math.floor((Date.now() - new Date(h.createdAt)) / 86400000));
        const rate = Math.min(Math.round((h.totalCompletions / days) * 100), 100);
        return (
          <div key={h._id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{h.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{h.name}</div>
              <div style={{ height: 3, background: 'var(--border-subtle)', borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${rate}%`, background: h.color || 'var(--accent)', borderRadius: 99 }} />
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0, width: 36, textAlign: 'right' }}>
              {rate}%
            </div>
          </div>
        );
      })}
    </div>
  );
}
