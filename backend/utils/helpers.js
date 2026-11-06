const jwt = require('jsonwebtoken');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

exports.asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

exports.signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

exports.logActivity = (user, type, message) =>
  Activity.create({ user, type, message }).catch(() => {});

exports.notify = (user, message) => Notification.create({ user, message }).catch(() => {});