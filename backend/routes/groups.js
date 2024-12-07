const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const groupController = require('../controllers/groupController');

// @route   POST api/groups
// @desc    Create a group
// @access  Private
router.post(
    '/',
    [
        authenticateToken,
        [
            check('name', 'Name is required').not().isEmpty(),
            check('category', 'Category is required').not().isEmpty()
        ]
    ],
    groupController.createGroup
);

// @route   GET api/groups
// @desc    Get all groups for the logged-in user
// @access  Private
router.get('/', authenticateToken, groupController.getMyGroups);

// @route   GET api/groups/:id
// @desc    Get group by ID
// @access  Private
router.get('/:id', authenticateToken, groupController.getGroup);

// @route   POST api/groups/:id/members
// @desc    Add member to group
// @access  Private
router.post(
    '/:id/members',
    [
        authenticateToken,
        [
            check('email', 'Please include a valid email').isEmail()
        ]
    ],
    groupController.addMember
);

// @route   DELETE api/groups/:groupId/members/:userId
// @desc    Remove member from group
// @access  Private
router.delete(
    '/:groupId/members/:userId',
    authenticateToken,
    groupController.removeMember
);

// @route   DELETE api/groups/:id
// @desc    Delete group
// @access  Private
router.delete('/:id', authenticateToken, groupController.deleteGroup);

module.exports = router;
