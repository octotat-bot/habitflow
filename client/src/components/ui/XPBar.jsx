import useUserStore from '../../stores/userStore';

function getTotalXpForBase(lvl) {
  let total = 0;
  for (let i = 2; i <= lvl; i++) {
    total += Math.floor(200 * Math.pow(1.3, i - 2));
  }
  return total;
}

export default function XPBar({ compact = false }) {
  const user = useUserStore(s => s.user);
  if (!user) return null;

  const level = user.level || 1;
  const xp = user.xp || 0;

  const currentLevelBase = getTotalXpForBase(level);
  const nextLevelBase = getTotalXpForBase(level + 1);
  const progress = nextLevelBase > currentLevelBase
    ? Math.min(((xp - currentLevelBase) / (nextLevelBase - currentLevelBase)) * 100, 100)
    : 100;

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--accent)',
          fontWeight: 600,
        }}>
          LVL {level}
        </span>
        <div style={{ flex: 1, height: 3, background: 'var(--border-subtle)', borderRadius: 99 }}>
          <div style={{
            height: '100%',
            width: `${Math.min(progress, 100)}%`,
            background: 'var(--accent)',
            borderRadius: 99,
            transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
          }} />
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-tertiary)',
        }}>
          {xp} XP
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            background: 'var(--accent)',
            color: 'var(--bg-base)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: 12,
            padding: '2px 8px',
            borderRadius: 4,
          }}>
            LVL {level}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>
            Level {level}
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)' }}>
          {xp.toLocaleString()} XP
        </span>
      </div>

      <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(progress, 100)}%`,
          background: 'linear-gradient(90deg, var(--accent-dim), var(--accent))',
          borderRadius: 99,
          transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: '0 0 8px rgba(200,241,53,0.4)',
        }} />
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
        {Math.round(progress)}% to Level {level + 1}
      </div>
    </div>
  );
}
