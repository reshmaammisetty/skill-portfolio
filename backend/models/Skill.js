const mongoose = require('mongoose');

const CATEGORIES = ['Programming', 'Frontend', 'Backend', 'Database', 'Design', 'DevOps', 'Data Science', 'Soft Skills', 'Other'];

const skillSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Skill name is required'], trim: true, maxlength: 60 },
    category: { type: String, enum: { values: CATEGORIES, message: 'Invalid category' }, default: 'Other' },
    level: {
      type: String,
      enum: { values: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], message: 'Invalid level' },
      default: 'Beginner',
    },
    progress: { type: Number, min: [0, 'Progress must be 0-100'], max: [100, 'Progress must be 0-100'], default: 0 },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Skill', skillSchema);