const mongoose = require('mongoose');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const User = require('../models/User');

async function recreateExpenses() {
    try {
        await mongoose.connect('mongodb://admin:password123@localhost:27017/splitwise?authSource=admin');
        
        // Get the Poka group
        const pokaGroup = await Group.findOne({ name: 'poka' });
        if (!pokaGroup) {
            console.log('Poka group not found');
            process.exit(1);
        }

        // Get users
        const ratheesh = await User.findOne({ name: 'Ratheesh' });
        const gokul = await User.findOne({ name: 'Gokul' });
        const gopal = await User.findOne({ name: 'Gopal' });

        // Reset all balances and expenses
        pokaGroup.members.forEach(member => {
            member.balance = 0;
        });
        pokaGroup.expenses = [];
        pokaGroup.totalExpenses = 0;
        await pokaGroup.save();

        // Delete all existing expenses
        await Expense.deleteMany({ group: pokaGroup._id });

        // Create Trip booking expense
        const tripExpense = new Expense({
            description: 'Trip booking',
            amount: 200,
            group: pokaGroup._id,
            paidBy: ratheesh._id,
            splitBetween: [
                {
                    user: ratheesh._id,
                    share: 66.67,
                    shareType: 'equal',
                    isPaid: true
                },
                {
                    user: gokul._id,
                    share: 66.67,
                    shareType: 'equal',
                    isPaid: false
                },
                {
                    user: gopal._id,
                    share: 66.67,
                    shareType: 'equal',
                    isPaid: false
                }
            ],
            category: 'Other',
            date: new Date('2024-12-06T01:08:41.431Z')
        });
        await tripExpense.save();

        // Update balances for trip expense
        const tripPayerIndex = pokaGroup.members.findIndex(m => m.user.toString() === ratheesh._id.toString());
        pokaGroup.members[tripPayerIndex].balance += (200 - 66.67); // Ratheesh gets back others' shares
        pokaGroup.members.forEach(member => {
            if (member.user.toString() !== ratheesh._id.toString()) {
                member.balance -= 66.67; // Others owe their shares
            }
        });

        // Create Water expense
        const waterExpense = new Expense({
            description: 'water',
            amount: 30,
            group: pokaGroup._id,
            paidBy: gokul._id,
            splitBetween: [
                {
                    user: ratheesh._id,
                    share: 10,
                    shareType: 'equal',
                    isPaid: false
                },
                {
                    user: gokul._id,
                    share: 10,
                    shareType: 'equal',
                    isPaid: true
                },
                {
                    user: gopal._id,
                    share: 10,
                    shareType: 'equal',
                    isPaid: false
                }
            ],
            category: 'Other',
            date: new Date('2024-12-06T01:27:57.263Z')
        });
        await waterExpense.save();

        // Update balances for water expense
        const waterPayerIndex = pokaGroup.members.findIndex(m => m.user.toString() === gokul._id.toString());
        pokaGroup.members[waterPayerIndex].balance += (30 - 10); // Gokul gets back others' shares
        pokaGroup.members.forEach(member => {
            if (member.user.toString() !== gokul._id.toString()) {
                member.balance -= 10; // Others owe their shares
            }
        });

        // Update group
        pokaGroup.expenses = [tripExpense._id, waterExpense._id];
        pokaGroup.totalExpenses = 230;
        await pokaGroup.save();

        console.log('Successfully recreated expenses with correct balances');
        console.log('\nFinal Balances:');
        for (const member of pokaGroup.members) {
            const user = await User.findById(member.user);
            console.log(`${user.name}: $${member.balance.toFixed(2)}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

recreateExpenses();
