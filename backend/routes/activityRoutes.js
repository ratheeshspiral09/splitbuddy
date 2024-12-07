const express = require('express');
const router = express.Router();
const { getUserActivities, getRecentActivities } = require('../controllers/activityController');
const { authenticateToken } = require('../middleware/auth');

// Get paginated activities for the authenticated user
router.get('/', authenticateToken, getUserActivities);

// Get recent activities for dashboard
router.get('/recent', authenticateToken, getRecentActivities);

module.exports = router;
