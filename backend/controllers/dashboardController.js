const Skill = require('../models/Skill');
const Project = require('../models/Project');
const Achievement = require('../models/Achievement');
const Goal = require('../models/Goal');
const Roadmap = require('../models/Roadmap');
const Activity = require('../models/Activity');
const { asyncHandler } = require('../utils/helpers');

const countBy = (arr, key) =>
  arr.reduce((o, i) => {
    o[i[key]] = (o[i[key]] || 0) + 1;
    return o;
  }, {});

exports.getDashboard = asyncHandler(async (req, res) => {
  const user = req.user._id;
  const [skills, projects, achievements, goals, roadmaps, activities] = await Promise.all([
    Skill.find({ user }).select('level progress category'),
    Project.find({ user }).select('status'),
    Achievement.countDocuments({ user }),
    Goal.find({ user }),
    Roadmap.find({ user }),
    Activity.find({ user }).sort({ createdAt: -1 }).limit(8),
  ]);

  const steps = roadmaps.flatMap((r) => r.steps);
  const done = steps.filter((s) => s.completed).length;
  const activeGoals = goals.filter((g) => g.status !== 'Completed');
  const time = (g) => (g.deadline ? +g.deadline : 8.64e15);
  activeGoals.sort((a, b) => time(a) - time(b));

  res.json({
    stats: {
      totalSkills: skills.length,
      completedProjects: projects.filter((p) => p.status === 'Completed').length,
      totalProjects: projects.length,
      achievements,
      activeGoals: activeGoals.length,
      learningProgress: steps.length ? Math.round((done / steps.length) * 100) : 0,
      roadmapSteps: { done, total: steps.length },
      avgSkillProgress: skills.length
        ? Math.round(skills.reduce((sum, s) => sum + s.progress, 0) / skills.length)
        : 0,
    },
    analytics: {
      skillsByLevel: countBy(skills, 'level'),
      projectsByStatus: countBy(projects, 'status'),
      goalsByStatus: countBy(goals, 'status'),
    },
    upcomingGoals: activeGoals.slice(0, 4),
    recentActivities: activities,
  });
});

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.search = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 50);
  if (q.length < 2) return res.json([]);

  const rx = new RegExp(escapeRegex(q), 'i');
  const user = req.user._id;
  const [skills, projects, achievements, goals, roadmaps] = await Promise.all([
    Skill.find({ user, $or: [{ name: rx }, { category: rx }] }).limit(5),
    Project.find({ user, $or: [{ title: rx }, { technologies: rx }, { description: rx }] }).limit(5),
    Achievement.find({ user, $or: [{ title: rx }, { issuer: rx }] }).limit(5),
    Goal.find({ user, title: rx }).limit(5),
    Roadmap.find({ user, title: rx }).limit(5),
  ]);

  res.json([
    ...skills.map((s) => ({ type: 'Skill', title: s.name, sub: `${s.category} · ${s.level}`, url: '/skills.html' })),
    ...projects.map((p) => ({ type: 'Project', title: p.title, sub: p.status, url: '/projects.html' })),
    ...achievements.map((a) => ({ type: 'Achievement', title: a.title, sub: a.issuer, url: '/achievements.html' })),
    ...goals.map((g) => ({ type: 'Goal', title: g.title, sub: `${g.type} · ${g.status}`, url: '/goals.html' })),
    ...roadmaps.map((r) => ({ type: 'Roadmap', title: r.title, sub: `${r.steps.length} steps`, url: '/roadmap.html' })),
  ]);
});