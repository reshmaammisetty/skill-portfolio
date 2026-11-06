const express = require('express');
const { protect } = require('../middleware/auth');
const c = require('../controllers/resourceControllers');

const router = express.Router();

const crudRoutes = (ctrl) => {
  const r = express.Router();
  r.route('/').get(ctrl.list).post(ctrl.create);
  r.route('/:id').get(ctrl.get).put(ctrl.update).delete(ctrl.remove);
  return r;
};

router.use('/skills', protect, crudRoutes(c.skills));
router.use('/projects', protect, crudRoutes(c.projects));
router.use('/achievements', protect, crudRoutes(c.achievements));
router.use('/goals', protect, crudRoutes(c.goals));
router.use('/roadmaps', protect, crudRoutes(c.roadmaps));

module.exports = router;