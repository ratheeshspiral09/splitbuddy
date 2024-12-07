const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    splitBetween: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        share: {
            type: Number,
            required: true
        },
        shareType: {
            type: String,
            enum: ['equal', 'percentage', 'exact'],
            default: 'equal'
        },
        isPaid: {
            type: Boolean,
            default: false
        }
    }],
    category: {
        type: String,
        enum: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Other'],
        default: 'Other'
    },
    date: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String
    },
    attachments: [{
        type: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
