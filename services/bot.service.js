const TelegramBot = require('node-telegram-bot-api');
// Import the new handlers
const { handleMessageTrack, handleMemberLeave, handleSyncMembers, handleSetMsg, handleStopMsg, handleStartMsg } = require('../controllers/tracker.controller');

const initBot = () => {
    const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

    bot.on('message', (msg) => {
        handleMessageTrack(msg);
        handleMemberLeave(msg);
    });

    bot.onText(/\/syncmembers/, (msg) => handleSyncMembers(bot, msg));
    bot.onText(/\/setmsg (.+)/, (msg, match) => handleSetMsg(bot, msg, match));

    // NEW: Register start and stop
    bot.onText(/\/stopmsg/, (msg) => handleStopMsg(bot, msg));
    bot.onText(/\/startmsg/, (msg) => handleStartMsg(bot, msg));

    return bot;
};

module.exports = { initBot };