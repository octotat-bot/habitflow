/**
 * seed-habits.js — drops any existing mock habits and inserts 6 realistic ones
 * with random completion history for the past 30 days.
 * Run: node server/seed/seed-habits.js
 */

const mongoose = require('mongoose');
const { subDays, format } = require('date-fns');

const MONGO_URI = 'mongodb://localhost:27017/habitflow';
const USER_ID   = '69e1ec5d710ba5bc08b2042a'; // mukund

// ── Schemas (inline so we don't need to resolve paths) ──
const HabitSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:            { type: String, required: true },
  description:     { type: String, default: '' },
  icon:            { type: String, default: '✨' },
  color:           { type: String, default: '#5B9A2F' },
  category:        { type: String, enum: ['Mind','Body','Work','Social','Creative','Finance','Spirit','Custom'], default: 'Custom' },
  frequency:       { type: String, default: 'daily' },
  targetDaysOfWeek:{ type: [Number], default: [] },
  timesPerWeek:    { type: Number, default: null },
  timeOfDay:       { type: String, default: null },
  stackedAfterId:  { type: mongoose.Schema.Types.ObjectId, default: null },
  currentStreak:   { type: Number, default: 0 },
  bestStreak:      { type: Number, default: 0 },
  totalCompletions:{ type: Number, default: 0 },
  xpEarned:        { type: Number, default: 0 },
  isArchived:      { type: Boolean, default: false },
  isPinned:        { type: Boolean, default: false },
  sortOrder:       { type: Number, default: 0 },
  createdAt:       { type: Date, default: Date.now },
});

const CompletionSchema = new mongoose.Schema({
  habitId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  date:     { type: String, required: true },       // 'yyyy-MM-dd'
  xpEarned: { type: Number, default: 10 },
  createdAt:{ type: Date,   default: Date.now },
});

const Habit      = mongoose.model('Habit',      HabitSchema);
const Completion = mongoose.model('Completion', CompletionSchema);

// ── Mock habit definitions ──
const HABITS = [
  { name: 'Morning Run',      icon: '🏃', color: '#2AA198', category: 'Body',     timeOfDay: 'morning',   hitRate: 0.80 },
  { name: 'Meditate 10 min',  icon: '🧘', color: '#7C5CBF', category: 'Mind',     timeOfDay: 'morning',   hitRate: 0.90 },
  { name: 'Read 20 pages',    icon: '📖', color: '#5B9A2F', category: 'Mind',     timeOfDay: 'evening',   hitRate: 0.70 },
  { name: 'Cold Shower',      icon: '🚿', color: '#3B82F6', category: 'Body',     timeOfDay: 'morning',   hitRate: 0.65 },
  { name: 'Deep Work 3h',     icon: '💻', color: '#E07B2A', category: 'Work',     timeOfDay: 'afternoon', hitRate: 0.75 },
  { name: 'No Sugar',         icon: '🍎', color: '#E5534B', category: 'Body',     timeOfDay: null,        hitRate: 0.60 },
  { name: 'Journal',          icon: '✍️', color: '#6B8EC7', category: 'Creative', timeOfDay: 'night',     hitRate: 0.55 },
  { name: 'Drink 2L Water',   icon: '💧', color: '#06B6D4', category: 'Body',     timeOfDay: null,        hitRate: 0.85 },
];

function randomHitSequence(length, baseRate) {
  // Creates a realistic streak-then-miss pattern rather than purely random
  const seq = [];
  let streakLen = 0;
  for (let i = 0; i < length; i++) {
    const boost  = streakLen > 3 ? 0.1 : 0;           // momentum boost
    const hit    = Math.random() < Math.min(baseRate + boost, 0.97);
    seq.push(hit);
    streakLen = hit ? streakLen + 1 : 0;
  }
  return seq;
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB');

  // Delete old mock habits for this user (re-seeding)
  const oldHabits = await Habit.find({ userId: USER_ID });
  const oldIds    = oldHabits.map(h => h._id);
  if (oldIds.length) {
    await Completion.deleteMany({ habitId: { $in: oldIds } });
    await Habit.deleteMany({ _id: { $in: oldIds } });
    console.log(`🗑   Removed ${oldIds.length} old habits + their completions`);
  }

  const DAYS = 30;
  const today = new Date();

  for (const [idx, def] of HABITS.entries()) {
    // Spread start dates so habits look like they were added at different times
    const daysOld   = DAYS - Math.floor(Math.random() * 5);
    const createdAt = subDays(today, daysOld);
    const hits      = randomHitSequence(daysOld, def.hitRate);

    // Compute streak
    let currentStreak = 0;
    for (let i = hits.length - 1; i >= 0; i--) {
      if (hits[i]) currentStreak++;
      else break;
    }
    const bestStreak      = Math.max(...hits.reduce((acc, h) => {
      if (h) { acc[acc.length - 1]++; } else acc.push(0);
      return acc;
    }, [0]));
    const totalCompletions = hits.filter(Boolean).length;

    const habit = await Habit.create({
      userId: USER_ID,
      name:   def.name,
      icon:   def.icon,
      color:  def.color,
      category: def.category,
      timeOfDay: def.timeOfDay,
      frequency: 'daily',
      description: '',
      currentStreak,
      bestStreak,
      totalCompletions,
      xpEarned: totalCompletions * 10,
      sortOrder: idx,
      createdAt,
    });

    // Insert completion docs
    const completions = [];
    for (let i = 0; i < hits.length; i++) {
      if (hits[i]) {
        completions.push({
          habitId:  habit._id,
          userId:   USER_ID,
          date:     format(subDays(today, hits.length - 1 - i), 'yyyy-MM-dd'),
          xpEarned: 10,
        });
      }
    }
    if (completions.length) await Completion.insertMany(completions);

    console.log(`  ✓  ${def.icon} ${def.name.padEnd(18)} streak=${currentStreak}  best=${bestStreak}  done=${totalCompletions}`);
  }

  console.log('\n🎉  Seeded 8 habits with 30-day history. Refresh the app!');
  await mongoose.disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
