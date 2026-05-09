const express = require('express');
const router = express.Router();
const { format, subDays, startOfWeek, endOfWeek, getDay } = require('date-fns');

const auth = require('../middleware/auth');
const aiRateLimit = require('../middleware/aiRateLimit');
const { generateText, generateJSON } = require('../utils/gemini');

const Habit = require('../models/Habit');
const HabitCompletion = require('../models/HabitCompletion');
const User = require('../models/User');
const WeeklyNarrative = require('../models/WeeklyNarrative');
const JournalInsight = require('../models/JournalInsight');
const AICache = require('../models/AICache');

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─── shared AI error handler ─────────────────────────────────────────────────
function aiError(res, err, fallback = {}) {
  const msg = err?.message || '';
  const isRateLimit = msg.includes('rate-limited') || msg.includes('retry in');
  const isQuota     = msg.includes('quota') || msg.includes('circuit');
  const status      = (isRateLimit || isQuota) ? 503 : 500;
  const message     = isRateLimit
    ? msg   // already has "retry in ~Xs"
    : isQuota
      ? 'AI quota exhausted for today — features resume automatically tomorrow.'
      : 'AI temporarily unavailable.';
  console.error('[AI error]', msg);
  res.status(status).json({ error: message, ...fallback });
}

// ─── helpers ────────────────────────────────────────────────────────────────

async function getCached(userId, feature) {
  const hit = await AICache.findOne({ userId, feature });
  return hit ? hit.data : null;
}

async function setCache(userId, feature, data, hoursToLive = 24) {
  const expiresAt = new Date(Date.now() + hoursToLive * 3600 * 1000);
  await AICache.findOneAndUpdate(
    { userId, feature },
    { userId, feature, data, expiresAt, createdAt: new Date() },
    { upsert: true, new: true }
  );
}

function mostCommonDay(completions) {
  const counts = Array(7).fill(0);
  for (const c of completions) {
    const dow = getDay(new Date(c.date + 'T12:00:00'));
    counts[dow]++;
  }
  const max = Math.max(...counts);
  return DAY_NAMES[counts.indexOf(max)];
}

// ─── FEATURE 1: INLINE COACH MESSAGE ────────────────────────────────────────
// POST /api/ai/coach
router.post('/coach', auth, aiRateLimit, async (req, res) => {
  try {
    const { habitId, event } = req.body;
    if (!habitId || !event) return res.status(400).json({ error: 'habitId and event required' });

    const [habit, user, allCompletions] = await Promise.all([
      Habit.findOne({ _id: habitId, userId: req.userId }),
      User.findById(req.userId).select('name'),
      HabitCompletion.find({ habitId, userId: req.userId }).sort({ date: -1 }).limit(30),
    ]);

    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const recent7 = allCompletions.slice(0, 7);
    const recentNotes = recent7.filter(c => c.note).map(c => c.note).slice(0, 3);
    const lastMood = recent7.find(c => c.mood)?.mood || 'unknown';
    const mostBreakDay = allCompletions.length > 5 ? mostCommonDay(
      allCompletions.filter((_, i) => i > 0 && !recent7.find(r => r.date === allCompletions[i - 1]?.date))
    ) : 'unknown';
    const totalHabits = await Habit.countDocuments({ userId: req.userId, isArchived: false });

    let contextLines = '';
    if (event === 'streak_break') {
      contextLines = `Broken streak: ${habit.currentStreak} days
Most common break day: ${mostBreakDay}
Last journal notes: ${recentNotes.length ? recentNotes.join(' | ') : 'none'}
Last mood score: ${lastMood}/5`;
    } else if (event === 'milestone') {
      contextLines = `Hit milestone: ${habit.currentStreak} days straight`;
    } else if (event === 'perfect_day') {
      contextLines = `Completed all ${totalHabits} habits today`;
    }

    const prompt = `You are a data-driven habit coach. Never say "great job", "you've got this", or any generic motivation.
Speak only from the user's actual data. Be direct. Be honest. Be brief.

User: ${user.name}
Event: ${event}
Habit: ${habit.name} (${habit.category})
${contextLines}

Write exactly 2 sentences. Reference specific numbers or patterns from the data above.
No emojis. No exclamation marks. Plain text only.`;

    const message = await generateText(prompt);
    res.json({ message: message.trim() });
  } catch (err) { aiError(res, err, { message: 'Keep tracking — patterns take time to reveal themselves.' }); }
});

// ─── FEATURE 2: PARSE HABIT FROM NATURAL LANGUAGE ───────────────────────────
// POST /api/ai/parse-habit
router.post('/parse-habit', auth, aiRateLimit, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'text is required' });

    const prompt = `Parse this habit description into a structured habit object.
Input: "${text.trim()}"

Return ONLY valid JSON matching this exact schema:
{
  "name": "string (short, title-case, max 4 words)",
  "description": "string (one sentence)",
  "icon": "string (single emoji that represents it)",
  "category": "one of: Mind, Body, Work, Social, Creative, Finance, Spirit, Custom",
  "frequency": "one of: daily, weekdays, weekends, custom, x_per_week",
  "timesPerWeek": "number 1-7 only if frequency is x_per_week, else null",
  "timeOfDay": "one of: dawn, morning, afternoon, evening, night — or null",
  "color": "one hex color: Mind=#A78BFA Body=#34D399 Work=#60A5FA Social=#F472B6 Creative=#FB923C Finance=#FBBF24 Spirit=#818CF8 Custom=#94A3B8"
}

Be generous in interpretation. Default frequency to daily if unsure. Return only the JSON object.`;

    const parsed = await generateJSON(prompt);
    res.json({ habit: parsed });
  } catch (err) { aiError(res, err); }
});

// ─── FEATURE 3: WEEKLY NARRATIVE ────────────────────────────────────────────
// GET /api/ai/weekly-narrative
router.get('/weekly-narrative', auth, async (req, res) => {
  try {
    const latest = await WeeklyNarrative.findOne({ userId: req.userId }).sort({ createdAt: -1 });
    if (latest) return res.json({ narrative: latest.narrative, weekStart: latest.weekStart, weekEnd: latest.weekEnd, createdAt: latest.createdAt });
    res.json({ narrative: null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch narrative' });
  }
});

// POST /api/ai/weekly-narrative  (generate + store)
router.post('/weekly-narrative', auth, aiRateLimit, async (req, res) => {
  try {
    // Cache check: don't regenerate in same week
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const existing = await WeeklyNarrative.findOne({ userId: req.userId, weekStart });
    if (existing) return res.json({ narrative: existing.narrative, weekStart: existing.weekStart, weekEnd: existing.weekEnd });

    const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const [user, habits, completions] = await Promise.all([
      User.findById(req.userId).select('name xp level'),
      Habit.find({ userId: req.userId, isArchived: false }),
      HabitCompletion.find({ userId: req.userId, date: { $gte: subDays(new Date(), 7).toISOString().slice(0, 10) } }),
    ]);

    // Generate even if user is new — just use what we have
    if (!user) return res.status(404).json({ error: 'User not found' });
    const totalHabits = habits.length;
    const done = completions.length;
    const completionRate = totalHabits > 0 ? Math.round((done / Math.max(1, totalHabits * 7)) * 100) : 0;

    const dayCompletions = {};
    for (const c of completions) {
      dayCompletions[c.date] = (dayCompletions[c.date] || 0) + 1;
    }
    const days = Object.entries(dayCompletions).sort((a, b) => b[1] - a[1]);
    const bestDay  = days[0]  ? format(new Date(days[0][0]  + 'T12:00:00'), 'EEEE') : 'unknown';
    const worstDay = days[days.length - 1] ? format(new Date(days[days.length - 1][0] + 'T12:00:00'), 'EEEE') : 'unknown';

    const habitRates = habits.map(h => {
      const hDone = completions.filter(c => String(c.habitId) === String(h._id)).length;
      return { name: h.name, rate: Math.round((hDone / 7) * 100), streak: h.currentStreak };
    }).sort((a, b) => b.rate - a.rate);

    const strongest = habitRates[0] || { name: '—', streak: 0 };
    const weakest   = habitRates[habitRates.length - 1] || { name: '—', rate: 0 };

    const prompt = `Write a 3-sentence personal weekly recap for a habit tracker user.
Write in second person ("You"). Do NOT use stats-report language.
Write like a thoughtful coach who has been watching quietly.
No emojis. No bullet points. Flowing prose only.

User: ${user.name}
Week of: ${weekStart} to ${weekEnd}
Total habits: ${totalHabits}
Completion rate: ${completionRate}%
Strongest habit: ${strongest.name} (${strongest.streak} day streak)
Weakest habit: ${weakest.name} (${weakest.rate}% this week)
Best day: ${bestDay}
Worst day: ${worstDay}
XP earned this level: ${user.xp}

3 sentences. Conversational. Specific. Honest.`;

    const narrative = await generateText(prompt);

    await WeeklyNarrative.create({ userId: req.userId, narrative: narrative.trim(), weekStart, weekEnd });
    res.json({ narrative: narrative.trim(), weekStart, weekEnd });
  } catch (err) { aiError(res, err); }
});

// ─── FEATURE 4: HABIT AUTOPSY ────────────────────────────────────────────────
// POST /api/ai/autopsy
router.post('/autopsy', auth, aiRateLimit, async (req, res) => {
  try {
    const { habitId } = req.body;
    if (!habitId) return res.status(400).json({ error: 'habitId required' });

    const cacheKey = `autopsy_${habitId}`;
    const cached = await getCached(req.userId, cacheKey);
    if (cached) return res.json(cached);

    const [habit, allCompletions] = await Promise.all([
      Habit.findOne({ _id: habitId, userId: req.userId }),
      HabitCompletion.find({ habitId, userId: req.userId }).sort({ date: -1 }),
    ]);
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const brokenStreak = habit.bestStreak;
    const breakDate = allCompletions[0]?.date || format(new Date(), 'yyyy-MM-dd');
    const dayOfWeek = DAY_NAMES[getDay(new Date(breakDate + 'T12:00:00'))];

    // Historical break days — gaps in completion sequence
    const dateSorted = [...allCompletions].map(c => c.date).sort();
    const breakDays = [];
    for (let i = 1; i < dateSorted.length; i++) {
      const diff = (new Date(dateSorted[i]) - new Date(dateSorted[i - 1])) / 86400000;
      if (diff > 1) breakDays.push(DAY_NAMES[getDay(new Date(dateSorted[i] + 'T12:00:00'))]);
    }
    const historicalBreakDays = [...new Set(breakDays)].slice(0, 4).join(', ') || 'insufficient data';

    const recentNotes = allCompletions.slice(0, 5).filter(c => c.note).map(c => c.note).join(' | ') || 'no notes';
    const breakCount = breakDays.length;
    const avgMood = allCompletions.filter(c => c.mood).reduce((s, c) => s + c.mood, 0) / Math.max(1, allCompletions.filter(c => c.mood).length);

    const prompt = `A user just broke a habit streak. Write a 2-sentence post-mortem.
Be a forensic analyst, not a therapist. Reference patterns. No comfort.

Habit: ${habit.name}
Broken streak: ${brokenStreak} days
Break date: ${breakDate} (${dayOfWeek})
Historical break days for this habit: ${historicalBreakDays}
Journal notes from the last 5 days: ${recentNotes}
Avg mood score on break days vs normal: ${avgMood.toFixed(1)}/5
How many times this streak has been broken before: ${breakCount}

2 sentences only. Start with the specific streak number. End with a pattern observation.
Plain text. No emojis.`;

    const message = await generateText(prompt);
    const result = { message: message.trim(), brokenStreak, habitName: habit.name, breakDate, dayOfWeek };

    await setCache(req.userId, cacheKey, result, 24);
    res.json(result);
  } catch (err) { aiError(res, err); }
});

// ─── FEATURE 5: RITUAL DNA ──────────────────────────────────────────────────
// GET /api/ai/ritual-dna
router.get('/ritual-dna', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('ritualDNA createdAt');
    if (user?.ritualDNA?.title || user?.ritualDNA?.archetype) return res.json({ dna: user.ritualDNA });
    res.json({ dna: null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ritual DNA' });
  }
});

// POST /api/ai/ritual-dna  (generate)
router.post('/ritual-dna', auth, aiRateLimit, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('name xp level createdAt ritualDNA');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 7-day cooldown check
    if (user.ritualDNA?.generatedAt) {
      const daysSince = (Date.now() - new Date(user.ritualDNA.generatedAt)) / 86400000;
      if (daysSince < 7) {
        return res.status(429).json({ error: `Cooldown: ${Math.ceil(7 - daysSince)} days until you can regenerate` });
      }
    }

    const habits = await Habit.find({ userId: req.userId, isArchived: false });
    const completions = await HabitCompletion.find({ userId: req.userId }).sort({ date: -1 }).limit(300);

    const daysActive = Math.floor((Date.now() - new Date(user.createdAt)) / 86400000);
    const catBreakdown = habits.reduce((acc, h) => { acc[h.category] = (acc[h.category] || 0) + 1; return acc; }, {});
    const catStr = Object.entries(catBreakdown).map(([k, v]) => `${k}: ${v}`).join(', ');

    const timeCounts = { dawn: 0, morning: 0, afternoon: 0, evening: 0, night: 0 };
    for (const c of completions) {
      const hr = new Date(c.completedAt).getHours();
      if (hr < 6) timeCounts.dawn++;
      else if (hr < 12) timeCounts.morning++;
      else if (hr < 17) timeCounts.afternoon++;
      else if (hr < 21) timeCounts.evening++;
      else timeCounts.night++;
    }
    const bestTOD = Object.entries(timeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'morning';

    const habitRates = habits.map(h => {
      const done = completions.filter(c => String(c.habitId) === String(h._id)).length;
      const days = Math.max(1, Math.floor((Date.now() - new Date(h.createdAt)) / 86400000));
      return { ...h.toObject(), rate: Math.round((done / days) * 100) };
    }).sort((a, b) => b.rate - a.rate);

    const most = habitRates[0] || { name: '—', currentStreak: 0 };
    const least = habitRates[habitRates.length - 1] || { name: '—', rate: 0 };
    const avgStreak = Math.round(habits.reduce((s, h) => s + h.currentStreak, 0) / Math.max(1, habits.length));
    const completionRate = daysActive > 0 ? Math.round((completions.length / Math.max(1, daysActive * habits.length)) * 100) : 0;
    const breakDays = [];
    const datesSorted = [...new Set(completions.map(c => c.date))].sort();
    for (let i = 1; i < datesSorted.length; i++) {
      const diff = (new Date(datesSorted[i]) - new Date(datesSorted[i - 1])) / 86400000;
      if (diff > 1) breakDays.push(DAY_NAMES[getDay(new Date(datesSorted[i - 1] + 'T12:00:00'))]);
    }
    const mostBreakDay = breakDays.length ? breakDays.sort((a, b) =>
      breakDays.filter(d => d === b).length - breakDays.filter(d => d === a).length)[0] : 'unknown';

    const prompt = `Analyze this user's habit data and generate their "Ritual DNA" — a personal habit personality profile.

User: ${user.name}
Days active: ${daysActive}
Total habits: ${habits.length}
Categories: ${catStr}
Best completion time of day: ${bestTOD}
Most consistent habit: ${most.name} (${most.currentStreak}d streak)
Least consistent habit: ${least.name} (${least.rate}% rate)
Average streak length: ${avgStreak} days
Most common break day: ${mostBreakDay}
Completion rate: ${completionRate}%
Total XP: ${user.xp}

Return ONLY valid JSON:
{
  "archetype": "2-3 word evocative title like 'The Midnight Builder'",
  "tagline": "one punchy sentence about their style",
  "insights": [
    "insight 1 — specific data point about their strength",
    "insight 2 — specific data point about their pattern",
    "insight 3 — honest observation about their weakness"
  ],
  "dominantCategory": "string",
  "score": 0-100
}`;

    const dna = await generateJSON(prompt);
    dna.generatedAt = new Date().toISOString();

    await User.findByIdAndUpdate(req.userId, { ritualDNA: dna });
    res.json({ dna });
  } catch (err) { aiError(res, err); }
});

// ─── FEATURE 6: RESCHEDULE SUGGESTIONS ──────────────────────────────────────
// GET /api/ai/reschedule-suggestions
router.get('/reschedule-suggestions', auth, aiRateLimit, async (req, res) => {
  try {
    const cached = await getCached(req.userId, 'reschedule');
    if (cached) return res.json({ suggestions: cached });

    const habits = await Habit.find({ userId: req.userId, isArchived: false });
    const suggestions = [];

    for (const habit of habits) {
      if (!habit.timeOfDay) continue;
      const completions = await HabitCompletion.find({ habitId: habit._id, userId: req.userId })
        .sort({ date: -1 }).limit(30);
      if (completions.length < 5) continue; // need at least 5 data points

      const timeOfDayHours = { dawn: 5, morning: 8, afternoon: 13, evening: 18, night: 21 };
      const scheduledHour = timeOfDayHours[habit.timeOfDay] || 9;

      const actualHours = completions.map(c => new Date(c.completedAt).getHours()).filter(h => h > 0);
      if (actualHours.length < 3) continue;
      const avgActual = Math.round(actualHours.reduce((a, b) => a + b, 0) / actualHours.length);
      const diffH = Math.abs(avgActual - scheduledHour);
      if (diffH < 3) continue; // Less than 3h difference — no suggestion needed

      const actualTOD = avgActual < 6 ? 'dawn' : avgActual < 12 ? 'morning' : avgActual < 17 ? 'afternoon' : avgActual < 21 ? 'evening' : 'night';
      if (actualTOD === habit.timeOfDay) continue;

      const actualTimeStr = `${avgActual > 12 ? avgActual - 12 : avgActual}${avgActual >= 12 ? 'pm' : 'am'}`;
      const done = completions.length;
      const rate = Math.round((done / 30) * 100);

      const prompt = `A user has a habit scheduled for ${habit.timeOfDay} but completes it at ${actualTimeStr} most days.
Habit: ${habit.name}
Scheduled: ${habit.timeOfDay}
Actual avg completion time: ${actualTimeStr}
Completion rate overall: ${rate}%

Write one sentence suggesting they reschedule. Be casual, not preachy.
Start with "Your ${habit.name}..." Plain text only.`;

      const suggestion = await generateText(prompt);
      suggestions.push({
        habitId: habit._id,
        habitName: habit.name,
        habitIcon: habit.icon,
        suggestion: suggestion.trim(),
        suggestedTimeOfDay: actualTOD,
        currentTimeOfDay: habit.timeOfDay,
      });
    }

    await setCache(req.userId, 'reschedule', suggestions, 24);
    res.json({ suggestions });
  } catch (err) { aiError(res, err, { suggestions: [] }); }
});

// ─── FEATURE 7: HABIT SUGGESTIONS ────────────────────────────────────────────
// GET /api/ai/habit-suggestions
router.get('/habit-suggestions', auth, aiRateLimit, async (req, res) => {
  // Hoist so both main path AND fallback can access user habits
  let habits = [];
  let completions = [];

  try {
    const cached = await getCached(req.userId, 'suggestions');
    if (cached) return res.json({ suggestions: cached });

    [habits, completions] = await Promise.all([
      Habit.find({ userId: req.userId, isArchived: false }),
      HabitCompletion.find({ userId: req.userId }).sort({ date: -1 }).limit(200),
    ]);

    if (habits.length === 0) return res.json({ suggestions: [] });

    const catCounts = habits.reduce((a, h) => { a[h.category] = (a[h.category] || 0) + 1; return a; }, {});
    const catRates  = {};
    for (const h of habits) {
      const done = completions.filter(c => String(c.habitId) === String(h._id)).length;
      const days = Math.max(7, Math.floor((Date.now() - new Date(h.createdAt)) / 86400000));
      catRates[h.category] = (catRates[h.category] || 0) + Math.round((done / days) * 100);
    }

    const cats = Object.keys(catCounts);
    const strongestCat = cats.sort((a, b) => catRates[b] - catRates[a])[0] || 'Body';
    const weakestCat   = cats.sort((a, b) => catRates[a] - catRates[b])[0] || 'Mind';
    const timesUsed    = habits.map(h => h.timeOfDay).filter(Boolean);
    const allTimes     = ['dawn','morning','afternoon','evening','night'];
    const timeGaps     = allTimes.filter(t => !timesUsed.includes(t)).join(', ') || 'none detected';
    const totalDone    = completions.length;
    const daysActive   = Math.max(1, Math.floor((Date.now() - new Date(habits[0].createdAt)) / 86400000));
    const compRate     = Math.round((totalDone / Math.max(1, daysActive * habits.length)) * 100);

    const prompt = `Suggest 3 new habits for this user based on their existing routine.
Be specific to their data. No generic wellness clichés.

Existing habits: ${habits.map(h => `${h.name} (${h.category}, ${h.timeOfDay || 'any'})`).join(', ')}
Strongest category: ${strongestCat}
Weakest category: ${weakestCat}
Available time gaps detected: ${timeGaps}
Completion rate: ${compRate}%

Return ONLY valid JSON array of 3 objects:
[
  {
    "name": "string",
    "reason": "one sentence referencing their specific data",
    "category": "string",
    "timeOfDay": "dawn|morning|afternoon|evening|night",
    "icon": "emoji",
    "difficulty": "easy|medium|hard"
  }
]`;

    const suggestions = await generateJSON(prompt);
    await setCache(req.userId, 'suggestions', suggestions, 24);
    return res.json({ suggestions });
  } catch (err) {
    // ── Fallback: curated suggestions based on user's actual habit categories ──
    // `habits` is guaranteed accessible here since it's declared above the try block.
    try {
      const FALLBACK_POOL = {
        Mind:     [
          { name:'5-Min Breathing', icon:'🧘', reason:'A short daily pause cuts cortisol and sharpens focus before deep work.', category:'Mind', timeOfDay:'morning', difficulty:'easy' },
          { name:'No-Phone Morning', icon:'📵', reason:'Delaying your first screen check for 30 min improves mood and intentionality.', category:'Mind', timeOfDay:'dawn', difficulty:'medium' },
          { name:'Gratitude Log', icon:'📝', reason:'Three specific things you appreciate each night rewires long-term optimism.', category:'Mind', timeOfDay:'night', difficulty:'easy' },
        ],
        Body:     [
          { name:'10-Min Walk', icon:'🚶', reason:'A short post-meal walk significantly lowers blood sugar and boosts energy.', category:'Body', timeOfDay:'afternoon', difficulty:'easy' },
          { name:'Stretch Routine', icon:'🤸', reason:'5 minutes of mobility work each morning prevents the stiffness that kills productive sessions.', category:'Body', timeOfDay:'morning', difficulty:'easy' },
          { name:'Sleep by 10:30 PM', icon:'🌙', reason:'Consistent sleep timing is the single highest-return body optimization.', category:'Body', timeOfDay:'night', difficulty:'medium' },
        ],
        Work:     [
          { name:'Daily Shutdown Ritual', icon:'🖥️', reason:'A hard stop time + task review prevents work from bleeding into recovery hours.', category:'Work', timeOfDay:'evening', difficulty:'easy' },
          { name:'One-Thing Focus', icon:'🎯', reason:'Identify tomorrow\'s single most important task tonight to eliminate morning decision fatigue.', category:'Work', timeOfDay:'night', difficulty:'easy' },
          { name:'No-Meeting Morning', icon:'🔕', reason:'Block your best cognitive hours for deep work — even one focused morning triples output.', category:'Work', timeOfDay:'morning', difficulty:'medium' },
        ],
        Creative: [
          { name:'Morning Pages', icon:'✍️', reason:'Three uncensored pages on waking clears mental backlog and surfaces fresh ideas.', category:'Creative', timeOfDay:'dawn', difficulty:'medium' },
          { name:'Idea Capture', icon:'💡', reason:'Writing down every idea, no matter how rough, trains your brain to generate more of them.', category:'Creative', timeOfDay:'afternoon', difficulty:'easy' },
        ],
        Finance:  [
          { name:'Daily Expense Log', icon:'💳', reason:'Awareness of daily spending is the first step — it often cuts discretionary spend 15% automatically.', category:'Finance', timeOfDay:'evening', difficulty:'easy' },
          { name:'No-Spend Day', icon:'🚫', reason:'One intentional no-spend day per week rebuilds the habit of delayed gratification.', category:'Finance', timeOfDay:'morning', difficulty:'medium' },
        ],
        Social:   [
          { name:'One Meaningful Text', icon:'💬', reason:'Sending one thoughtful message per day maintains relationships without feeling overwhelming.', category:'Social', timeOfDay:'afternoon', difficulty:'easy' },
        ],
        Spirit:   [
          { name:'Evening Reflection', icon:'🌟', reason:'5 minutes of quiet reflection on the day\'s wins and lessons compounds over time.', category:'Spirit', timeOfDay:'night', difficulty:'easy' },
        ],
      };
      const DEFAULT = [
        { name:'Morning Hydration', icon:'💧', reason:'500ml of water first thing activates your metabolism and clears brain fog.', category:'Body', timeOfDay:'dawn', difficulty:'easy' },
        { name:'Reading Habit', icon:'📚', reason:'20 pages a day compounds to 20+ books per year with zero disruption to your schedule.', category:'Mind', timeOfDay:'evening', difficulty:'easy' },
        { name:'Digital Sunset', icon:'📱', reason:'No screens 30 min before bed is the fastest-acting sleep quality improvement available.', category:'Mind', timeOfDay:'night', difficulty:'medium' },
      ];

      // If habits failed to load (DB error before Promise.all), fetch them now
      if (!habits.length) {
        try { habits = await Habit.find({ userId: req.userId, isArchived: false }).lean(); } catch (_) {}
      }

      // Pick suggestions that complement what the user already has
      const existingNames = habits.map(h => h.name.toLowerCase());
      const existingCats  = new Set(habits.map(h => h.category));

      // Prefer categories the user doesn't already have habits in
      const gapCats = Object.keys(FALLBACK_POOL).filter(c => !existingCats.has(c));
      let pool = [];
      for (const cat of [...gapCats, ...existingCats]) {
        pool.push(...(FALLBACK_POOL[cat] || []));
      }
      if (!pool.length) pool = DEFAULT;

      const picked = pool
        .filter(s => !existingNames.some(n => n.includes(s.name.toLowerCase().slice(0, 5))))
        .slice(0, 3);

      const fallback = picked.length >= 3 ? picked : [...picked, ...DEFAULT].slice(0, 3);
      return res.json({ suggestions: fallback, fallback: true });
    } catch (fallbackErr) {
      console.error('[AI fallback error]', fallbackErr?.message);
      aiError(res, err, { suggestions: [] });
    }
  }
});

// ─── FEATURE 8: JOURNAL INTELLIGENCE ─────────────────────────────────────────
// GET /api/ai/journal-insight
router.get('/journal-insight', auth, aiRateLimit, async (req, res) => {
  try {
    // Check DB cache — 7 days
    const existing = await JournalInsight.findOne({ userId: req.userId })
      .sort({ createdAt: -1 });
    if (existing) {
      const ageDays = (Date.now() - new Date(existing.createdAt)) / 86400000;
      if (ageDays < 7) return res.json({ insight: existing.insight, createdAt: existing.createdAt });
    }

    const habits = await Habit.find({ userId: req.userId, isArchived: false });
    const completions = await HabitCompletion.find({ userId: req.userId,
      date: { $gte: format(subDays(new Date(), 30), 'yyyy-MM-dd') }
    }).sort({ date: -1 });

    // If no mood/note data, use pure completion data for insight
    const notedCompletions = completions.filter(c => c.note || c.mood);
    if (completions.length < 3) {
      return res.json({ insight: 'Keep checking off habits and adding mood ratings — pattern detection needs at least a few days of data.', createdAt: new Date() });
    }

    const habitMap = habits.reduce((a, h) => { a[String(h._id)] = h.name; return a; }, {});

    // Use noted completions if available, fall back to all completions for basic analysis
    const analysisBase = notedCompletions.length > 0 ? notedCompletions : completions.slice(0, 20);
    const journalLines = analysisBase.slice(0, 40).map(c =>
      `[${c.date}] ${habitMap[String(c.habitId)] || 'Unknown'}: mood=${c.mood || '?'} energy=${c.energy || '?'} note="${c.note || ''}"`,
    ).join('\n');

    const dayMap = {};
    for (const c of completions) {
      dayMap[c.date] = (dayMap[c.date] || 0) + 1;
    }
    const completionSummary = `${completions.length} completions over 30 days. Avg ${(completions.length / 30).toFixed(1)}/day.`;

    const prompt = `Analyze this user's habit journal notes and find one non-obvious cross-habit pattern.
Focus on correlations between mood/energy and completions. Be forensic, not motivational.

Journal entries (last 30 days):
${journalLines}

Completion data summary:
${completionSummary}

Write exactly 2 sentences. Start with "We noticed..."
Reference specific habit names and numbers. No generic observations.
Plain text only.`;

    const insight = await generateText(prompt);
    const doc = await JournalInsight.create({ userId: req.userId, insight: insight.trim() });
    res.json({ insight: doc.insight, createdAt: doc.createdAt });
  } catch (err) { aiError(res, err); }
});

// ─── FEATURE 9: CASCADE DETECTION ────────────────────────────────────────────
// GET /api/ai/cascade-detection
router.get('/cascade-detection', auth, aiRateLimit, async (req, res) => {
  try {
    const cached = await getCached(req.userId, 'cascade');
    if (cached) return res.json({ cascades: cached });

    const habits = await Habit.find({ userId: req.userId, isArchived: false });
    if (habits.length < 2) return res.json({ cascades: [] });

    const completions = await HabitCompletion.find({ userId: req.userId })
      .sort({ date: -1 }).limit(500);
    if (completions.length < 10) return res.json({ cascades: [] }); // need at least 10 completions

    // Build per-day completion sets
    const dayMap = {};
    for (const c of completions) {
      if (!dayMap[c.date]) dayMap[c.date] = new Set();
      dayMap[c.date].add(String(c.habitId));
    }
    const days = Object.keys(dayMap);

    const cascades = [];
    for (let i = 0; i < habits.length; i++) {
      for (let j = i + 1; j < habits.length; j++) {
        const hA = habits[i];
        const hB = habits[j];
        const idA = String(hA._id);
        const idB = String(hB._id);

        const daysA    = days.filter(d => dayMap[d].has(idA)).length;
        const daysB    = days.filter(d => dayMap[d].has(idB)).length;
        const daysAB   = days.filter(d => dayMap[d].has(idA) && dayMap[d].has(idB)).length;

        if (daysA < 10 || daysB < 10 || daysAB < 5) continue;

        const baseRate = daysB / days.length;
        const givenA   = daysAB / daysA;
        const lift     = Math.round(((givenA - baseRate) / Math.max(baseRate, 0.01)) * 100);
        if (lift < 20) continue;

        const prompt = `A habit tracker user has a data pattern:
When they complete "${hA.name}", they complete "${hB.name}" ${lift}% more often that day.

Write one casual observation about this.
Format: "When you [A], you're [X]% more likely to [B] that day."
Keep the exact numbers. Max 20 words. Plain text.`;

        const message = await generateText(prompt);
        cascades.push({
          habitA: { id: hA._id, name: hA.name, icon: hA.icon, color: hA.color },
          habitB: { id: hB._id, name: hB.name, icon: hB.icon, color: hB.color },
          liftPct: lift,
          message: message.trim(),
        });
        if (cascades.length >= 5) break; // cap at 5 insights
      }
      if (cascades.length >= 5) break;
    }

    await setCache(req.userId, 'cascade', cascades, 24);
    res.json({ cascades });
  } catch (err) { aiError(res, err, { cascades: [] }); }
});

module.exports = router;
