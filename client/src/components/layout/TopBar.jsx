import { motion } from 'framer-motion';
import useUserStore from '../../stores/userStore';
import { formatDateMono } from '../../lib/dateUtils';

export default function TopBar({ title, subtitle, rightSlot }) {
  const user = useUserStore(s => s.user);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: '32px 24px 20px',
      gap: 16,
    }}>
      <div>
        {subtitle && (
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-tertiary)',
            letterSpacing: '0.1em',
            marginBottom: 4,
          }}>
            {subtitle}
          </div>
        )}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 'clamp(24px, 4vw, 36px)',
          color: 'var(--text-primary)',
          lineHeight: 1.1,
          margin: 0,
        }}>
          {title}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {rightSlot}
        {user && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '2px solid var(--border-mid)',
              overflow: 'hidden',
              background: 'var(--bg-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--accent)',
              fontFamily: 'var(--font-display)',
              flexShrink: 0,
            }}
          >
            {user.avatarBase64 ? (
              <img src={user.avatarBase64} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user.name?.[0]?.toUpperCase() || 'U'
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
