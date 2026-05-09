const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');

// GET /api/achievements — all achievements with locked/unlocked status for current user
router.get('/', auth, async (req, res) => {
  try {
    const [all, userAchievements] = await Promise.all([
      Achievement.find({}).sort({ rarity: 1 }),
      UserAchievement.find({ userId: req.userId }),
    ]);

    const unlockedMap = {};
    for (const ua of userAchievements) {
      unlockedMap[String(ua.achievementId)] = ua;
    }

    const achievements = all.map(ach => {
      const ua = unlockedMap[String(ach._id)];
      return {
        ...ach.toObject(),
        unlocked: !!ua,
        unlockedAt: ua ? ua.unlockedAt : null,
        seen: ua ? ua.seen : true,
      };
    });

    res.json({ achievements });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// PATCH /api/achievements/seen — mark all unseen as seen
router.patch('/seen', auth, async (req, res) => {
  try {
    await UserAchievement.updateMany(
      { userId: req.userId, seen: false },
      { seen: true }
    );
    res.json({ message: 'Achievements marked as seen' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark achievements as seen' });
  }
});

module.exports = router;
