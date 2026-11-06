const Notification = require('../models/Notification');
const Goal = require('../models/Goal');
const { asyncHandler } = require('../utils/helpers');

exports.list = asyncHandler(async (req, res) => {
  const user = req.user._id;

  // Create reminders for goals that are overdue or due within 2 days (one per goal deadline)
  const soon = new Date(Date.now() + 2 * 86400000);
  const goals = await Goal.find({ user, status: { $ne: 'Completed' }, deadline: { $ne: null, $lte: soon } });
  await Promise.all(
    goals.map((g) => {
      const overdue = g.deadline < new Date();
      return Notification.updateOne(
        { user, key: `due-${g._id}-${g.deadline.toISOString().slice(0, 10)}` },
        { $setOnInsert: { message: `Goal "${g.title}" is ${overdue ? 'overdue' : 'due soon'}` } },
        { upsert: true }
      );
    })
  );

  const items = await Notification.find({ user }).sort({ createdAt: -1 }).limit(20);
  res.json({ items, unread: items.filter((n) => !n.read).length });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ ok: true });
});