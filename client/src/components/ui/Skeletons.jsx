/**
 * Comprehensive skeleton components — dark-theme shimmer
 */

const SHIMMER = {
  background: 'linear-gradient(90deg, var(--bg-elevated,#1A1916) 25%, var(--border-subtle,#252320) 50%, var(--bg-elevated,#1A1916) 75%)',
  backgroundSize: '300% 100%',
  animation: 'boneShimmer 1.6s infinite linear',
};

const keyframes = `
  @keyframes boneShimmer {
    0%   { background-position: 300% 0; }
    100% { background-position: -300% 0; }
  }
`;

function Bone({ w = '100%', h = 16, r = 6, style = {} }) {
  return (
    <>
      <style>{keyframes}</style>
      <div style={{ width: w, height: h, borderRadius: r, flexShrink: 0, ...SHIMMER, ...style }} />
    </>
  );
}

/* ─── Habit card skeleton ─────────────────────── */
export function HabitCardSkeleton({ delay = 0 }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      borderLeft: '4px solid var(--border-mid)', borderRadius: 14, padding: 16,
      marginBottom: 16, opacity: 0, animation: `fadeIn 0.3s ${delay}s ease forwards`,
    }}>
      <style>{`@keyframes fadeIn{to{opacity:1}}`}</style>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <Bone w={40} h={40} r={10} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Bone h={13} w="65%" />
          <Bone h={9}  w="35%" r={99} />
        </div>
        <Bone w={20} h={20} r={4} />
      </div>
      <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
        {[0,1,2,3,4,5,6].map(i => <Bone key={i} w={18} h={18} r={4} style={{ flex: 1 }} />)}
      </div>
      <Bone h={10} w="45%" style={{ marginBottom: 10 }} />
      <Bone h={3} r={99} />
    </div>
  );
}

/* ─── Dashboard habit row skeleton ───────────────*/
export function HabitRowSkeleton({ cols = 10 }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <td style={{ padding: '13px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bone w={30} h={30} r={8} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <Bone h={12} w="70%" r={4} />
            <Bone h={9}  w="40%" r={3} />
          </div>
        </div>
      </td>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '13px 2px', textAlign: 'center' }}>
          <Bone w={20} h={20} r={5} style={{ margin: '0 auto' }} />
        </td>
      ))}
      <td style={{ padding: '13px 6px' }}><Bone h={12} w={36} r={4} style={{ margin: '0 auto' }} /></td>
      <td style={{ padding: '13px 16px' }}><Bone h={12} w={40} r={4} style={{ marginLeft: 'auto' }} /></td>
    </tr>
  );
}

/* ─── Stat metric card skeleton ──────────────────*/
export function StatCardSkeleton() {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderTop: '2px solid var(--border-mid)', borderRadius: 14, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Bone h={10} w="55%" r={4} />
      <Bone h={28} w="50%" r={6} />
    </div>
  );
}

/* ─── Full dashboard loading skeleton ────────────*/
export function DashboardSkeleton({ rows = 4, cols = 10 }) {
  return (
    <>
      {/* Stat cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[0,1,2,3].map(i => <StatCardSkeleton key={i} />)}
      </div>
      {/* Table */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
          {[80,60,50,60,70].map((w, i) => <Bone key={i} w={w} h={28} r={99} />)}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => <HabitRowSkeleton key={i} cols={cols} />)}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ─── Habits page skeleton ───────────────────────*/
export function HabitsPageSkeleton() {
  return (
    <div style={{ columns: 2, columnGap: 16 }}>
      {[0,1,2,3,4].map(i => <HabitCardSkeleton key={i} delay={i * 0.06} />)}
    </div>
  );
}

/* ─── Stats page skeleton ────────────────────────*/
export function StatsPageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[0,1,2,3].map(i => <StatCardSkeleton key={i} />)}
      </div>
      <div style={{ height: 180, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, ...SHIMMER }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ height: 160, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, ...SHIMMER }} />
        <div style={{ height: 160, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, ...SHIMMER }} />
      </div>
    </div>
  );
}

/* ─── Profile page skeleton ──────────────────────*/
export function ProfileSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* DNA card */}
      <div style={{ height: 160, background: '#1A1916', border: '1px solid #2A2A28', borderRadius: 18, ...SHIMMER }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ height: 280, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, ...SHIMMER }} />
        <div style={{ height: 280, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, ...SHIMMER }} />
      </div>
    </div>
  );
}

/* ─── Journal skeleton ───────────────────────────*/
export function JournalSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{ height: 52, borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', ...SHIMMER }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ height: 80, borderRadius: 12, ...SHIMMER, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }} />
        <div style={{ height: 220, borderRadius: 12, ...SHIMMER, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }} />
      </div>
    </div>
  );
}
