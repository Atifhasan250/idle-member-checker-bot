const Member = require('../models/member.model');
const GroupConfig = require('../models/groupConfig.model');

async function isAdmin(bot, chatId, userId) {
    try {
        const admins = await bot.getChatAdministrators(chatId);
        return admins.some(admin => admin.user.id === userId);
    } catch (error) {
        return false;
    }
}

const handleMessageTrack = async (msg) => {
    if (msg.sender_chat || msg.from.is_bot) return;

    if ((msg.chat.type === 'group' || msg.chat.type === 'supergroup') && !msg.text?.startsWith('/')) {
        try {
            // 1. Update the member's last message time and dynamically update their name
            await Member.findOneAndUpdate(
                { groupId: msg.chat.id.toString(), userId: msg.from.id.toString() },
                { firstName: msg.from.first_name, lastMessageAt: new Date() },
                { upsert: true, new: true }
            );

            // 2. Silently update the group's name so we have it for the report
            await GroupConfig.findOneAndUpdate(
                { groupId: msg.chat.id.toString() },
                { groupName: msg.chat.title },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error('Error tracking message:', error.message);
        }
    }
};

const handleMemberLeave = async (msg) => {
    if (msg.left_chat_member) {
        try {
            await Member.deleteOne({ groupId: msg.chat.id.toString(), userId: msg.left_chat_member.id.toString() });
        } catch (error) { }
    }
};

const handleSyncMembers = async (bot, msg) => {
    const chatId = msg.chat.id;
    if (msg.chat.type === 'private') return bot.sendMessage(chatId, "This command only works in groups.");
    if (!(await isAdmin(bot, chatId, msg.from.id))) return bot.sendMessage(chatId, "⛔ Only group admins can use this command.");

    const count = await Member.countDocuments({ groupId: chatId.toString() });
    bot.sendMessage(chatId, `📊 Tracker Status\n\nTracked ${count} members.`);
};

// --- NEW: Custom Message Command ---
const handleSetMsg = async (bot, msg, match) => {
    const chatId = msg.chat.id;
    if (msg.chat.type === 'private') return bot.sendMessage(chatId, "This command only works in groups.");
    if (!(await isAdmin(bot, chatId, msg.from.id))) return bot.sendMessage(chatId, "⛔ Only group admins can use this command.");

    // match[1] captures everything the user types after "/setmsg "
    const customText = match[1];

    if (!customText) {
        return bot.sendMessage(chatId, "⚠️ Usage: `/setmsg Your custom message here`\n\nThis will change the top header of the daily report.", { parse_mode: 'Markdown' });
    }

    try {
        await GroupConfig.findOneAndUpdate(
            { groupId: chatId.toString() },
            { customHeader: customText, groupName: msg.chat.title },
            { upsert: true }
        );
        bot.sendMessage(chatId, "✅ Custom report header has been updated!");
    } catch (error) {
        bot.sendMessage(chatId, "❌ Error saving custom message.");
    }
};

// --- NEW: Stop Messages Command ---
const handleStopMsg = async (bot, msg) => {
    const chatId = msg.chat.id;
    if (msg.chat.type === 'private') return bot.sendMessage(chatId, "This command only works in groups.");
    if (!(await isAdmin(bot, chatId, msg.from.id))) return bot.sendMessage(chatId, "⛔ Only group admins can use this command.");

    try {
        const config = await GroupConfig.findOne({ groupId: chatId.toString() });

        // If config exists and is already false
        if (config && config.isActive === false) {
            return bot.sendMessage(chatId, "⚠️ Messages are already stopped. Use /startmsg to resume.");
        }

        await GroupConfig.findOneAndUpdate(
            { groupId: chatId.toString() },
            { isActive: false, groupName: msg.chat.title },
            { upsert: true }
        );
        bot.sendMessage(chatId, "🛑 Daily inactivity messages have been STOPPED for this group.");
    } catch (error) {
        bot.sendMessage(chatId, "❌ Error stopping messages.");
    }
};

// --- NEW: Start Messages Command ---
const handleStartMsg = async (bot, msg) => {
    const chatId = msg.chat.id;
    if (msg.chat.type === 'private') return bot.sendMessage(chatId, "This command only works in groups.");
    if (!(await isAdmin(bot, chatId, msg.from.id))) return bot.sendMessage(chatId, "⛔ Only group admins can use this command.");

    try {
        const config = await GroupConfig.findOne({ groupId: chatId.toString() });

        // If config doesn't exist (default is active) OR it's already true
        if (!config || config.isActive !== false) {
            return bot.sendMessage(chatId, "⚠️ Messages are already active. Use /stopmsg to pause them.");
        }

        await GroupConfig.findOneAndUpdate(
            { groupId: chatId.toString() },
            { isActive: true, groupName: msg.chat.title },
            { upsert: true }
        );
        bot.sendMessage(chatId, "✅ Daily inactivity messages have been RESUMED for this group.");
    } catch (error) {
        bot.sendMessage(chatId, "❌ Error starting messages.");
    }
};


module.exports = { handleMessageTrack, handleMemberLeave, handleSyncMembers, handleSetMsg, handleStopMsg, handleStartMsg };