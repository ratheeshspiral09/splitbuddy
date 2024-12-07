const mongoose = require('mongoose');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const User = require('../models/User');

async function resetBalances() {
    try {
        await mongoose.connect('mongodb://admin:password123@localhost:27017/splitwise?authSource=admin');
        
        // Get the Poka group
        const pokaGroup = await Group.findOne({ name: 'poka' });
        if (!pokaGroup) {
            console.log('Poka group not found');
            process.exit(1);
        }

        // Reset all member balances to 0
        pokaGroup.members.forEach(member => {
            member.balance = 0;
        });

        // Save the group with reset balances
        await pokaGroup.save();
        
        console.log('Successfully reset all balances to 0');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

resetBalances();
