const User = require('../models/User');
const Skill = require('../models/Skill');
const Project = require('../models/Project');
const Achievement = require('../models/Achievement');
const Goal = require('../models/Goal');
const Roadmap = require('../models/Roadmap');
const Progress = require('../models/Progress');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { asyncHandler, httpError, logActivity } = require('../utils/helpers');

exports.updateProfile = asyncHandler(async (req, res) => {
  const b = req.body;
  const user = req.user;

  ['name', 'headline', 'bio', 'location'].forEach((k) => {
    if (typeof b[k] === 'string') user[k] = b[k].trim();
  });
  if (!user.name) throw httpError(400, 'Name is required');

  if (b.username !== undefined) {
    const u = String(b.username).trim().toLowerCase();
    if (!/^[a-z0-9-]{3,30}$/.test(u)) {
      throw httpError(400, 'Username must be 3-30 characters: letters, numbers and hyphens only');
    }
    if (u !== user.username && (await User.exists({ username: u }))) throw httpError(409, 'That username is taken');
    user.username = u;
  }

  if (typeof b.isPublic === 'boolean') user.isPublic = b.isPublic;

  if (b.avatar !== undefined) {
    const avatar = String(b.avatar || '');
    if (avatar && !/^data:image\/(png|jpeg|webp);base64,/.test(avatar)) throw httpError(400, 'Invalid image');
    if (avatar.length > 600000) throw httpError(400, 'Image is too large');
    user.avatar = avatar;
  }

  if (b.social && typeof b.social === 'object') {
    ['github', 'linkedin', 'twitter', 'website'].forEach((k) => {
      if (b.social[k] !== undefined) user.social[k] = String(b.social[k]).trim();
    });
  }

  if (Array.isArray(b.education)) {
    user.education = b.education.slice(0, 10).map((e) => ({
      school: String(e.school || '').trim(),
      degree: String(e.degree || '').trim(),
      field: String(e.field || '').trim(),
      startYear: String(e.startYear || '').trim(),
      endYear: String(e.endYear || '').trim(),
    }));
  }

  await user.save();
  await logActivity(user._id, 'profile', 'Updated profile');
  res.json(user);
});

exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw httpError(400, 'Current password is incorrect');
  }
  user.password = req.body.newPassword;
  await user.save();
  await logActivity(user._id, 'account', 'Changed password');
  res.json({ message: 'Password changed successfully' });
});

exports.deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!req.body.password || !(await user.comparePassword(req.body.password))) {
    throw httpError(400, 'Password is incorrect');
  }
  const id = user._id;
  await Promise.all(
    [Skill, Project, Achievement, Goal, Roadmap, Progress, Activity, Notification].map((M) => M.deleteMany({ user: id }))
  );
  await user.deleteOne();
  res.json({ message: 'Account deleted' });
});