import usePageTitle from '../../hooks/usePageTitle.js';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  format, subDays, eachDayOfInterval, startOfMonth, endOfMonth,
  getDay, isToday, getISOWeek,
} from 'date-fns';
import api from '../../lib/axios';
import useHabitStore from '../../stores/habitStore';
import useUIStore from '../../stores/uiStore';
import toast from 'react-hot-toast';

const DAY_ABBR = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function HeatmapCell({ date, pct, isTodays }) {
  const bg = isTodays
    ? '#1A1916'
    : pct >= 100 ? '#3A7A0F'
    : pct >= 70  ? '#5B9A2F'
    : pct >= 40  ? '#C3DE94'
    : pct > 0    ? '#EEF5E4'
    : '#F0EDE8';
  return (
    <div title={`${date}: ${pct}%`} style={{
      width: 11, height: 11, borderRadius: 2,
      background: bg, flexShrink: 0,
    }} />
  );
}

export default function HabitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { habits, archiveHabit } = useHabitStore();
  const { openDrawer } = useUIStore();

  const [completions, setCompletions]   = useState([]);
  const [loading, setLoading]           = useState(true);

  const habit = habits.find(h => h._id === id);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const start = format(subDays(new Date(), 89), 'yyyy-MM-dd');
    const end   = format(new Date(), 'yyyy-MM-dd');
    api.get(`/completions/range?start=${start}&end=${end}&habitId=${id}`)
      .then(r => { setCompletions(r.data.completions); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (!habit) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
      Habit not found. <button onClick={() => navigate('/')} style={{ color: 'var(--accent)', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700 }}>← Back</button>
    </div>
  );

  // Build 90-day heatmap data
  const today = format(new Date(), 'yyyy-MM-dd');
  const doneSet = new Set(completions.map(c => c.date));
  const days90 = Array.from({ length: 90 }, (_, i) => {
    const d = format(subDays(new Date(), 89 - i), 'yyyy-MM-dd');
    return { date: d, done: doneSet.has(d) };
  });

  // Streak history — 90 days
  const streakData = (() => {
    let streak = 0;
    return days90.map(d => {
      streak = d.done ? streak + 1 : 0;
      return { ...d, streak };
    });
  })();

  // Day-of-week completion analysis
  const dowCounts = Array(7).fill(0);
  const dowTotals = Array(7).fill(0);
  days90.forEach(d => {
    const dow = getDay(new Date(d.date + 'T12:00:00'));
    dowTotals[dow]++;
    if (d.done) dowCounts[dow]++;
  });
  const dowRates = dowTotals.map((t, i) => (t > 0 ? Math.round((dowCounts[i] / t) * 100) : 0));

  // Stats
  const totalDone  = completions.length;
  const days       = Math.max(1, Math.floor((Date.now() - new Date(habit.createdAt)) / 86400000));
  const rate       = Math.min(Math.round((totalDone / days) * 100), 100);
  const bestStreak = habit.bestStreak || 0;
  const curStreak  = habit.currentStreak || 0;
  const bestDow    = dowRates.indexOf(Math.max(...dowRates));

  // Weekly completion totals (last 12 weeks)
  const weeklyData = Array.from({ length: 12 }, (_, wi) => {
    const weekStart = subDays(new Date(), (11 - wi) * 7 + 6);
    let count = 0;
    for (let di = 0; di < 7; di++) {
      const d = format(subDays(new Date(), (11 - wi) * 7 + 6 - di), 'yyyy-MM-dd');
      if (doneSet.has(d)) count++;
    }
    return { week: `Wk ${getISOWeek(weekStart)}`, count };
  });

  const catColor = habit.color || '#5B9A2F';

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', paddingBottom: 64 }}>
      <div style={{ padding: '28px 28px 0' }}>

        {/* ── Back + Header ── */}
        <div style={{ marginBottom: 24 }}>
          <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 13, padding: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Back
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: `${catColor}20`, border: `2px solid ${catColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                {habit.icon || '✨'}
              </div>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--text-primary)', margin: 0, lineHeight: 1.1 }}>{habit.name}</h1>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: catColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{habit.category}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>·</span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Since {format(new Date(habit.createdAt), 'MMM d, yyyy')}</span>
                </div>
                {habit.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 0', maxWidth: 400 }}>{habit.description}</p>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => openDrawer('edit', habit)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-mid)', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                ✏️ Edit
              </button>
              <button onClick={async () => { await archiveHabit(id); toast.success('Archived'); navigate('/'); }} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-mid)', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                🗄 Archive
              </button>
            </div>
          </div>
        </div>

        {/* ── 4 Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { v: `${curStreak}d`, l: 'Current Streak', s: curStreak > 0 ? '🔥 Active' : 'Start today', vc: curStreak > 0 ? 'var(--amber)' : 'var(--text-primary)' },
            { v: `${bestStreak}d`, l: 'Best Streak',   s: 'personal best' },
            { v: `${rate}%`,      l: 'Completion Rate', s: `${totalDone} total completions` },
            { v: `${totalDone}`,  l: 'Times Done',      s: `over ${days} days` },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '18px 16px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: s.vc || 'var(--text-primary)', lineHeight: 1, marginBottom: 4 }}>{s.v}</div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 3 }}>{s.l}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.s}</div>
            </motion.div>
          ))}
        </div>

        {/* ── 90-Day Heatmap ── */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>90-DAY ACTIVITY</span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Less</span>
              {['#F0EDE8','#EEF5E4','#C3DE94','#5B9A2F','#3A7A0F'].map(c => (
                <div key={c} style={{ width: 11, height: 11, borderRadius: 2, background: c }} />
              ))}
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>More</span>
            </div>
          </div>
          {loading ? (
            <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Loading...</div>
          ) : (
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {days90.map(d => (
                <HeatmapCell key={d.date} date={d.date} pct={d.done ? 100 : 0} isTodays={d.date === today} />
              ))}
            </div>
          )}
        </div>

        {/* ── Bottom 2-col: Day-of-Week + Weekly Trend ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

          {/* Day of week breakdown */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '20px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 14, fontFamily: 'var(--font-body)' }}>
              BEST DAYS OF THE WEEK
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DAY_FULL.map((day, i) => (
                <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', width: 28, fontFamily: 'var(--font-body)' }}>{day}</span>
                  <div style={{ flex: 1, height: 8, background: '#F0EDE8', borderRadius: 99, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${dowRates[i]}%` }}
                      transition={{ duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                      style={{ height: '100%', background: i === bestDow ? catColor : '#C3DE94', borderRadius: 99 }}
                    />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: i === bestDow ? catColor : 'var(--text-secondary)', fontFamily: 'var(--font-mono)', width: 32, textAlign: 'right' }}>{dowRates[i]}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly bar chart */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '20px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 14, fontFamily: 'var(--font-body)' }}>
              WEEKLY COMPLETIONS (12 WKS)
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
              {weeklyData.map((w, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: `${(w.count / 7) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                    style={{ width: '100%', minHeight: 3, background: w.count >= 6 ? catColor : w.count >= 4 ? '#C3DE94' : '#E8E5E0', borderRadius: '3px 3px 0 0' }}
                  />
                  <span style={{ fontSize: 8, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', transform: 'rotate(-45deg)', transformOrigin: 'center' }}>{w.week}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Streak Timeline ── */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '20px', marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 14, fontFamily: 'var(--font-body)' }}>
            STREAK TIMELINE — LAST 90 DAYS
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 64 }}>
            {streakData.map((d, i) => (
              <motion.div key={d.date}
                initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                transition={{ duration: 0.4, delay: i * 0.005, ease: [0.16, 1, 0.3, 1] }}
                title={`${d.date}: streak ${d.streak}d`}
                style={{
                  flex: 1, minWidth: 0,
                  height: d.streak === 0 ? 3 : `${Math.min((d.streak / (bestStreak || 1)) * 100, 100)}%`,
                  background: d.streak === 0 ? '#F0EDE8' : d.streak >= 7 ? catColor : '#C3DE94',
                  borderRadius: '2px 2px 0 0',
                  transformOrigin: 'bottom',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              {format(subDays(new Date(), 89), 'MMM d')}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>Today</span>
          </div>
        </div>

      </div>
    </div>
  );
}
