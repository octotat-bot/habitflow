import { motion } from 'framer-motion';
import { getNextMilestone, getMilestoneProgress } from '../../lib/streakUtils';

const MILESTONES = [7, 21, 66, 100, 365];

export default function StreakCard({ habit, rank }) {
  const streak = habit.currentStreak || 0;
  const next = getNextMilestone(streak);
  const progress = getMilestoneProgress(streak);
  const isTopThree = rank <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 16px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Rank */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        fontWeight: 700,
        color: isTopThree ? 'var(--accent)' : 'var(--text-tertiary)',
        width: 24,
        textAlign: 'center',
        flexShrink: 0,
      }}>
        {rank}
      </div>

      {/* Icon */}
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: `${habit.color || '#C8F135'}22`,
        border: `1px solid ${habit.color || '#C8F135'}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
        flexShrink: 0,
      }}>
        {habit.icon || '✨'}
      </div>

      {/* Name + Progress */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 14,
          color: 'var(--text-primary)',
          marginBottom: 6,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {habit.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 3, background: 'var(--border-subtle)', borderRadius: 99 }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: rank * 0.05 + 0.3 }}
              style={{
                height: '100%',
                background: isTopThree ? 'var(--accent)' : 'var(--border-bright)',
                borderRadius: 99,
                boxShadow: isTopThree ? '0 0 6px rgba(200,241,53,0.5)' : 'none',
              }}
            />
          </div>
          {next && (
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
              →{next}d
            </span>
          )}
        </div>
      </div>

      {/* Streak number */}
      <div
        className={streak >= 7 ? 'streak-glow' : ''}
        style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: streak >= 100 ? 20 : 24,
          color: streak >= 7 ? 'var(--accent)' : 'var(--text-secondary)',
          flexShrink: 0,
        }}
      >
        {streak}
        <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 2, color: 'var(--text-tertiary)' }}>d</span>
      </div>
    </motion.div>
  );
}
