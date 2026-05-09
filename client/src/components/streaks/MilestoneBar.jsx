import { motion } from 'framer-motion';

const MILESTONES = [7, 21, 66, 100, 365];
const MILESTONE_LABELS = { 7: '1W', 21: '3W', 66: '66D', 100: '100D', 365: '1Y' };

export default function MilestoneBar({ streak = 0 }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {MILESTONES.map(m => {
        const reached = streak >= m;
        const isNext = !reached && MILESTONES.filter(x => streak >= x).length === MILESTONES.indexOf(m);

        return (
          <motion.div
            key={m}
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              border: `1px solid ${reached ? 'var(--accent)' : isNext ? 'var(--accent-dim)' : 'var(--border-subtle)'}`,
              background: reached ? 'var(--accent-glow)' : isNext ? 'rgba(141,170,35,0.06)' : 'transparent',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: reached ? 'var(--accent)' : isNext ? 'var(--accent-dim)' : 'var(--text-tertiary)',
              boxShadow: reached ? '0 0 8px rgba(200,241,53,0.25)' : 'none',
              animation: isNext ? 'pulse-lime 2s infinite' : 'none',
            }}
          >
            {MILESTONE_LABELS[m]}
            {reached ? ' ✓' : ''}
          </motion.div>
        );
      })}
    </div>
  );
}
