const TelegramBot = require('node-telegram-bot-api');
const {
    handleMessageTrack, handleMemberLeave, handleSyncMembers,
    handleSetMsg, handleStopMsg, handleStartMsg,
    handleCheckStatus, handleSetInterval, handleSchedule
} = require('../controllers/tracker.controller');

const initBot = () => {
    const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

    bot.on('message', (msg) => {
        handleMessageTrack(msg);
        handleMemberLeave(msg);
    });

    bot.onText(/\/syncmembers/, (msg) => handleSyncMembers(bot, msg));
    bot.onText(/\/setmsg (.+)/, (msg, match) => handleSetMsg(bot, msg, match));
    bot.onText(/\/stopmsg/, (msg) => handleStopMsg(bot, msg));
    bot.onText(/\/startmsg/, (msg) => handleStartMsg(bot, msg));

    // --- NEW COMMANDS ---
    bot.onText(/\/checkstatus/, (msg) => handleCheckStatus(bot, msg));
    bot.onText(/\/setinterval (.+)/, (msg, match) => handleSetInterval(bot, msg, match));
    bot.onText(/\/schedule (.+)/, (msg, match) => handleSchedule(bot, msg, match));

    return bot;
};

module.exports = { initBot };