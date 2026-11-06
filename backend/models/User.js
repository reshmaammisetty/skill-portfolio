const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { urlField } = require('../utils/fields');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    headline: { type: String, trim: true, maxlength: 120, default: '' },
    bio: { type: String, trim: true, maxlength: 1000, default: '' },
    location: { type: String, trim: true, maxlength: 80, default: '' },
    avatar: { type: String, default: '' },
    education: [
      {
        _id: false,
        school: { type: String, trim: true, maxlength: 120 },
        degree: { type: String, trim: true, maxlength: 120 },
        field: { type: String, trim: true, maxlength: 120 },
        startYear: { type: String, trim: true, maxlength: 4 },
        endYear: { type: String, trim: true, maxlength: 4 },
      },
    ],
    social: {
      github: urlField(),
      linkedin: urlField(),
      twitter: urlField(),
      website: urlField(),
    },
    isPublic: { type: Boolean, default: true },
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.resetTokenHash;
        delete ret.resetTokenExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);