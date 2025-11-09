# 🌐 DEPLOYMENT GUIDE

## Deployment Options

This guide covers deploying your Telegram Bot system to production.

---

## 📦 Part 1: Backend Deployment (Bot + API)

### Option A: Railway.app (Recommended - Easiest)

1. **Sign up** at https://railway.app (GitHub login)

2. **Create new project**
   - Click "New Project"
   - "Deploy from GitHub"
   - Connect your GitHub repo (or create one)

3. **Configure environment**
   - Go to Variables tab
   - Add these variables:
   ```
   TELEGRAM_BOT_TOKEN=your_token_here
   MONGODB_URI=your_mongodb_connection_string
   NODE_ENV=production
   PORT=3000
   ```

4. **Add MongoDB (Option)**
   - Click "Add service" in Railway
   - Select "MongoDB"
   - Railway creates connection string automatically

5. **Deploy**
   - Push to GitHub
   - Railway auto-deploys on push
   - Get your URL: yourproject.up.railway.app

### Option B: Heroku (Free tier ended)

1. Install Heroku CLI
2. `heroku login`
3. `heroku create your-app-name`
4. `heroku config:set TELEGRAM_BOT_TOKEN=your_token`
5. `git push heroku main`

### Option C: Render.com

1. Sign up at https://render.com
2. Create new Web Service
3. Connect GitHub repo (bot-backend folder)
4. Set environment variables
5. Deploy

### Option D: AWS EC2

1. Create EC2 instance (Ubuntu 22.04)
2. SSH into instance
3. Install Node.js and MongoDB
4. Clone repository
5. Install dependencies: `npm install`
6. Start with PM2: `pm2 start src/index.js --name "telegram-bot"`
7. Setup nginx as reverse proxy

---

## 🎨 Part 2: Frontend Deployment (Dashboard)

### Option A: Vercel (Easiest)

1. **Sign up** at https://vercel.com (GitHub login)

2. **Import project**
   - Click "New Project"
   - Select `dashboard-frontend` folder
   - Import from GitHub

3. **Configure**
   - Set Environment: `REACT_APP_API_URL`
   - Value: `https://yourbackend.up.railway.app/api`

4. **Deploy**
   - Click Deploy
   - Get URL: yourproject.vercel.app

### Option B: Netlify

1. Sign up at https://netlify.com
2. "New site from Git"
3. Connect GitHub
4. Build command: `npm run build`
5. Publish directory: `build`
6. Set environment variables
7. Deploy

### Option C: GitHub Pages

1. Add to package.json: `"homepage": "https://yourusername.github.io/repo-name"`
2. Install gh-pages: `npm install gh-pages`
3. Add to scripts:
   ```json
   "deploy": "npm run build && gh-pages -d build"
   ```
4. `npm run deploy`

### Option D: AWS S3 + CloudFront

1. Create S3 bucket
2. Enable static hosting
3. Build frontend: `npm run build`
4. Upload `build/` to S3
5. Create CloudFront distribution
6. Point domain to CloudFront

---

## 🗄️ Part 3: Database Deployment

### MongoDB Atlas (Cloud - Recommended)

1. **Create account** at https://www.mongodb.com/cloud/atlas

2. **Create cluster**
   - Free tier available
   - Choose region close to users
   - Create database user
   - Whitelist IPs

3. **Get connection string**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/telegram-bot-db
   ```

4. **Update .env**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/telegram-bot-db
   ```

### AWS DocumentDB

1. Create DocumentDB cluster
2. Get connection endpoint
3. Create database user
4. Update connection string

### Azure CosmosDB

1. Create CosmosDB account (MongoDB API)
2. Get connection string
3. Configure firewall
4. Update connection string

---

## 📋 Pre-Deployment Checklist

- [ ] All `.env` values are correct
- [ ] Bot token is valid
- [ ] MongoDB connection works
- [ ] All dependencies in package.json
- [ ] No hardcoded secrets in code
- [ ] Frontend API URL updated
- [ ] Tests pass locally
- [ ] No console errors/warnings
- [ ] README.md is updated
- [ ] .gitignore includes .env

---

## 🔐 Security for Production

### Backend Security

1. **Environment variables**
   ```javascript
   // ✅ Good
   require('dotenv').config();
   const token = process.env.TELEGRAM_BOT_TOKEN;
   
   // ❌ Bad
   const token = "12345:ABCDE";
   ```

2. **Input validation**
   ```javascript
   // Validate all user inputs
   if (!query || query.trim().length === 0) {
     return sendError('Query cannot be empty');
   }
   ```

3. **Rate limiting**
   ```javascript
   const rateLimit = require('express-rate-limit');
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100
   });
   app.use(limiter);
   ```

4. **CORS configuration**
   ```javascript
   app.use(cors({
     origin: process.env.FRONTEND_URL,
     credentials: true
   }));
   ```

### Frontend Security

1. **API calls use HTTPS in production**
2. **No sensitive data in localStorage**
3. **Validate all API responses**
4. **Use environment variables for API URLs**

### Database Security

1. **Strong passwords for DB users**
2. **Whitelist IPs in MongoDB**
3. **Use VPN/Private networks if available**
4. **Enable encryption at rest**
5. **Regular backups enabled**

---

## 🚀 Full Production Setup Example

### Using Railway + MongoDB Atlas

```env
# Backend .env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/telegram-bot-db
PORT=3000
NODE_ENV=production
API_URL=https://mybot.up.railway.app

# Frontend .env
REACT_APP_API_URL=https://mybot.up.railway.app/api
```

### Deployment Steps

1. Create GitHub repo with both folders
2. Deploy backend to Railway
3. Get backend URL
4. Update frontend API URL
5. Deploy frontend to Vercel
6. Test end-to-end

---

## 📊 Monitoring in Production

### Logging

```javascript
// Add logging service
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Use in code
logger.info('Ticket created', { ticketId });
logger.error('Database error', { error: err });
```

### Error Tracking (Sentry)

```bash
npm install @sentry/node
```

```javascript
const Sentry = require("@sentry/node");
Sentry.init({ dsn: process.env.SENTRY_DSN });

try {
  // Code here
} catch (err) {
  Sentry.captureException(err);
}
```

### Performance Monitoring

- Use NewRelic or DataDog
- Monitor response times
- Track database queries
- Monitor bot response times

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy Backend
        run: |
          curl -X POST ${{ secrets.RAILWAY_WEBHOOK }}
      
      - name: Deploy Frontend
        run: |
          npm install
          npm run build
          # Upload to Vercel/Netlify
```

---

## 💰 Cost Estimation (Monthly)

### Free Options
- **Backend**: Railway (free tier with limits)
- **Frontend**: Vercel (free tier)
- **Database**: MongoDB Atlas (free tier)
- **Total**: $0

### Paid Options (For Production)
- **Backend**: Railway $5-20/month
- **Frontend**: Vercel $20/month (optional)
- **Database**: MongoDB Atlas $57+/month
- **CDN**: Cloudflare $20+/month
- **Total**: $100+/month for high traffic

---

## 🆘 Troubleshooting Deployments

### Bot not responding after deployment

```
✓ Check TELEGRAM_BOT_TOKEN is correct in deployed .env
✓ Verify bot is running (check logs)
✓ Ensure webhook URL is updated if using webhooks
✓ Check MongoDB connection string
```

### Dashboard showing blank

```
✓ Check REACT_APP_API_URL in frontend .env
✓ Verify backend is running and accessible
✓ Open browser DevTools → Network tab → check API calls
✓ Check CORS settings on backend
```

### Database not accessible

```
✓ Verify connection string in backend .env
✓ Check IP whitelist in MongoDB Atlas
✓ Ensure database user has correct permissions
✓ Test connection locally first
```

---

## 🎯 Deployment Checklist

- [ ] Code committed to GitHub
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database backups configured
- [ ] SSL certificate setup
- [ ] Error tracking enabled
- [ ] Monitoring alerts setup
- [ ] Documentation updated
- [ ] Runbook created for incidents
- [ ] Team trained on deployment process

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Guide](https://docs.atlas.mongodb.com)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Happy deploying! 🚀**
