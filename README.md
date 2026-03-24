# 🕵️‍♂️ Telegram Group Inactivity Tracker

A production-grade Telegram bot built with Node.js that silently monitors group activity and generates automated daily reports of inactive members. Features MongoDB persistence, HTML-formatted mentions, and a built-in Express server for cloud deployment.

---

## ✨ Features

- **Silent Tracking** — Monitors all group messages in the background without replying or interrupting the conversation.
- **Automated Daily Reports** — Uses `node-cron` to automatically check the database and send an inactivity list every day at a specified time (e.g., 10:00 PM).
- **Smart Mentions** — Formats the inactivity report with direct Telegram HTML tags so inactive users receive a push notification.
- **Auto-Cleanup** — Listens for `left_chat_member` events and automatically purges departed users from the database.
- **Admin Verification** — Includes a `/syncmembers` command restricted strictly to group admins to verify tracker status.
- **Cloud-Ready** — Deployable to services like Render with a built-in Express keep-alive server.

---

## 🏗️ Project Structure

```text
├── index.js                           # Entry point — boots DB, server, bot & cron
├── app.js                             # Express keep-alive server
├── db/
│   └── db.js                          # MongoDB connection
├── models/
│   └── member.model.js                # Mongoose schema for user activity tracking
├── controllers/
│   └── tracker.controller.js          # Core logic for tracking, cleanup, and sync
└── services/
    ├── bot.service.js                 # Telegram bot initialization and listeners
    └── cron.service.js                # Scheduled inactivity report generator
```

---

## 🛠️ Tech Stack

| Purpose | Package |
|---|---|
| Bot API | `node-telegram-bot-api` |
| Database | `mongoose` (MongoDB Atlas) |
| Scheduling | `node-cron` |
| Server | `express` |
| Config | `dotenv` |

---

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone [https://github.com/atifhasan250/idle-member-checker-bot.git](https://github.com/atifhasan250/idle-member-checker-bot.git)
cd idle-member-checker-bot
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create your `.env` file
```env
BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
MONGODB_URI=YOUR_MONGODB_ATLAS_URI
PORT=3000
```

### 4. Run the Bot
```bash
npm run dev     # if using nodemon
npm start       # production
```

---

## 🤖 Bot Commands

To prevent clutter, this bot operates mostly in the background. It only has one manual command, restricted to group administrators.

| Command | Description | Access |
|---|---|---|
| `/syncmembers` | Displays the total number of members currently registered in the tracking database. | Group Admins Only |

> **Note on Tracking:** Telegram bots cannot fetch a full member list upon joining. Users are only added to the database *after* they send their first message while the bot is present in the group.

---

## ☁️ Deployment Notes (Render)

1. Push your code to a GitHub repository.
2. Create a new **Web Service** on Render.
3. Set **Start Command** to `node index.js`.
4. Add `BOT_TOKEN` and `MONGODB_URI` under the **Environment** tab.
5. Deploy. The included Express server will automatically bind to Render's port requirement.# idle-member-checker-bot
# idle-member-checker-bot
