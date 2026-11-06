const router = require('express').Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { validate, passwordRule } = require('../middleware/validate');
const c = require('../controllers/userController');

router.use(protect);
router.put('/profile', c.updateProfile);
router.put(
  '/password',
  [body('currentPassword').notEmpty().withMessage('Current password is required'), passwordRule('newPassword')],
  validate,
  c.changePassword
);
router.delete('/me', c.deleteAccount);

module.exports = router;