const mongoose = require('mongoose');

const groupConfigSchema = new mongoose.Schema({
    groupId: { type: String, required: true, unique: true },
    groupName: { type: String, required: true },
    customHeader: {
        type: String,
        default: "🔴 গত ২৪ ঘন্টায় যারা সাবমিট করেননি:"
    },
    isActive: { type: Boolean, default: true },
    scheduleTime: { type: String, default: "22:00" },
    intervalMs: { type: Number, default: 86400000 }
});

module.exports = mongoose.model('GroupConfig', groupConfigSchema);