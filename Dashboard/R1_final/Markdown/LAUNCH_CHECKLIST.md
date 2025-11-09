# 📋 STARTUP CHECKLIST

## 🎯 Pre-Launch Checklist

### ✅ Prerequisites (Do First)
- [ ] **Node.js Installed**
  ```powershell
  node --version  # Should show v14+
  ```
  If not: https://nodejs.org/

- [ ] **MongoDB Installed & Running**
  ```powershell
  mongosh  # Should connect
  exit()   # Type exit to quit
  ```
  If not: https://www.mongodb.com/try/download/community

- [ ] **Telegram Bot Token Obtained**
  - Open Telegram → Search @BotFather
  - Send `/newbot`
  - Copy the API token provided

### ✅ Project Setup (5 Minutes)

**Step 1: Install Dependencies**
```powershell
# Open PowerShell in Bot directory
cd "c:\Users\Lenovo\Desktop\Bot"

# Option A: Automatic
.\install.ps1

# Option B: Manual
cd bot-backend
npm install
cd ..\dashboard-frontend
npm install
cd ..
```

**Step 2: Create .env Files**

**bot-backend/.env**
```env
TELEGRAM_BOT_TOKEN=YOUR_TOKEN_HERE
MONGODB_URI=mongodb://localhost:27017/telegram-bot-db
PORT=3001
NODE_ENV=development
API_URL=http://localhost:3001
```

**dashboard-frontend/.env**
```env
REACT_APP_API_URL=http://localhost:3001/api
```

**Step 3: Verify Installation**
```powershell
# Check backend installed correctly
cd bot-backend
npm list  # Should show all packages
cd ..

# Check frontend installed correctly
cd dashboard-frontend
npm list  # Should show all packages
cd ..
```

---

## 🚀 Launch Checklist

### Before Starting Servers
- [ ] MongoDB is running
- [ ] Port 3000 is free (frontend)
- [ ] Port 3001 is free (backend)
- [ ] .env files created and filled
- [ ] Internet connection active
- [ ] Telegram bot token verified

### Starting Services (Use 2 PowerShell Windows)

**Window 1: Backend Server**
```powershell
cd "c:\Users\Lenovo\Desktop\Bot\bot-backend"
npm start
```

Wait for these messages:
```
✅ MongoDB Connected Successfully
🤖 Telegram Bot started successfully
🚀 Server running on http://localhost:3001
📊 API available at http://localhost:3001/api
```

**Window 2: Frontend Dashboard**
```powershell
cd "c:\Users\Lenovo\Desktop\Bot\dashboard-frontend"
npm start
```

Wait for browser to open automatically at:
```
http://localhost:3000
```

---

## ✅ Testing Checklist

### Test Bot in Telegram
- [ ] Open Telegram app
- [ ] Find your bot (search for the username you gave @BotFather)
- [ ] Send `/start` → Bot responds with welcome message
- [ ] Send `/help` → Bot shows all commands
- [ ] Send `/ticket I need help` → Bot creates ticket with ID
- [ ] Send `/mytickets` → Bot shows your tickets
- [ ] Send `/status` → Bot shows ticket count summary

### Test Dashboard
- [ ] Open http://localhost:3000 in browser
- [ ] Dashboard loads successfully
- [ ] See "Dashboard" tab with statistics
- [ ] Click "All Tickets" tab → See the ticket you created
- [ ] Click on a ticket → See full details
- [ ] Update ticket status → Change from "open" to "in-progress"
- [ ] Add a response → Type message and submit
- [ ] See response appear in ticket
- [ ] Click "Statistics" tab → See breakdown by category

### Test API Directly
- [ ] Open http://localhost:3001/health in browser
- [ ] Should show: `{"status":"Bot backend is running"}`
- [ ] Try: http://localhost:3001/api/tickets
- [ ] Should return JSON array of all tickets

---

## 🐛 Troubleshooting During Launch

### Problem: "Cannot find module 'telegraf'"
```powershell
# Solution: Reinstall dependencies
cd bot-backend
npm install
```

### Problem: "MongoDB connection error"
```powershell
# Solution 1: Start MongoDB
mongosh  # If this works, MongoDB is running

# Solution 2: Check connection string
# Edit .env and verify MONGODB_URI is correct:
# mongodb://localhost:27017/telegram-bot-db

# Solution 3: Windows MongoDB Service
# 1. Open Services (services.msc)
# 2. Find "MongoDB Server"
# 3. Right-click → Start
```

### Problem: "Port 3001 already in use"
```powershell
# Solution 1: Find what's using port 3001
Get-NetTCPConnection -LocalPort 3001

# Solution 2: Kill the process
Stop-Process -Id <PID> -Force

# Solution 3: Use different port
# Edit bot-backend/.env and change PORT=3002
```

### Problem: "Port 3000 already in use"
```powershell
# Solution: Kill port 3000
netstat -ano | findstr :3000  # Find PID
taskkill /PID <PID> /F

# Or change port in dashboard-frontend/.env
```

### Problem: "Bot not responding to commands"
```
✓ Check TELEGRAM_BOT_TOKEN is correct
✓ Look for ✅ "Telegram Bot started" message
✓ Copy exact token from BotFather (no spaces)
✓ Restart bot (Ctrl+C then npm start)
```

### Problem: "Dashboard shows 'Failed to load'"
```
✓ Check backend is running (window 1)
✓ Check API URL in .env is http://localhost:3001/api
✓ Open DevTools (F12) → Console tab → Check errors
✓ Try http://localhost:3001/api/dashboard/stats directly
```

---

## 📊 Expected Output

### Backend Console (Successful Start)
```
✅ MongoDB Connected Successfully
🤖 Telegram Bot started successfully
🚀 Server running on http://localhost:3001
📊 API available at http://localhost:3001/api
```

### When Bot Receives Command
```
Command: /start
User: 123456789
...
Message sent to user: "Welcome to Support Bot!"
```

### Frontend Console (Successful Start)
```
Compiled successfully!

You can now view telegram-bot-dashboard in the browser.

Local:            http://localhost:3000
```

---

## 🎮 Test Commands to Run

In order:

1. **Bot Welcome**
   ```
   /start
   ```
   Expected: Welcome message with commands

2. **Create First Ticket**
   ```
   /ticket My account is not working
   ```
   Expected: Ticket created with ID like TKT-ABC12345

3. **View Tickets**
   ```
   /mytickets
   ```
   Expected: List shows your ticket

4. **Check Status**
   ```
   /status
   ```
   Expected: Shows 1 open ticket

5. **Create Another**
   ```
   /ticket I forgot my password
   ```
   Expected: Another ticket created

6. **View All**
   ```
   /mytickets
   ```
   Expected: Shows 2 tickets

---

## 🌐 URLs to Check

| URL | Expected Result |
|-----|-----------------|
| http://localhost:3001/health | `{"status":"Bot backend is running"}` |
| http://localhost:3001/api/tickets | JSON array of all tickets |
| http://localhost:3001/api/dashboard/stats | JSON with stats |
| http://localhost:3000 | Dashboard loads with stats |
| http://localhost:3000 (Tickets tab) | Shows all tickets |

---

## 📝 Logging In Dashboard

### Check Backend Logs
```powershell
# In Window 1 where backend is running
# Look for lines like:
# ✅ MongoDB Connected Successfully
# Request: GET /api/tickets
# Response: 200 OK
```

### Check Frontend Console
```
1. Open http://localhost:3000
2. Press F12 (Developer Tools)
3. Go to Console tab
4. Look for any red errors
5. Green messages are good
```

---

## ✨ Everything Works When You See:

✅ Bot responds to `/start` in Telegram
✅ Dashboard loads at http://localhost:3000
✅ Can create ticket with `/ticket`
✅ Ticket appears in dashboard instantly
✅ Can change ticket status in dashboard
✅ Can add responses in dashboard
✅ No errors in console windows

---

## 🎉 Success Indicators

### Backend Ready
```
✅ MongoDB Connected Successfully
🤖 Telegram Bot started successfully
```

### Frontend Ready
```
Compiled successfully!
You can now view telegram-bot-dashboard in the browser.
```

### Bot Working
```
/start → Bot replies with welcome message
/ticket test → Bot creates ticket
/mytickets → Bot shows tickets
```

### Dashboard Working
```
Loads at localhost:3000
Shows stats
Shows tickets list
Can click and edit tickets
```

---

## 🛑 If Something's Wrong

### Step 1: Check Everything Running
- [ ] MongoDB running? (mongosh connects)
- [ ] Window 1 showing bot messages?
- [ ] Window 2 showing dashboard compiled?
- [ ] No red errors in any console?

### Step 2: Check .env Files
- [ ] bot-backend/.env has token?
- [ ] MONGODB_URI looks correct?
- [ ] REACT_APP_API_URL is http://localhost:3001/api?

### Step 3: Restart Everything
```powershell
# Stop both windows (Ctrl+C)
# Restart MongoDB (if needed)
# Run both again
```

### Step 4: Check Logs
```powershell
# In backend window, look for:
✅ MongoDB Connected
🤖 Bot started

# In frontend window, look for:
Compiled successfully!
```

---

## 📞 Quick Help

| Issue | Fix |
|-------|-----|
| Bot doesn't reply | Check token, restart bot |
| Dashboard blank | Check API URL, restart backend |
| Can't find MongoDB | Run `mongosh`, start service |
| Port in use | Change PORT in .env |
| npm install fails | Delete node_modules, npm install again |

---

## 🚀 You're Ready When:

1. ✅ Both servers running without errors
2. ✅ Bot responds to `/start`
3. ✅ Dashboard shows at localhost:3000
4. ✅ Can create ticket and see it in dashboard
5. ✅ Can update ticket status

**Go ahead and launch! 🎉**

---

**Print this or keep it handy while launching!**
