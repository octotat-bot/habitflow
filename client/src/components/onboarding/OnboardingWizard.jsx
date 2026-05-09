/**
 * OnboardingWizard — 3-step first-run experience for new users.
 * Shown once after signup; stores completion flag in localStorage.
 * Steps: Welcome → Pick goal → Choose starter habits → Set reminder
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useHabitStore from '../../stores/habitStore';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { tabStorage } from '../../lib/storage';

const ONBOARDING_KEY = 'hf_onboarding_done';

const GOALS = [
  { id: 'health',      emoji: '💪', label: 'Get Healthier',    desc: 'Exercise, sleep & nutrition' },
  { id: 'mindset',     emoji: '🧠', label: 'Sharpen My Mind',  desc: 'Reading, meditation & focus' },
  { id: 'productivity',emoji: '🚀', label: 'Be More Productive', desc: 'Deep work & goal-setting' },
  { id: 'balance',     emoji: '☯️', label: 'Find Balance',     desc: 'Journaling, rest & social time' },
  { id: 'finance',     emoji: '💰', label: 'Build Wealth',     desc: 'Saving, budgeting & investing' },
  { id: 'creative',    emoji: '🎨', label: 'Create More',      desc: 'Writing, music & art' },
];

const STARTER_PACKS = {
  health:       [
    { name: 'Morning Run',         icon: '🏃', color: '#2AA198', category: 'Body',  frequency: 'daily' },
    { name: 'Drink 8 Glasses',     icon: '💦', color: '#60A5FA', category: 'Body',  frequency: 'daily' },
    { name: 'Sleep 8 Hours',       icon: '😴', color: '#7C5CBF', category: 'Body',  frequency: 'daily' },
    { name: 'No Junk Food',        icon: '🥗', color: '#34D399', category: 'Body',  frequency: 'daily' },
  ],
  mindset:      [
    { name: 'Meditate 10 min',     icon: '🧘', color: '#7C5CBF', category: 'Mind',  frequency: 'daily' },
    { name: 'Read 20 Pages',       icon: '📚', color: '#E07B2A', category: 'Mind',  frequency: 'daily' },
    { name: 'Gratitude Journal',   icon: '✍️', color: '#F472B6', category: 'Mind',  frequency: 'daily' },
    { name: 'No Phone First Hour', icon: '📵', color: '#6B8EC7', category: 'Mind',  frequency: 'daily' },
  ],
  productivity: [
    { name: 'Deep Work 2h',        icon: '🎯', color: '#E07B2A', category: 'Work',  frequency: 'weekdays' },
    { name: 'Plan Tomorrow',       icon: '📝', color: '#5B9A2F', category: 'Work',  frequency: 'daily' },
    { name: 'Inbox Zero',          icon: '📨', color: '#60A5FA', category: 'Work',  frequency: 'weekdays' },
    { name: 'No Meetings > 30min', icon: '🚫', color: '#E5534B', category: 'Work',  frequency: 'weekdays' },
  ],
  balance:      [
    { name: 'Journaling',          icon: '📓', color: '#F472B6', category: 'Mind',  frequency: 'daily' },
    { name: 'Evening Walk',        icon: '🌅', color: '#5B9A2F', category: 'Body',  frequency: 'daily' },
    { name: 'Call a Friend',       icon: '📞', color: '#FB923C', category: 'Social',frequency: 'weekends' },
    { name: 'Digital Detox Hour',  icon: '🌿', color: '#34D399', category: 'Mind',  frequency: 'daily' },
  ],
  finance:      [
    { name: 'Track Spending',      icon: '💳', color: '#34D399', category: 'Finance',frequency: 'daily' },
    { name: 'No Impulse Buys',     icon: '🛒', color: '#E5534B', category: 'Finance',frequency: 'daily' },
    { name: 'Read Finance News',   icon: '📈', color: '#E07B2A', category: 'Finance',frequency: 'weekdays' },
    { name: 'Add to Savings',      icon: '🏦', color: '#5B9A2F', category: 'Finance',frequency: 'weekdays' },
  ],
  creative:     [
    { name: 'Write 500 Words',     icon: '✍️', color: '#F472B6', category: 'Creative',frequency: 'daily' },
    { name: 'Sketch / Draw',       icon: '🎨', color: '#FB923C', category: 'Creative',frequency: 'daily' },
    { name: 'Learn an Instrument', icon: '🎵', color: '#A5B4FC', category: 'Creative',frequency: 'daily' },
    { name: 'Share Your Work',     icon: '🌟', color: '#E07B2A', category: 'Creative',frequency: 'weekends' },
  ],
};

const STEP_COUNT = 3;

export function isOnboardingDone(userId) {
  const key = userId ? `hf_${userId}_onboarding_done` : 'hf_onboarding_done';
  return !!localStorage.getItem(key);
}

export function markOnboardingDone(userId) {
  const key = userId ? `hf_${userId}_onboarding_done` : 'hf_onboarding_done';
  localStorage.setItem(key, '1');
}

export default function OnboardingWizard({ onComplete, userId }) {
  const { addHabit } = useHabitStore();
  const [step, setStep]         = useState(0); // 0=welcome 1=goal 2=habits 3=done
  const [goal, setGoal]         = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading]   = useState(false);

  const habits = goal ? STARTER_PACKS[goal] : [];
  const toggleHabit = (idx) =>
    setSelected(s => s.includes(idx) ? s.filter(i => i !== idx) : [...s, idx]);

  const handleFinish = async () => {
    setLoading(true);
    try {
      const toCreate = selected.map(i => habits[i]);
      await Promise.all(toCreate.map(h => addHabit(h)));
      markOnboardingDone(userId);
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ['#5B9A2F','#C3DE94','#fff'] });
      toast.success(`🎉 ${toCreate.length} habit${toCreate.length !== 1 ? 's' : ''} created! Let's build your ritual.`);
      onComplete();
    } catch {
      toast.error('Failed to create habits — you can add them manually.');
      markOnboardingDone(userId);
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit:    { opacity: 0, x: -40 },
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 5000,
      background: 'rgba(26,25,22,0.6)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 24,
          width: '100%',
          maxWidth: 560,
          maxHeight: '90dvh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
        }}
      >
        {/* Progress bar */}
        <div style={{ height: 3, background: 'var(--bg-base)' }}>
          <motion.div
            animate={{ width: `${((step) / STEP_COUNT) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}
            style={{ height: '100%', background: 'var(--accent)', borderRadius: 99 }}
          />
        </div>

        {/* Step counter */}
        <div style={{ padding: '16px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>
            {step === 0 ? 'WELCOME' : `STEP ${step} OF ${STEP_COUNT}`}
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array.from({ length: STEP_COUNT }).map((_, i) => (
              <div key={i} style={{
                width: i < step ? 18 : 6, height: 6, borderRadius: 99,
                background: i < step ? 'var(--accent)' : 'var(--border-mid)',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 0' }}>
          <AnimatePresence mode="wait">

            {/* ── Step 0: Welcome ── */}
            {step === 0 && (
              <motion.div key="welcome" {...slideVariants} transition={{ duration: 0.3 }}>
                <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 14 }}
                    style={{ fontSize: 64, marginBottom: 16 }}
                  >
                    🌱
                  </motion.div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--text-primary)', margin: '0 0 12px' }}>
                    Welcome to HabitFlow
                  </h2>
                  <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 380, margin: '0 auto' }}>
                    Build powerful habits, track your streaks, and become the best version of yourself — one day at a time.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 28, textAlign: 'left' }}>
                    {[
                      { icon: '🎯', title: 'Daily Tracking', desc: 'Check off habits in seconds' },
                      { icon: '🔥', title: 'Build Streaks',  desc: 'Stay consistent, earn XP' },
                      { icon: '🤖', title: 'AI Insights',    desc: 'Personalized suggestions' },
                    ].map(f => (
                      <div key={f.title} style={{ background: 'var(--bg-base)', borderRadius: 12, padding: '14px' }}>
                        <div style={{ fontSize: 24, marginBottom: 6 }}>{f.icon}</div>
                        <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)', marginBottom: 2 }}>{f.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{f.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 1: Pick goal ── */}
            {step === 1 && (
              <motion.div key="goal" {...slideVariants} transition={{ duration: 0.3 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                  What's your main goal?
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px' }}>
                  We'll suggest the right starter habits for you.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {GOALS.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setGoal(g.id)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 14,
                        border: `2px solid ${goal === g.id ? 'var(--accent)' : 'var(--border-subtle)'}`,
                        background: goal === g.id ? 'var(--accent-light)' : 'var(--bg-base)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{g.emoji}</div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: goal === g.id ? 'var(--accent-dim)' : 'var(--text-primary)', marginBottom: 2 }}>{g.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{g.desc}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Pick habits ── */}
            {step === 2 && (
              <motion.div key="habits" {...slideVariants} transition={{ duration: 0.3 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                  Choose your starter habits
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px' }}>
                  Select the ones that resonate with you. You can always add more later.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {habits.map((h, idx) => {
                    const checked = selected.includes(idx);
                    return (
                      <motion.button
                        key={idx}
                        onClick={() => toggleHabit(idx)}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '14px 16px',
                          borderRadius: 12,
                          border: `2px solid ${checked ? h.color : 'var(--border-subtle)'}`,
                          background: checked ? `${h.color}10` : 'var(--bg-base)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{
                          width: 42, height: 42, borderRadius: 10,
                          background: `${h.color}20`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 20, flexShrink: 0,
                        }}>
                          {h.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>{h.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{h.category} · {h.frequency}</div>
                        </div>
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%',
                          border: `2px solid ${checked ? h.color : 'var(--border-mid)'}`,
                          background: checked ? h.color : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, transition: 'all 0.15s',
                        }}>
                          {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
                {selected.length === 0 && (
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', margin: '16px 0 0' }}>
                    Select at least one habit, or skip to start with an empty slate.
                  </p>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 28px 24px', display: 'flex', gap: 10, borderTop: '1px solid var(--border-subtle)', marginTop: 20 }}>

          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                padding: '11px 20px', borderRadius: 10, border: '1px solid var(--border-mid)',
                background: 'transparent', color: 'var(--text-secondary)',
                fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}
            >
              ← Back
            </button>
          )}

          <div style={{ flex: 1 }} />

          {step === 0 && (
            <button
              onClick={() => setStep(1)}
              style={{
                padding: '11px 28px', borderRadius: 10, border: 'none',
                background: 'var(--accent)', color: 'white',
                fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}
            >
              Get Started →
            </button>
          )}

          {step === 1 && (
            <>
              <button
                onClick={() => { setGoal(null); setSelected([]); onComplete(); markOnboardingDone(); }}
                style={{
                  padding: '11px 16px', borderRadius: 10, border: 'none',
                  background: 'transparent', color: 'var(--text-tertiary)',
                  fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >
                Skip
              </button>
              <button
                disabled={!goal}
                onClick={() => { setSelected([]); setStep(2); }}
                style={{
                  padding: '11px 28px', borderRadius: 10, border: 'none',
                  background: goal ? 'var(--accent)' : 'var(--border-mid)',
                  color: 'white', fontSize: 14, fontWeight: 700,
                  cursor: goal ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)',
                  transition: 'background 0.15s',
                }}
              >
                Next →
              </button>
            </>
          )}

          {step === 2 && (
            <button
              onClick={handleFinish}
              disabled={loading}
              style={{
                padding: '11px 28px', borderRadius: 10, border: 'none',
                background: 'var(--accent)', color: 'white',
                fontSize: 14, fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer', fontFamily: 'var(--font-body)',
                opacity: loading ? 0.8 : 1, transition: 'opacity 0.15s',
              }}
            >
              {loading ? 'Creating...' : selected.length === 0 ? 'Skip & Finish →' : `Add ${selected.length} Habit${selected.length > 1 ? 's' : ''} →`}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
