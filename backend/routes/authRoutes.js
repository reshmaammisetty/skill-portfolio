const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { validate, passwordRule } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const c = require('../controllers/authController');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many attempts. Please try again later.' },
});

const emailRule = body('email').trim().toLowerCase().isEmail().withMessage('Enter a valid email address');

router.post(
  '/register',
  limiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }).withMessage('Name is too long'),
    emailRule,
    passwordRule('password'),
  ],
  validate,
  c.register
);
router.post('/login', limiter, [emailRule, body('password').notEmpty().withMessage('Password is required')], validate, c.login);
router.post('/forgot-password', limiter, [emailRule], validate, c.forgotPassword);
router.post(
  '/reset-password',
  limiter,
  [body('token').notEmpty().withMessage('Reset token is missing'), passwordRule('password')],
  validate,
  c.resetPassword
);
router.get('/me', protect, c.me);

module.exports = router;