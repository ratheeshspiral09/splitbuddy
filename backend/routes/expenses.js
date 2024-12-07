const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const { check, validationResult } = require('express-validator');
const expenseController = require('../controllers/expenseController');

// @route   GET api/expenses
// @desc    Get all expenses for the logged-in user
// @access  Private
router.get('/', authenticateToken, expenseController.getUserExpenses);

// @route   POST api/expenses
// @desc    Create an expense
// @access  Private
router.post(
    '/',
    [
        authenticateToken,
        [
            check('description', 'Description is required').not().isEmpty(),
            check('amount', 'Amount is required').isNumeric(),
            check('groupId', 'Group ID is required').not().isEmpty(),
            check('splitBetween', 'Split information is required').isArray()
        ]
    ],
    expenseController.createExpense
);

// @route   GET api/expenses/group/:groupId
// @desc    Get all expenses for a group
// @access  Private
router.get('/group/:groupId', authenticateToken, expenseController.getGroupExpenses);

// @route   GET api/expenses/:id
// @desc    Get expense by ID
// @access  Private
router.get('/:id', authenticateToken, expenseController.getExpense);

// @route   DELETE api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete('/:id', authenticateToken, expenseController.deleteExpense);

// @route   GET api/expenses/settlement/:groupId
// @desc    Get settlement plan for a group
// @access  Private
router.get('/settlement/:groupId', authenticateToken, expenseController.getSettlementPlan);

module.exports = router;
