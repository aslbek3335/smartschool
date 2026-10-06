const express = require('express');
const router  = express.Router();
const publicController = require('../controllers/publicController');

// GET /api/public/landing-stats
router.get('/landing-stats', publicController.getLandingStats);

module.exports = router;
