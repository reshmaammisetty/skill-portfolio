const mongoose = require('mongoose');
const { urlField } = require('../utils/fields');

const projectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: [true, 'Project title is required'], trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 1500, default: '' },
    technologies: {
      type: [{ type: String, trim: true, maxlength: 30 }],
      validate: { validator: (v) => v.length <= 15, message: 'Maximum 15 technologies' },
    },
    githubUrl: urlField(),
    liveUrl: urlField(),
    status: {
      type: String,
      enum: { values: ['Planned', 'In Progress', 'Completed'], message: 'Invalid status' },
      default: 'Planned',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);