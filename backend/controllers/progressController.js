const Progress = require('../models/Progress');
const Activity = require('../models/Activity');
const Project = require('../models/Project');
const { asyncHandler, httpError, logActivity } = require('../utils/helpers');

const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

exports.summary = asyncHandler(async (req, res) => {
  const user = req.user._id;
  const since = new Date();
  since.setDate(1);
  since.setMonth(since.getMonth() - 5);
  since.setHours(0, 0, 0, 0);

  const [logs, acts, skillRecords, projects] = await Promise.all([
    Progress.find({ user, type: 'study', date: { $gte: since } }),
    Activity.find({ user, createdAt: { $gte: since } }),
    Progress.find({ user, type: 'skill' }).sort({ createdAt: 1 }),
    Project.find({ user }).select('status'),
  ]);

  // Last 7 days
  const weekly = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = dayKey(d);
    weekly.push({
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      hours: logs.filter((l) => dayKey(new Date(l.date)) === k).reduce((s, l) => s + l.hours, 0),
      activities: acts.filter((a) => dayKey(new Date(a.createdAt)) === k).length,
    });
  }

  // Last 6 months
  const monthly = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const k = monthKey(d);
    monthly.push({
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      hours: logs.filter((l) => monthKey(new Date(l.date)) === k).reduce((s, l) => s + l.hours, 0),
      activities: acts.filter((a) => monthKey(new Date(a.createdAt)) === k).length,
    });
  }

  // Skill improvement (first vs latest recorded progress)
  const bySkill = new Map();
  skillRecords.forEach((r) => {
    if (!bySkill.has(r.skillName)) bySkill.set(r.skillName, []);
    bySkill.get(r.skillName).push(r.value);
  });
  const skillImprovement = [...bySkill.entries()].map(([skillName, values]) => ({
    skillName,
    first: values[0],
    latest: values[values.length - 1],
    updates: values.length,
    values,
  }));

  const projectStats = { Planned: 0, 'In Progress': 0, Completed: 0 };
  projects.forEach((p) => (projectStats[p.status] += 1));

  res.json({ weekly, monthly, skillImprovement, projectStats, totalProjects: projects.length });
});

exports.listLogs = asyncHandler(async (req, res) => {
  res.json(await Progress.find({ user: req.user._id, type: 'study' }).sort({ date: -1, createdAt: -1 }).limit(30));
});

exports.addLog = asyncHandler(async (req, res) => {
  const { skillName, hours, note, date } = req.body;
  const log = await Progress.create({
    user: req.user._id,
    type: 'study',
    skillName,
    hours,
    note,
    date: date || Date.now(),
  });
  await logActivity(req.user._id, 'learning', `Logged ${log.hours}h of learning: ${log.skillName}`);
  res.status(201).json(log);
});

exports.deleteLog = asyncHandler(async (req, res) => {
  const log = await Progress.findOneAndDelete({ _id: req.params.id, user: req.user._id, type: 'study' });
  if (!log) throw httpError(404, 'Log not found');
  res.json({ message: 'Log deleted' });
});