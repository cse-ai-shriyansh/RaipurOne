# 🚀 TELEGRAM BOT + DASHBOARD - COMPLETE SETUP

## 📦 What You Have

✅ **Complete Telegram Bot**
- Responds to /start, /help, /ticket, /mytickets, /status
- Creates unique ticket IDs (TKT-XXXXX)
- Stores all data in MongoDB

✅ **REST API Backend**
- Express.js server running on port 3001
- Full CRUD operations for tickets
- Dashboard statistics endpoint
- Filter & search capabilities

✅ **React Dashboard**
- Beautiful responsive UI
- Real-time ticket management
- Statistics and analytics
- Filter tickets by status, category, priority

✅ **MongoDB Integration**
- Persistent data storage
- User tracking
- Full ticket history with responses

---

## 🎯 QUICK SETUP (Copy & Paste)

### Prerequisites
```powershell
# 1. Check Node.js (should show version)
node --version

# 2. Check MongoDB (should connect)
mongosh
# Exit with: exit()
```

If either fails, install them first!

---

## 🏃 RUN IN 3 MINUTES

### Step 1: Get Bot Token
1. Open Telegram → Search @BotFather
2. Send `/newbot`
3. Name it, username it
4. **Copy the API token**

### Step 2: Setup Backend

**PowerShell:**
```powershell
cd "c:\Users\Lenovo\Desktop\Bot\bot-backend"
npm install
```

**Create .env file** (with your token):
```
TELEGRAM_BOT_TOKEN=YOUR_TOKEN_HERE
MONGODB_URI=mongodb://localhost:27017/telegram-bot-db
PORT=3001
NODE_ENV=development
API_URL=http://localhost:3001
```

### Step 3: Setup Frontend

**PowerShell:**
```powershell
cd "c:\Users\Lenovo\Desktop\Bot\dashboard-frontend"
npm install
```

**Create .env file:**
```
REACT_APP_API_URL=http://localhost:3001/api
```

### Step 4: Start Everything

**Open 2 PowerShell Windows:**

**Window 1 - Backend:**
```powershell
cd "c:\Users\Lenovo\Desktop\Bot\bot-backend"
npm start
```
Wait for: `🤖 Telegram Bot started successfully`

**Window 2 - Frontend:**
```powershell
cd "c:\Users\Lenovo\Desktop\Bot\dashboard-frontend"
npm start
```
Wait for: Opens http://localhost:3000

### Step 5: TEST

**In Telegram (find your bot):**
```
/start
/ticket I need help with my account
/mytickets
```

**In Dashboard (http://localhost:3000):**
- See your ticket appear
- Click it to view details
- Update status
- Add responses

---

## 📁 File Structure

```
Bot/
├── bot-backend/                 (Node.js Telegram Bot)
│   ├── src/
│   │   ├── index.js            (Main entry)
│   │   ├── botHandlers.js      (Bot commands)
│   │   ├── models/             (Database models)
│   │   ├── controllers/        (Business logic)
│   │   ├── routes/             (API endpoints)
│   │   └── config/             (Database config)
│   ├── package.json
│   └── .env                    (Your secrets here)
│
├── dashboard-frontend/          (React Dashboard)
│   ├── src/
│   │   ├── App.js              (Main component)
│   │   ├── api.js              (API calls)
│   │   ├── pages/              (Pages)
│   │   └── components/         (UI components)
│   ├── package.json
│   └── .env                    (API URL)
│
├── README.md                    (Full documentation)
├── QUICKSTART.md               (This file)
└── ARCHITECTURE.md             (Technical details)
```

---

## 🎮 BOT COMMANDS

| Command | What It Does | Example |
|---------|-------------|---------|
| `/start` | Welcome message | Send it first! |
| `/help` | Show all commands | See what's available |
| `/ticket <query>` | Create new ticket | `/ticket I can't login` |
| `/mytickets` | Show your tickets | See all your tickets |
| `/status` | Quick status summary | Check open/resolved count |

---

## 📊 DASHBOARD FEATURES

### Dashboard Tab
- **5 Quick Stats**: Total, Open, In Progress, Resolved, Users
- **Recent Tickets**: Last 5 tickets preview
- **Real-time Updates**: Refreshes automatically

### All Tickets Tab
- **Filters**: Status, Category, Priority
- **Click Ticket**: View full details
- **Search**: All filters work together

### Ticket Details
- **View Everything**: All ticket info
- **Responses**: See conversation history
- **Update Status**: Change in real-time
- **Add Response**: Reply to user

### Statistics Tab
- **By Category**: Pie/bar charts
- **By Priority**: Distribution
- **Resolution Rate**: Success metrics

---

## 🔧 API ENDPOINTS

All endpoints start with: `http://localhost:3001/api`

### Tickets
```
GET    /tickets              - List all tickets
GET    /tickets/:id          - Get single ticket
PATCH  /tickets/:id/status   - Update status
POST   /tickets/:id/response - Add response
```

### User
```
GET    /user/:userId/tickets - Get user's tickets
```

### Dashboard
```
GET    /dashboard/stats      - Get statistics
```

---

## 🛠️ TROUBLESHOOTING

### ❌ Bot not responding
```
✓ Check TELEGRAM_BOT_TOKEN in .env is correct
✓ Make sure npm start ran without errors in Terminal 1
✓ Look for "✅ MongoDB Connected" message
```

### ❌ Dashboard shows error
```
✓ Check Terminal 2 (frontend) has no errors
✓ Verify API URL in dashboard .env is http://localhost:3001/api
✓ Open browser console (F12) to see error details
```

### ❌ Can't connect to MongoDB
```
✓ Open new PowerShell, type: mongosh
✓ If fails, MongoDB not running
✓ Windows: Restart MongoDB service
✓ Mac/Linux: brew services restart mongodb-community
```

### ❌ Port already in use
```
✓ Port 3000: Another app using it
✓ Port 3001: Another app using it
✓ Close conflicting apps or change PORT in .env
```

---

## 🚀 NEXT STEPS

### Short Term
1. ✅ Get bot token from BotFather
2. ✅ Install Node.js & MongoDB
3. ✅ Follow setup above
4. ✅ Test the system

### Medium Term
1. Customize ticket categories
2. Add admin authentication
3. Send notifications to users
4. Add email integration
5. Customize dashboard styling

### Production Deployment
1. Deploy backend to Railway/Render/Heroku
2. Deploy frontend to Vercel/Netlify
3. Use MongoDB Atlas (cloud database)
4. Setup custom domain
5. Add SSL certificate
6. Enable monitoring

---

## 📞 SUPPORT

If stuck:

1. **Check Logs**: Look at terminal output for errors
2. **Verify .env**: Double-check token and URLs
3. **Test MongoDB**: Run `mongosh` in new PowerShell
4. **Test Bot**: Send `/help` in Telegram
5. **Test API**: Visit `http://localhost:3001/health`

---

## 🎉 YOU'RE ALL SET!

Your bot is ready to:
- ✅ Receive user queries 24/7
- ✅ Generate unique tickets
- ✅ Store everything in MongoDB
- ✅ Show real-time dashboard
- ✅ Manage support efficiently

**Happy ticket managing! 🚀**

---

## Quick Links

- 📖 Full Guide: See README.md
- 🏗️ Architecture: See ARCHITECTURE.md
- 🤖 Telegram: @BotFather (get token)
- 🐍 MongoDB: https://www.mongodb.com/try/download/community
- ⚛️ Node.js: https://nodejs.org/

