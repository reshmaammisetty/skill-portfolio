const router = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/dashboardController');

router.get('/dashboard', protect, c.getDashboard);
router.get('/search', protect, c.search);

module.exports = router;