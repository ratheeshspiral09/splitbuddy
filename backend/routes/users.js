const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

// @route   GET api/users/search
// @desc    Search users by email
// @access  Private
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const searchTerm = req.query.q;
    if (!searchTerm) {
      return res.status(400).json({ msg: 'Search term is required' });
    }

    const users = await User.find({
      email: { $regex: searchTerm, $options: 'i' },
      _id: { $ne: req.user.id } // Exclude the current user
    }).select('-password');

    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
