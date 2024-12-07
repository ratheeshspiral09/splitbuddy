const mongoose = require('mongoose');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const User = require('../models/User');

async function queryDatabase() {
    try {
        await mongoose.connect('mongodb://admin:password123@localhost:27017/splitwise?authSource=admin');
        
        // Get the Poka group details
        const pokaGroup = await Group.findOne({ name: 'poka' })
            .populate('members.user')
            .populate('expenses');
            
        console.log('Poka Group:', JSON.stringify(pokaGroup, null, 2));
        
        // Get all expenses in Poka group
        const expenses = await Expense.find({ group: pokaGroup._id })
            .populate('paidBy')
            .populate('splitBetween.user');
            
        console.log('Expenses:', JSON.stringify(expenses, null, 2));
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

queryDatabase();
