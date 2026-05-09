import { useEffect } from 'react';
import { motion } from 'framer-motion';
import useHabitStore from '../../stores/habitStore';
import useUserStore from '../../stores/userStore';
import StreakCard from '../../components/streaks/StreakCard';
import MilestoneBar from '../../components/streaks/MilestoneBar';
import AchievementBadge from '../../components/streaks/AchievementBadge';
import FreezePanel from '../../components/streaks/FreezePanel';
import PageTransition from '../../components/layout/PageTransition';

export default function Streaks() {
  const { habits } = useHabitStore();
  const { user, achievements, fetchAchievements } = useUserStore();

  useEffect(() => {
    fetchAchievements();
  }, []);

  const activeHabits = habits.filter(h => !h.isArchived);
  const habitsWithStreak = [...activeHabits]
    .sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0));

  return (
    <PageTransition>
      <div className="page-content">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.1em', marginBottom: 6 }}>MOMENTUM TRACKER</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--text-primary)', margin: 0 }}>
              Streaks
            </h1>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--teal)' }}>
              ❄️ {user?.streakFreezes || 0} freezes
            </div>
          </div>
        </div>

        {/* Live Streak Leaderboard */}
        <div style={{ marginBottom: 32 }}>
          <SectionLabel>CURRENT STREAKS</SectionLabel>
          {habitsWithStreak.length === 0 ? (
            <div style={{ color: 'var(--text-tertiary)', fontSize: 14, fontFamily: 'var(--font-body)', padding: '20px 0' }}>
              Start completing habits to build streaks!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {habitsWithStreak.map((habit, idx) => (
                <div key={habit._id}>
                  <StreakCard habit={habit} rank={idx + 1} />
                  <div style={{ marginTop: 8, marginBottom: 4, paddingLeft: 8 }}>
                    <MilestoneBar streak={habit.currentStreak || 0} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Freeze Panel */}
        <div style={{ marginBottom: 32 }}>
          <SectionLabel>STREAK FREEZES</SectionLabel>
          <FreezePanel />
        </div>

        {/* Achievements */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <SectionLabel>ACHIEVEMENTS</SectionLabel>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)' }}>
              {achievements.filter(a => a.unlocked).length} / {achievements.length} unlocked
            </div>
          </div>

          {achievements.length === 0 ? (
            <div style={{ color: 'var(--text-tertiary)', fontSize: 14, fontFamily: 'var(--font-body)' }}>
              Loading achievements...
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
            }}>
              {achievements.map((ach, i) => (
                <motion.div
                  key={ach._id || ach.key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <AchievementBadge achievement={ach} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.1em',
      color: 'var(--text-tertiary)',
      textTransform: 'uppercase',
      marginBottom: 14,
    }}>
      {children}
    </div>
  );
}
