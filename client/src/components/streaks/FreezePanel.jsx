import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import useUserStore from '../../stores/userStore';
import useHabitStore from '../../stores/habitStore';

export default function FreezePanel() {
  const { user, fetchUser } = useUserStore();
  const { habits, todayCompletions, fetchHabits } = useHabitStore();
  const [spending, setSpending] = useState(null);

  if (!user) return null;

  const freezes = user.streakFreezes || 0;

  // At-risk habits (streak > 0, not completed today)
  const atRiskHabits = habits.filter(h => {
    const hour = new Date().getHours();
    const isCompleted = todayCompletions.some(c => String(c.habitId) === String(h._id));
    return !isCompleted && (h.currentStreak || 0) > 0 && !h.isArchived;
  });

  const spendFreeze = async (habitId, habitName) => {
    if (freezes <= 0) { toast.error('No freezes available'); return; }
    setSpending(habitId);
    try {
      const { data } = await api.post('/streaks/freeze', { habitId });
      toast.success(`❄️ Freeze applied to "${habitName}"! Streak protected.`);
      await fetchUser();
      await fetchHabits();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to apply freeze');
    } finally {
      setSpending(null);
    }
  };

  return (
    <div style={{
      padding: 20,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 28 }}>❄️</span>
        <div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: 20,
            color: 'var(--teal)',
          }}>
            {freezes} Streak {freezes === 1 ? 'Freeze' : 'Freezes'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
            Max 5 · Earn 1 per perfect week
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{
              width: 12, height: 20,
              borderRadius: 3,
              background: i < freezes ? 'var(--teal)' : 'var(--border-subtle)',
              boxShadow: i < freezes ? '0 0 6px rgba(45,212,191,0.4)' : 'none',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
      </div>

      {/* At-risk habits */}
      {atRiskHabits.length > 0 ? (
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            At-Risk Streaks
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {atRiskHabits.map(h => (
              <div key={h._id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                background: 'var(--bg-elevated)',
                border: '1px solid rgba(245,166,35,0.3)',
                borderRadius: 'var(--radius-md)',
              }}>
                <span style={{ fontSize: 18 }}>{h.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{h.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber)' }}>🔥 {h.currentStreak}d at risk</div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => spendFreeze(h._id, h.name)}
                  disabled={freezes <= 0 || spending === h._id}
                  style={{
                    padding: '6px 14px',
                    background: freezes > 0 ? 'rgba(45,212,191,0.15)' : 'var(--bg-surface)',
                    border: '1px solid var(--teal)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--teal)',
                    fontSize: 12,
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    cursor: 'none',
                    opacity: freezes <= 0 ? 0.4 : 1,
                  }}
                >
                  {spending === h._id ? '...' : '❄️ Freeze'}
                </motion.button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
          No streaks at risk right now. Keep it up! 🔥
        </div>
      )}

      {/* Earn conditions */}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          How to Earn Freezes
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', lineHeight: 1.8 }}>
          ✦ Complete all habits for 7 consecutive days (Perfect Week)<br />
          ✦ Maximum balance: 5 freezes
        </div>
      </div>
    </div>
  );
}
