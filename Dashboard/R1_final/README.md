# Telegram Bot System - Complete Setup Guide

## 🎯 Overview

This is a complete end-to-end Telegram bot system with MongoDB database and a React dashboard frontend. The system allows users to create support tickets through Telegram and manage them via a web dashboard.

### Features

✅ **Telegram Bot**
- `/start` - Welcome message with available commands
- `/help` - Show help and available commands
- `/ticket <query>` - Create a new support ticket
- `/mytickets` - View all user's tickets
- `/status` - Check ticket status summary

✅ **MongoDB Database**
- Persistent ticket storage
- User tracking
- Full ticket history with responses

✅ **REST API**
- Complete CRUD operations for tickets
- Dashboard statistics endpoint
- Filter tickets by status, category, priority

✅ **React Dashboard**
- Real-time statistics
- Ticket management interface
- Filter and search functionality
- Responsive design

---

## 📋 Prerequisites

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Telegram Bot Token** - Get one from [@BotFather](https://t.me/botfather)

---

## 🚀 Installation & Setup

### Step 1: MongoDB Setup

1. **Install MongoDB** (if not already installed)
   - Windows: Download from MongoDB website
   - macOS: `brew install mongodb-community`
   - Linux: `sudo apt-get install mongodb`

2. **Start MongoDB**
   - Windows: MongoDB should start automatically
   - macOS/Linux: `brew services start mongodb-community` or `sudo systemctl start mongod`

3. **Verify MongoDB is running**
   ```powershell
   # Open PowerShell and run:
   mongosh
   ```
   If it connects successfully, MongoDB is running.

### Step 2: Get Telegram Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/start` and `/newbot`
3. Follow the instructions to create a new bot
4. Copy the **API Token** provided

### Step 3: Backend Setup

```powershell
# Navigate to backend directory
cd "c:\Users\Lenovo\Desktop\Bot\bot-backend"

# Install dependencies
npm install

# Create .env file
Copy-Item .env.example -Destination .env

# Edit .env file with your values
# Open .env and update:
# - TELEGRAM_BOT_TOKEN=your_token_here
# - MONGODB_URI=mongodb://localhost:27017/telegram-bot-db
```

### Step 4: Frontend Setup

```powershell
# Navigate to frontend directory
cd "c:\Users\Lenovo\Desktop\Bot\dashboard-frontend"

# Install dependencies
npm install

# Create .env file
Add-Content .env "REACT_APP_API_URL=http://localhost:3001/api"
```

---

## ▶️ Running the Application

### Terminal 1: Start Backend (Bot & API)

```powershell
cd "c:\Users\Lenovo\Desktop\Bot\bot-backend"
npm start
```

Expected output:
```
✅ MongoDB Connected Successfully
🤖 Telegram Bot started successfully
🚀 Server running on http://localhost:3001
📊 API available at http://localhost:3001/api
```

### Terminal 2: Start Frontend Dashboard

```powershell
cd "c:\Users\Lenovo\Desktop\Bot\dashboard-frontend"
npm start
```

This will open the dashboard at `http://localhost:3000`

---

## 📱 Testing the Bot

1. Open Telegram and find your bot (use the username you provided to BotFather)

2. Send commands:
   ```
   /start              # See welcome message
   /help               # See all commands
   /ticket I need help with my account  # Create a ticket
   /mytickets          # View your tickets
   /status             # Check ticket status
   ```

3. The bot will respond with ticket IDs like `TKT-ABC12345`

---

## 🌐 API Endpoints

All API endpoints are accessible at `http://localhost:3001/api/`

### Get All Tickets
```
GET /api/tickets
Query Parameters:
  - status: open|in-progress|resolved|closed
  - category: support|billing|technical|general|other
  - priority: low|medium|high|urgent
```

### Get Single Ticket
```
GET /api/tickets/:ticketId
```

### Get User's Tickets
```
GET /api/user/:userId/tickets
```

### Update Ticket Status
```
PATCH /api/tickets/:ticketId/status
Body: { "status": "in-progress" }
```

### Add Response to Ticket
```
POST /api/tickets/:ticketId/response
Body: { "message": "Your response here" }
```

### Get Dashboard Statistics
```
GET /api/dashboard/stats
```

---

## 📊 Dashboard Features

### Dashboard Page
- Overview statistics (Total, Open, In Progress, Resolved tickets)
- Total users count
- Recent 5 tickets preview

### All Tickets Page
- Filter by status, category, priority
- Click any ticket to view details
- Search and browse functionality

### Ticket Detail Page
- View full ticket information
- See all responses/comments
- Add new responses
- Update ticket status
- View user information and timestamps

### Statistics Page
- Tickets breakdown by category
- Tickets breakdown by priority
- Overall resolution rate
- Visual representations

---

## 🗄️ Database Schema

### Ticket Collection
```javascript
{
  ticketId: String (unique),
  userId: String,
  username: String,
  firstName: String,
  lastName: String,
  query: String,
  category: String (enum),
  status: String (enum),
  priority: String (enum),
  responses: Array,
  notes: String,
  assignedTo: String,
  createdAt: Date,
  updatedAt: Date
}
```

### User Collection
```javascript
{
  userId: String (unique),
  username: String,
  firstName: String,
  lastName: String,
  chatId: String,
  isBot: Boolean,
  ticketsCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🐛 Troubleshooting

### Bot not responding
- Check Telegram bot token is correct in `.env`
- Ensure backend server is running (`npm start`)
- Check MongoDB is connected (look for ✅ message in console)

### Dashboard showing "Failed to load"
- Ensure backend API is running on port 3001
- Check REACT_APP_API_URL in `.env`
- Open browser console for error messages

### MongoDB connection error
- Ensure MongoDB service is running
- Check connection string in `.env`
- Default: `mongodb://localhost:27017/telegram-bot-db`

### Port already in use
- Backend uses port 3001
- Frontend uses port 3000
- Change ports if needed in code

---

## 📁 Project Structure

```
Bot/
├── bot-backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── Ticket.js
│   │   │   └── User.js
│   │   ├── controllers/
│   │   │   └── ticketController.js
│   │   ├── routes/
│   │   │   └── ticketRoutes.js
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── botHandlers.js
│   │   └── index.js
│   ├── package.json
│   ├── .env
│   └── .env.example
│
└── dashboard-frontend/
    ├── src/
    │   ├── components/
    │   │   ├── StatCard.js
    │   │   └── TicketCard.js
    │   ├── pages/
    │   │   ├── Dashboard.js
    │   │   ├── TicketsList.js
    │   │   ├── TicketDetail.js
    │   │   └── Statistics.js
    │   ├── App.js
    │   ├── api.js
    │   └── index.js
    ├── package.json
    └── .env
```

---

## 🔧 Customization

### Change Bot Commands
Edit `bot-backend/src/botHandlers.js`

### Customize Dashboard Colors
Edit CSS files in `dashboard-frontend/src/`

### Add More Ticket Fields
1. Update `Ticket.js` schema
2. Update `ticketController.js`
3. Update API routes in `ticketRoutes.js`
4. Update dashboard components

---

## 🚢 Deployment

### Backend (Telegram Bot + API)
Deploy to services like:
- Heroku
- Railway
- Render
- AWS EC2
- DigitalOcean

### Frontend Dashboard
Deploy to:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

### Database
Use cloud MongoDB:
- MongoDB Atlas
- AWS DocumentDB
- Azure CosmosDB

---

## 📝 License

MIT License - Feel free to use this project for any purpose.

---

## 💡 Support

For issues or questions:
1. Check troubleshooting section
2. Review console logs
3. Check MongoDB connection
4. Verify all environment variables

---

**Happy coding! 🚀**
