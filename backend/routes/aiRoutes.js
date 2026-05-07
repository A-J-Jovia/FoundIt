const express = require('express');
const router = express.Router();
const { getInsights, chatWithAI } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/ai/insights  — requires login
router.post('/insights', protect, getInsights);

// POST /api/ai/chat  — requires login
router.post('/chat', protect, chatWithAI);

module.exports = router;
