import { motion } from 'framer-motion';
import { format } from 'date-fns';

const RARITY_CONFIG = {
  common:    { color: '#888888', glow: 'rgba(136,136,136,0.2)' },
  rare:      { color: '#2DD4BF', glow: 'rgba(45,212,191,0.2)' },
  epic:      { color: '#A78BFA', glow: 'rgba(167,139,250,0.2)' },
  legendary: { color: '#F5A623', glow: 'rgba(245,166,35,0.2)' },
};

export default function AchievementBadge({ achievement }) {
  const { unlocked, seen, rarity, icon, name, description, xpReward, unlockedAt } = achievement;
  const rc = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'relative',
        padding: '20px 16px',
        background: 'var(--bg-surface)',
        border: `1px solid ${unlocked ? rc.color + '60' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
        overflow: 'hidden',
        boxShadow: unlocked && !seen ? `0 0 16px ${rc.glow}` : 'none',
        animation: unlocked && !seen ? 'pulse-lime 2s 3' : 'none',
      }}
    >
      {/* Locked overlay */}
      {!unlocked && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(8,8,8,0.6)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          borderRadius: 'inherit',
        }}>
          <span style={{ fontSize: 20 }}>🔒</span>
        </div>
      )}

      {/* Icon */}
      <div style={{
        fontSize: 40,
        marginBottom: 12,
        filter: unlocked ? 'none' : 'grayscale(1)',
        lineHeight: 1,
      }}>
        {icon}
      </div>

      {/* Rarity badge */}
      <div style={{
        display: 'inline-block',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: rc.color,
        background: `${rc.color}18`,
        border: `1px solid ${rc.color}40`,
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        marginBottom: 8,
        fontFamily: 'var(--font-body)',
      }}>
        {rarity}
      </div>

      {/* Name */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 14,
        color: 'var(--text-primary)',
        marginBottom: 4,
      }}>
        {name}
      </div>

      {/* Description */}
      <div style={{
        fontSize: 11,
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-body)',
        marginBottom: 8,
        lineHeight: 1.5,
      }}>
        {description}
      </div>

      {/* XP */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: rc.color,
        fontWeight: 600,
      }}>
        +{xpReward} XP
      </div>

      {/* Unlock date */}
      {unlocked && unlockedAt && (
        <div style={{
          marginTop: 8,
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono)',
        }}>
          {format(new Date(unlockedAt), 'MMM d, yyyy')}
        </div>
      )}
    </motion.div>
  );
}
