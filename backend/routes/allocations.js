const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/allocationController');
const { authenticate, authorize } = require('../middleware/auth');

const adminOnly = [authenticate, authorize('admin')];

router.get('/',           ...adminOnly, ctrl.getAllocations);
router.get('/options',    ...adminOnly, ctrl.getAllocationOptions);
router.post('/primary',   ...adminOnly, ctrl.savePrimaryAllocation);
router.post('/secondary', ...adminOnly, ctrl.saveSecondaryAllocation);

module.exports = router;
