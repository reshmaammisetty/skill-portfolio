const User = require('../models/User');
const Skill = require('../models/Skill');
const Project = require('../models/Project');
const Achievement = require('../models/Achievement');
const { asyncHandler, httpError } = require('../utils/helpers');

// Only non-private data is exposed: profile, skills, projects, achievements.
exports.getPortfolio = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: String(req.params.username).toLowerCase(), isPublic: true });
  if (!user) throw httpError(404, 'Portfolio not found or it is private');

  const [skills, projects, achievements] = await Promise.all([
    Skill.find({ user: user._id }).sort({ progress: -1 }).select('-user -notes -__v'),
    Project.find({ user: user._id }).sort({ createdAt: -1 }).select('-user -__v'),
    Achievement.find({ user: user._id }).sort({ date: -1 }).select('-user -__v'),
  ]);

  const { name, headline, bio, location, avatar, education, social, username } = user;
  res.json({ profile: { name, headline, bio, location, avatar, education, social, username }, skills, projects, achievements });
});