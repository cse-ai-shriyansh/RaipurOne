# Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1️⃣ Prerequisites Check
- [ ] Node.js installed (`node --version`)
- [ ] MongoDB installed and running (`mongosh` works)
- [ ] Telegram bot token (from [@BotFather](https://t.me/botfather))

### 2️⃣ Backend Setup
```powershell
cd "c:\Users\Lenovo\Desktop\Bot\bot-backend"
npm install
```

Create `.env` file:
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
MONGODB_URI=mongodb://localhost:27017/telegram-bot-db
PORT=3001
NODE_ENV=development
API_URL=http://localhost:3001
```

### 3️⃣ Frontend Setup
```powershell
cd "c:\Users\Lenovo\Desktop\Bot\dashboard-frontend"
npm install
```

Create `.env` file:
```
REACT_APP_API_URL=http://localhost:3001/api
```

### 4️⃣ Start Services

**PowerShell Terminal 1:**
```powershell
cd "c:\Users\Lenovo\Desktop\Bot\bot-backend"
npm start
```

**PowerShell Terminal 2:**
```powershell
cd "c:\Users\Lenovo\Desktop\Bot\dashboard-frontend"
npm start
```

### 5️⃣ Test It
- Open Telegram, find your bot, send `/start`
- Open `http://localhost:3000` in browser
- Create a ticket with `/ticket My issue here`
- View it in the dashboard!

---

## 📱 Telegram Commands Reference

| Command | Description |
|---------|-------------|
| `/start` | Welcome & help |
| `/help` | Show all commands |
| `/ticket <query>` | Create new ticket |
| `/mytickets` | View your tickets |
| `/status` | Check ticket status |

---

## 🔑 Example Workflow

1. **User sends**: `/ticket I can't login to my account`
2. **Bot replies**: Creates ticket `TKT-ABC12345`
3. **Dashboard shows**: New ticket appears in real-time
4. **Admin can**: Update status, add responses
5. **User sees**: Updates when checking `/status`

---

## 🛠️ If Something Goes Wrong

| Issue | Solution |
|-------|----------|
| Bot not responding | Check TELEGRAM_BOT_TOKEN in .env |
| Can't connect to DB | Ensure MongoDB is running (`mongosh`) |
| Dashboard blank | Check API is running on port 3001 |
| Port 3000/3001 in use | Change PORT in .env or close conflicting apps |

---

## 📊 Dashboard URLs

- **Dashboard**: http://localhost:3000
- **API Base**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

---

## 🎯 Next Steps

1. ✅ Deploy backend to cloud (Heroku, Railway, etc.)
2. ✅ Deploy frontend to Vercel or Netlify
3. ✅ Use MongoDB Atlas for cloud database
4. ✅ Add authentication to dashboard
5. ✅ Customize categories and ticket types
6. ✅ Add email notifications

---

**That's it! You have a fully working Telegram bot with dashboard! 🎉**
