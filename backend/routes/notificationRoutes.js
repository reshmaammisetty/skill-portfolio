const router = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/notificationController');

router.use(protect);
router.get('/', c.list);
router.put('/read-all', c.markAllRead);

module.exports = router;