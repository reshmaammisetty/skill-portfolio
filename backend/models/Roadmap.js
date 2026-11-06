const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: [true, 'Roadmap title is required'], trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 400, default: '' },
    steps: {
      type: [
        {
          title: { type: String, required: [true, 'Step title is required'], trim: true, maxlength: 120 },
          type: { type: String, enum: ['Topic', 'Milestone'], default: 'Topic' },
          completed: { type: Boolean, default: false },
        },
      ],
      validate: { validator: (v) => v.length <= 60, message: 'Maximum 60 steps per roadmap' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Roadmap', roadmapSchema);