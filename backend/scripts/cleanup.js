const mongoose = require('mongoose');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Payment = require('../models/Payment');

async function cleanup() {
    try {
        await mongoose.connect('mongodb://admin:password123@localhost:27017/splitwise?authSource=admin');
        
        // Delete all test data
        await Activity.deleteMany({});
        await Payment.deleteMany({});
        await Group.deleteMany({});
        await Expense.deleteMany({});
        //await User.deleteMany({});
        
        console.log('Successfully deleted all data');
        
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

cleanup();
