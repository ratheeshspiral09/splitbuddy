const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// @route   GET api/payments
// @desc    Get all payments for the logged-in user
// @access  Private
router.get('/', authenticateToken, paymentController.getPayments);

// @route   GET api/payments/group/:groupId
// @desc    Get all payments for a specific group
// @access  Private
router.get('/group/:groupId', authenticateToken, paymentController.getGroupPayments);

// @route   GET api/payments/:id
// @desc    Get a single payment by ID
// @access  Private
router.get('/:id', authenticateToken, paymentController.getPaymentById);

// @route   POST api/payments
// @desc    Create a new payment
// @access  Private
router.post(
    '/',
    [
        authenticateToken,
        [
            check('amount', 'Amount is required').not().isEmpty(),
            check('amount', 'Amount must be a positive number').isFloat({ min: 0.01 }),
            check('paidTo', 'Paid to user is required').not().isEmpty(),
            check('groupId', 'Group ID is required').not().isEmpty()
        ]
    ],
    paymentController.createPayment
);

// @route   DELETE api/payments/:id
// @desc    Delete a payment
// @access  Private
router.delete('/:id', authenticateToken, paymentController.deletePayment);

module.exports = router;
