import { useEffect } from 'react';
import useUserStore from '../stores/userStore';
import toast from 'react-hot-toast';

/**
 * useAchievementCheck - monitors newAchievements and shows a toast for each
 * Call once in AppShell
 */
export function useAchievementCheck(onNewAchievement) {
  const newAchievements = useUserStore(s => s.newAchievements);
  const clearNewAchievements = useUserStore(s => s.clearNewAchievements);

  useEffect(() => {
    if (!newAchievements || newAchievements.length === 0) return;

    for (const ach of newAchievements) {
      if (onNewAchievement) {
        onNewAchievement(ach);
      } else {
        toast.success(`🏆 Achievement Unlocked: ${ach.name}`, {
          duration: 5000,
          style: {
            background: '#0F0F0F',
            color: '#F2F0EB',
            border: '1px solid #C8F135',
          },
        });
      }
    }

    clearNewAchievements();
  }, [newAchievements?.length]);
}

export default useAchievementCheck;
