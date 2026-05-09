import usePageTitle from '../../hooks/usePageTitle.js';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import api from '../../lib/axios';
import useUserStore from '../../stores/userStore';

const RARITY_CONFIG = {
  common:    { label: 'Common',    color: '#888',    bg: '#F5F5F3', glow: 'rgba(136,136,136,0.2)' },
  rare:      { label: 'Rare',      color: '#3B82F6', bg: '#EFF6FF', glow: 'rgba(59,130,246,0.2)' },
  epic:      { label: 'Epic',      color: '#7C3AED', bg: '#F5F3FF', glow: 'rgba(124,58,237,0.2)' },
  legendary: { label: 'Legendary', color: '#F59E0B', bg: '#FFFBEB', glow: 'rgba(245,158,11,0.3)' },
};

export default function Achievements() {
  const { user } = useUserStore();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('all'); // 'all' | 'unlocked' | 'locked'

  useEffect(() => {
    api.get('/achievements')
      .then(r => { setAchievements(r.data.achievements); setLoading(false); })
      .catch(() => setLoading(false));
    // Mark as seen
    api.patch('/achievements/seen').catch(() => {});
  }, []);

  const unlocked = achievements.filter(a => a.unlocked);
  const locked   = achievements.filter(a => !a.unlocked);
  const filtered = filter === 'unlocked' ? unlocked : filter === 'locked' ? locked : achievements;

  const byRarity = (list) => {
    const order = ['legendary', 'epic', 'rare', 'common'];
    return [...list].sort((a, b) => order.indexOf(a.rarity) - order.indexOf(b.rarity));
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', paddingBottom: 64 }}>
      <div style={{ padding: '28px 28px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, color: 'var(--text-primary)', margin: 0 }}>
              Achievement <span style={{ color: 'var(--accent)' }}>Gallery</span>
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 0' }}>
              {unlocked.length} of {achievements.length} unlocked
            </p>
          </div>

          {/* XP + Level pill */}
          <div style={{ background: '#1A1916', color: '#F5F4EF', padding: '12px 20px', borderRadius: 14, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--accent)', lineHeight: 1 }}>
              LVL {user?.level || 1}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#555', textTransform: 'uppercase', marginTop: 3 }}>
              {user?.xp || 0} XP
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Collection Progress</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
              {achievements.length > 0 ? Math.round((unlocked.length / achievements.length) * 100) : 0}%
            </span>
          </div>
          <div style={{ height: 8, background: '#E8E5E0', borderRadius: 99, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${achievements.length > 0 ? (unlocked.length / achievements.length) * 100 : 0}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              style={{ height: '100%', background: 'var(--accent)', borderRadius: 99 }}
            />
          </div>

          {/* Rarity breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 16 }}>
            {Object.entries(RARITY_CONFIG).map(([rar, cfg]) => {
              const total = achievements.filter(a => a.rarity === rar).length;
              const done  = achievements.filter(a => a.rarity === rar && a.unlocked).length;
              return (
                <div key={rar} style={{ textAlign: 'center', padding: '10px', background: cfg.bg, borderRadius: 10, border: `1px solid ${cfg.color}30` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cfg.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: cfg.color, lineHeight: 1, marginTop: 4 }}>{done}/{total}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          {[['all', `All (${achievements.length})`], ['unlocked', `Unlocked (${unlocked.length})`], ['locked', `Locked (${locked.length})`]].map(([v, label]) => (
            <button key={v} onClick={() => setFilter(v)} style={{
              padding: '6px 14px', borderRadius: 99, border: `1px solid ${filter === v ? 'var(--accent)' : 'var(--border-mid)'}`,
              background: filter === v ? 'var(--accent-light)' : 'transparent',
              color: filter === v ? 'var(--accent-dim)' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: filter === v ? 700 : 500, cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>{label}</button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading achievements...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>No achievements here yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, paddingBottom: 32 }}>
            {byRarity(filtered).map((ach, i) => {
              const cfg = RARITY_CONFIG[ach.rarity] || RARITY_CONFIG.common;
              return (
                <motion.div key={ach._id || ach.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  style={{
                    background: ach.unlocked ? cfg.bg : '#FAFAF8',
                    border: `1.5px solid ${ach.unlocked ? cfg.color + '40' : 'var(--border-subtle)'}`,
                    borderRadius: 14, padding: '18px',
                    opacity: ach.unlocked ? 1 : 0.55,
                    boxShadow: ach.unlocked ? `0 4px 16px ${cfg.glow}` : 'none',
                    transition: 'all 0.15s',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {/* Rarity badge */}
                  <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}40`, padding: '2px 6px', borderRadius: 99 }}>
                    {cfg.label}
                  </div>

                  {/* Icon */}
                  <div style={{ fontSize: 36, marginBottom: 10, filter: ach.unlocked ? 'none' : 'grayscale(1)' }}>
                    {ach.unlocked ? ach.icon : '🔒'}
                  </div>

                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: ach.unlocked ? 'var(--text-primary)' : 'var(--text-tertiary)', marginBottom: 4 }}>
                    {ach.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 10 }}>
                    {ach.unlocked ? ach.description : '???'}
                  </div>

                  {ach.unlocked ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: cfg.color, fontWeight: 700 }}>+{ach.xpReward} XP</span>
                      {ach.unlockedAt && (
                        <span style={{ fontSize: 9, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                          {format(new Date(ach.unlockedAt), 'MMM d')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                      {ach.condition || 'Keep going to unlock'}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
