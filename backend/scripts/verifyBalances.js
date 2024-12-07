const mongoose = require('mongoose');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const User = require('../models/User');

async function verifyBalances() {
    try {
        await mongoose.connect('mongodb://admin:password123@localhost:27017/splitwise?authSource=admin');
        
        // Get the Poka group with all expenses
        const pokaGroup = await Group.findOne({ name: 'poka' })
            .populate('expenses')
            .populate('members.user');

        if (!pokaGroup) {
            console.log('Poka group not found');
            process.exit(1);
        }

        // Calculate expected balances
        const expectedBalances = {};
        pokaGroup.members.forEach(member => {
            expectedBalances[member.user._id.toString()] = 0;
        });

        console.log('\n=== Expenses ===');
        for (const expense of pokaGroup.expenses) {
            // Populate the expense details
            await expense.populate('paidBy');
            await expense.populate('splitBetween.user');

            console.log(`\nExpense: ${expense.description}`);
            console.log(`Amount: $${expense.amount}`);
            console.log(`Paid by: ${expense.paidBy.name}`);
            
            // Calculate what others owe the payer
            const payerId = expense.paidBy._id.toString();
            const payerShare = expense.splitBetween.find(split => 
                split.user._id.toString() === payerId
            ).share;
            
            // Payer gets back what others owe
            expectedBalances[payerId] += (expense.amount - payerShare);

            // Others owe their shares
            expense.splitBetween.forEach(split => {
                const userId = split.user._id.toString();
                if (userId !== payerId) {
                    expectedBalances[userId] -= split.share;
                }
            });
        }

        console.log('\n=== Balance Verification ===');
        console.log('\nExpected Balances:');
        for (const member of pokaGroup.members) {
            const userId = member.user._id.toString();
            console.log(`${member.user.name}: $${expectedBalances[userId].toFixed(2)}`);
        }

        console.log('\nActual Balances in Database:');
        for (const member of pokaGroup.members) {
            console.log(`${member.user.name}: $${member.balance.toFixed(2)}`);
        }

        // Check if balances match
        let balancesMatch = true;
        for (const member of pokaGroup.members) {
            const userId = member.user._id.toString();
            const expected = expectedBalances[userId];
            const actual = member.balance;
            if (Math.abs(expected - actual) > 0.01) { // Using 0.01 to handle floating point precision
                balancesMatch = false;
                console.log(`\nMismatch for ${member.user.name}:`);
                console.log(`Expected: $${expected.toFixed(2)}`);
                console.log(`Actual: $${actual.toFixed(2)}`);
            }
        }

        console.log('\nVerification Result:');
        console.log(balancesMatch ? '✅ All balances are correct!' : '❌ Some balances need correction');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

verifyBalances();
