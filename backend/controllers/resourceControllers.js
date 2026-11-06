const crudFactory = require('./crudFactory');
const Skill = require('../models/Skill');
const Project = require('../models/Project');
const Achievement = require('../models/Achievement');
const Goal = require('../models/Goal');
const Roadmap = require('../models/Roadmap');
const Progress = require('../models/Progress');
const { notify } = require('../utils/helpers');

exports.skills = crudFactory({
  Model: Skill,
  label: 'skill',
  titleField: 'name',
  fields: ['name', 'category', 'level', 'progress', 'notes'],
  // Save a progress snapshot so the Progress page can chart improvement over time
  afterSave: async (doc, before, user) => {
    if (!before || before.progress !== doc.progress) {
      await Progress.create({ user: user._id, type: 'skill', skillName: doc.name, value: doc.progress });
    }
  },
});

exports.projects = crudFactory({
  Model: Project,
  label: 'project',
  fields: ['title', 'description', 'technologies', 'githubUrl', 'liveUrl', 'status'],
  afterSave: async (doc, before, user) => {
    if (doc.status === 'Completed' && (!before || before.status !== 'Completed')) {
      await notify(user._id, `Project completed: ${doc.title}`);
    }
  },
});

exports.achievements = crudFactory({
  Model: Achievement,
  label: 'achievement',
  fields: ['title', 'type', 'issuer', 'date', 'credentialUrl', 'description'],
  sort: { date: -1 },
  afterSave: async (doc, before, user) => {
    if (!before) await notify(user._id, `New achievement added: ${doc.title}`);
  },
});

exports.goals = crudFactory({
  Model: Goal,
  label: 'goal',
  fields: ['title', 'description', 'type', 'deadline', 'progress', 'status'],
  // Keep progress and status consistent with each other
  beforeSave: (g) => {
    if (g.isModified('status') && g.status === 'Completed') {
      g.progress = 100;
    } else if (g.isModified('progress') && !g.isModified('status')) {
      if (g.progress >= 100) g.status = 'Completed';
      else if (g.status === 'Completed') g.status = 'In Progress';
      else if (g.progress > 0 && g.status === 'Not Started') g.status = 'In Progress';
    }
  },
  afterSave: async (doc, before, user) => {
    if (doc.status === 'Completed' && (!before || before.status !== 'Completed')) {
      await notify(user._id, `Goal completed: ${doc.title}`);
    }
  },
});

exports.roadmaps = crudFactory({
  Model: Roadmap,
  label: 'roadmap',
  fields: ['title', 'description', 'steps'],
  afterSave: async (doc, before, user) => {
    const allDone = doc.steps.length > 0 && doc.steps.every((s) => s.completed);
    const wasDone = before && before.steps.length > 0 && before.steps.every((s) => s.completed);
    if (allDone && !wasDone) await notify(user._id, `Roadmap finished: ${doc.title}`);
  },
  describeUpdate: (doc, before) => {
    const wasDone = new Set(before.steps.filter((s) => s.completed).map((s) => s.title));
    const newly = doc.steps.find((s) => s.completed && !wasDone.has(s.title));
    return newly ? `Completed "${newly.title}" in ${doc.title}` : `Updated roadmap: ${doc.title}`;
  },
});