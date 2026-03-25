const cron = require('node-cron');
const GroupConfig = require('../models/groupConfig.model');
const { sendGroupReport } = require('../controllers/tracker.controller');

const initCron = (bot) => {
    cron.schedule('* * * * *', async () => {
        try {
            // Get exact current time in Dhaka in HH:MM format (24hr)
            const dhakaTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
            const currentHHMM = `${String(dhakaTime.getHours()).padStart(2, '0')}:${String(dhakaTime.getMinutes()).padStart(2, '0')}`;

            // Find ONLY the groups scheduled for this exact minute that are active
            const groupsToReport = await GroupConfig.find({
                isActive: true,
                scheduleTime: currentHHMM
            });

            for (const group of groupsToReport) {
                await sendGroupReport(bot, group.groupId);
            }

        } catch (err) {
            console.error('Cron error:', err);
        }
    }, { timezone: "Asia/Dhaka" });
};

module.exports = { initCron };