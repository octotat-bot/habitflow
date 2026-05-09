import { format, formatDistanceToNow, isToday, isYesterday, parseISO, differenceInDays } from 'date-fns';

export const formatDate = (date, fmt = 'MMM d, yyyy') => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt);
};

export const formatDateShort = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
};

export const formatDateMono = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "EEE · d MMM").toUpperCase();
};

export const timeAgo = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
};

export const todayString = () => format(new Date(), 'yyyy-MM-dd');

export const getDynamicGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 7)  return 'dawn ritual.';
  if (hour >= 7 && hour < 12) return 'morning run.';
  if (hour >= 12 && hour < 17) return 'afternoon focus.';
  if (hour >= 17 && hour < 21) return 'evening wind-down.';
  return 'night grind.';
};

export const getDaysSince = (dateStr) => {
  if (!dateStr) return 0;
  return differenceInDays(new Date(), new Date(dateStr));
};

export const formatTime = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'HH:mm');
};

export const getMoodEmoji = (mood) => {
  const map = { 1: '😔', 2: '😕', 3: '😐', 4: '😊', 5: '😄' };
  return map[mood] || '—';
};

export const getEnergyEmoji = (energy) => {
  const map = { 1: '🪫', 2: '😴', 3: '⚡', 4: '🔋', 5: '🚀' };
  return map[energy] || '—';
};
