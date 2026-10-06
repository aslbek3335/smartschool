const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/newsController');
const { authenticate, authorize } = require('../middleware/auth');

const adminOnly = [authenticate, authorize('admin')];

router.get('/',     ctrl.getNews);
router.post('/',    ...adminOnly, ctrl.createNews);
router.put('/:id',  ...adminOnly, ctrl.updateNews);
router.delete('/:id', ...adminOnly, ctrl.deleteNews);

module.exports = router;
