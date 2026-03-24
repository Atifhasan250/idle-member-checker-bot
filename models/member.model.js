const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    groupId: { type: String, required: true },
    userId: { type: String, required: true },
    firstName: { type: String, required: true },
    lastMessageAt: { type: Date, default: Date.now }
});

memberSchema.index({ groupId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Member', memberSchema);