import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Drawer from '../ui/Drawer';
import useHabitStore from '../../stores/habitStore';
import useUIStore from '../../stores/uiStore';
import useAIStore from '../../stores/aiStore';
import toast from 'react-hot-toast';
import { validateHabitForm, mapHabitError } from '../../lib/errorMap';

const CATEGORIES = [
  { label: 'Mind',     color: '#7C5CBF', icon: '🧠' },
  { label: 'Body',     color: '#2AA198', icon: '💪' },
  { label: 'Work',     color: '#E07B2A', icon: '💻' },
  { label: 'Social',   color: '#E0567B', icon: '🤝' },
  { label: 'Creative', color: '#D4732A', icon: '🎨' },
  { label: 'Finance',  color: '#3A9E6A', icon: '💰' },
  { label: 'Spirit',   color: '#6B8EC7', icon: '🌿' },
  { label: 'Custom',   color: '#888',    icon: '✨' },
];

const FREQUENCIES = [
  { value: 'daily',     label: 'Every Day',  desc: 'No days off' },
  { value: 'weekdays',  label: 'Weekdays',   desc: 'Mon – Fri' },
  { value: 'weekends',  label: 'Weekends',   desc: 'Sat & Sun' },
  { value: 'custom',    label: 'Custom',     desc: 'Pick days' },
  { value: 'x_per_week',label: 'X / Week',  desc: 'Set a target' },
];

const TIMES = [
  { value: null,        label: 'Any time',  emoji: '🕐' },
  { value: 'dawn',      label: 'Dawn',      emoji: '🌙' },
  { value: 'morning',   label: 'Morning',   emoji: '☀️' },
  { value: 'afternoon', label: 'Afternoon', emoji: '⛅' },
  { value: 'evening',   label: 'Evening',   emoji: '🌆' },
  { value: 'night',     label: 'Night',     emoji: '🌑' },
];

const DAYS = ['S','M','T','W','T','F','S'];

const EMOJIS = [
  '✨','💪','🧠','📚','🏃','🧘','💰','🎨','🤝','🌱','💤','🍎',
  '🎯','🔥','⚡','🌟','🎵','✍️','🏋️','🚴','🏊','🥗','💊','💦',
  '🌅','☕','🍵','🦁','🦋','🌙','⭐','🏆','🔮','📝','💡','🫀',
];

const COLORS = [
  '#5B9A2F','#2AA198','#7C5CBF','#E07B2A','#E0567B',
  '#3A9E6A','#6B8EC7','#D4732A','#E5534B','#60A5FA',
];

const defaultForm = {
  name: '', description: '', icon: '✨', color: '#5B9A2F',
  category: 'Custom', frequency: 'daily', targetDaysOfWeek: [],
  timesPerWeek: 3, timeOfDay: null, stackedAfterId: null,
  habitType: 'boolean',   // 'boolean' | 'duration' | 'quantity'
  targetDuration: 10,     // minutes (for duration type)
  targetQuantity: 8,      // count  (for quantity type)
  reminderTime: '',       // HH:MM custom reminder (overrides timeOfDay for notifications)
};

export default function HabitDrawer() {
  const { drawerOpen, drawerMode, editingHabit, closeDrawer } = useUIStore();
  const { addHabit, updateHabit, habits } = useHabitStore();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState('basics');
  const [aiMode, setAiMode] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiHighlight, setAiHighlight] = useState(false);
  const { parseHabit, loadingStates } = useAIStore();
  const aiParsing = loadingStates['parseHabit'];

  useEffect(() => {
    if (drawerMode === 'edit' && editingHabit) {
      setForm({
        name: editingHabit.name || '',
        description: editingHabit.description || '',
        icon: editingHabit.icon || '✨',
        color: editingHabit.color || '#5B9A2F',
        category: editingHabit.category || 'Custom',
        frequency: editingHabit.frequency || 'daily',
        targetDaysOfWeek: editingHabit.targetDaysOfWeek || [],
        timesPerWeek: editingHabit.timesPerWeek || 3,
        timeOfDay: editingHabit.timeOfDay || null,
        stackedAfterId: editingHabit.stackedAfterId || null,
      });
    } else if (drawerMode === 'create' && editingHabit) {
      // Pre-fill from AI suggestion — editingHabit holds prefill data
      setForm({ ...defaultForm, ...editingHabit });
    } else {
      setForm(defaultForm);
    }
    setStep('basics');
    setErrors({});
    setAiMode(false);
    setAiText('');
  }, [drawerMode, editingHabit, drawerOpen]);

  const handleParseWithAI = async () => {
    if (!aiText.trim()) return;
    const parsed = await parseHabit(aiText);
    if (!parsed) {
      toast.error("Couldn't parse — fill it in manually");
      setAiMode(false);
      return;
    }
    setForm(f => ({ ...f, ...parsed, timesPerWeek: parsed.timesPerWeek || f.timesPerWeek || 3, targetDaysOfWeek: f.targetDaysOfWeek || [] }));
    setAiHighlight(true);
    setTimeout(() => setAiHighlight(false), 1200);
    setAiMode(false);
    toast.success('Form filled by AI ✨ Review before saving');
  };

  const upd = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    // Clear that field's error as the user edits
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const toggleDay = (i) => {
    const days = form.targetDaysOfWeek.includes(i)
      ? form.targetDaysOfWeek.filter(d => d !== i)
      : [...form.targetDaysOfWeek, i];
    upd('targetDaysOfWeek', days);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateHabitForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      const firstErrorKey = Object.keys(validationErrors)[0];
      if (firstErrorKey === 'targetDuration' || firstErrorKey === 'targetQuantity' || firstErrorKey === 'reminderTime') {
        setStep('details');
      } else if (firstErrorKey === 'targetDaysOfWeek' || firstErrorKey === 'timesPerWeek') {
        setStep('schedule');
      }
      return;
    }
    setLoading(true);
    try {
      if (drawerMode === 'edit' && editingHabit) {
        await updateHabit(editingHabit._id, form);
        toast.success('Habit updated ✓');
      } else {
        await addHabit(form);
        toast.success('Habit added ✓');
      }
      closeDrawer();
    } catch (err) {
      toast.error(mapHabitError(err));
    } finally {
      setLoading(false);
    }
  };

  const catColor = CATEGORIES.find(c => c.label === form.category)?.color || '#888';
  const stackableHabits = habits.filter(h => !h.isArchived && h._id !== editingHabit?._id);

  const STEPS = ['basics', 'schedule', 'details'];

  return (
    <Drawer
      isOpen={drawerOpen}
      onClose={closeDrawer}
      title={drawerMode === 'edit' ? 'Edit Habit' : 'New Habit'}
    >
      <form onSubmit={handleSubmit}>

        {/* ── AI / Manual Toggle (create mode only) ── */}
        {drawerMode === 'create' && (
          <div style={{ display: 'flex', background: 'var(--bg-base)', borderRadius: 10, padding: 3, marginBottom: 20, gap: 2 }}>
            {[['Full Form', false], ['✨ Quick Add (AI)', true]].map(([label, val]) => (
              <button key={String(val)} type="button" onClick={() => setAiMode(val)}
                style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                  background: aiMode === val ? 'var(--bg-surface)' : 'transparent',
                  color: aiMode === val ? 'var(--accent-dim)' : 'var(--text-tertiary)',
                  boxShadow: aiMode === val ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ── AI Quick Add mode ── */}
        <AnimatePresence>
          {aiMode && (
            <motion.div key="ai-mode" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} style={{ marginBottom: 20 }}>
              <textarea
                value={aiText}
                onChange={e => setAiText(e.target.value)}
                placeholder="Describe your habit in plain English... e.g. 'I want to meditate for 10 minutes every morning'"
                rows={4}
                style={{ width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid var(--border-mid)', background: 'var(--bg-base)', fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--text-primary)', resize: 'vertical', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' }}
              />
              <button type="button" onClick={handleParseWithAI} disabled={!aiText.trim() || aiParsing}
                style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: 10, border: 'none', background: aiParsing ? 'var(--border-mid)' : 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 700, cursor: aiParsing ? 'wait' : 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}>
                {aiParsing ? '⟳ Parsing...' : '✨ Parse with AI →'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Live Preview ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 16px', marginBottom: 24,
          background: `${form.color}10`,
          border: `1.5px solid ${form.color}30`,
          borderRadius: 14,
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `${form.color}20`, border: `2px solid ${form.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            {form.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 2 }}>
              {form.name || <span style={{ color: 'var(--text-tertiary)', fontWeight: 500, fontStyle: 'italic', fontSize: 14 }}>Habit name...</span>}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: form.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{form.category}</span>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>·</span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{FREQUENCIES.find(f => f.value === form.frequency)?.label}</span>
            </div>
          </div>
        </div>

        {/* ── Step tabs ── */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: 'var(--bg-base)', borderRadius: 10, padding: 3, border: '1px solid var(--border-subtle)' }}>
          {[['basics','Basics'], ['schedule','Schedule'], ['details','Details']].map(([s, label]) => (
            <button key={s} type="button" onClick={() => setStep(s)} style={{
              flex: 1, padding: '7px', borderRadius: 8, border: 'none',
              background: step === s ? 'var(--bg-surface)' : 'transparent',
              color: step === s ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontWeight: step === s ? 700 : 500, fontSize: 12,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              boxShadow: step === s ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* ══ BASICS ══ */}
        {step === 'basics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Name */}
            <div>
              <label style={L}>Habit Name</label>
              <input
                className="input-base"
                value={form.name}
                onChange={e => upd('name', e.target.value)}
                placeholder="e.g. Morning meditation"
                style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}
                autoFocus
              />
            </div>

            {/* Icon picker */}
            <div>
              <label style={L}>Icon</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 4 }}>
                {EMOJIS.map(emoji => (
                  <button key={emoji} type="button" onClick={() => upd('icon', emoji)} style={{
                    padding: '6px', borderRadius: 8,
                    background: form.icon === emoji ? `${form.color}20` : 'transparent',
                    border: form.icon === emoji ? `1.5px solid ${form.color}60` : '1.5px solid transparent',
                    fontSize: 18, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.1s',
                  }}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label style={L}>Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => upd('color', c)} style={{
                    width: 30, height: 30, borderRadius: '50%', border: 'none',
                    background: c, cursor: 'pointer', flexShrink: 0,
                    outline: form.color === c ? `3px solid ${c}` : 'none',
                    outlineOffset: 2,
                    transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.15s',
                  }} />
                ))}
                {/* Custom hex */}
                <input type="text" value={form.color} onChange={e => upd('color', e.target.value)}
                  style={{ width: 80, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-mid)', fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--bg-base)', color: 'var(--text-primary)' }}
                  placeholder="#5B9A2F"
                />
              </div>
            </div>

            {/* Habit Type */}
            <div>
              <label style={L}>Habit Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { value: 'boolean',  label: 'Check-off', emoji: '✅', desc: 'Done or not done' },
                  { value: 'duration', label: 'Timer',     emoji: '⏱️', desc: 'Track minutes' },
                  { value: 'quantity', label: 'Counter',   emoji: '🔢', desc: 'Count repetitions' },
                ].map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => upd('habitType', t.value)}
                    style={{
                      padding: '10px 8px', borderRadius: 10,
                      border: `1.5px solid ${form.habitType === t.value ? 'var(--accent)' : 'var(--border-subtle)'}`,
                      background: form.habitType === t.value ? 'var(--accent-light)' : 'transparent',
                      cursor: 'pointer', textAlign: 'center',
                      transition: 'all 0.12s',
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{t.emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: form.habitType === t.value ? 'var(--accent-dim)' : 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>{t.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{t.desc}</div>
                  </button>
                ))}
              </div>

              {/* Target for duration */}
              {form.habitType === 'duration' && (
                <div style={{ marginTop: 12 }}>
                  <label style={{ ...L, marginBottom: 6, display: 'block' }}>Target Duration (minutes)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {[5, 10, 15, 20, 30, 45, 60].map(m => (
                      <button key={m} type="button" onClick={() => upd('targetDuration', m)} style={{
                        flex: 1, padding: '8px 4px', borderRadius: 8, border: `1.5px solid ${form.targetDuration === m ? 'var(--accent)' : 'var(--border-mid)'}`,
                        background: form.targetDuration === m ? 'var(--accent)' : 'transparent',
                        color: form.targetDuration === m ? 'white' : 'var(--text-secondary)',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.12s',
                      }}>{m}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Target for quantity */}
              {form.habitType === 'quantity' && (
                <div style={{ marginTop: 12 }}>
                  <label style={{ ...L, marginBottom: 6, display: 'block' }}>Target Count</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {[1, 2, 3, 5, 8, 10, 15, 20].map(n => (
                      <button key={n} type="button" onClick={() => upd('targetQuantity', n)} style={{
                        flex: 1, padding: '7px 4px', borderRadius: 8, border: `1.5px solid ${form.targetQuantity === n ? 'var(--accent)' : 'var(--border-mid)'}`,
                        background: form.targetQuantity === n ? 'var(--accent)' : 'transparent',
                        color: form.targetQuantity === n ? 'white' : 'var(--text-secondary)',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.12s',
                      }}>{n}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label style={L}>Category</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {CATEGORIES.map(cat => (
                  <button key={cat.label} type="button" onClick={() => upd('category', cat.label)} style={{
                    padding: '8px 6px', borderRadius: 10,
                    border: `1.5px solid ${form.category === cat.label ? cat.color : 'var(--border-subtle)'}`,
                    background: form.category === cat.label ? `${cat.color}15` : 'transparent',
                    color: form.category === cat.label ? cat.color : 'var(--text-secondary)',
                    fontSize: 12, fontWeight: form.category === cat.label ? 700 : 500,
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    transition: 'all 0.12s',
                  }}>
                    <span style={{ fontSize: 16 }}>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ SCHEDULE ══ */}
        {step === 'schedule' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Frequency */}
            <div>
              <label style={L}>Frequency</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {FREQUENCIES.map(freq => (
                  <button key={freq.value} type="button" onClick={() => upd('frequency', freq.value)} style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${form.frequency === freq.value ? 'var(--accent)' : 'var(--border-subtle)'}`,
                    background: form.frequency === freq.value ? 'var(--accent-light)' : 'var(--bg-base)',
                    textAlign: 'left', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'all 0.12s',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: form.frequency === freq.value ? 'var(--accent-dim)' : 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>{freq.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{freq.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom day picker */}
            <AnimatePresence>
              {form.frequency === 'custom' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                  <label style={L}>Pick Days</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {DAYS.map((d, i) => (
                      <button key={i} type="button" onClick={() => toggleDay(i)} style={{
                        flex: 1, height: 38, borderRadius: 8,
                        border: `1.5px solid ${form.targetDaysOfWeek.includes(i) ? 'var(--accent)' : 'var(--border-mid)'}`,
                        background: form.targetDaysOfWeek.includes(i) ? 'var(--accent)' : 'transparent',
                        color: form.targetDaysOfWeek.includes(i) ? 'white' : 'var(--text-secondary)',
                        fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.12s',
                      }}>{d}</button>
                    ))}
                  </div>
                </motion.div>
              )}
              {form.frequency === 'x_per_week' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                  <label style={L}>Times per week</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[1,2,3,4,5,6,7].map(n => (
                      <button key={n} type="button" onClick={() => upd('timesPerWeek', n)} style={{
                        flex: 1, height: 40, borderRadius: 8,
                        border: `1.5px solid ${form.timesPerWeek === n ? 'var(--accent)' : 'var(--border-mid)'}`,
                        background: form.timesPerWeek === n ? 'var(--accent)' : 'transparent',
                        color: form.timesPerWeek === n ? 'white' : 'var(--text-secondary)',
                        fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.12s',
                      }}>{n}</button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Time of day */}
            <div>
              <label style={L}>Best Time <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>optional</span></label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {TIMES.map(t => (
                  <button key={String(t.value)} type="button" onClick={() => upd('timeOfDay', t.value)} style={{
                    padding: '10px 14px', borderRadius: 10,
                    border: `1.5px solid ${form.timeOfDay === t.value ? 'var(--accent)' : 'var(--border-subtle)'}`,
                    background: form.timeOfDay === t.value ? 'var(--accent-light)' : 'var(--bg-base)',
                    textAlign: 'left', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'all 0.12s',
                  }}>
                    <span style={{ fontSize: 16 }}>{t.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: form.timeOfDay === t.value ? 700 : 500, color: form.timeOfDay === t.value ? 'var(--accent-dim)' : 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom reminder time */}
            <div>
              <label style={L}>⏰ Exact Reminder Time <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>optional — overrides time-of-day</span></label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="time"
                  value={form.reminderTime || ''}
                  onChange={e => upd('reminderTime', e.target.value)}
                  className="input-base"
                  style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 14, letterSpacing: '0.05em' }}
                />
                {form.reminderTime && (
                  <button type="button" onClick={() => upd('reminderTime', '')} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-mid)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)' }}>
                    Clear
                  </button>
                )}
              </div>
              {form.reminderTime && (
                <div style={{ fontSize: 11, color: 'var(--accent-dim)', marginTop: 6, fontFamily: 'var(--font-body)' }}>
                  🔔 You'll get a notification at {form.reminderTime} every day this habit is due.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ DETAILS ══ */}
        {step === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Description */}
            <div>
              <label style={L}>Why this habit? <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>optional</span></label>
              <textarea
                className="input-base"
                value={form.description}
                onChange={e => upd('description', e.target.value)}
                placeholder="Write your intention..."
                rows={4}
                style={{ resize: 'vertical', fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6 }}
              />
            </div>

            {/* Habit stacking */}
            {stackableHabits.length > 0 && (
              <div>
                <label style={L}>🔗 Stack After</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button type="button" onClick={() => upd('stackedAfterId', null)} style={{ ...stackBtnStyle, borderColor: !form.stackedAfterId ? 'var(--accent)' : 'var(--border-subtle)', background: !form.stackedAfterId ? 'var(--accent-light)' : 'var(--bg-base)', color: !form.stackedAfterId ? 'var(--accent-dim)' : 'var(--text-secondary)' }}>
                    None
                  </button>
                  {stackableHabits.map(h => (
                    <button key={h._id} type="button" onClick={() => upd('stackedAfterId', h._id)} style={{ ...stackBtnStyle, borderColor: form.stackedAfterId === h._id ? 'var(--accent)' : 'var(--border-subtle)', background: form.stackedAfterId === h._id ? 'var(--accent-light)' : 'var(--bg-base)', color: form.stackedAfterId === h._id ? 'var(--accent-dim)' : 'var(--text-secondary)' }}>
                      <span style={{ fontSize: 16 }}>{h.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)' }}>{h.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Footer: nav + submit ── */}
        <div style={{ display: 'flex', gap: 10, marginTop: 28, alignItems: 'center' }}>
          {step !== 'basics' && (
            <button type="button" onClick={() => setStep(STEPS[STEPS.indexOf(step) - 1])} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border-mid)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              ← Back
            </button>
          )}
          {step !== 'details' ? (
            <button type="button" onClick={() => setStep(STEPS[STEPS.indexOf(step) + 1])} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--text-primary)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              Next →
            </button>
          ) : (
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Saving...' : drawerMode === 'edit' ? '✓ Save Changes' : '+ Add Habit'}
            </button>
          )}
        </div>
      </form>
    </Drawer>
  );
}

const L = {
  display: 'block', fontSize: 10, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)', marginBottom: 8,
};

const stackBtnStyle = {
  padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid var(--border-subtle)',
  background: 'var(--bg-base)',
  textAlign: 'left', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 10,
  transition: 'all 0.12s',
};
