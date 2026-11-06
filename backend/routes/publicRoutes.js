const router = require('express').Router();
const c = require('../controllers/publicController');

router.get('/:username', c.getPortfolio);

module.exports = router;