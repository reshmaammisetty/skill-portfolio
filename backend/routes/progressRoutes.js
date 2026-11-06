const router = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/progressController');

router.use(protect);
router.get('/summary', c.summary);
router.route('/logs').get(c.listLogs).post(c.addLog);
router.delete('/logs/:id', c.deleteLog);

module.exports = router;