const mongoose = require('mongoose');

// type "skill": snapshot of a skill's progress at a point in time (for improvement charts)
// type "study": a learning session logged by the user (hours studied)
const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['skill', 'study'], required: true },
    skillName: { type: String, required: [true, 'Topic is required'], trim: true, maxlength: 80 },
    value: { type: Number, min: 0, max: 100 },
    hours: { type: Number, min: [0.1, 'Hours must be at least 0.1'], max: [24, 'Hours cannot exceed 24'] },
    note: { type: String, trim: true, maxlength: 300, default: '' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Progress', progressSchema);