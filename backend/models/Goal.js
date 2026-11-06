const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: [true, 'Goal title is required'], trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 600, default: '' },
    type: { type: String, enum: { values: ['Daily', 'Weekly', 'Monthly'], message: 'Invalid goal type' }, default: 'Weekly' },
    deadline: { type: Date, default: null },
    progress: { type: Number, min: [0, 'Progress must be 0-100'], max: [100, 'Progress must be 0-100'], default: 0 },
    status: {
      type: String,
      enum: { values: ['Not Started', 'In Progress', 'Completed'], message: 'Invalid status' },
      default: 'Not Started',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Goal', goalSchema);