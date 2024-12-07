const Payment = require('../models/Payment');
const Group = require('../models/Group');
const { validationResult } = require('express-validator');
const { createActivity } = require('./activityController');
const logger = require('../config/logger');

// Get all payments for a user (both sent and received)
exports.getPayments = async (req, res) => {
    try {
        const payments = await Payment.find({
            $or: [
                { paidBy: req.user.id },
                { paidTo: req.user.id }
            ]
        })
        .populate('group', 'name')
        .populate('paidBy', 'name')
        .populate('paidTo', 'name')
        .sort({ date: -1 });

        res.json(payments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get payments for a specific group
exports.getGroupPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ group: req.params.groupId })
            .populate('paidBy', 'name')
            .populate('paidTo', 'name')
            .sort({ date: -1 });

        res.json(payments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Create a new payment
exports.createPayment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { groupId, paidTo, amount, description } = req.body;

        // Verify group exists and users are members
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        // Create payment
        const newPayment = new Payment({
            group: groupId,
            paidBy: req.user.id,
            paidTo,
            amount,
            description
        });

        // Update group balances
        const payerIndex = group.members.findIndex(m => m.user.toString() === req.user.id);
        const receiverIndex = group.members.findIndex(m => m.user.toString() === paidTo);

        if (payerIndex !== -1) {
            group.members[payerIndex].balance += amount;
        }
        if (receiverIndex !== -1) {
            group.members[receiverIndex].balance -= amount;
        }

        await group.save();
        const savedPayment = await newPayment.save();

        // Create activity for payment
        try {
            await createActivity({
                type: 'PAYMENT_MADE',
                actor: req.user.id,
                target: paidTo,
                group: groupId,
                payment: savedPayment._id,
                amount: amount,
                description: `made a payment of $${amount}`
            });
            logger.info('Payment activity created successfully');
        } catch (error) {
            logger.error('Error creating payment activity:', error);
        }

        res.json(savedPayment);
    } catch (err) {
        logger.error('Error in createPayment:', err.message);
        res.status(500).send('Server Error');
    }
};

// Get payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('paidBy', 'name email')
      .populate('paidTo', 'name email')
      .populate('group', 'name');

    if (!payment) {
      return res.status(404).json({ msg: 'Payment not found' });
    }

    // Check if user is part of the payment
    if (payment.paidBy._id.toString() !== req.user.id && 
        payment.paidTo._id.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to view this payment' });
    }

    res.json(payment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Payment not found' });
    }
    res.status(500).send('Server Error');
  }
};

// Delete a payment
exports.deletePayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ msg: 'Payment not found' });
        }

        // Check if user created the payment
        if (payment.paidBy.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Update group balances
        const group = await Group.findById(payment.group);
        if (group) {
            const payerIndex = group.members.findIndex(m => m.user.toString() === payment.paidBy.toString());
            const receiverIndex = group.members.findIndex(m => m.user.toString() === payment.paidTo.toString());

            if (payerIndex !== -1) {
                group.members[payerIndex].balance -= payment.amount;
            }
            if (receiverIndex !== -1) {
                group.members[receiverIndex].balance += payment.amount;
            }

            await group.save();
        }

        // Create activity for payment deletion
        try {
            await createActivity({
                type: 'PAYMENT_DELETE',
                actor: req.user.id,
                target: payment.paidTo,
                group: payment.group,
                payment: payment._id,
                amount: payment.amount,
                description: `deleted a payment of $${payment.amount}`
            });
            logger.info('Payment deletion activity created successfully');
        } catch (error) {
            logger.error('Error creating payment deletion activity:', error);
        }

        await payment.deleteOne();
        res.json({ msg: 'Payment deleted' });
    } catch (err) {
        logger.error('Error in deletePayment:', err.message);
        res.status(500).send('Server Error');
    }
};
