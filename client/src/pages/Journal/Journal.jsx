import usePageTitle from '../../hooks/usePageTitle.js';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, isToday, parseISO } from 'date-fns';
import useHabitStore from '../../stores/habitStore';
import useUserStore from '../../stores/userStore';
import JournalInsight from '../../components/journal/JournalInsight';
import { JournalSkeleton } from '../../components/ui/Skeletons';
import api from '../../lib/axios';

const MOODS = [
  { val: 1, emoji: '😞', label: 'Rough' },
  { val: 2, emoji: '😕', label: 'Meh' },
  { val: 3, emoji: '😐', label: 'Okay' },
  { val: 4, emoji: '😊', label: 'Good' },
  { val: 5, emoji: '🔥', label: 'Great' },
];

const BASE_KEY = 'habitflow_journal';

function getUserKey(userId) {
  return userId ? `${BASE_KEY}_${userId}` : BASE_KEY;
}

function loadEntries(userId) {
  try { return JSON.parse(localStorage.getItem(getUserKey(userId)) || '{}'); }
  catch { return {}; }
}
function saveEntries(entries, userId) {
  localStorage.setItem(getUserKey(userId), JSON.stringify(entries));
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const h = (e) => setMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return mobile;
}

export default function Journal() {
  usePageTitle('Journal');
  const { habits, todayCompletions } = useHabitStore();
  const { user } = useUserStore();
  const active   = habits.filter(h => !h.isArchived);
  const isMobile = useIsMobile();

  const [entries, setEntries]         = useState(() => loadEntries(user?._id));
  const [selectedDate, setSelected]   = useState(format(new Date(), 'yyyy-MM-dd'));
  const [draft, setDraft]             = useState('');
  const [mood, setMood]               = useState(null);
  const [saved, setSaved]             = useState(false);
  const [completions, setCompletions] = useState({});

  // Fetch completions for past 30 days
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
      }).catch(() => {});
  }, [habits.length, todayCompletions.length]);

  // Load entry when date changes
  useEffect(() => {
    const entry = entries[selectedDate];
    setDraft(entry?.text || '');
    setMood(entry?.mood || null);
    setSaved(false);
  }, [selectedDate]);

  const saveEntry = () => {
    const updated = {
      ...entries,
      [selectedDate]: { text: draft, mood, savedAt: new Date().toISOString() },
    };
    setEntries(updated);
    saveEntries(updated, user?._id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const recentDays  = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'));
  const habitsForDate = (date) => {
    const ids = completions[date] || [];
    return active.filter(h => ids.includes(h._id));
  };
  const entryForDate = (date) => entries[date];

  const doneHabits = habitsForDate(selectedDate);
  const allHabits  = active;

  const moodAvg = (() => {
    const vals = recentDays.map(d => entries[d]?.mood).filter(Boolean);
    if (!vals.length) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  })();

  return (
    <div style={{
      background: 'var(--bg-base)',
      minHeight: '100vh',
      paddingBottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom))' : 64,
      overflowX: 'hidden',
    }}>
      <div style={{ padding: isMobile ? '16px 14px 0' : '28px 28px 0' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: isMobile ? 28 : 36,
              color: 'var(--text-primary)', margin: 0, lineHeight: 1,
            }}>
              Daily <span style={{ color: 'var(--accent)' }}>Journal</span>
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 0' }}>
              Reflect · Track mood · Stay consistent
            </p>
          </div>
          {moodAvg && (
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 12, padding: isMobile ? '8px 12px' : '10px 16px', textAlign: 'center', flexShrink: 0,
            }}>
              <div style={{ fontSize: isMobile ? 18 : 22 }}>
                {MOODS.find(m => m.val === Math.round(parseFloat(moodAvg)))?.emoji || '😐'}
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>AVG</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>{moodAvg}</div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════
            MOBILE LAYOUT: stacked
            DESKTOP LAYOUT: sidebar + editor
        ══════════════════════════════════════ */}
        {isMobile ? (
          /* ── MOBILE: horizontal date strip + editor ── */
          <div>
            {/* Date strip — horizontal scroll */}
            <div style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 12,
              marginBottom: 16,
              marginLeft: -14,
              marginRight: -14,
              paddingLeft: 14,
              paddingRight: 14,
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}>
              {recentDays.map(date => {
                const entry = entryForDate(date);
                const done  = (completions[date] || []).length;
                const isSel = date === selectedDate;
                const moodE = entry?.mood ? MOODS.find(m => m.val === entry.mood)?.emoji : null;
                const isT   = isToday(parseISO(date));
                return (
                  <button
                    key={date}
                    onClick={() => setSelected(date)}
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: `1.5px solid ${isSel ? 'var(--accent)' : 'var(--border-subtle)'}`,
                      background: isSel ? 'var(--accent-light)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                      minWidth: 58,
                      transition: 'all 0.12s',
                    }}
                  >
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: isSel ? 'var(--accent-dim)' : 'var(--text-tertiary)' }}>
                      {isT ? 'Today' : format(parseISO(date), 'EEE')}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: isSel ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {format(parseISO(date), 'd')}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                      {format(parseISO(date), 'MMM')}
                    </div>
                    {(moodE || done > 0) && (
                      <div style={{ display: 'flex', gap: 3, alignItems: 'center', marginTop: 2 }}>
                        {moodE && <span style={{ fontSize: 11 }}>{moodE}</span>}
                        {done > 0 && (
                          <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '1px 4px', borderRadius: 99 }}>
                            {done}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Editor (full width) */}
            <JournalEditor
              selectedDate={selectedDate}
              draft={draft}
              setDraft={setDraft}
              mood={mood}
              setMood={setMood}
              saved={saved}
              saveEntry={saveEntry}
              doneHabits={doneHabits}
              allHabits={allHabits}
              isMobile={isMobile}
            />
          </div>
        ) : (
          /* ── DESKTOP: sidebar + editor ── */
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>

            {/* Left: date list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {recentDays.map(date => {
                const entry = entryForDate(date);
                const done  = (completions[date] || []).length;
                const isSel = date === selectedDate;
                const moodE = entry?.mood ? MOODS.find(m => m.val === entry.mood)?.emoji : null;
                return (
                  <button key={date} onClick={() => setSelected(date)} style={{
                    textAlign: 'left',
                    border: `1.5px solid ${isSel ? 'var(--accent)' : 'var(--border-subtle)'}`,
                    borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
                    background: isSel ? 'var(--accent-light)' : 'var(--bg-surface)',
                    transition: 'all 0.12s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isSel ? 'var(--accent-dim)' : 'var(--text-primary)' }}>
                          {isToday(parseISO(date)) ? 'Today' : format(parseISO(date), 'EEE, MMM d')}
                        </div>
                        {entry?.text && (
                          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                            {entry.text}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                        {moodE && <span style={{ fontSize: 14 }}>{moodE}</span>}
                        {done > 0 && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '1px 5px', borderRadius: 99 }}>
                            {done}/{allHabits.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right: editor */}
            <JournalEditor
              selectedDate={selectedDate}
              draft={draft}
              setDraft={setDraft}
              mood={mood}
              setMood={setMood}
              saved={saved}
              saveEntry={saveEntry}
              doneHabits={doneHabits}
              allHabits={allHabits}
              isMobile={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Shared editor panel ── */
function JournalEditor({ selectedDate, draft, setDraft, mood, setMood, saved, saveEntry, doneHabits, allHabits, isMobile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', minWidth: 0 }}>

      {/* AI Journal Insight */}
      <JournalInsight />

      {/* Date header + mood */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: isMobile ? 17 : 20, color: 'var(--text-primary)' }}>
            {isToday(parseISO(selectedDate)) ? 'Today' : format(parseISO(selectedDate), 'EEEE, MMMM d')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {format(parseISO(selectedDate), 'yyyy-MM-dd')}
          </div>
        </div>

        {/* Mood picker */}
        <div style={{ display: 'flex', gap: isMobile ? 6 : 4, flexWrap: 'wrap' }}>
          {MOODS.map(m => (
            <button
              key={m.val}
              onClick={() => setMood(mood === m.val ? null : m.val)}
              title={m.label}
              style={{
                width: isMobile ? 42 : 38, height: isMobile ? 42 : 38,
                borderRadius: 10,
                border: `2px solid ${mood === m.val ? 'var(--accent)' : 'var(--border-subtle)'}`,
                background: mood === m.val ? 'var(--accent-light)' : 'var(--bg-base)',
                fontSize: isMobile ? 20 : 18,
                cursor: 'pointer', transition: 'all 0.12s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {m.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Habits done this day */}
      {allHabits.length > 0 && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 12, padding: isMobile ? '12px 14px' : '14px 16px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 10, fontFamily: 'var(--font-body)' }}>
            HABITS THIS DAY — {doneHabits.length}/{allHabits.length} DONE
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {allHabits.map(h => {
              const done = doneHabits.some(d => d._id === h._id);
              return (
                <div key={h._id} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 99,
                  background: done ? `${h.color || 'var(--accent)'}15` : 'var(--bg-base)',
                  border: `1px solid ${done ? h.color || 'var(--accent)' : 'var(--border-subtle)'}`,
                  opacity: done ? 1 : 0.5,
                }}>
                  <span style={{ fontSize: 12 }}>{h.icon || '●'}</span>
                  <span style={{ fontSize: 11, fontWeight: done ? 700 : 400, color: done ? (h.color || 'var(--accent)') : 'var(--text-tertiary)' }}>{h.name}</span>
                  {done && <span style={{ fontSize: 10 }}>✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Textarea */}
      <textarea
        value={draft}
        onChange={e => { setDraft(e.target.value); }}
        placeholder="What happened today? How are you feeling? What are you proud of?"
        style={{
          minHeight: isMobile ? 180 : 220,
          width: '100%',
          padding: isMobile ? '14px' : '16px',
          borderRadius: 12,
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          lineHeight: 1.7,
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />

      {/* Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={saveEntry}
          style={{
            flex: isMobile ? 1 : undefined,
            padding: '10px 28px', borderRadius: 10, border: 'none',
            background: saved ? '#5B9A2F' : 'var(--text-primary)',
            color: 'white', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
            transition: 'background 0.2s',
          }}
        >
          {saved ? '✓ Saved' : 'Save Entry'}
        </button>
        {draft && (
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {draft.length} chars
          </span>
        )}
      </div>
    </div>
  );
}
