import { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import useHabitStore from '../../stores/habitStore';
import useUserStore from '../../stores/userStore';
import useUIStore from '../../stores/uiStore';
import useParticle from '../../hooks/useParticle';
import useStreakFreezeStore from '../../stores/streakFreezeStore';
import { todayString } from '../../lib/dateUtils';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const CATEGORY_COLORS = {
  Mind: 'var(--violet)', Body: 'var(--teal)', Work: 'var(--amber)',
  Social: '#F472B6', Creative: '#FB923C', Finance: '#34D399',
  Spirit: '#A5B4FC', Custom: 'var(--text-secondary)',
};

export default function HabitCard({ habit, index, completions, focusMode, isNextIncomplete }) {
  const { markComplete, undoComplete, todayCompletions } = useHabitStore();
  const { addNewAchievements, addXP } = useUserStore();
  const { openDrawer } = useUIStore();
  const { burst } = useParticle();
  const { canFreeze, isFrozenToday, useFreeze, undoFreeze, getResetDate } = useStreakFreezeStore();
  const checkBtnRef = useRef(null);
  const controls = useAnimation();

  const today       = todayString();
  const completion  = todayCompletions.find(c => String(c.habitId) === String(habit._id));
  const isCompleted = !!completion;
  const streak      = habit.currentStreak || 0;
  const bigStreak   = streak >= 7;
  const frozen      = isFrozenToday(habit._id);
  const freezeAvail = canFreeze(habit._id) && !frozen && streak >= 3 && !isCompleted;

  // Duration / Quantity helpers
  const habitType      = habit.habitType || 'boolean';
  const targetDuration = habit.targetDuration || 10;
  const targetQuantity = habit.targetQuantity || 1;

  const [showFreezeHint, setShowFreezeHint] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSecs, setTimerSecs] = useState(targetDuration * 60);
  const timerRef = useRef(null);

  // Timer countdown
  useEffect(() => {
    if (timerActive && timerSecs > 0) {
      timerRef.current = setInterval(() => setTimerSecs(s => s - 1), 1000);
    } else if (timerSecs === 0 && timerActive) {
      setTimerActive(false);
      handleComplete();
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive, timerSecs]);

  const handleComplete = async () => {
    if (isCompleted) return;

    await controls.start({ scale: 0.85, transition: { duration: 0.1 } });
    await controls.start({ scale: 1.15, transition: { duration: 0.1 } });
    controls.start({ scale: 1, transition: { type: 'spring', stiffness: 400, damping: 20 } });

    burst(checkBtnRef.current, { count: 12, color: habit.color || '#C8F135', spread: 70 });

    try {
      const result = await markComplete(habit._id, today);
      if (result?.newAchievements?.length > 0) addNewAchievements(result.newAchievements);
      if (result?.xp) addXP(result.xp.xpAdded);
      if (result?.allDoneToday) triggerPerfectDayEffect();

      const undoToastId = toast.custom((t) => (
        <UndoToast
          t={t}
          habitName={habit.name}
          onUndo={async () => {
            toast.dismiss(undoToastId);
            await undoComplete(result.completion._id, habit._id);
          }}
        />
      ), { duration: 5000 });
    } catch {
      toast.error('Failed to mark complete');
    }
  };

  const handleFreeze = () => {
    useFreeze(habit._id);
    toast.success(`🧊 Streak frozen! "${habit.name}" streak is protected for today.`, { duration: 4000 });
    setShowFreezeHint(false);
  };

  const handleUndoFreeze = () => {
    undoFreeze(habit._id);
    toast('Streak freeze removed', { icon: '↩' });
  };

  const triggerPerfectDayEffect = () => {
    const flash = document.createElement('div');
    flash.className = 'lime-flash-overlay active';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 200);
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#C8F135', '#8DAA23', '#F2F0EB'] });
  };

  const dimmed = focusMode && !isNextIncomplete && !isCompleted;

  // Format timer
  const mins = String(Math.floor(timerSecs / 60)).padStart(2, '0');
  const secs = String(timerSecs % 60).padStart(2, '0');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: dimmed ? 0.12 : isCompleted ? 0.5 : 1, y: 0 }}
      transition={{ layout: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.3 }, delay: index * 0.04 }}
      style={{
        background: frozen ? 'linear-gradient(135deg, #EBF4FF 0%, #F5F9FF 100%)' : 'var(--bg-surface)',
        border: `1px solid ${frozen ? '#93C5FD' : 'var(--border-subtle)'}`,
        borderLeft: `4px solid ${frozen ? '#60A5FA' : (habit.color || '#C8F135')}`,
        borderRadius: 'var(--radius-lg)',
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 14,
        position: 'relative', overflow: 'hidden',
        pointerEvents: dimmed ? 'none' : 'auto',
      }}
    >
      {/* Completed shimmer */}
      {isCompleted && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(200,241,53,0.04), transparent)', pointerEvents: 'none' }} />
      )}

      {/* Frozen overlay badge */}
      {frozen && !isCompleted && (
        <div style={{ position: 'absolute', top: 6, right: 52, display: 'flex', alignItems: 'center', gap: 4, background: '#DBEAFE', border: '1px solid #93C5FD', borderRadius: 99, padding: '2px 8px' }}>
          <span style={{ fontSize: 11 }}>🧊</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#2563EB', fontFamily: 'var(--font-mono)' }}>FROZEN</span>
          <button onClick={handleUndoFreeze} style={{ fontSize: 10, color: '#93C5FD', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 2 }}>×</button>
        </div>
      )}

      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${habit.color}22` || 'var(--bg-elevated)',
        border: `1px solid ${habit.color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>
        {habit.icon || '✨'}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15,
            color: 'var(--text-primary)',
            textDecoration: isCompleted ? 'line-through' : 'none',
            textDecorationColor: 'var(--text-tertiary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {habit.name}
          </span>
          {habit.isPinned && <span style={{ fontSize: 11 }}>📌</span>}
          {habitType === 'duration' && <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>⏱ {targetDuration}m</span>}
          {habitType === 'quantity' && <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>🔢 ×{targetQuantity}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-body)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            color: CATEGORY_COLORS[habit.category] || 'var(--text-tertiary)',
            background: `${CATEGORY_COLORS[habit.category]}18`,
            padding: '1px 6px', borderRadius: 4,
            border: `1px solid ${CATEGORY_COLORS[habit.category]}30`,
          }}>
            {habit.category}
          </span>
          {streak > 0 && (
            <span className={bigStreak ? 'streak-glow' : ''} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: bigStreak ? 'var(--accent)' : 'var(--text-secondary)' }}>
              🔥 {streak}d
            </span>
          )}
        </div>

        {/* Duration timer bar */}
        {habitType === 'duration' && !isCompleted && timerActive && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--accent-dim)' }}>{mins}:{secs}</span>
              <button onClick={() => { setTimerActive(false); setTimerSecs(targetDuration * 60); }} style={{ fontSize: 10, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
            </div>
            <div style={{ height: 3, background: 'var(--border-subtle)', borderRadius: 99 }}>
              <motion.div
                style={{ height: '100%', background: 'var(--accent)', borderRadius: 99 }}
                animate={{ width: `${(1 - timerSecs / (targetDuration * 60)) * 100}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>
          </div>
        )}

        {/* Quantity stepper */}
        {habitType === 'quantity' && !isCompleted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <button onClick={() => setQuantity(q => Math.max(0, q - 1))} style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid var(--border-mid)', background: 'var(--bg-base)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, minWidth: 32, textAlign: 'center' }}>{quantity}/{targetQuantity}</span>
            <button onClick={() => setQuantity(q => q + 1)} style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid var(--border-mid)', background: 'var(--bg-base)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            <div style={{ flex: 1, height: 3, background: 'var(--border-subtle)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div style={{ height: '100%', background: habit.color || 'var(--accent)', borderRadius: 99 }} animate={{ width: `${Math.min((quantity / targetQuantity) * 100, 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Freeze button — only show when streak ≥ 3 and freeze available */}
      {freezeAvail && (
        <div style={{ position: 'relative' }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowFreezeHint(h => !h)}
            style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #93C5FD', background: '#EFF6FF', color: '#3B82F6', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            🧊
          </motion.button>
          <AnimatePresence>
            {showFreezeHint && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 4 }}
                style={{ position: 'absolute', bottom: 38, right: 0, width: 200, background: 'var(--bg-elevated)', border: '1px solid #93C5FD', borderRadius: 12, padding: 12, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8', marginBottom: 4 }}>🧊 Streak Freeze</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
                  Protect your {streak}-day streak. You have 1 freeze/week. Resets {getResetDate()}.
                </div>
                <button onClick={handleFreeze} style={{ width: '100%', padding: '8px', borderRadius: 8, border: 'none', background: '#3B82F6', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Use Freeze →
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Check / Action button */}
      <motion.button
        ref={checkBtnRef}
        animate={controls}
        onClick={() => {
          if (isCompleted) return;
          if (habitType === 'duration' && !timerActive) { setTimerActive(true); return; }
          if (habitType === 'quantity' && quantity < targetQuantity) { toast('Keep going! Tap + to count.', { icon: '🔢' }); return; }
          handleComplete();
        }}
        disabled={isCompleted}
        whileHover={!isCompleted ? { scale: 1.1 } : {}}
        style={{
          width: 44, height: 44, borderRadius: '50%',
          border: isCompleted ? '2px solid var(--accent)' : frozen ? '2px solid #93C5FD' : '2px solid var(--border-mid)',
          background: isCompleted ? 'var(--accent)' : frozen ? '#DBEAFE' : 'transparent',
          color: isCompleted ? 'var(--bg-base)' : frozen ? '#3B82F6' : 'var(--text-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: isCompleted ? 'default' : 'pointer',
          flexShrink: 0,
          transition: 'border-color 0.2s ease, background 0.2s ease',
          boxShadow: isCompleted ? '0 0 12px rgba(200,241,53,0.4)' : 'none',
        }}
      >
        {isCompleted ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
        ) : habitType === 'duration' && !timerActive ? (
          <span style={{ fontSize: 16 }}>▶</span>
        ) : habitType === 'quantity' && quantity >= targetQuantity ? (
          <span style={{ fontSize: 13, fontWeight: 700, color: habit.color || 'var(--accent)' }} onClick={handleComplete}>✓</span>
        ) : (
          <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid currentColor', opacity: 0.5 }} />
        )}
      </motion.button>
    </motion.div>
  );
}

function UndoToast({ t, habitName, onUndo }) {
  const [progress, setProgress] = useState(100);
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / 5000) * 100);
      setProgress(pct);
      if (pct <= 0) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', borderRadius: 10, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 240, maxWidth: 320 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>✓ {habitName}</span>
        <button onClick={onUndo} style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer', border: 'none', background: 'none' }}>UNDO</button>
      </div>
      <div style={{ height: 2, background: 'var(--border-subtle)', borderRadius: 99 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width 0.1s linear' }} />
      </div>
    </motion.div>
  );
}
