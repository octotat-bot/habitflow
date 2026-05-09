/**
 * MoodCorrelationChart — shows how mood correlates with habit completion rate
 * Uses last 30 days of journal mood data + completion history.
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import useHabitStore from '../../stores/habitStore';
import useUserStore from '../../stores/userStore';
import api from '../../lib/axios';

const MOODS = [
  { val: 1, emoji: '😞', label: 'Rough' },
  { val: 2, emoji: '😕', label: 'Meh' },
  { val: 3, emoji: '😐', label: 'Okay' },
  { val: 4, emoji: '😊', label: 'Good' },
  { val: 5, emoji: '🔥', label: 'Great' },
];

const MOOD_COLORS = { 1: '#E5534B', 2: '#FB923C', 3: '#E07B2A', 4: '#5B9A2F', 5: '#2AA198' };
const BASE_JOURNAL_KEY = 'habitflow_journal';

function loadJournal(userId) {
  const key = userId ? `${BASE_JOURNAL_KEY}_${userId}` : BASE_JOURNAL_KEY;
  try { return JSON.parse(localStorage.getItem(key) || '{}'); }
  catch { return {}; }
}

export default function MoodCorrelationChart() {
  const { habits } = useHabitStore();
  const { user }   = useUserStore();
  const [completions, setCompletions] = useState({});
  const [loading, setLoading]         = useState(true);

  const journal = loadJournal(user?._id);
  const active  = habits.filter(h => !h.isArchived);

  useEffect(() => {
    const start = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');
    api.get(`/completions/range?start=${start}&end=${today}`)
      .then(r => {
        const map = {};
        for (const c of r.data.completions) {
          if (!map[c.date]) map[c.date] = [];
          map[c.date].push(c.habitId);
        }
        setCompletions(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [habits.length]);

  // Build 30-day dataset
  const days = Array.from({ length: 30 }, (_, i) =>
    format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
  );

  const dataset = days
    .map(date => {
      const moodEntry = journal[date];
      const mood      = moodEntry?.mood || null;
      const done      = (completions[date] || []).length;
      const total     = active.length;
      const pct       = total > 0 ? Math.round((done / total) * 100) : null;
      return { date, mood, done, total, pct, label: format(parseISO(date), 'MMM d') };
    })
    .filter(d => d.mood !== null && d.pct !== null);

  // Correlation score (simple Pearson-like)
  const correlation = (() => {
    if (dataset.length < 5) return null;
    const n  = dataset.length;
    const mx = dataset.reduce((s, d) => s + d.mood, 0) / n;
    const my = dataset.reduce((s, d) => s + d.pct,  0) / n;
    const num = dataset.reduce((s, d) => s + (d.mood - mx) * (d.pct - my), 0);
    const dx  = Math.sqrt(dataset.reduce((s, d) => s + (d.mood - mx) ** 2, 0));
    const dy  = Math.sqrt(dataset.reduce((s, d) => s + (d.pct  - my) ** 2, 0));
    if (dx === 0 || dy === 0) return null;
    return (num / (dx * dy)).toFixed(2);
  })();

  // Per-mood average completion
  const byMood = MOODS.map(m => {
    const days = dataset.filter(d => d.mood === m.val);
    const avg  = days.length > 0
      ? Math.round(days.reduce((s, d) => s + d.pct, 0) / days.length)
      : null;
    return { ...m, avg, count: days.length };
  }).filter(m => m.avg !== null);

  // Time-series (30 days with both mood×5 scaled and pct)
  const timeSeries = days.map(date => {
    const entry = journal[date];
    const done  = (completions[date] || []).length;
    const total = active.length;
    return {
      label: format(parseISO(date), 'M/d'),
      mood: entry?.mood ? entry.mood * 20 : null, // scale to 0-100
      completion: total > 0 ? Math.round((done / total) * 100) : null,
    };
  });

  const noData = dataset.length < 3;

  if (loading) {
    return (
      <div style={{ padding: 24, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase' }}>MOOD × HABITS</div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Loading correlation data...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      style={{ padding: 24, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', marginBottom: 16 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: 4, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            MOOD × HABIT CORRELATION
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>
            How does your mood affect your habits?
          </div>
        </div>
        {correlation && (
          <div style={{ background: parseFloat(correlation) > 0.3 ? 'var(--accent-light)' : 'var(--bg-base)', border: `1.5px solid ${parseFloat(correlation) > 0.3 ? 'var(--accent)' : 'var(--border-mid)'}`, borderRadius: 10, padding: '8px 14px', textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 2 }}>Correlation</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: parseFloat(correlation) > 0.3 ? 'var(--accent-dim)' : 'var(--text-secondary)' }}>{correlation}</div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
              {parseFloat(correlation) > 0.5 ? 'Strong ↑' : parseFloat(correlation) > 0.2 ? 'Moderate' : 'Weak'}
            </div>
          </div>
        )}
      </div>

      {noData ? (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📓</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>Not enough data yet</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', maxWidth: 280, margin: '0 auto' }}>
            Log your mood in the Journal page for at least 3 days to see how it correlates with your habit completion.
          </div>
        </div>
      ) : (
        <>
          {/* Per-mood average bars */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.06em', marginBottom: 12, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              Average habit completion by mood
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {byMood.sort((a, b) => b.val - a.val).map(m => (
                <div key={m.val} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0, width: 24 }}>{m.emoji}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 36, flexShrink: 0, fontFamily: 'var(--font-mono)' }}>{m.label}</span>
                  <div style={{ flex: 1, height: 8, background: 'var(--bg-base)', borderRadius: 99, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${m.avg}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      style={{ height: '100%', background: MOOD_COLORS[m.val], borderRadius: 99 }}
                    />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: MOOD_COLORS[m.val], width: 36, textAlign: 'right' }}>{m.avg}%</span>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)', width: 40, flexShrink: 0, fontFamily: 'var(--font-mono)' }}>{m.count}d</span>
                </div>
              ))}
            </div>
          </div>

          {/* Time series overlay chart */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.06em', marginBottom: 12, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              30-day mood & completion trend
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={timeSeries} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }} interval={6} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', borderRadius: 8, fontSize: 12, fontFamily: 'var(--font-mono)' }}
                  formatter={(v, name) => [
                    name === 'mood' ? `${v / 20}/5` : `${v}%`,
                    name === 'mood' ? 'Mood' : 'Completion',
                  ]}
                />
                <Line type="monotone" dataKey="completion" stroke="var(--accent)" strokeWidth={2} dot={false} name="completion" connectNulls />
                <Line type="monotone" dataKey="mood" stroke="#7C5CBF" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="mood" connectNulls />
                <Legend iconType="line" wrapperStyle={{ fontSize: 10, fontFamily: 'var(--font-mono)', paddingTop: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Insight callout */}
          {correlation && parseFloat(correlation) > 0.3 && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 10, fontSize: 13, color: 'var(--accent-dim)', lineHeight: 1.5 }}>
              💡 <strong>Insight:</strong> Your data shows a {parseFloat(correlation) > 0.5 ? 'strong' : 'moderate'} positive correlation between your mood and habit completion. On your best mood days, you complete significantly more habits.
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
