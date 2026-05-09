import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import FloatingNav, { BottomDock } from './FloatingNav';
import CommandPalette from './CommandPalette';
import OfflineBanner from '../ui/OfflineBanner';
import LoadingScreen from '../ui/LoadingScreen';
import useUserStore from '../../stores/userStore';
import useHabitStore from '../../stores/habitStore';
import useAchievementCheck from '../../hooks/useAchievementCheck';
import useRealtimeSync from '../../hooks/useRealtimeSync';
import OnboardingWizard, { isOnboardingDone, markOnboardingDone } from '../onboarding/OnboardingWizard';
import { tabStorage } from '../../lib/storage';

export default function AppShell() {
  const { user, fetchUser, newAchievements, addNewAchievements } = useUserStore();
  const { fetchHabits, fetchTodayCompletions, habits } = useHabitStore();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Loading screen state — only shown if boot takes > 350ms
  const [bootDone, setBootDone]       = useState(false);
  const [loadProgress, setProgress]   = useState(0);
  const [showLoader, setShowLoader]   = useState(false);

  useAchievementCheck();
  useRealtimeSync(); // ← 30s poll + focus/visibility refetch

  useEffect(() => {
    const token = tabStorage.get('hf_token');
    if (!token) { navigate('/login'); return; }

    // Show loader only if auth takes more than 350ms (avoids flash on fast connections)
    const loaderTimer = setTimeout(() => setShowLoader(true), 350);

    // Stage 1: authenticate user (0 → 50)
    setProgress(10);
    fetchUser()
      .then(() => setProgress(50))
      .catch(() => {})
      .finally(async () => {
        // Stage 2: load habits + completions (50 → 100)
        setProgress(72);
        try {
          await Promise.all([fetchHabits(), fetchTodayCompletions()]);
          setProgress(100);
        } catch {
          setProgress(100);
        } finally {
          clearTimeout(loaderTimer);
          // Small delay so progress bar hits 100 before exit animation
          setTimeout(() => {
            setShowLoader(false);
            setBootDone(true);
          }, 300);
        }
      });

    return () => clearTimeout(loaderTimer);
  }, []);

  useEffect(() => {
    if (user && bootDone) {
      // If user already has habits → they've been through setup, mark done & skip wizard
      if (habits.length > 0 && !isOnboardingDone(user._id)) {
        markOnboardingDone(user._id);
        return;
      }
      // Only show wizard to genuinely new users with no habits
      if (!isOnboardingDone(user._id) && habits.length === 0) {
        const t = setTimeout(() => setShowOnboarding(true), 600);
        return () => clearTimeout(t);
      }
    }
  }, [user, bootDone, habits.length]);


  // showLoader is set/cleared by our boot sequence — no need for userLoading
  const isLoading = showLoader;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-base)' }}>
      {/* Loading screen — only shown if auth takes > 400ms */}
      <LoadingScreen isVisible={isLoading} progress={loadProgress} />

      {/* Toaster */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#fff',
            color: '#1A1916',
            border: '1px solid #EAEAE6',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            borderRadius: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
          success: { iconTheme: { primary: '#5B9A2F', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#E5534B', secondary: '#fff' } },
          duration: 3000,
        }}
      />

      {/* Offline banner */}
      <OfflineBanner />

      {/* Achievement Banner */}
      <AnimatePresence>
        {newAchievements?.length > 0 && (
          <AchievementBanner
            achievement={newAchievements[0]}
            onClose={() => addNewAchievements([])}
          />
        )}
      </AnimatePresence>

      {/* Floating nav */}
      <FloatingNav />

      {/* Mobile bottom dock */}
      <BottomDock />

      {/* Global Cmd+K command palette */}
      <CommandPalette />

      {/* Onboarding wizard — shown once per user */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingWizard onComplete={() => { setShowOnboarding(false); fetchHabits(); }} userId={user?._id} />
        )}
      </AnimatePresence>

      {/* Page content */}
      <div className="app-shell-outlet" style={{ paddingTop: 64 }}>
        <Outlet />
      </div>
    </div>
  );
}

function AchievementBanner({ achievement, onClose }) {
  const RARITY_COLORS = { common:'#888', rare:'#2AA198', epic:'#7C5CBF', legendary:'#E07B2A' };
  const color = RARITY_COLORS[achievement.rarity] || '#5B9A2F';

  return (
    <motion.div
      initial={{ opacity: 0, y: -60, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -60, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      style={{
        position: 'fixed', top: 74, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, background: '#fff',
        border: `2px solid ${color}`,
        borderRadius: 14, padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        minWidth: 300,
      }}
    >
      <span style={{ fontSize: 28 }}>{achievement.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color, marginBottom: 2 }}>
          Achievement Unlocked · {achievement.rarity}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1916' }}>{achievement.name}</div>
        <div style={{ fontSize: 11, color: '#888' }}>+{achievement.xpReward} XP</div>
      </div>
      <button onClick={onClose} style={{ color: '#bbb', fontSize: 18, cursor: 'pointer', border: 'none', background: 'none', lineHeight: 1 }}>×</button>
    </motion.div>
  );
}
