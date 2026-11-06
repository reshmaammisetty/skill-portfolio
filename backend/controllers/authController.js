const crypto = require('crypto');
const User = require('../models/User');
const { asyncHandler, signToken, httpError, logActivity } = require('../utils/helpers');

const makeUsername = async (name) => {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 20) || 'user';
  for (let i = 0; i < 10; i++) {
    const candidate = `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!(await User.exists({ username: candidate }))) return candidate;
  }
  return `${base}-${Date.now()}`;
};

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) throw httpError(409, 'An account with this email already exists');

  const user = await User.create({ name, email, password, username: await makeUsername(name) });
  await logActivity(user._id, 'account', 'Joined SkillFolio');
  res.status(201).json({ token: signToken(user._id), user });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw httpError(401, 'Invalid email or password');
  res.json({ token: signToken(user._id), user });
});

exports.me = asyncHandler(async (req, res) => res.json(req.user));

// No email service is configured, so the reset link is printed in the server console.
// In development it is also returned in the response so you can test the flow.
exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const out = { message: 'If an account exists for that email, a reset link has been generated.' };

  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    user.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const link = `${req.protocol}://${req.get('host')}/reset-password.html?token=${token}`;
    console.log(`\n[Password reset requested for ${user.email}]\n${link}\n`);
    if (process.env.NODE_ENV !== 'production') out.devResetLink = link;
  }
  res.json(out);
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const hash = crypto.createHash('sha256').update(req.body.token).digest('hex');
  const user = await User.findOne({ resetTokenHash: hash, resetTokenExpires: { $gt: new Date() } });
  if (!user) throw httpError(400, 'Reset link is invalid or has expired');

  user.password = req.body.password;
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  await user.save();
  res.json({ message: 'Password updated. You can now log in.' });
});