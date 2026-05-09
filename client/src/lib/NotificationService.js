/**
 * NotificationService — schedules browser notifications for habits
 * Supports two modes per habit:
 *   1. reminderTime (HH:MM) — exact time, highest priority
 *   2. timeOfDay (dawn/morning/afternoon/evening/night) — time window fallback
 * Works while the browser tab is open (1-minute polling interval).
 */

const TIME_WINDOWS = {
  dawn:      { hour: 5,  minuteRange: [0, 30], label: 'Rise & shine — time to start your dawn ritual' },
  morning:   { hour: 7,  minuteRange: [0, 30], label: 'Good morning! Check off your morning habits' },
  afternoon: { hour: 12, minuteRange: [0, 30], label: 'Midday check-in — how are your habits going?' },
  evening:   { hour: 17, minuteRange: [0, 30], label: 'Evening wind-down — time for your ritual' },
  night:     { hour: 21, minuteRange: [0, 30], label: 'Night routine — finish strong today' },
};

class NotificationService {
  constructor() {
    this.intervalId    = null;
    this.notifiedToday = new Set(); // `${habitId}_${YYYY-MM-DD}`
    this._getHabits    = null;
    this._getCompleted = null;
  }

  async requestPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  get isGranted() {
    return typeof Notification !== 'undefined' && Notification.permission === 'granted';
  }

  get permissionStatus() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }

  show(title, body, tag) {
    if (!this.isGranted) return;
    try {
      const n = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: tag || title,
        requireInteraction: false,
        silent: false,
      });
      n.onclick = () => { window.focus(); n.close(); };
      setTimeout(() => n.close(), 10_000);
    } catch (e) {
      console.warn('[NotificationService] Failed to show notification:', e);
    }
  }

  /** Fire a test notification immediately */
  test() {
    this.show('🔔 HabitFlow', "Habit reminders are enabled! You'll be notified when it's time.", 'habitflow-test');
  }

  /**
   * Start the per-minute scheduler.
   * @param {() => Habit[]} getHabits — returns current habit list
   * @param {() => Set<string>} getCompletedToday — returns Set of completed habitIds today
   */
  start(getHabits, getCompletedToday) {
    this._getHabits    = getHabits;
    this._getCompleted = getCompletedToday;
    this.stop();
    this._tick();
    this.intervalId = setInterval(() => this._tick(), 60_000);
  }

  _tick() {
    if (!this.isGranted) return;
    if (!this._getHabits) return;

    const now     = new Date();
    const hh      = now.getHours();
    const mm      = now.getMinutes();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const habits  = (this._getHabits() || []).filter(h => !h.isArchived);
    const completedToday = this._getCompleted ? this._getCompleted() : new Set();

    for (const habit of habits) {
      const key = `${habit._id}_${dateStr}`;
      if (this.notifiedToday.has(key)) continue;

      const hid        = String(habit._id);
      const alreadyDone = [...completedToday].some(id => String(id) === hid);
      if (alreadyDone) continue;

      // ── Mode 1: exact reminderTime (HH:MM) ──
      if (habit.reminderTime) {
        const [rh, rm] = habit.reminderTime.split(':').map(Number);
        if (hh === rh && mm === rm) {
          this.notifiedToday.add(key);
          this.show(
            `${habit.icon || '✨'} Reminder: ${habit.name}`,
            `Your daily reminder — time to complete "${habit.name}"!`,
            `habit-${habit._id}-${dateStr}`
          );
        }
        continue; // skip timeOfDay check if reminderTime is set
      }

      // ── Mode 2: timeOfDay window ──
      if (!habit.timeOfDay) continue;
      const cfg = TIME_WINDOWS[habit.timeOfDay];
      if (!cfg) continue;
      if (hh !== cfg.hour) continue;
      if (mm < cfg.minuteRange[0] || mm > cfg.minuteRange[1]) continue;

      this.notifiedToday.add(key);
      this.show(
        `${habit.icon || '✨'} Time for: ${habit.name}`,
        cfg.label,
        `habit-${habit._id}-${dateStr}`
      );
    }

    // Clean up old keys (previous days)
    for (const key of this.notifiedToday) {
      if (!key.endsWith(dateStr)) this.notifiedToday.delete(key);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const notificationService = new NotificationService();
