const Group = require('../models/Group');
const User = require('../models/User');
const Expense = require('../models/Expense'); 
const Payment = require('../models/Payment'); 
const { validationResult } = require('express-validator');
const { createActivity } = require('./activityController');
const logger = require('../config/logger');

// Create a new group
exports.createGroup = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, category, members } = req.body;
        const creator = req.user.id;

        // Initialize members array with creator
        const groupMembers = [{ user: creator, balance: 0 }];
        let uniqueMembers = [];

        // Add other members if provided
        if (members && Array.isArray(members)) {
            // Filter out duplicates and creator
            uniqueMembers = [...new Set(members)].filter(id => id !== creator);
            
            // Add each member to the group
            uniqueMembers.forEach(memberId => {
                groupMembers.push({ user: memberId, balance: 0 });
            });
        }

        const group = new Group({
            name,
            description,
            category,
            creator,
            members: groupMembers
        });

        await group.save();

        // Add group to all members' groups array
        const memberIds = groupMembers.map(member => member.user);
        await User.updateMany(
            { _id: { $in: memberIds } },
            { $push: { groups: group._id } }
        );

        // Create activity for group creation
        try {
            await createActivity({
                type: 'GROUP_CREATE',
                actor: creator,
                group: group._id,
                description: `created group "${name}"`
            });

            // Create activities for each added member (except creator)
            for (const memberId of uniqueMembers) {
                await createActivity({
                    type: 'MEMBER_ADD',
                    actor: creator,
                    target: memberId,
                    group: group._id,
                    description: `added to group "${name}"`
                });
            }
        } catch (error) {
            logger.error('Error creating group activities:', error);
        }

        // Populate the group before sending response
        const populatedGroup = await Group.findById(group._id)
            .populate('creator', ['name', 'email'])
            .populate('members.user', ['name', 'email', 'avatar']);

        res.json(populatedGroup);
    } catch (err) {
        logger.error('Error in createGroup:', err.message);
        res.status(500).send('Server error');
    }
};

// Get all groups for a user
exports.getMyGroups = async (req, res) => {
    try {
        const groups = await Group.find({
            'members.user': req.user.id
        })
        .populate('creator', ['name', 'email'])
        .populate('members.user', ['name', 'email', 'avatar'])
        .sort({ createdAt: -1 });

        res.json(groups);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Get single group by ID
exports.getGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate('creator', ['name', 'email'])
            .populate('members.user', ['name', 'email', 'avatar'])
            .populate('expenses');

        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        // Check if user is member of group
        if (!group.members.some(member => member.user._id.toString() === req.user.id)) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        res.json(group);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Group not found' });
        }
        res.status(500).send('Server error');
    }
};

// Add member to group
exports.addMember = async (req, res) => {
    try {
        const { email } = req.body;
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        // Check if user is group creator
        if (group.creator.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if user is already a member
        if (group.members.some(member => member.user.toString() === user._id.toString())) {
            return res.status(400).json({ msg: 'User already in group' });
        }

        group.members.push({ user: user._id, balance: 0 });
        await group.save();

        // Add group to user's groups
        await User.findByIdAndUpdate(user._id, {
            $push: { groups: group._id }
        });

        // Create activity for member addition
        try {
            await createActivity({
                type: 'MEMBER_ADD',
                actor: req.user.id,
                target: user._id,
                group: group._id,
                description: `added to group "${group.name}"`
            });
            logger.info('Member addition activity created successfully');
        } catch (error) {
            logger.error('Error creating member addition activity:', error);
        }

        // Populate the group before sending response
        const populatedGroup = await Group.findById(group._id)
            .populate('creator', ['name', 'email'])
            .populate('members.user', ['name', 'email', 'avatar']);

        res.json(populatedGroup);
    } catch (err) {
        logger.error('Error in addMember:', err.message);
        res.status(500).send('Server error');
    }
};

// Remove member from group
exports.removeMember = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        const memberId = req.params.userId;

        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        // Check if user is group creator
        if (group.creator.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Check if member exists in the group
        const memberIndex = group.members.findIndex(m => m.user.toString() === memberId);
        if (memberIndex === -1) {
            return res.status(404).json({ msg: 'Member not found in group' });
        }

        // Check if member has any expenses in the group
        const hasExpenses = await Expense.exists({
            group: group._id,
            $or: [
                { paidBy: memberId },
                { 'splitBetween.user': memberId }
            ]
        });

        if (hasExpenses) {
            return res.status(400).json({ msg: 'Cannot remove member with related expenses' });
        }

        // Check if member has any payments in the group
        const hasPayments = await Payment.exists({
            group: group._id,
            $or: [
                { paidBy: memberId },
                { paidTo: memberId }
            ]
        });

        if (hasPayments) {
            return res.status(400).json({ msg: 'Cannot remove member with related payments' });
        }

        // Check if member has outstanding balance
        const member = group.members[memberIndex];
        if (member.balance !== 0) {
            return res.status(400).json({ msg: 'Cannot remove member with outstanding balance' });
        }

        // Remove member from group
        group.members = group.members.filter(
            member => member.user.toString() !== memberId
        );

        await group.save();

        // Remove group from user's groups
        await User.findByIdAndUpdate(memberId, {
            $pull: { groups: group._id }
        });

        // Create activity for member removal
        try {
            await createActivity({
                type: 'MEMBER_REMOVE',
                actor: req.user.id,
                target: memberId,
                group: group._id,
                description: `removed from group "${group.name}"`
            });
        } catch (error) {
            logger.error('Error creating member removal activity:', error);
        }

        // Populate the group before sending response
        const populatedGroup = await Group.findById(group._id)
            .populate('creator', ['name', 'email'])
            .populate('members.user', ['name', 'email', 'avatar']);

        res.json(populatedGroup);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Delete group and all associated expenses
exports.deleteGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        // Check if user is group creator
        if (group.creator.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized to delete this group' });
        }

        // Delete all expenses associated with this group
        await Expense.deleteMany({ group: req.params.id });

        // Remove group reference from all members
        const memberIds = group.members.map(member => member.user);
        await User.updateMany(
            { _id: { $in: memberIds } },
            { $pull: { groups: group._id } }
        );

        // Delete the group
        await group.deleteOne();

        res.json({ msg: 'Group and associated expenses deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
