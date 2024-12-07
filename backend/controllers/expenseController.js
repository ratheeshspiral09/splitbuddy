const Expense = require('../models/Expense');
const Group = require('../models/Group');
const { validationResult } = require('express-validator');
const { createActivity } = require('./activityController');
const logger = require('../config/logger');

// Helper function to calculate balances
const calculateBalances = (amount, paidBy, splitBetween) => {
    const totalShares = splitBetween.reduce((sum, split) => sum + split.share, 0);
    
    return splitBetween.map(split => {
        let shareAmount = (split.shareType === 'percentage')
            ? (amount * split.share) / 100
            : (split.shareType === 'exact')
                ? split.share
                : (amount * split.share) / totalShares;

        // Round to 2 decimal places
        shareAmount = Number(shareAmount.toFixed(2));

        return {
            user: split.user,
            share: shareAmount,
            shareType: split.shareType,
            isPaid: split.user.toString() === paidBy.toString()
        };
    });
};

// Create a new expense
exports.createExpense = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.error('Validation error:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            description,
            amount,
            groupId,
            splitBetween,
            category,
            notes
        } = req.body;

        // Check if group exists and user is a member
        const group = await Group.findById(groupId);
        if (!group) {
            logger.error('Group not found:', groupId);
            return res.status(404).json({ msg: 'Group not found' });
        }

        if (!group.members.some(member => member.user.toString() === req.user.id)) {
            logger.error('Not authorized:', req.user.id);
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Calculate shares and update balances
        const calculatedSplits = calculateBalances(amount, req.user.id, splitBetween);

        const expense = new Expense({
            description,
            amount,
            group: groupId,
            paidBy: req.user.id,
            splitBetween: calculatedSplits,
            category,
            notes
        });

        await expense.save();

        // Update group balances
        calculatedSplits.forEach(split => {
            const memberIndex = group.members.findIndex(
                m => m.user.toString() === split.user.toString()
            );

            if (memberIndex !== -1) {
                if (split.user.toString() === req.user.id) {
                    // Payer gets back what others owe
                    const amountOthersOwe = amount - split.share;
                    group.members[memberIndex].balance += amountOthersOwe;
                } else {
                    // Others owe their share
                    group.members[memberIndex].balance -= split.share;
                }
            }
        });

        group.expenses.push(expense._id);
        group.totalExpenses += amount;
        await group.save();

        // Create activity record for expense creation
        try {
            logger.info('Creating activity for expense creation:', {
                type: 'EXPENSE_ADD',
                group: groupId,
                expense: expense._id,
                actor: req.user.id,
                amount: amount,
                description: `Added expense: ${description}`
            });

            await createActivity({
                type: 'EXPENSE_ADD',
                group: groupId,
                expense: expense._id,
                actor: req.user.id,
                amount: amount,
                description: `Added expense: ${description}`
            });
            logger.info('Activity created successfully');
        } catch (activityError) {
            logger.error('Failed to create activity:', activityError);
            // Don't throw the error, just log it
        }

        res.json(expense);
    } catch (err) {
        logger.error(err.message);
        res.status(500).send('Server error');
    }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
    try {
        logger.info('Attempting to delete expense:', req.params.id);
        
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            logger.error('Expense not found:', req.params.id);
            return res.status(404).json({ msg: 'Expense not found' });
        }

        // Check if user created the expense
        logger.info('User attempting delete:', req.user.id);
        logger.info('Expense paid by:', expense.paidBy.toString());
        
        if (expense.paidBy.toString() !== req.user.id) {
            logger.error('Not authorized:', req.user.id);
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const group = await Group.findById(expense.group);
        if (!group) {
            logger.error('Group not found:', expense.group);
            return res.status(404).json({ msg: 'Group not found' });
        }

        // Reverse the balances
        expense.splitBetween.forEach(split => {
            const memberIndex = group.members.findIndex(
                m => m.user.toString() === split.user.toString()
            );

            if (memberIndex !== -1) {
                if (split.user.toString() === expense.paidBy.toString()) {
                    // Reverse payer's balance - they no longer get back what others owed
                    const amountOthersOwed = expense.amount - split.share;
                    group.members[memberIndex].balance -= amountOthersOwed;
                } else {
                    // Reverse others' balances - they no longer owe their share
                    group.members[memberIndex].balance += split.share;
                }
            }
        });

        group.expenses = group.expenses.filter(
            expId => expId.toString() !== expense._id.toString()
        );
        group.totalExpenses -= expense.amount;
        await group.save();

        // Create activity record for expense deletion
        try {
            const activityData = {
                type: 'EXPENSE_DELETE',
                actor: req.user.id,
                group: expense.group,
                expense: expense._id,
                description: `deleted expense: ${expense.description}`,
                amount: expense.amount
            };
            logger.info('Creating activity with data:', activityData);
            
            const activity = await createActivity(activityData);
            logger.info('Activity created successfully:', activity);
        } catch (error) {
            logger.error('Error creating activity for expense deletion:', error);
            // Continue with expense deletion even if activity creation fails
        }

        // Delete the expense
        logger.info('Deleting expense from database...');
        await expense.deleteOne();
        logger.info('Expense successfully deleted');
        
        res.json({ msg: 'Expense deleted' });
    } catch (err) {
        logger.error(err.message);
        res.status(500).send('Server error');
    }
};

// Get all expenses for the logged-in user
exports.getUserExpenses = async (req, res) => {
    try {
        // Find expenses where the user is either the payer or included in splitBetween
        const expenses = await Expense.find({
            $or: [
                { paidBy: req.user.id },
                { 'splitBetween.user': req.user.id }
            ]
        })
        .populate('paidBy', ['name', 'email'])
        .populate('splitBetween.user', ['name', 'email'])
        .populate('group', ['name'])
        .sort({ date: -1 }); // Sort by date, newest first

        res.json(expenses);
    } catch (err) {
        logger.error(err.message);
        res.status(500).send('Server error');
    }
};

// Get all expenses for a group
exports.getGroupExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find({ group: req.params.groupId })
            .populate('paidBy', ['name', 'email'])
            .populate('splitBetween.user', ['name', 'email']);

        res.json(expenses);
    } catch (err) {
        logger.error(err.message);
        res.status(500).send('Server error');
    }
};

// Get expense by ID
exports.getExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id)
            .populate('paidBy', ['name', 'email'])
            .populate('splitBetween.user', ['name', 'email']);

        if (!expense) {
            logger.error('Expense not found:', req.params.id);
            return res.status(404).json({ msg: 'Expense not found' });
        }

        res.json(expense);
    } catch (err) {
        logger.error(err.message);
        if (err.kind === 'ObjectId') {
            logger.error('Invalid expense ID:', req.params.id);
            return res.status(404).json({ msg: 'Expense not found' });
        }
        res.status(500).send('Server error');
    }
};

// Calculate settlement plan
exports.getSettlementPlan = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId)
            .populate('members.user', ['name', 'email']);

        if (!group) {
            logger.error('Group not found:', req.params.groupId);
            return res.status(404).json({ msg: 'Group not found' });
        }

        // Get all members with non-zero balances
        const balances = group.members
            .filter(member => member.balance !== 0)
            .map(member => ({
                user: member.user,
                balance: member.balance
            }));

        // Sort by balance (descending)
        balances.sort((a, b) => b.balance - a.balance);

        const settlements = [];
        let i = 0; // index for positive balances (creditors)
        let j = balances.length - 1; // index for negative balances (debtors)

        while (i < j) {
            const creditor = balances[i];
            const debtor = balances[j];
            
            const amount = Math.min(creditor.balance, -debtor.balance);
            
            if (amount > 0) {
                settlements.push({
                    from: debtor.user,
                    to: creditor.user,
                    amount: Number(amount.toFixed(2))
                });
            }

            creditor.balance -= amount;
            debtor.balance += amount;

            if (creditor.balance === 0) i++;
            if (debtor.balance === 0) j--;
        }

        res.json(settlements);
    } catch (err) {
        logger.error(err.message);
        res.status(500).send('Server error');
    }
};

module.exports = {
    createExpense: exports.createExpense,
    deleteExpense: exports.deleteExpense,
    getUserExpenses: exports.getUserExpenses,
    getGroupExpenses: exports.getGroupExpenses,
    getExpense: exports.getExpense,
    getSettlementPlan: exports.getSettlementPlan
};
