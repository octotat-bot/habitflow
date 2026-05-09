import usePageTitle from '../../hooks/usePageTitle.js';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, getISOWeek } from 'date-fns';
import api from '../../lib/axios';
import useHabitStore from '../../stores/habitStore';
import useUserStore from '../../stores/userStore';

const DAY_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeeklyDigest() {
  const { habits } = useHabitStore();
  const { user }   = useUserStore();
  const active     = habits.filter(h => !h.isArchived);

  const [completions, setCompletions] = useState([]);
  const [loading, setLoading]         = useState(true);

  // This week (Mon–Sun) and last week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(new Date(), { weekStartsOn: 1 });
  const lastWeekStart = subDays(weekStart, 7);
  const lastWeekEnd   = subDays(weekEnd, 7);

  useEffect(() => {
    const start = format(lastWeekStart, 'yyyy-MM-dd');
    const end   = format(weekEnd, 'yyyy-MM-dd');
    api.get(`/completions/range?start=${start}&end=${end}`)
      .then(r => { setCompletions(r.data.completions); setLoading(false); })
      .catch(() => setLoading(false));
  }, [habits.length]);

  const doneSet = new Set(completions.map(c => `${c.habitId}_${c.date}`));

  const weekDays    = eachDayOfInterval({ start: weekStart,     end: weekEnd });
  const lastWeekDays = eachDayOfInterval({ start: lastWeekStart, end: lastWeekEnd });

  const rateForDays = (days) => {
    if (!active.length) return 0;
    let done = 0, total = 0;
    for (const day of days) {
      const ds = format(day, 'yyyy-MM-dd');
      if (new Date(ds) > new Date()) continue;
      for (const h of active) { total++; if (doneSet.has(`${h._id}_${ds}`)) done++; }
    }
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  const thisRate = rateForDays(weekDays);
  const lastRate = rateForDays(lastWeekDays);
  const delta    = thisRate - lastRate;

  // Per-day completion count this week
  const dailyCounts = weekDays.map(day => {
    const ds   = format(day, 'yyyy-MM-dd');
    const done = active.filter(h => doneSet.has(`${h._id}_${ds}`)).length;
    const isFuture = new Date(ds) > new Date();
    return { day: day.getDay(), ds, done, total: active.length, isFuture };
  });

  // Per-habit performance this week
  const habitPerf = active.map(h => {
    const done = weekDays.filter(d => {
      const ds = format(d, 'yyyy-MM-dd');
      return new Date(ds) <= new Date() && doneSet.has(`${h._id}_${ds}`);
    }).length;
    const possible = weekDays.filter(d => new Date(d) <= new Date()).length;
    return { ...h, done, possible, rate: possible > 0 ? Math.round((done / possible) * 100) : 0 };
  }).sort((a, b) => b.rate - a.rate);

  // Highlights
  const perfectDays  = dailyCounts.filter(d => !d.isFuture && d.done === d.total && d.total > 0).length;
  const bestHabit    = habitPerf[0];
  const strugHabit   = habitPerf[habitPerf.length - 1];
  const totalDoneWk  = completions.filter(c => new Date(c.date) >= weekStart).length;

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', paddingBottom: 64 }}>
      <div style={{ padding: '28px 28px 0' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
            WEEK {getISOWeek(new Date())} · {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 38, color: 'var(--text-primary)', margin: '0 0 6px', lineHeight: 1 }}>
            Weekly <span style={{ color: 'var(--accent)' }}>Review</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Your habit performance at a glance.
          </p>
        </div>

        {/* ── 4 Big Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            {
              v: `${thisRate}%`,
              l: 'This Week',
              s: delta >= 0 ? `↑ +${delta}% vs last week` : `↓ ${delta}% vs last week`,
              vc: 'var(--text-primary)',
              sc: delta >= 0 ? 'var(--accent)' : 'var(--red)',
            },
            { v: lastRate + '%', l: 'Last Week',    s: 'completion rate' },
            { v: perfectDays,    l: 'Perfect Days', s: `${perfectDays === 7 ? '🏆 flawless week!' : 'all habits done'}` },
            { v: totalDoneWk,   l: 'Completions',  s: 'this week total' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '18px 16px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: s.vc || 'var(--text-primary)', lineHeight: 1, marginBottom: 4 }}>{s.v}</div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 3 }}>{s.l}</div>
              <div style={{ fontSize: 11, color: s.sc || 'var(--text-secondary)' }}>{s.s}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Day-by-day bar chart ── */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '20px', marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 16, fontFamily: 'var(--font-body)' }}>
            THIS WEEK — DAY BY DAY
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, alignItems: 'end', height: 120 }}>
            {dailyCounts.map((d, i) => {
              const pct = d.total > 0 ? (d.done / d.total) * 100 : 0;
              const isTodays = d.ds === format(new Date(), 'yyyy-MM-dd');
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  {!d.isFuture && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: pct === 100 ? 'var(--accent)' : 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                      {Math.round(pct)}%
                    </div>
                  )}
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: d.isFuture ? 4 : `${Math.max(pct, 4)}%` }}
                    transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      width: '100%', minHeight: 4,
                      background: d.isFuture ? '#F0EDE8' : pct === 100 ? '#3A7A0F' : pct >= 60 ? '#5B9A2F' : pct >= 30 ? '#C3DE94' : '#E0DDD6',
                      borderRadius: '4px 4px 0 0',
                      border: isTodays ? '2px solid var(--accent)' : 'none',
                    }}
                  />
                  <div style={{ fontSize: 10, fontWeight: isTodays ? 700 : 500, color: isTodays ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                    {DAY_FULL[d.day]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Habit Leaderboard + Highlights ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 20 }}>

          {/* Habit rankings */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '20px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 14, fontFamily: 'var(--font-body)' }}>
              HABIT RANKINGS THIS WEEK
            </div>
            {loading ? (
              <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Loading...</div>
            ) : habitPerf.length === 0 ? (
              <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No habits yet.</div>
            ) : habitPerf.map((h, i) => (
              <div key={h._id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: i === 0 ? 'var(--amber)' : 'var(--text-tertiary)', width: 20 }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{h.icon || '●'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</div>
                  <div style={{ height: 4, background: '#F0EDE8', borderRadius: 99, marginTop: 4, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${h.rate}%` }}
                      transition={{ duration: 0.7, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                      style={{ height: '100%', background: h.color || 'var(--accent)', borderRadius: 99 }}
                    />
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: h.rate >= 80 ? 'var(--accent)' : 'var(--text-secondary)', flexShrink: 0 }}>
                  {h.done}/{h.possible}
                </span>
              </div>
            ))}
          </div>

          {/* Highlights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* XP summary */}
            <div style={{ background: '#1A1916', borderRadius: 14, padding: '20px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#4A4A48', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>YOUR LEVEL</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, color: 'var(--accent)', lineHeight: 1 }}>LVL {user?.level || 1}</div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{user?.xp || 0} XP total</div>
              <div style={{ height: 3, background: '#2A2A28', borderRadius: 99, marginTop: 12, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(((user?.xp || 0) % 1000) / 10, 100)}%`, background: 'var(--accent)', borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>{1000 - ((user?.xp || 0) % 1000)} XP to next level</div>
            </div>

            {/* Best + Needs work */}
            {bestHabit && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>⭐ STAR HABIT</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{bestHabit.icon || '●'}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{bestHabit.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--accent)' }}>{bestHabit.rate}% this week</div>
                  </div>
                </div>
              </div>
            )}
            {strugHabit && bestHabit?._id !== strugHabit._id && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--amber)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>⚠️ NEEDS FOCUS</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{strugHabit.icon || '●'}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{strugHabit.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--amber)' }}>Only {strugHabit.rate}% this week</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
