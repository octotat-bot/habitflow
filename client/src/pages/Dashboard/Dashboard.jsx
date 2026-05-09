import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  format, subDays, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, isToday,
  addMonths, subMonths, parseISO, getISOWeek,
} from 'date-fns';
import useHabitStore from '../../stores/habitStore';
import useUserStore from '../../stores/userStore';
import useUIStore from '../../stores/uiStore';
import HabitDrawer from '../../components/habits/HabitDrawer';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { getDynamicGreeting } from '../../lib/dateUtils';
import { notificationService } from '../../lib/NotificationService';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { DashboardSkeleton } from '../../components/ui/Skeletons';
import usePageTitle from '../../hooks/usePageTitle';
import WeeklyNarrative from '../../components/dashboard/WeeklyNarrative';
import AutopsyModal from '../../components/streaks/AutopsyModal';
import TodayProgress from '../../components/dashboard/TodayProgress';

const DAY_ABBR = ['S','M','T','W','T','F','S'];

function getGridDays(n = 29) {
  return Array.from({ length: n + 1 }, (_, i) =>
    format(subDays(new Date(), n - i), 'yyyy-MM-dd')
  );
}

export default function Dashboard() {
  const { habits, todayCompletions, markComplete, undoComplete, archiveHabit, reorderHabits } = useHabitStore();
  const { user } = useUserStore();
  const { openDrawer } = useUIStore();
  const navigate = useNavigate();

  const [filter, setFilter]         = useState('All');
  const [completionMap, setMap]     = useState({});
  const [calMonth, setCalMonth]     = useState(new Date());
  const [rawComp, setRawComp]       = useState([]);
  const [showRitual, setShowRitual] = useState(false);
  const [menuOpen, setMenuOpen]     = useState(null);
  const [dragOver, setDragOver]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [confirm, setConfirm]       = useState(null); // { habitId, habitName }
  const dragItem = useRef(null);
  const shownRef = useRef(false);

  usePageTitle('Dashboard');

  // Start notification scheduler
  useEffect(() => {
    notificationService.start(
      () => useHabitStore.getState().habits,
      () => new Set(useHabitStore.getState().todayCompletions.map(c => c.habitId))
    );
    return () => notificationService.stop();
  }, []);

  const gridDays   = getGridDays(29);
  const today      = format(new Date(), 'yyyy-MM-dd');
  const active     = habits.filter(h => !h.isArchived);
  const filtered   = filter === 'All' ? active : active.filter(h => h.category === filter);
  const doneToday  = todayCompletions.length;
  const totalToday = active.length;
  const allDone    = totalToday > 0 && doneToday >= totalToday;

  const greeting = getDynamicGreeting();
  const gParts   = greeting.split(' ');
  const gWord1   = gParts.slice(0, -1).join(' ');
  const gWord2   = gParts[gParts.length - 1];

  const fetchingRef = useRef(false);

  useEffect(() => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    const start = format(subDays(new Date(), 29), 'yyyy-MM-dd');
    api.get(`/completions/range?start=${start}&end=${today}`)
      .then(r => {
        setRawComp(r.data.completions);
        const serverMap = {};
        for (const c of r.data.completions) serverMap[`${c.habitId}_${c.date}`] = true;
        setMap(prev => ({ ...serverMap, ...prev }));
      })
      .catch(() => {})
      .finally(() => { fetchingRef.current = false; setLoading(false); });
  }, [habits.length]);

  // Merge server-polled today completions into the local map in real time
  useEffect(() => {
    if (!todayCompletions.length) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    setMap(prev => {
      const next = { ...prev };
      for (const c of todayCompletions) {
        next[`${c.habitId}_${c.date || today}`] = true;
      }
      return next;
    });
  }, [todayCompletions]);

  const bestStreak = active.reduce(
    (b, h) => (h.currentStreak||0) > b.val ? { val: h.currentStreak, name: h.name } : b,
    { val: 0, name: '' }
  );
  const totalDone = active.reduce((s, h) => s + (h.totalCompletions||0), 0);

  const calcRate = (days) => {
    if (!totalToday) return 0;
    let done = 0, poss = 0;
    for (let i = 0; i < days; i++) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      for (const h of active) { poss++; if (completionMap[`${h._id}_${d}`]) done++; }
    }
    return poss > 0 ? Math.round((done / poss) * 100) : 0;
  };

  const rate30 = calcRate(30);
  const rate14 = calcRate(14);

  const momentum = (() => {
    const tw = rawComp.filter(c => new Date(c.date) >= subDays(new Date(), 6)).length;
    const lw = rawComp.filter(c => new Date(c.date) >= subDays(new Date(), 13) && new Date(c.date) < subDays(new Date(), 6)).length;
    return tw - lw;
  })();

  const trend30 = Array.from({ length: 30 }, (_, i) => {
    const d = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
    const done = active.filter(h => completionMap[`${h._id}_${d}`]).length;
    return { date: d, pct: totalToday > 0 ? Math.round((done / totalToday) * 100) : 0 };
  });

  const calData = (() => {
    const byDate = {};
    for (const c of rawComp) byDate[c.date] = (byDate[c.date]||0) + 1;
    const r = {};
    for (const [d, n] of Object.entries(byDate))
      r[d] = totalToday > 0 ? Math.round((n / totalToday) * 100) : 0;
    return r;
  })();

  const habitsLeft = totalToday - doneToday;
  const insights = [
    bestStreak.val > 0 && bestStreak.name && `${bestStreak.name} is your anchor — ${bestStreak.val}d streak.`,
    habitsLeft > 0 && `Complete ${habitsLeft} more habit${habitsLeft > 1 ? 's' : ''} to hit a perfect day.`,
    rate30 >= 70 && `${rate30}% 30-day rate — you're on a roll.`,
    momentum > 0 && `Momentum up +${momentum} completions vs last week.`,
    !bestStreak.name && 'Complete habits to unlock insights.',
  ].filter(Boolean).slice(0, 4);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const sessionKey = `ritual_shown_${today}`;
    if (allDone && doneToday > 0 && !sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      setShowRitual(true);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 }, colors: ['#5B9A2F','#C3DE94','#fff'] });
      setTimeout(() => setShowRitual(false), 1800);
    }
  }, [allDone, doneToday]);

  // Build an id map: 'habitId_date' → completion _id (needed for undo/delete)
  const idMap = {};
  for (const c of rawComp) {
    if (c._id) idMap[`${c.habitId}_${c.date}`] = c._id;
  }
  // Also pull from todayCompletions (which may have real IDs from the store)
  for (const c of todayCompletions) {
    const key = `${c.habitId}_${c.date || today}`;
    if (c._id && !c._id.startsWith('temp_')) idMap[key] = c._id;
  }

  const handleCheck = async (habitId, date) => {
    const key = `${habitId}_${date}`;

    // ── UNCHECK (already done) ──
    if (completionMap[key]) {
      const completionId = idMap[key];
      if (!completionId) {
        toast.error('Cannot undo — completion ID not found');
        return;
      }
      // Optimistic uncheck
      setMap(p => { const n = { ...p }; delete n[key]; return n; });
      setRawComp(prev => prev.filter(c => c._id !== completionId));
      try {
        if (date === today) {
          await undoComplete(completionId, habitId);
        } else {
          await api.delete(`/completions/${completionId}`);
        }
        toast.success('Unmarked ✓');
      } catch {
        // Revert
        setMap(p => ({ ...p, [key]: true }));
        toast.error('Failed to unmark');
      }
      return;
    }

    // ── CHECK (not yet done) ──
    setMap(p => ({ ...p, [key]: true }));
    try {
      if (date === today) {
        const result = await markComplete(habitId, date);
        // Store the real completion ID so undo works immediately
        if (result?.completion?._id) {
          setRawComp(prev => [...prev, { _id: result.completion._id, habitId, date }]);
        }
      } else {
        const { data } = await api.post('/completions', { habitId, date });
        if (data?.completion?._id) {
          setRawComp(prev => [...prev, { _id: data.completion._id, habitId, date }]);
        }
      }
    } catch (err) {
      if (err.response?.status === 409) return; // already done — keep checked
      setMap(p => { const n = { ...p }; delete n[key]; return n; });
      toast.error('Failed to mark complete');
    }
  };

  const handleDragStart = (habitId) => { dragItem.current = habitId; };
  const handleDragOver  = (e, habitId) => { e.preventDefault(); setDragOver(habitId); };
  const handleDrop = async (targetId) => {
    setDragOver(null);
    if (!dragItem.current || dragItem.current === targetId) return;
    const ids = active.map(h => h._id);
    const fromIdx = ids.indexOf(dragItem.current);
    const toIdx   = ids.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const reordered = [...ids];
    reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, dragItem.current);
    dragItem.current = null;
    await reorderHabits(reordered);
  };

  const categories = ['All', ...new Set(active.map(h => h.category))];
  const calStart   = startOfMonth(calMonth);
  const calDays    = eachDayOfInterval({ start: calStart, end: endOfMonth(calMonth) });
  const startDow   = getDay(calStart);

  /* ─────────────── styles ─────────────── */
  const S = {
    page:    { background: 'var(--bg-base)', minHeight: '100vh', paddingBottom: 64 },
    wrap:    { padding: '32px 28px 0' },
    label:   { fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)', marginBottom: 10, display: 'block' },
    card:    { background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14 },
  };

  return (
    <div style={S.page}>

      {/* Confirm modal for destructive actions */}
      <ConfirmModal
        open={!!confirm}
        title={`Archive "${confirm?.habitName}"?`}
        message="It'll be removed from your grid. You can restore it from Settings → Archived."
        confirmLabel="Archive"
        danger
        onConfirm={async () => {
          await archiveHabit(confirm.habitId);
          toast.success(`"${confirm.habitName}" archived`);
          setConfirm(null);
          setMenuOpen(null);
        }}
        onCancel={() => setConfirm(null)}
      />

      {/* Skeleton while first load — not on background polls */}
      {(loading && habits.length === 0) && (
        <div style={{ padding: '32px 28px 0' }}>
          <DashboardSkeleton rows={4} cols={15} />
        </div>
      )}

      {/* Ritual flash */}
      <AnimatePresence>
        {showRitual && (
          <motion.div key="r" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, pointerEvents: 'none', background: 'rgba(238,245,228,0.8)' }}>
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 1.05 }}
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 48, color: 'var(--accent)', letterSpacing: '0.03em' }}>
              RITUAL COMPLETE ✓
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Autopsy Modal */}
      <AutopsyModal />

      <div className="dashboard-wrap" style={S.wrap}>

        {/* AI Weekly Narrative */}
        <WeeklyNarrative />

        {/* ══ TODAY'S PROGRESS RING ══ */}
        <TodayProgress />

        {/* ══ HEADER ══ */}
        <div className="dashboard-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div className="dashboard-header-greeting" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, lineHeight: 1.0, letterSpacing: '-0.02em' }}>
              <span style={{ color: 'var(--text-primary)' }}>{gWord1} </span>
              <span style={{ color: 'var(--accent)' }}>{gWord2}</span>
            </div>
            <div className="dashboard-header-meta" style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginTop: 6 }}>
              {format(new Date(), 'EEE').toUpperCase()} · {format(new Date(), 'd MMM yyyy').toUpperCase()} · WEEK {getISOWeek(new Date())}
            </div>
          </div>

          <div className="dashboard-header-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1A1916', color: '#F5F4EF', padding: '5px 14px', borderRadius: 99, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                LVL {user?.level || 1} · OBSIDIAN RITUAL
              </div>
              {/* XP bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 80, height: 4, background: '#E0DDD6', borderRadius: 99, overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(((user?.xp||0) % 1000) / 10, 100)}%` }}
                    transition={{ duration: 1, ease: [0.16,1,0.3,1] }}
                    style={{ height: '100%', background: 'var(--accent)', borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                  {user?.xp || 0} XP
                </span>
              </div>
              <div style={{ background: 'var(--accent-light)', border: '1.5px solid var(--accent)', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: 'var(--accent-dim)', whiteSpace: 'nowrap' }}>
                WK {(user?.weeklyScore || 0).toLocaleString()}
              </div>
            </div>
            <button onClick={() => openDrawer('create')} className="btn btn-accent" style={{ padding: '8px 18px', fontSize: 13 }}>
              + Add Habit
            </button>
          </div>
        </div>

        {/* ══ 6 STAT CARDS ══ */}
        <div className="dashboard-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 28 }}>
          {[
            { v: `${doneToday}/${totalToday}`, l: 'TODAY',        s: `${totalToday > 0 ? Math.round((doneToday/totalToday)*100) : 0}% complete`, sc: 'var(--accent)' },
            { v: bestStreak.val,               l: 'BEST STREAK',  s: bestStreak.name || '—' },
            { v: `${rate30}%`,                 l: '30-DAY RATE',  s: 'completion rate' },
            { v: user?.weeklyScore || 0,       l: 'WEEKLY SCORE', s: momentum >= 0 ? `↑ ${momentum} vs last wk` : `↓ ${Math.abs(momentum)} vs last wk`, vc: 'var(--amber)', sc: momentum >= 0 ? 'var(--accent)' : 'var(--red)' },
            { v: totalDone,                    l: 'TOTAL DONE',   s: 'all time' },
            { v: user?.xp || 0,                l: 'TOTAL XP',     s: `level ${user?.level || 1}` },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ ...S.card, padding: '16px 14px' }}>
              <div className="dashboard-stat-value" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: s.vc || 'var(--text-primary)', lineHeight: 1, marginBottom: 4 }}>{s.v}</div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 3 }}>{s.l}</div>
              <div style={{ fontSize: 11, color: s.sc || 'var(--text-secondary)' }}>{s.s}</div>
            </motion.div>
          ))}
        </div>

        {/* ══ HABIT GRID ══ */}
        <div className="dashboard-habit-grid-section" style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={S.label}>HABIT GRID · LAST 30 DAYS</span>
            <div style={{ display: 'flex', gap: 5 }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilter(cat)} style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: filter === cat ? 700 : 500, border: `1px solid ${filter === cat ? 'var(--accent)' : 'var(--border-mid)'}`, background: filter === cat ? 'var(--accent-light)' : 'transparent', color: filter === cat ? 'var(--accent-dim)' : 'var(--text-secondary)', cursor: 'pointer' }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ ...S.card, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600, width: 180, whiteSpace: 'nowrap' }}>Habit</th>
                    {gridDays.map(d => {
                      const isT = d === today;
                      return (
                        <th key={d} style={{ textAlign: 'center', padding: '8px 2px', fontSize: 9, color: isT ? 'var(--accent-dim)' : 'var(--text-tertiary)', fontWeight: isT ? 700 : 500, background: isT ? '#F4FAE9' : 'transparent', width: 36, whiteSpace: 'nowrap' }}>
                          {isT ? 'Today' : format(parseISO(d), 'M/d')}
                        </th>
                      );
                    })}
                    <th style={{ textAlign: 'center', padding: '8px 8px', fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600, whiteSpace: 'nowrap' }}>Streak</th>
                    <th style={{ textAlign: 'right', padding: '8px 16px', fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600 }}>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={gridDays.length + 4}>
                      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--text-primary)', marginBottom: 8 }}>
                          {active.length === 0 ? 'No habits yet' : `No ${filter} habits`}
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
                          {active.length === 0
                            ? 'Start your ritual. Add your first habit and track it every day.'
                            : `No habits in the ${filter} category.`}
                        </div>
                        <button onClick={() => openDrawer('create')} style={{ padding: '10px 24px', borderRadius: 99, background: 'var(--accent)', color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                          + Add Your First Habit
                        </button>
                      </div>
                    </td></tr>
                  ) : filtered.map((habit, idx) => {
                    const days  = Math.max(1, Math.floor((Date.now() - new Date(habit.createdAt)) / 86400000));
                    const rate  = Math.min(Math.round(((habit.totalCompletions||0) / days) * 100), 100);
                    const streak = habit.currentStreak || 0;
                    return (
                      <motion.tr key={habit._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }}
                        draggable
                        onDragStart={() => handleDragStart(habit._id)}
                        onDragOver={(e) => handleDragOver(e, habit._id)}
                        onDrop={() => handleDrop(habit._id)}
                        onDragEnd={() => setDragOver(null)}
                        style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: dragOver === habit._id ? 'var(--accent-light)' : idx % 2 === 0 ? 'var(--bg-surface)' : '#FAFAF8', position: 'relative', cursor: 'grab', outline: dragOver === habit._id ? '2px solid var(--accent)' : 'none', transition: 'background 0.12s' }}>
                        <td style={{ padding: '11px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div title="Drag to reorder" style={{ width: 16, color: 'var(--text-tertiary)', fontSize: 12, cursor: 'grab', flexShrink: 0, letterSpacing: -2 }}>⋮⋮</div>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: `${habit.color||'#5B9A2F'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{habit.icon || '●'}</div>
                            <div>
                              <div
                                onClick={() => navigate(`/habits/${habit._id}`)}
                                style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
                              >
                                {habit.name}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{habit.category}</div>
                            </div>
                          </div>
                        </td>
                        {gridDays.map(d => {
                          const done = completionMap[`${habit._id}_${d}`];
                          const isT  = d === today;
                          return (
                            <td key={d} style={{ textAlign: 'center', padding: '8px 2px', background: isT ? '#F4FAE9' : 'transparent' }}>
                              <motion.div
                                whileTap={{ scale: 0.75 }}
                                whileHover={{ scale: 1.08 }}
                                onClick={() => handleCheck(habit._id, d)}
                                title={done ? 'Click to unmark' : 'Click to mark done'}
                                style={{
                                  width: 26, height: 26, borderRadius: 6, margin: '0 auto',
                                  border: done ? 'none' : `1.5px solid ${isT ? 'var(--accent)' : 'var(--border-mid)'}`,
                                  background: done ? 'var(--accent)' : 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', transition: 'all 0.12s',
                                }}
                              >
                                {done && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                              </motion.div>
                            </td>
                          );
                        })}
                        <td style={{ textAlign: 'center', padding: '8px 6px', whiteSpace: 'nowrap' }}>
                          {streak > 0
                            ? <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>🔥 {streak}d</span>
                            : <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>—</span>}
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px 16px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: rate >= 80 ? 'var(--accent)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{rate}%</div>
                          <div style={{ width: 32, height: 3, background: 'var(--border-subtle)', borderRadius: 99, marginLeft: 'auto', marginTop: 4 }}>
                            <div style={{ height: '100%', width: `${rate}%`, background: rate >= 80 ? 'var(--accent)' : 'var(--border-bright)', borderRadius: 99 }} />
                          </div>
                        </td>
                        {/* 3-dot action menu */}
                        <td style={{ textAlign: 'center', padding: '8px 10px', position: 'relative' }}>
                          <button
                            onClick={() => setMenuOpen(menuOpen === habit._id ? null : habit._id)}
                            style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--border-mid)', background: 'var(--bg-base)', cursor: 'pointer', fontSize: 14, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >⋯</button>
                          <AnimatePresence>
                            {menuOpen === habit._id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.92, y: -4 }}
                                transition={{ duration: 0.12 }}
                                style={{ position: 'absolute', right: 8, top: 36, zIndex: 100, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 140 }}
                              >
                                {[['📊 View Detail', () => { navigate(`/habits/${habit._id}`); setMenuOpen(null); }],
                                  ['✏️ Edit', () => { openDrawer('edit', habit); setMenuOpen(null); }],
                                  ['🗄 Archive', () => { setConfirm({ habitId: habit._id, habitName: habit.name }); }],
                                ].map(([label, action]) => (
                                  <button key={label} onClick={action} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                  >{label}</button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ══ MOTIVATION · ANALYTICS ══ */}
        <span style={S.label}>MOTIVATION · ANALYTICS</span>
        <div className="dashboard-analytics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 28 }}>

          {/* Momentum — dark card */}
          <div style={{ background: '#1A1916', borderRadius: 14, padding: '22px 20px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#4A4A48', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>CURRENT MOMENTUM</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 44, color: 'var(--accent)', lineHeight: 1, marginBottom: 6 }}>
              {momentum >= 0 ? '+' : ''}{momentum}
            </div>
            <div style={{ fontSize: 12, color: '#666', fontFamily: 'var(--font-body)', marginBottom: 16 }}>
              {momentum >= 0 ? 'points above' : 'points below'} last week's score
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {trend30.slice(-14).map((d, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: d.pct >= 50 ? 'var(--accent)' : '#2A2A28' }} />
              ))}
            </div>
          </div>

          {/* 14-day card */}
          <div style={{ ...S.card, padding: '22px 20px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>LAST 14 DAYS</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 44, color: 'var(--text-primary)', lineHeight: 1, marginBottom: 6 }}>{rate14}%</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>completion rate</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {trend30.slice(-14).map((d, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: d.pct >= 80 ? '#1A1916' : d.pct >= 40 ? '#C3DE94' : '#E0DDD6' }} />
              ))}
            </div>
          </div>

          {/* Insights */}
          <div style={{ ...S.card, padding: '22px 20px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>INSIGHTS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {insights.map((ins, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 5 }} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ins}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ CALENDAR + 30-DAY TREND ══ */}
        <div className="dashboard-calendar-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>

          {/* Calendar */}
          <div style={{ ...S.card, padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                {format(calMonth, 'MMMM yyyy')}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setCalMonth(subMonths(calMonth, 1))} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--border-mid)', background: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                <button onClick={() => setCalMonth(addMonths(calMonth, 1))} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--border-mid)', background: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {DAY_ABBR.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', paddingBottom: 6 }}>{d}</div>)}
              {Array.from({ length: startDow }).map((_, i) => <div key={`e${i}`} />)}
              {calDays.map(day => {
                const ds  = format(day, 'yyyy-MM-dd');
                const pct = calData[ds] || 0;
                const isTd = isToday(day);
                const bg  = isTd ? 'var(--text-primary)' : pct >= 100 ? '#3A7A0F' : pct >= 70 ? '#5B9A2F' : pct >= 40 ? '#C3DE94' : pct > 0 ? '#EEF5E4' : 'transparent';
                const col = isTd || pct >= 70 ? 'white' : pct >= 40 ? '#3A5A10' : 'var(--text-primary)';
                return (
                  <div key={ds} style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, fontSize: 12, fontWeight: isTd || pct >= 70 ? 700 : 400, background: bg, color: col }}>
                    {format(day, 'd')}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 30-day trend bars */}
          <div style={{ ...S.card, padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
                30-DAY COMPLETION TREND
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--accent)' }}>{rate30}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 140 }}>
              {trend30.map((d, i) => (
                <motion.div key={d.date}
                  initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.015, ease: [0.16,1,0.3,1] }}
                  style={{
                    flex: 1, minWidth: 0,
                    height: `${Math.max(d.pct, 4)}%`,
                    background: d.pct >= 80 ? '#3A7A0F' : d.pct >= 50 ? '#5B9A2F' : d.pct >= 20 ? '#C3DE94' : '#E0DDD6',
                    borderRadius: '3px 3px 0 0',
                    transformOrigin: 'bottom',
                  }}
                  title={`${d.date}: ${d.pct}%`}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              {[29, 21, 14, 7, 0].map(n => (
                <span key={n} style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  {format(subDays(new Date(), n), 'MMM d')}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>

      <HabitDrawer />
    </div>
  );
}
