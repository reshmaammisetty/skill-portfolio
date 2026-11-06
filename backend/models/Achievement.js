const mongoose = require('mongoose');
const { urlField } = require('../utils/fields');

const achievementSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
    type: {
      type: String,
      enum: { values: ['Certificate', 'Coding Competition', 'Course Completion', 'Other'], message: 'Invalid type' },
      default: 'Certificate',
    },
    issuer: { type: String, trim: true, maxlength: 100, default: '' },
    date: { type: Date, default: Date.now },
    credentialUrl: urlField(),
    description: { type: String, trim: true, maxlength: 600, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Achievement', achievementSchema);