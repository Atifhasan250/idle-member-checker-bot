const Member = require('../models/member.model');
const GroupConfig = require('../models/groupConfig.model');

// --- SECURITY: Strict Admin Check ---
async function isAdmin(bot, chatId, userId) {
    try {
        const admins = await bot.getChatAdministrators(chatId);
        return admins.some(admin => admin.user.id === userId);
    } catch (error) {
        return false; // Fails securely if the bot lacks permissions
    }
}

// --- CORE: Generate & Send Report ---
const sendGroupReport = async (bot, groupId) => {
    try {
        const config = await GroupConfig.findOne({ groupId: groupId.toString() });

        const intervalMs = config && config.intervalMs ? config.intervalMs : 86400000;
        const header = config && config.customHeader ? config.customHeader : "🔴 গত ২৪ ঘন্টায় যারা সাবমিট করেননি:";
        const timeLimit = new Date(Date.now() - intervalMs);

        let adminIds = [];
        try {
            const admins = await bot.getChatAdministrators(groupId);
            adminIds = admins.map(admin => admin.user.id.toString());
        } catch (err) { }

        // Find users strictly isolated to this specific group
        const inactive = await Member.find({
            groupId: groupId.toString(),
            lastMessageAt: { $lt: timeLimit },
            userId: { $nin: adminIds }
        });

        if (inactive.length > 0) {
            let liveGroupName = "Unknown Group";
            try {
                const chatInfo = await bot.getChat(groupId);
                if (chatInfo.title) liveGroupName = chatInfo.title;
            } catch (err) { }

            const timeString = new Date().toLocaleString("en-GB", {
                timeZone: "Asia/Dhaka",
                day: "2-digit", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit", hour12: true
            });

            let text = `👥 গ্রুপ: <b>${liveGroupName}</b>\n`;
            text += `⏰ চেক করার সময়: ${timeString}\n`;
            text += `━━━━━━━━━━━━━━\n`;
            text += `<b>${header}</b>\n\n`;
            text += `❌ মোট অনুপস্থিত: ${inactive.length} জন\n`;
            text += `━━━━━━━━━━━━━━\n\n`;

            inactive.forEach(u => {
                text += `• <a href="tg://user?id=${u.userId}">${u.firstName}</a>\n`;
            });

            await bot.sendMessage(groupId, text, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error generating report for ${groupId}:`, error.message);
        return false;
    }
};

// --- SILENT TRACKER ---
const handleMessageTrack = async (msg) => {
    if (msg.sender_chat || msg.from.is_bot) return;
    if ((msg.chat.type === 'group' || msg.chat.type === 'supergroup') && !msg.text?.startsWith('/')) {
        try {
            await Member.findOneAndUpdate(
                { groupId: msg.chat.id.toString(), userId: msg.from.id.toString() },
                { firstName: msg.from.first_name, lastMessageAt: new Date() },
                { upsert: true, returnDocument: 'after' }
            );
            await GroupConfig.findOneAndUpdate(
                { groupId: msg.chat.id.toString() },
                { groupName: msg.chat.title },
                { upsert: true, setDefaultsOnInsert: true, returnDocument: 'after' }
            );
        } catch (error) { }
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

const handleCheckStatus = async (bot, msg) => {
    const chatId = msg.chat.id;
    if (msg.chat.type === 'private') return bot.sendMessage(chatId, "This command only works in groups.");
    if (!(await isAdmin(bot, chatId, msg.from.id))) return bot.sendMessage(chatId, "⛔ Only group admins can use this command.");

    bot.sendMessage(chatId, "⏳ Generating report...");
    const reportSent = await sendGroupReport(bot, chatId);
    if (!reportSent) {
        bot.sendMessage(chatId, "✅ Everyone has messaged within the required timeframe. No inactive members!");
    }
};

const handleSetInterval = async (bot, msg, match) => {
    const chatId = msg.chat.id;
    if (msg.chat.type === 'private') return bot.sendMessage(chatId, "This command only works in groups.");
    if (!(await isAdmin(bot, chatId, msg.from.id))) return bot.sendMessage(chatId, "⛔ Only group admins can use this command.");

    const input = match[1]?.toLowerCase();
    if (!input) return bot.sendMessage(chatId, "⚠️ Usage: `/setinterval 1d` or `12h` or `30m`", { parse_mode: 'Markdown' });

    const timeMatch = input.match(/^(\d+)(d|h|m)$/);
    if (!timeMatch) return bot.sendMessage(chatId, "⚠️ Invalid format. Use a number followed by d, h, or m.");

    const value = parseInt(timeMatch[1]);
    const unit = timeMatch[2];
    let intervalMs = 0;

    if (unit === 'd') intervalMs = value * 24 * 60 * 60 * 1000;
    if (unit === 'h') intervalMs = value * 60 * 60 * 1000;
    if (unit === 'm') intervalMs = value * 60 * 1000;

    await GroupConfig.findOneAndUpdate(
        { groupId: chatId.toString() },
        { intervalMs: intervalMs, groupName: msg.chat.title },
        { upsert: true }
    );
    bot.sendMessage(chatId, `✅ Inactivity threshold updated to **${input}** for this group.`, { parse_mode: 'Markdown' });
};

const handleSchedule = async (bot, msg, match) => {
    const chatId = msg.chat.id;
    if (msg.chat.type === 'private') return bot.sendMessage(chatId, "This command only works in groups.");
    if (!(await isAdmin(bot, chatId, msg.from.id))) return bot.sendMessage(chatId, "⛔ Only group admins can use this command.");

    const input = match[1];
    if (!input) return bot.sendMessage(chatId, "⚠️ Usage: `/schedule 10:00pm` or `/schedule 22:00`", { parse_mode: 'Markdown' });

    const timeMatch = input.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
    if (!timeMatch) return bot.sendMessage(chatId, "⚠️ Invalid time format.");

    let hours = parseInt(timeMatch[1]);
    let minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3]?.toLowerCase();

    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;

    if (hours > 23 || minutes > 59) return bot.sendMessage(chatId, "⚠️ Invalid time provided.");

    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    await GroupConfig.findOneAndUpdate(
        { groupId: chatId.toString() },
        { scheduleTime: formattedTime, groupName: msg.chat.title },
        { upsert: true }
    );

    const niceTime = new Date(`2000-01-01T${formattedTime}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    bot.sendMessage(chatId, `✅ Daily report schedule updated to **${niceTime}** for this group.`, { parse_mode: 'Markdown' });
};

const handleSetMsg = async (bot, msg, match) => {
    const chatId = msg.chat.id;
    if (msg.chat.type === 'private') return bot.sendMessage(chatId, "This command only works in groups.");
    if (!(await isAdmin(bot, chatId, msg.from.id))) return bot.sendMessage(chatId, "⛔ Only group admins can use this command.");

    const customText = match[1];
    if (!customText) return bot.sendMessage(chatId, "⚠️ Usage: `/setmsg Your message`", { parse_mode: 'Markdown' });

    await GroupConfig.findOneAndUpdate(
        { groupId: chatId.toString() },
        { customHeader: customText, groupName: msg.chat.title },
        { upsert: true }
    );
    bot.sendMessage(chatId, "✅ Custom report header updated!");
};

const handleStopMsg = async (bot, msg) => {
    const chatId = msg.chat.id;
    if (msg.chat.type === 'private') return bot.sendMessage(chatId, "This command only works in groups.");
    if (!(await isAdmin(bot, chatId, msg.from.id))) return bot.sendMessage(chatId, "⛔ Only group admins can use this command.");

    const config = await GroupConfig.findOne({ groupId: chatId.toString() });
    if (config && config.isActive === false) return bot.sendMessage(chatId, "⚠️ Messages are already stopped.");

    await GroupConfig.findOneAndUpdate(
        { groupId: chatId.toString() },
        { isActive: false, groupName: msg.chat.title },
        { upsert: true }
    );
    bot.sendMessage(chatId, "🛑 Daily messages STOPPED.");
};

const handleStartMsg = async (bot, msg) => {
    const chatId = msg.chat.id;
    if (msg.chat.type === 'private') return bot.sendMessage(chatId, "This command only works in groups.");
    if (!(await isAdmin(bot, chatId, msg.from.id))) return bot.sendMessage(chatId, "⛔ Only group admins can use this command.");

    const config = await GroupConfig.findOne({ groupId: chatId.toString() });
    if (!config || config.isActive !== false) return bot.sendMessage(chatId, "⚠️ Messages are already active.");

    await GroupConfig.findOneAndUpdate(
        { groupId: chatId.toString() },
        { isActive: true, groupName: msg.chat.title },
        { upsert: true }
    );
    bot.sendMessage(chatId, "✅ Daily messages RESUMED.");
};

module.exports = {
    handleMessageTrack, handleMemberLeave, handleSyncMembers,
    handleCheckStatus, handleSetInterval, handleSchedule,
    handleSetMsg, handleStopMsg, handleStartMsg,
    sendGroupReport
};