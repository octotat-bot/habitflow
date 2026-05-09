import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useHabitStore from '../../stores/habitStore';
import useUIStore from '../../stores/uiStore';
import HabitDrawer from '../../components/habits/HabitDrawer';
import HabitSuggestions from '../../components/habits/HabitSuggestions';
import MiniDots from '../../components/habits/MiniDots';
import PageTransition from '../../components/layout/PageTransition';
import { HabitsPageSkeleton } from '../../components/ui/Skeletons';
import HabitTemplatesModal from '../../components/habits/HabitTemplatesModal';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { format, subDays } from 'date-fns';

const CATEGORIES = ['All', 'Mind', 'Body', 'Work', 'Social', 'Creative', 'Finance', 'Spirit', 'Custom'];
const CATEGORY_COLORS = { Mind: 'var(--violet)', Body: 'var(--teal)', Work: 'var(--amber)', Social: '#F472B6', Creative: '#FB923C', Finance: '#34D399', Spirit: '#A5B4FC', Custom: 'var(--text-secondary)', All: 'var(--text-secondary)' };

export default function HabitsPage() {
  const { habits, fetchHabits, deleteHabit, archiveHabit, pinHabit, loading: habitsLoading } = useHabitStore();
  const { openDrawer } = useUIStore();
  const [filter, setFilter] = useState('All');
  const [showArchived, setShowArchived] = useState(false);
  const [sort, setSort] = useState('streak');
  const [completionsRange, setCompletionsRange] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    const start = format(subDays(new Date(), 6), 'yyyy-MM-dd');
    const end = format(new Date(), 'yyyy-MM-dd');
    api.get(`/completions/range?start=${start}&end=${end}`)
      .then(r => setCompletionsRange(r.data.completions))
      .catch(() => {});
  }, [habits]);

  const activeHabits = habits.filter(h => !h.isArchived);
  const archivedHabits = habits.filter(h => h.isArchived);

  const filtered = activeHabits.filter(h => {
    if (filter === 'All') return true;
    if (filter === 'Pinned') return h.isPinned;
    return h.category === filter;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'streak') return (b.currentStreak || 0) - (a.currentStreak || 0);
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'rate') return (b.totalCompletions || 0) - (a.totalCompletions || 0);
    if (sort === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });

  const handleDelete = async (id) => {
    if (!confirm('Delete this habit and all its data?')) return;
    try {
      await deleteHabit(id);
      toast.success('Habit deleted');
    } catch { toast.error('Failed to delete'); }
    setMenuOpen(null);
  };

  return (
    <PageTransition>
      <div className="page-content">
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.1em', marginBottom: 6 }}>RITUAL LIBRARY</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--text-primary)', margin: 0 }}>
              My Habits
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--text-tertiary)', marginLeft: 12 }}>
                {activeHabits.length}
              </span>
            </h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <motion.button
                onClick={() => setShowTemplates(true)}
                whileTap={{ scale: 0.97 }}
                style={{ padding: '10px 16px', background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                📦 Templates
              </motion.button>
              <motion.button
                onClick={() => openDrawer('create')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{ padding: '10px 20px', background: 'var(--accent)', color: 'var(--bg-base)', border: 'none', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >
                + New Habit
              </motion.button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
          {[...CATEGORIES, 'Pinned'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${filter === cat ? (CATEGORY_COLORS[cat] || 'var(--accent)') : 'var(--border-subtle)'}`,
                background: filter === cat ? `${CATEGORY_COLORS[cat] || 'var(--accent)'}18` : 'transparent',
                color: filter === cat ? (CATEGORY_COLORS[cat] || 'var(--accent)') : 'var(--text-secondary)',
                fontSize: 12,
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                cursor: 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>SORT:</span>
          {[
            { key: 'streak', label: 'Streak ↓' },
            { key: 'name', label: 'Name' },
            { key: 'rate', label: 'Completions' },
            { key: 'date', label: 'Newest' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid ' + (sort === s.key ? 'var(--border-mid)' : 'var(--border-subtle)'),
                background: sort === s.key ? 'var(--bg-elevated)' : 'transparent',
                color: sort === s.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                cursor: 'none',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* AI Habit Suggestions */}
        <HabitSuggestions />

        {/* Habit Grid */}
        {(habitsLoading && habits.length === 0) ? (
          <HabitsPageSkeleton />
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
            No habits in this category.
          </div>
        ) : (
          <div className="habits-two-col" style={{
            columns: 2,
            columnGap: 16,
            marginBottom: 32,
          }}>
            {sorted.map((habit, idx) => (
              <HabitGridCard
                key={habit._id}
                habit={habit}
                idx={idx}
                completionsRange={completionsRange}
                menuOpen={menuOpen === habit._id}
                onMenuToggle={() => setMenuOpen(menuOpen === habit._id ? null : habit._id)}
                onEdit={() => { openDrawer('edit', habit); setMenuOpen(null); }}
                onPin={() => { pinHabit(habit._id); setMenuOpen(null); }}
                onArchive={() => { archiveHabit(habit._id); setMenuOpen(null); }}
                onDelete={() => handleDelete(habit._id)}
              />
            ))}
          </div>
        )}

        {/* Archived section */}
        {archivedHabits.length > 0 && (
          <div>
            <button
              onClick={() => setShowArchived(v => !v)}
              style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', cursor: 'none', marginBottom: 12 }}
            >
              {showArchived ? '▼' : '▶'} ARCHIVED ({archivedHabits.length})
            </button>
            <AnimatePresence>
              {showArchived && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  {archivedHabits.map(h => (
                    <div key={h._id} style={{ padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, opacity: 0.5 }}>
                      <span style={{ fontSize: 18 }}>{h.icon}</span>
                      <span style={{ flex: 1, fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: 14 }}>{h.name}</span>
                      <button onClick={() => archiveHabit(h._id)} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'none', fontFamily: 'var(--font-body)', fontWeight: 600 }}>Restore</button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
      <HabitTemplatesModal isOpen={showTemplates} onClose={() => setShowTemplates(false)} />
      <HabitDrawer />
    </PageTransition>
  );
}

function HabitGridCard({ habit, idx, completionsRange, menuOpen, onMenuToggle, onEdit, onPin, onArchive, onDelete }) {
  const totalDays = Math.max(1, Math.floor((Date.now() - new Date(habit.createdAt)) / 86400000));
  const rate = Math.min(Math.round((habit.totalCompletions / totalDays) * 100), 100);
  const CATEGORY_COLORS = { Mind: 'var(--violet)', Body: 'var(--teal)', Work: 'var(--amber)', Social: '#F472B6', Creative: '#FB923C', Finance: '#34D399', Spirit: '#A5B4FC', Custom: 'var(--text-secondary)' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      style={{
        breakInside: 'avoid',
        marginBottom: 16,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderLeft: `4px solid ${habit.color || '#C8F135'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        position: 'relative',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${habit.color}22`, border: `1px solid ${habit.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {habit.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {habit.name}
            {habit.isPinned && <span style={{ marginLeft: 6, fontSize: 12 }}>📌</span>}
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em', color: CATEGORY_COLORS[habit.category] || 'var(--text-tertiary)', background: `${CATEGORY_COLORS[habit.category]}18`, padding: '1px 6px', borderRadius: 4, border: `1px solid ${CATEGORY_COLORS[habit.category]}30` }}>
            {habit.category}
          </span>
        </div>
        {/* Menu */}
        <div style={{ position: 'relative' }}>
          <button onClick={onMenuToggle} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'none', fontSize: 18, padding: '2px 6px' }}>⋯</button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-md)', zIndex: 100, minWidth: 160, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}
              >
                {[
                  { label: 'Edit', action: onEdit },
                  { label: habit.isPinned ? 'Unpin' : 'Pin', action: onPin },
                  { label: 'Archive', action: onArchive },
                  { label: 'Delete', action: onDelete, danger: true },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', color: item.danger ? 'var(--red)' : 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'none', transition: 'background 0.15s ease' }}
                    onMouseEnter={e => e.target.style.background = 'var(--bg-surface)'}
                    onMouseLeave={e => e.target.style.background = 'none'}
                  >
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 7-day dots */}
      <div style={{ marginBottom: 12 }}>
        <MiniDots habitId={habit._id} color={habit.color} completionsRange={completionsRange} />
      </div>

      {/* Streak */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <span className={habit.currentStreak >= 7 ? 'streak-glow' : ''} style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18, color: habit.currentStreak >= 7 ? 'var(--accent)' : 'var(--text-secondary)' }}>
            🔥 {habit.currentStreak || 0}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 4 }}>
            best: {habit.bestStreak || 0}d
          </span>
        </div>
        {habit.stackedAfterId && (
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>🔗 stacked</span>
        )}
      </div>

      {/* Completion rate bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>COMPLETION</span>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{rate}%</span>
        </div>
        <div style={{ height: 3, background: 'var(--border-subtle)', borderRadius: 99 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${rate}%` }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: idx * 0.05 }}
            style={{ height: '100%', background: habit.color || 'var(--accent)', borderRadius: 99 }}
          />
        </div>
      </div>
    </motion.div>
  );
}
