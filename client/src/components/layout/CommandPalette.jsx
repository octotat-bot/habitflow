import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useHabitStore from '../../stores/habitStore';
import useUIStore from '../../stores/uiStore';
import { notificationService } from '../../lib/NotificationService';

const STATIC_COMMANDS = [
  { id: 'goto-dashboard',  label: 'Go to Dashboard',   icon: '◈', action: (nav) => nav('/') },
  { id: 'goto-habits',     label: 'Go to Habits',       icon: '≋', action: (nav) => nav('/habits') },
  { id: 'goto-analytics',  label: 'Go to Analytics',    icon: '⌇', action: (nav) => nav('/analytics') },
  { id: 'goto-streaks',    label: 'Go to Streaks',      icon: '◎', action: (nav) => nav('/streaks') },
  { id: 'goto-journal',    label: 'Go to Journal',      icon: '◻', action: (nav) => nav('/journal') },
  { id: 'goto-profile',     label: 'Go to Profile',            icon: '◉', action: (nav) => nav('/profile') },
  { id: 'goto-achievements',label: 'Achievement Gallery',      icon: '🏆', action: (nav) => nav('/achievements') },
  { id: 'goto-weekly',      label: 'Weekly Review',            icon: '📅', action: (nav) => nav('/weekly') },
  { id: 'notifs', label: 'Enable Notifications', icon: '🔔', action: async () => {
    const ok = await notificationService.requestPermission();
    if (ok) notificationService.test();
  }},
  { id: 'add-habit',        label: 'Add New Habit',            icon: '+', action: (nav, ui) => ui.openDrawer('create') },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { habits } = useHabitStore();
  const { openDrawer } = useUIStore();
  const ui = { openDrawer };

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Build command list: static + dynamic habit commands
  const habitCommands = habits
    .filter(h => !h.isArchived)
    .map(h => ({
      id: `habit-${h._id}`,
      label: h.name,
      icon: h.icon || '●',
      sub: h.category,
      action: (nav) => nav(`/habits/${h._id}`),
    }));

  const allCommands = [...STATIC_COMMANDS, ...habitCommands];

  const filtered = query
    ? allCommands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : allCommands;

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selected]) {
          filtered[selected].action(navigate, ui);
          setOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filtered, selected]);

  useEffect(() => setSelected(0), [query]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cp-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(26,25,22,0.4)', backdropFilter: 'blur(8px)', zIndex: 8000 }}
          />

          {/* Palette */}
          <motion.div
            key="cp-panel"
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', top: '20vh', left: '50%', transform: 'translateX(-50%)',
              width: 560, maxWidth: 'calc(100vw - 32px)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 16,
              boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)',
              zIndex: 8001, overflow: 'hidden',
            }}
          >
            {/* Search input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 16, color: 'var(--text-tertiary)' }}>⌘</span>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search commands or habits..."
                style={{
                  flex: 1, border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 15, color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
                }}
              />
              <kbd style={{ fontSize: 10, color: 'var(--text-tertiary)', background: 'var(--bg-base)', border: '1px solid var(--border-mid)', borderRadius: 4, padding: '2px 6px', fontFamily: 'var(--font-mono)' }}>ESC</kbd>
            </div>

            {/* Results */}
            <div style={{ maxHeight: 360, overflowY: 'auto', padding: '6px' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No results for "{query}"</div>
              ) : filtered.map((cmd, i) => (
                <motion.button
                  key={cmd.id}
                  onClick={() => { cmd.action(navigate, ui); setOpen(false); }}
                  onMouseEnter={() => setSelected(i)}
                  layout
                  style={{
                    width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '9px 12px', borderRadius: 10,
                    background: i === selected ? 'var(--accent-light)' : 'transparent',
                    color: i === selected ? 'var(--accent-dim)' : 'var(--text-primary)',
                    fontFamily: 'var(--font-body)', transition: 'background 0.1s',
                  }}
                >
                  <span style={{ width: 28, height: 28, borderRadius: 7, background: i === selected ? 'var(--accent)' : 'var(--bg-base)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, color: i === selected ? 'white' : 'var(--text-secondary)' }}>
                    {cmd.icon}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{cmd.label}</div>
                    {cmd.sub && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{cmd.sub}</div>}
                  </div>
                  {i === selected && (
                    <kbd style={{ fontSize: 10, color: 'var(--accent)', background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 4, padding: '2px 6px', fontFamily: 'var(--font-mono)' }}>↵</kbd>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Footer hint */}
            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 16, alignItems: 'center' }}>
              {[['↑↓','Navigate'],['↵','Select'],['Esc','Close']].map(([k, label]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <kbd style={{ fontSize: 9, color: 'var(--text-tertiary)', background: 'var(--bg-base)', border: '1px solid var(--border-mid)', borderRadius: 3, padding: '1px 5px', fontFamily: 'var(--font-mono)' }}>{k}</kbd>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{label}</span>
                </div>
              ))}
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-tertiary)' }}>⌘K to toggle</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
