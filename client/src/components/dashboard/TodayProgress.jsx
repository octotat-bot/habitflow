/**
 * TodayProgress — a sticky floating ring showing X/Y habits done today.
 * Renders at the top of the dashboard, just below the nav bar.
 */
import { motion, AnimatePresence } from 'framer-motion';
import ProgressRing from '../ui/ProgressRing';
import useHabitStore from '../../stores/habitStore';

export default function TodayProgress() {
  const { habits, todayCompletions } = useHabitStore();
  const active    = habits.filter(h => !h.isArchived);
  const total     = active.length;
  const done      = todayCompletions.length;
  const pct       = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone   = total > 0 && done >= total;
  const remaining = total - done;

  if (total === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        background: allDone ? 'linear-gradient(135deg, #EEF7DC 0%, #F5F9EC 100%)' : 'var(--bg-surface)',
        border: `1px solid ${allDone ? 'var(--accent)' : 'var(--border-subtle)'}`,
        borderRadius: 16,
        padding: '16px 20px',
        marginBottom: 20,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: allDone ? '0 4px 20px rgba(91,154,47,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Background fill bar */}
      <div style={{
        position: 'absolute', inset: 0, left: 0,
        width: `${pct}%`,
        background: allDone
          ? 'rgba(91,154,47,0.08)'
          : 'linear-gradient(90deg, rgba(200,241,53,0.07) 0%, transparent 100%)',
        transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
        borderRadius: 16,
        pointerEvents: 'none',
      }} />

      {/* Ring */}
      <div style={{ flexShrink: 0, position: 'relative' }}>
        <ProgressRing
          value={done}
          max={total}
          size={64}
          strokeWidth={5}
          color={allDone ? '#3A7A0F' : 'var(--accent)'}
          glow={allDone}
        >
          <div style={{ textAlign: 'center', lineHeight: 1 }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: allDone ? 11 : 16,
              color: allDone ? '#3A7A0F' : 'var(--text-primary)',
            }}>
              {allDone ? '✓' : done}
            </div>
            {!allDone && (
              <div style={{ fontSize: 9, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                /{total}
              </div>
            )}
          </div>
        </ProgressRing>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 16,
          color: allDone ? '#2A5A0A' : 'var(--text-primary)',
          marginBottom: 2,
        }}>
          {allDone
            ? '🎉 Perfect day! All habits done.'
            : done === 0
              ? "Let's get started on today's habits"
              : `${remaining} habit${remaining > 1 ? 's' : ''} left for a perfect day`}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          {pct}% complete · {done}/{total} done today
        </div>
      </div>

      {/* Pct badge */}
      <div style={{
        flexShrink: 0,
        background: allDone ? 'rgba(58,122,15,0.12)' : 'var(--bg-base)',
        border: `1.5px solid ${allDone ? '#5B9A2F' : 'var(--border-subtle)'}`,
        borderRadius: 99,
        padding: '4px 12px',
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: 14,
        color: allDone ? '#3A7A0F' : 'var(--text-primary)',
        position: 'relative',
      }}>
        {pct}%
      </div>
    </motion.div>
  );
}
