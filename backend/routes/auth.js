const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const authController = require('../controllers/authController');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post(
    '/register',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ],
    authController.register
);

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    authController.login
);

// @route   POST api/auth/google
// @desc    Google OAuth
// @access  Public
router.post('/google', authController.googleAuth);

// @route   GET api/auth/me
// @desc    Get authenticated user
// @access  Private
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
