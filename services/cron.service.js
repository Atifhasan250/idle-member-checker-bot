const cron = require('node-cron');
const Member = require('../models/member.model');
const GroupConfig = require('../models/groupConfig.model');

const initCron = (bot) => {
    // Use '* * * * *' to test every minute, or '0 22 * * *' for production
    cron.schedule('* * * * *', async () => {
        try {
            const groups = await Member.distinct('groupId');
            // Use 60 * 1000 for 1-minute test, or 24 * 60 * 60 * 1000 for production
            const timeLimit = new Date(Date.now() - 60 * 1000);

            for (const groupId of groups) {

                // --- NEW: Check if messages are stopped for this group ---
                const config = await GroupConfig.findOne({ groupId: groupId });
                if (config && config.isActive === false) {
                    continue; // Skip to the next group, do not send message
                }

                let adminIds = [];
                try {
                    const admins = await bot.getChatAdministrators(groupId);
                    adminIds = admins.map(admin => admin.user.id.toString());
                } catch (err) { }

                const inactive = await Member.find({
                    groupId: groupId,
                    lastMessageAt: { $lt: timeLimit },
                    userId: { $nin: adminIds }
                });

                if (inactive.length > 0) {
                    let liveGroupName = "Unknown Group";
                    try {
                        const chatInfo = await bot.getChat(groupId);
                        if (chatInfo.title) liveGroupName = chatInfo.title;
                    } catch (err) { }

                    const header = config && config.customHeader ? config.customHeader : "🔴 গত ২৪ ঘন্টায় যারা সাবমিট করেননি:";

                    const timeString = new Date().toLocaleString("en-GB", {
                        timeZone: "Asia/Dhaka",
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit", hour12: true
                    });

                    // --- UPDATED FORMATTING ---
                    let text = `👥 গ্রুপ: <b>${liveGroupName}</b>\n`; // Bolded group name
                    text += `⏰ চেক করার সময়: ${timeString}\n`;
                    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
                    text += `<b>${header}</b>\n\n`; // Added \n\n for extra spacing
                    text += `❌ মোট অনুপস্থিত: ${inactive.length} জন\n`;
                    text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

                    inactive.forEach(u => {
                        text += `• <a href="tg://user?id=${u.userId}">${u.firstName}</a>\n`;
                    });

                    await bot.sendMessage(groupId, text, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                }
            }
        } catch (err) {
            console.error('Cron error:', err);
        }
    }, { timezone: "Asia/Dhaka" });
};

module.exports = { initCron };