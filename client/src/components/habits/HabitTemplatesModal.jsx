/**
 * HabitTemplatesModal — browse & add pre-built habit packs
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useHabitStore from '../../stores/habitStore';
import toast from 'react-hot-toast';

const PACKS = [
  {
    id: 'morning', name: 'Morning Ritual', emoji: '🌅', color: '#E07B2A',
    desc: 'Start every day with intention and energy',
    habits: [
      { name: 'Wake Up Early',     icon: '⏰', color: '#E07B2A', category: 'Mind',  frequency: 'daily', timeOfDay: 'dawn' },
      { name: 'Drink Water First', icon: '💦', color: '#60A5FA', category: 'Body',  frequency: 'daily', timeOfDay: 'morning' },
      { name: 'Meditate 10 min',   icon: '🧘', color: '#7C5CBF', category: 'Mind',  frequency: 'daily', timeOfDay: 'morning' },
      { name: 'No Phone 1st Hour', icon: '📵', color: '#6B8EC7', category: 'Mind',  frequency: 'daily', timeOfDay: 'morning' },
      { name: 'Cold Shower',       icon: '🚿', color: '#2AA198', category: 'Body',  frequency: 'daily', timeOfDay: 'morning' },
    ],
  },
  {
    id: 'fitness', name: 'Fitness Pack', emoji: '💪', color: '#2AA198',
    desc: 'Build a strong, healthy body every week',
    habits: [
      { name: 'Morning Run 30 min', icon: '🏃', color: '#2AA198', category: 'Body', frequency: 'daily', timeOfDay: 'morning' },
      { name: 'Drink 2L Water',     icon: '💧', color: '#60A5FA', category: 'Body', frequency: 'daily' },
      { name: 'Strength Training',  icon: '🏋️', color: '#E0567B', category: 'Body', frequency: 'custom', targetDaysOfWeek: [1,3,5] },
      { name: 'Stretch 10 min',     icon: '🤸', color: '#34D399', category: 'Body', frequency: 'daily', timeOfDay: 'evening' },
      { name: 'Sleep 8 Hours',      icon: '😴', color: '#7C5CBF', category: 'Body', frequency: 'daily', timeOfDay: 'night' },
    ],
  },
  {
    id: 'study', name: 'Study Pack', emoji: '📚', color: '#7C5CBF',
    desc: 'Accelerate learning and deep focus',
    habits: [
      { name: 'Read 20 Pages',    icon: '📖', color: '#7C5CBF', category: 'Mind', frequency: 'daily', timeOfDay: 'morning' },
      { name: 'Deep Work 2h',     icon: '🎯', color: '#E07B2A', category: 'Work', frequency: 'weekdays', timeOfDay: 'morning' },
      { name: 'Review Notes',     icon: '📝', color: '#5B9A2F', category: 'Mind', frequency: 'daily', timeOfDay: 'evening' },
      { name: 'No Social Media',  icon: '🚫', color: '#E5534B', category: 'Mind', frequency: 'weekdays' },
    ],
  },
  {
    id: 'mindfulness', name: 'Inner Peace', emoji: '☯️', color: '#6B8EC7',
    desc: 'Reduce stress and sharpen awareness',
    habits: [
      { name: 'Meditate 20 min',    icon: '🧘', color: '#6B8EC7', category: 'Mind',   frequency: 'daily', timeOfDay: 'morning' },
      { name: 'Gratitude Journal',  icon: '🙏', color: '#F472B6', category: 'Mind',   frequency: 'daily', timeOfDay: 'evening' },
      { name: 'Evening Walk',       icon: '🌿', color: '#34D399', category: 'Body',   frequency: 'daily', timeOfDay: 'evening' },
      { name: 'Digital Detox Hour', icon: '🌙', color: '#7C5CBF', category: 'Mind',   frequency: 'daily', timeOfDay: 'night' },
      { name: 'Breathing Exercise', icon: '💨', color: '#2AA198', category: 'Mind',   frequency: 'daily' },
    ],
  },
  {
    id: 'finance', name: 'Wealth Builder', emoji: '💰', color: '#34D399',
    desc: 'Build financial discipline daily',
    habits: [
      { name: 'Track All Spending', icon: '💳', color: '#34D399', category: 'Finance', frequency: 'daily', timeOfDay: 'evening' },
      { name: 'No Impulse Buys',    icon: '🛒', color: '#E5534B', category: 'Finance', frequency: 'daily' },
      { name: 'Read Finance News',  icon: '📈', color: '#E07B2A', category: 'Finance', frequency: 'weekdays', timeOfDay: 'morning' },
      { name: 'Add to Savings',     icon: '🏦', color: '#5B9A2F', category: 'Finance', frequency: 'weekdays' },
    ],
  },
  {
    id: 'creative', name: 'Creative Studio', emoji: '🎨', color: '#FB923C',
    desc: 'Build a consistent creative practice',
    habits: [
      { name: 'Write 500 Words', icon: '✍️', color: '#F472B6', category: 'Creative', frequency: 'daily', timeOfDay: 'morning' },
      { name: 'Sketch / Draw',   icon: '🎨', color: '#FB923C', category: 'Creative', frequency: 'daily' },
      { name: 'Learn 1 New Thing', icon: '💡', color: '#E07B2A', category: 'Mind',   frequency: 'daily', timeOfDay: 'evening' },
      { name: 'Share Your Work',  icon: '🌟', color: '#A5B4FC', category: 'Creative', frequency: 'weekends' },
    ],
  },
];

export default function HabitTemplatesModal({ isOpen, onClose }) {
  const { addHabit, habits } = useHabitStore();
  const [activePack, setActivePack]   = useState(null);
  const [selected, setSelected]       = useState([]);
  const [loading, setLoading]         = useState(false);

  const pack = PACKS.find(p => p.id === activePack);

  const toggle = (idx) =>
    setSelected(s => s.includes(idx) ? s.filter(i => i !== idx) : [...s, idx]);

  const handleAdd = async () => {
    if (!pack || selected.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(selected.map(i => addHabit(pack.habits[i])));
      toast.success(`✓ Added ${selected.length} habit${selected.length > 1 ? 's' : ''} from ${pack.name}`);
      setActivePack(null);
      setSelected([]);
      onClose();
    } catch {
      toast.error('Failed to add some habits. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const existingNames = new Set(habits.map(h => h.name.toLowerCase()));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { onClose(); setActivePack(null); setSelected([]); }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 2000 }}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            style={{
              position: 'fixed', inset: 0, margin: 'auto',
              width: '90vw', maxWidth: 580,
              height: 'fit-content', maxHeight: '88dvh',
              background: 'var(--bg-surface)',
              borderRadius: 20,
              zIndex: 2001,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
            }}
          >
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                {activePack && (
                  <button onClick={() => { setActivePack(null); setSelected([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-tertiary)', padding: '0 0 4px', fontFamily: 'var(--font-body)', display: 'block' }}>
                    ← Back to packs
                  </button>
                )}
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>
                  {activePack ? `${pack.emoji} ${pack.name}` : '📦 Habit Templates'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {activePack ? pack.desc : 'Add a curated set of habits instantly'}
                </div>
              </div>
              <button onClick={() => { onClose(); setActivePack(null); setSelected([]); }} style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--border-mid)', background: 'var(--bg-base)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ×
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', WebkitOverflowScrolling: 'touch' }}>
              {!activePack ? (
                /* Pack grid */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {PACKS.map(p => (
                    <motion.button
                      key={p.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setActivePack(p.id); setSelected(p.habits.map((_, i) => i)); }}
                      style={{
                        padding: '18px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                        border: `1.5px solid ${p.color}30`,
                        background: `${p.color}08`,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{p.emoji}</div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8, lineHeight: 1.4 }}>{p.desc}</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {p.habits.map(h => (
                          <span key={h.name} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: `${p.color}20`, color: p.color }}>
                            {h.icon} {h.name}
                          </span>
                        ))}
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                /* Habit checklist for selected pack */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pack.habits.map((h, idx) => {
                    const checked = selected.includes(idx);
                    const alreadyExists = existingNames.has(h.name.toLowerCase());
                    return (
                      <motion.button
                        key={idx}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => !alreadyExists && toggle(idx)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                          borderRadius: 12, cursor: alreadyExists ? 'not-allowed' : 'pointer', textAlign: 'left',
                          border: `2px solid ${checked && !alreadyExists ? h.color : 'var(--border-subtle)'}`,
                          background: alreadyExists ? 'var(--bg-base)' : checked ? `${h.color}10` : 'var(--bg-base)',
                          opacity: alreadyExists ? 0.5 : 1,
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${h.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                          {h.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>{h.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                            {h.category} · {h.frequency}
                            {h.timeOfDay && ` · ${h.timeOfDay}`}
                          </div>
                          {alreadyExists && <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>Already in your habits</div>}
                        </div>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${checked && !alreadyExists ? h.color : 'var(--border-mid)'}`, background: checked && !alreadyExists ? h.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                          {checked && !alreadyExists && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {activePack && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 10, flexShrink: 0 }}>
                <button onClick={() => setSelected(pack.habits.map((_, i) => i))} style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border-mid)', background: 'transparent', fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                  Select All
                </button>
                <div style={{ flex: 1 }} />
                <button
                  onClick={handleAdd}
                  disabled={selected.length === 0 || loading}
                  style={{
                    padding: '10px 24px', borderRadius: 10, border: 'none',
                    background: selected.length > 0 ? 'var(--accent)' : 'var(--border-mid)',
                    color: 'white', fontSize: 13, fontWeight: 700, cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
                    fontFamily: 'var(--font-body)', transition: 'background 0.15s',
                  }}
                >
                  {loading ? 'Adding...' : `Add ${selected.length} Habit${selected.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
