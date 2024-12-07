const mongoose = require('mongoose');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const User = require('../models/User');

async function createTestExpense() {
    try {
        await mongoose.connect('mongodb://admin:password123@localhost:27017/splitwise?authSource=admin');
        
        // Get the Poka group
        const pokaGroup = await Group.findOne({ name: 'poka' });
        if (!pokaGroup) {
            console.log('Poka group not found');
            process.exit(1);
        }

        // Get Gopal's user ID (will be the payer)
        const gopal = await User.findOne({ name: 'Gopal' });
        if (!gopal) {
            console.log('Gopal user not found');
            process.exit(1);
        }

        // Create test expense - Gopal pays 60 split equally
        const testExpense = new Expense({
            description: 'Test Expense',
            amount: 60,
            group: pokaGroup._id,
            paidBy: gopal._id,
            splitBetween: [
                {
                    user: gopal._id,
                    share: 20,
                    shareType: 'equal',
                    isPaid: true
                },
                {
                    user: pokaGroup.members[0].user, // Ratheesh
                    share: 20,
                    shareType: 'equal',
                    isPaid: false
                },
                {
                    user: pokaGroup.members[1].user, // Gokul
                    share: 20,
                    shareType: 'equal',
                    isPaid: false
                }
            ],
            category: 'Other'
        });

        // Save the expense
        await testExpense.save();

        // Update group balances
        pokaGroup.members.forEach(member => {
            if (member.user.toString() === gopal._id.toString()) {
                // Gopal (payer) gets back what others owe
                member.balance += (60 - 20); // Gets back 40
            } else {
                // Others owe their share
                member.balance -= 20;
            }
        });

        pokaGroup.expenses.push(testExpense._id);
        pokaGroup.totalExpenses += 60;
        await pokaGroup.save();

        // Print final balances
        console.log('Updated balances:');
        for (const member of pokaGroup.members) {
            const user = await User.findById(member.user);
            console.log(`${user.name}: ${member.balance}`);
        }

        console.log('\nTest expense created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createTestExpense();
