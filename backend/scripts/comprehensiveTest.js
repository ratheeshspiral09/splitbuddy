const mongoose = require('mongoose');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const User = require('../models/User');
const Payment = require('../models/Payment'); // Assuming Payment model is defined in '../models/Payment'

async function createTestScenarios() {
    try {
        await mongoose.connect('mongodb://admin:password123@localhost:27017/splitwise?authSource=admin');
        
        // List of test usernames - these are the users we'll be working with
        const testUsernames = ['John', 'Mike', 'David', 'Alex', 'Sarah'];
        
        // Clean up any existing test data before starting
        const existingTestUsers = await User.find({ name: { $in: testUsernames } });
        const existingTestUserIds = existingTestUsers.map(user => user._id);
        
        // Delete expenses where test users are involved
        await Expense.deleteMany({
            $or: [
                { paidBy: { $in: existingTestUserIds } },
                { 'splitBetween.user': { $in: existingTestUserIds } }
            ]
        });
        
        // Delete groups where test users are involved
        await Group.deleteMany({
            $or: [
                { creator: { $in: existingTestUserIds } },
                { 'members.user': { $in: existingTestUserIds } }
            ]
        });
        
        // Delete existing test users
        await User.deleteMany({ name: { $in: testUsernames } });

        // Create test users
        const users = await createTestUsers();
        
        // Create test groups
        const groups = await createTestGroups(users);
        
        // Create various expenses
        await createTestExpenses(groups, users);
        
        // Verify final balances
        await verifyBalances(groups);

        // Clean up test data
        console.log('\nCleaning up test data...');
        
        // Get all expenses where any test user is involved
        const testUsers = await User.find({ name: { $in: testUsernames } });
        const testUserIds = testUsers.map(user => user._id);
        
        // Delete expenses where test users are involved
        await Expense.deleteMany({
            $or: [
                { paidBy: { $in: testUserIds } },
                { 'splitBetween.user': { $in: testUserIds } }
            ]
        });
        
        // Delete groups where test users are involved
        await Group.deleteMany({
            $or: [
                { creator: { $in: testUserIds } },
                { 'members.user': { $in: testUserIds } }
            ]
        });
        
        // Delete payments where test users are involved
        await Payment.deleteMany({
            $or: [
                { paidBy: { $in: testUserIds } },
                { paidTo: { $in: testUserIds } }
            ]
        });
        
        // Finally, delete the test users
        await User.deleteMany({ name: { $in: testUsernames } });
        
        console.log('Successfully cleaned up all test data');
        console.log('Test users and their associated data have been removed');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

async function createTestUsers() {
    console.log('\nCreating test users...');
    
    const users = {
        john: await User.findOneAndUpdate(
            { name: 'John' },
            { email: 'john@example.com' },
            { upsert: true, new: true }
        ),
        mike: await User.findOneAndUpdate(
            { name: 'Mike' },
            { email: 'mike@example.com' },
            { upsert: true, new: true }
        ),
        david: await User.findOneAndUpdate(
            { name: 'David' },
            { email: 'david@example.com' },
            { upsert: true, new: true }
        ),
        alex: await User.findOneAndUpdate(
            { name: 'Alex' },
            { email: 'alex@example.com' },
            { upsert: true, new: true }
        ),
        sarah: await User.findOneAndUpdate(
            { name: 'Sarah' },
            { email: 'sarah@example.com' },
            { upsert: true, new: true }
        )
    };

    console.log('Created users:', Object.keys(users).join(', '));
    return users;
}

async function createTestGroups(users) {
    console.log('\nCreating test groups...');
    
    // Group 1: Poka (John, Mike, David)
    const pokaGroup = new Group({
        name: 'poka',
        description: 'Trip group',
        creator: users.john._id,
        members: [
            { user: users.john._id, balance: 0 },
            { user: users.mike._id, balance: 0 },
            { user: users.david._id, balance: 0 }
        ],
        category: 'Trip'
    });
    await pokaGroup.save();

    // Group 2: Home (Mike, Alex, Sarah)
    const homeGroup = new Group({
        name: 'home',
        description: 'Home expenses',
        creator: users.mike._id,
        members: [
            { user: users.mike._id, balance: 0 },
            { user: users.alex._id, balance: 0 },
            { user: users.sarah._id, balance: 0 }
        ],
        category: 'Home'
    });
    await homeGroup.save();

    // Group 3: Party (All members)
    const partyGroup = new Group({
        name: 'party',
        description: 'Party expenses',
        creator: users.sarah._id,
        members: [
            { user: users.john._id, balance: 0 },
            { user: users.mike._id, balance: 0 },
            { user: users.david._id, balance: 0 },
            { user: users.alex._id, balance: 0 },
            { user: users.sarah._id, balance: 0 }
        ],
        category: 'Other'
    });
    await partyGroup.save();

    console.log('Created groups: poka, home, party');
    return { pokaGroup, homeGroup, partyGroup };
}

async function createTestExpenses(groups, users) {
    console.log('\nCreating test expenses...');

    // 1. Poka Group Expenses
    console.log('\n=== Poka Group Expenses ===');
    
    // 1.1 Equal split expense
    const tripExpense = new Expense({
        description: 'Trip booking',
        amount: 300,
        group: groups.pokaGroup._id,
        paidBy: users.john._id,
        splitBetween: [
            { user: users.john._id, share: 100, shareType: 'equal', isPaid: true },
            { user: users.mike._id, share: 100, shareType: 'equal', isPaid: false },
            { user: users.david._id, share: 100, shareType: 'equal', isPaid: false }
        ],
        category: 'Transport'
    });
    await tripExpense.save();
    await updateGroupBalances(groups.pokaGroup, tripExpense);
    console.log('Added trip expense: $300 (equal split)');

    // Test payment scenario
    console.log('\nTesting payment scenario...');
    console.log('Initial group balances before payment:');
    await printGroupBalances(groups.pokaGroup);

    // Create a payment from Mike to John
    const payment = new Payment({
        group: groups.pokaGroup._id,
        paidBy: users.mike._id,
        paidTo: users.john._id,
        amount: 100,
        description: 'Trip expense settlement'
    });

    // Update group balances for the payment
    const groupBeforePayment = await Group.findById(groups.pokaGroup._id);
    const payerMember = groupBeforePayment.members.find(m => m.user.toString() === users.mike._id.toString());
    const receiverMember = groupBeforePayment.members.find(m => m.user.toString() === users.john._id.toString());

    payerMember.balance += 100; // Mike's balance increases (less negative/more positive)
    receiverMember.balance -= 100; // John's balance decreases (less positive/more negative)

    await groupBeforePayment.save();
    await payment.save();

    console.log('\nGroup balances after Mike pays John $100:');
    await printGroupBalances(groups.pokaGroup);

    // 1.2 Percentage split expense
    const foodExpense = new Expense({
        description: 'Restaurant',
        amount: 150,
        group: groups.pokaGroup._id,
        paidBy: users.mike._id,
        splitBetween: [
            { user: users.john._id, share: 50, shareType: 'percentage', isPaid: false },
            { user: users.mike._id, share: 30, shareType: 'percentage', isPaid: true },
            { user: users.david._id, share: 20, shareType: 'percentage', isPaid: false }
        ],
        category: 'Food'
    });
    await foodExpense.save();
    await updateGroupBalances(groups.pokaGroup, foodExpense);
    console.log('Added food expense: $150 (percentage split 50/30/20)');

    // 2. Home Group Expenses
    console.log('\n=== Home Group Expenses ===');
    
    // 2.1 Exact split expense
    const rentExpense = new Expense({
        description: 'Monthly Rent',
        amount: 1200,
        group: groups.homeGroup._id,
        paidBy: users.alex._id,
        splitBetween: [
            { user: users.mike._id, share: 500, shareType: 'exact', isPaid: false },
            { user: users.alex._id, share: 400, shareType: 'exact', isPaid: true },
            { user: users.sarah._id, share: 300, shareType: 'exact', isPaid: false }
        ],
        category: 'Bills'
    });
    await rentExpense.save();
    await updateGroupBalances(groups.homeGroup, rentExpense);
    console.log('Added rent expense: $1200 (exact split 500/400/300)');

    // 3. Party Group Expenses (All members)
    console.log('\n=== Party Group Expenses ===');
    
    // 3.1 Equal split among all
    const partyExpense = new Expense({
        description: 'New Year Party',
        amount: 500,
        group: groups.partyGroup._id,
        paidBy: users.sarah._id,
        splitBetween: [
            { user: users.john._id, share: 100, shareType: 'equal', isPaid: false },
            { user: users.mike._id, share: 100, shareType: 'equal', isPaid: false },
            { user: users.david._id, share: 100, shareType: 'equal', isPaid: false },
            { user: users.alex._id, share: 100, shareType: 'equal', isPaid: false },
            { user: users.sarah._id, share: 100, shareType: 'equal', isPaid: true }
        ],
        category: 'Entertainment'
    });
    await partyExpense.save();
    await updateGroupBalances(groups.partyGroup, partyExpense);
    console.log('Added party expense: $500 (equal split among 5 people)');

    // 3.2 Percentage split with multiple payers
    const decorationExpense = new Expense({
        description: 'Party Decorations',
        amount: 250,
        group: groups.partyGroup._id,
        paidBy: users.david._id,
        splitBetween: [
            { user: users.john._id, share: 10, shareType: 'percentage', isPaid: false },
            { user: users.mike._id, share: 20, shareType: 'percentage', isPaid: false },
            { user: users.david._id, share: 40, shareType: 'percentage', isPaid: true },
            { user: users.alex._id, share: 15, shareType: 'percentage', isPaid: false },
            { user: users.sarah._id, share: 15, shareType: 'percentage', isPaid: false }
        ],
        category: 'Shopping'
    });
    await decorationExpense.save();
    await updateGroupBalances(groups.partyGroup, decorationExpense);
    console.log('Added decoration expense: $250 (percentage split 10/20/40/15/15)');
}

async function updateGroupBalances(group, expense) {
    const shares = {};
    
    // Calculate actual amounts based on share type
    expense.splitBetween.forEach(split => {
        if (split.shareType === 'equal') {
            shares[split.user.toString()] = split.share;
        } else if (split.shareType === 'percentage') {
            shares[split.user.toString()] = (expense.amount * split.share) / 100;
        } else if (split.shareType === 'exact') {
            shares[split.user.toString()] = split.share;
        }
    });

    // Update balances
    group.members.forEach(member => {
        const userId = member.user.toString();
        if (userId === expense.paidBy.toString()) {
            // Payer gets back what others owe
            const userShare = shares[userId] || 0;
            member.balance += (expense.amount - userShare);
        } else {
            // Others owe their share
            const userShare = shares[userId] || 0;
            member.balance -= userShare;
        }
    });

    group.expenses.push(expense._id);
    group.totalExpenses += expense.amount;
    await group.save();
}

async function printGroupBalances(group) {
    const populatedGroup = await Group.findById(group._id).populate('members.user');
    console.log('Group:', populatedGroup.name);
    populatedGroup.members.forEach(member => {
        console.log(`${member.user.name}: ${member.balance}`);
    });
}

async function verifyBalances(groups) {
    console.log('\n=== Final Balance Verification ===');
    
    // Verify Poka group balances
    console.log('\nPoka Group Final Balances:');
    const pokaGroup = await Group.findById(groups.pokaGroup._id).populate('members.user');
    
    pokaGroup.members.forEach(member => {
        console.log(`${member.user.name}: ${member.balance}`);
    });

    // Verify the sum of all balances is zero
    const totalBalance = pokaGroup.members.reduce((sum, member) => sum + member.balance, 0);
    console.log(`\nTotal balance sum (should be 0): ${totalBalance.toFixed(2)}`);
    
    if (Math.abs(totalBalance) > 0.01) {
        throw new Error('Balance verification failed: Sum of balances is not zero');
    }
    
    console.log('Balance verification passed: Sum of balances is zero');
}

createTestScenarios();
