![alt text](image.png)# 🤖 Telegram Bot Manual

## 🗣️ How Users "Talk" to the Bot
Currently, the bot is designed to be **Proactive**, not **Reactive**.
-   **It Talks First**: When a user joins, the bot sends the Welcome Message.
-   **Buttons**: Users interact by clicking the buttons ("How to Download", etc.).
-   **Chatting**: If a user types "Hello", the bot currently **ignores it**. This is intentional to keep the group chat clean.

## ⚙️ How You (Admin) Control It
Right now, your bot is **Code-Configured**. This means "Settings" are defined in your code/deployment, not in the chat.

### 1. Changing the Daily Schedule
-   **Where**: `vercel.json`
-   **How**: Change `"schedule": "0 10 * * *"` (10 AM) to any other time.
-   **Apply**: Triggers on next deployment.

### 2. Changing the Content (Welcome Message)
-   **Where**: `app/api/telegram/route.js`
-   **How**: Edit the `welcomeText` string in the code.

### 3. Triggering Updates Manually
-   **Daily Post**: Visit `https://your-site.vercel.app/api/cron/daily` in your browser.
-   **Welcome**: Happens automatically when someone joins.

---

## 🚀 Upgrade: Adding "Chat Commands" (Future)
If you want to control the bot directly from Telegram (e.g., typing `/stats`), we need to add **Command Logic**.

**What we can build next:**
-   `/force_post`: Admin command to post the daily recommendation *now*.
-   `/stats`: Bot replies with "150 Users on website right now".
-   `/ban_user`: Basic modification commands.

**Current Status**: 
The bot is running in **"Automated Mode"** (Welcome + Daily). It does not listen to text commands yet to save server resources and complexity.
