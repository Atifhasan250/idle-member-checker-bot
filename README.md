# ⏳ Idle Member Checker Bot

A production-grade, multi-tenant Telegram bot built with Node.js that monitors group activity and generates automated reports of inactive members. Features dynamic per-group scheduling, customizable inactivity thresholds, MongoDB persistence, and strict admin-only security protocols.

---

## ✨ Features

- **Multi-Group Isolation** — Built to be added to multiple groups simultaneously. All data, schedules, and custom settings are strictly isolated per group (`groupId`).
- **Silent Background Tracking** — Monitors all group messages seamlessly without replying or interrupting the flow of conversation.
- **Dynamic Scheduling (`/schedule`)** — Admins can set a specific time of day (e.g., `10:00 PM`) for the automated report to drop in their specific group.
- **Custom Inactivity Thresholds (`/setinterval`)** — Admins dictate what qualifies as "inactive" for their group (e.g., 24 hours, 12 hours, or even 30 minutes).
- **Customizable Reports (`/setmsg`)** — The top header of the inactivity report can be customized per group.
- **Smart Mentions** — Formats the inactivity report with direct Telegram HTML tags so inactive users receive a push notification.
- **Auto-Cleanup** — Listens for `left_chat_member` events and automatically purges departed users from the database.
- **Cloud-Ready** — Uses a single, lightweight `node-cron` master loop to manage all schedules efficiently, making it perfect for free-tier cloud deployment (Render, Railway, etc.).

---

## 🏗️ Project Structure

```text
├── index.js                           # Entry point — boots DB, server, bot & cron
├── app.js                             # Express keep-alive server (for cloud deployment)
├── db/
│   └── db.js                          # MongoDB connection setup
├── models/
│   ├── member.model.js                # Schema for user activity tracking
│   └── groupConfig.model.js           # Schema for per-group schedules and settings
├── controllers/
│   └── tracker.controller.js          # Core logic, DB queries, and command handling
└── services/
    ├── bot.service.js                 # Telegram bot initialization and event routing
    └── cron.service.js                # Master cron loop for automated scheduling
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
git clone [https://github.com/Atifhasan250/idle-member-checker-bot.git](https://github.com/Atifhasan250/idle-member-checker-bot.git)
cd idle-member-checker-bot
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add the following:
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

To prevent group spam and ensure security, **every single command is strictly restricted to Group Administrators.** The bot will reject commands from standard users.

| Command | Example | Description |
|---|---|---|
| `/checkstatus` | `/checkstatus` | Instantly generates and sends the inactivity report based on the current interval. |
| `/schedule` | `/schedule 10:00pm` | Sets the exact daily time for the automated report to drop in the group. |
| `/setinterval` | `/setinterval 24h` | Defines the inactivity threshold (`m` for minutes, `h` for hours, `d` for days). |
| `/setmsg` | `/setmsg ⚠️ Wake up!` | Changes the top text header of the automated report. |
| `/stopmsg` | `/stopmsg` | Pauses automated daily reports for the group. |
| `/startmsg` | `/startmsg` | Resumes automated daily reports for the group. |
| `/syncmembers` | `/syncmembers` | Shows the total number of users currently tracked in the database for the group. |

> **Note on Tracking:** Telegram bots cannot fetch a full member list upon joining. Users are only added to the database *after* they send their first message while the bot is present in the group.

---

## ☁️ Deployment Notes (Render / Railway)

This bot includes an Express web server (`app.js`) specifically designed to bind to the port assigned by cloud providers, preventing the deployment from crashing due to port timeout errors. 

1. Connect your GitHub repository to your host.
2. Set the **Start Command** to `node index.js`.
3. Add `BOT_TOKEN` and `MONGODB_URI` to your host's Environment Variables panel.
4. Deploy.