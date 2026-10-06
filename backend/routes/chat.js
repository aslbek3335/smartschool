const express = require('express');
const router  = express.Router();
const chatController = require('../controllers/chatController');

// POST /api/chat - AI chatbot endpoint
router.post('/', chatController.handleChat);

module.exports = router;
