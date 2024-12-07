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

        // Get Ratheesh's user ID (will be the payer)
        const ratheesh = await User.findOne({ name: 'Ratheesh' });
        if (!ratheesh) {
            console.log('Ratheesh user not found');
            process.exit(1);
        }

        // Get other users
        const gokul = await User.findOne({ name: 'Gokul' });
        const gopal = await User.findOne({ name: 'Gopal' });

        console.log('\nCurrent balances before new expense:');
        for (const member of pokaGroup.members) {
            const user = await User.findById(member.user);
            console.log(`${user.name}: $${member.balance.toFixed(2)}`);
        }

        // Create test expense - Ratheesh pays 90 split equally
        const testExpense = new Expense({
            description: 'Test Food Expense',
            amount: 90,
            group: pokaGroup._id,
            paidBy: ratheesh._id,
            splitBetween: [
                {
                    user: ratheesh._id,
                    share: 30,
                    shareType: 'equal',
                    isPaid: true
                },
                {
                    user: gokul._id,
                    share: 30,
                    shareType: 'equal',
                    isPaid: false
                },
                {
                    user: gopal._id,
                    share: 30,
                    shareType: 'equal',
                    isPaid: false
                }
            ],
            category: 'Food'
        });

        // Save the expense
        await testExpense.save();

        // Update group balances
        pokaGroup.members.forEach(member => {
            if (member.user.toString() === ratheesh._id.toString()) {
                // Ratheesh (payer) gets back what others owe
                member.balance += (90 - 30); // Gets back 60
            } else {
                // Others owe their share
                member.balance -= 30;
            }
        });

        pokaGroup.expenses.push(testExpense._id);
        pokaGroup.totalExpenses += 90;
        await pokaGroup.save();

        console.log('\nExpected new balances:');
        console.log(`Ratheesh: $${(123.33 + 60).toFixed(2)} (previous + 60)`);
        console.log(`Gokul: $${(-46.67 - 30).toFixed(2)} (previous - 30)`);
        console.log(`Gopal: $${(-76.67 - 30).toFixed(2)} (previous - 30)`);

        console.log('\nActual new balances in database:');
        const updatedGroup = await Group.findOne({ name: 'poka' }).populate('members.user');
        for (const member of updatedGroup.members) {
            console.log(`${member.user.name}: $${member.balance.toFixed(2)}`);
        }

        console.log('\nTest expense created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createTestExpense();
