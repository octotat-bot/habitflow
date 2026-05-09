// XP utility functions mirrored from server for client-side display
export function getLevelThreshold(level) {
  if (level <= 1) return 0;
  return Math.floor(200 * Math.pow(1.3, level - 2));
}

export function getTotalXpForLevel(level) {
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += getLevelThreshold(i);
  }
  return total;
}

export function calculateLevel(totalXp) {
  let level = 1;
  let accumulated = 0;
  while (true) {
    const threshold = getLevelThreshold(level + 1);
    if (accumulated + threshold > totalXp) break;
    accumulated += threshold;
    level++;
    if (level >= 100) break;
  }
  return level;
}
