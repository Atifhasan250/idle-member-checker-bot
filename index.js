require('dotenv').config();
const connectDB = require('./db/db');
const app = require('./app');
const { initBot } = require('./services/bot.service');
const { initCron } = require('./services/cron.service');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start Express (Keep-alive for cloud hosts like Render)
    app.listen(PORT, () => {
        console.log(`🌐 Express server listening on port ${PORT}`);
    });

    // 3. Initialize Bot
    const bot = initBot();
    console.log('🤖 Tracker Bot is up and running!');

    // 4. Start Cron Jobs
    initCron(bot);
};

startServer();