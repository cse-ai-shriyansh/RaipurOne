# 🚀 Supabase Migration Guide

## Overview

This project has been **migrated from MongoDB to Supabase (PostgreSQL)**. This guide will help you set up and run the application with Supabase.

### What Changed

- ✅ **Database**: MongoDB → Supabase (PostgreSQL)
- ✅ **ORM**: Mongoose → @supabase/supabase-js
- ✅ **Storage**: Added Supabase Storage for image uploads
- ✅ **New Features**: Image upload endpoints with Supabase Storage

---

## 📋 Prerequisites

1. **Node.js** (v14 or higher)
2. **Supabase Account** - [Sign up free](https://supabase.com)
3. **Telegram Bot Token** - Get from [@BotFather](https://t.me/botfather)

---

## 🔧 Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in:
   - **Name**: Your project name (e.g., "municipal-bot")
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your location
4. Click **"Create new project"** (takes ~2 minutes)

---

## 🗄️ Step 2: Run Database Migration

### Option A: Using Supabase SQL Editor (Recommended)

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open the file `bot-backend/supabase-schema.sql` from this project
4. Copy the **entire contents** of that file
5. Paste it into the SQL Editor
6. Click **"Run"** (bottom right)
7. You should see: "Success. No rows returned"

### Option B: Using psql (Advanced)

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f bot-backend/supabase-schema.sql
```

---

## 🖼️ Step 3: Create Storage Bucket for Images

1. In Supabase Dashboard, go to **Storage** (left sidebar)
2. Click **"Create a new bucket"**
3. Fill in:
   - **Name**: `ticket-images`
   - **Public**: ✅ Check this (to allow public access to uploaded images)
4. Click **"Create bucket"**

### Set Storage Policies (Important!)

1. Click on `ticket-images` bucket
2. Go to **"Policies"** tab
3. Click **"New Policy"**
4. Select **"For full customization"**
5. Add these policies:

**Policy 1: Allow Public Read**
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'ticket-images' );
```

**Policy 2: Allow Authenticated Upload**
```sql
CREATE POLICY "Allow Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'ticket-images' );
```

**Policy 3: Allow Authenticated Delete**
```sql
CREATE POLICY "Allow Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'ticket-images' );
```

---

## 🔐 Step 4: Get Supabase Credentials

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Project API Key** → `anon` `public` key

---

## ⚙️ Step 5: Configure Environment Variables

1. Navigate to `bot-backend` folder:
   ```powershell
   cd "c:\Users\Lenovo\Desktop\Bot - Copy\bot-backend"
   ```

2. Create `.env` file:
   ```powershell
   New-Item -ItemType File -Name .env
   ```

3. Open `.env` and add:

```env
# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Telegram Bot (REQUIRED)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Server Configuration
PORT=3001
NODE_ENV=development

# Twilio WhatsApp (OPTIONAL)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Gemini AI (OPTIONAL - for ticket analysis)
GEMINI_API_KEY=your-gemini-api-key
```

**Important:** Replace placeholder values with your actual credentials!

---

## 📦 Step 6: Install Dependencies

```powershell
cd "c:\Users\Lenovo\Desktop\Bot - Copy\bot-backend"
npm install
```

This will install:
- `@supabase/supabase-js` - Supabase client
- `multer` - File upload middleware
- All other existing dependencies

---

## ▶️ Step 7: Start the Backend

```powershell
npm start
```

Expected output:
```
✅ Supabase Connected Successfully
🤖 Telegram Bot started successfully
📱 Twilio WhatsApp integration initialized
🚀 Server running on http://localhost:3001
📊 API available at http://localhost:3001/api
🖼️ Image API at http://localhost:3001/api/images
```

---

## 🧪 Step 8: Test the Setup

### Test 1: Health Check
Open browser and go to:
```
http://localhost:3001/health
```

Should return:
```json
{
  "status": "Bot backend is running"
}
```

### Test 2: Create a Test Ticket via Telegram
1. Open Telegram and find your bot
2. Send: `/start`
3. Send: `/ticket Test ticket from Telegram`
4. Bot should respond with ticket details

### Test 3: Verify Database
1. Go to Supabase Dashboard → **Table Editor**
2. Open `tickets` table
3. You should see your test ticket!

---

## 🖼️ Image Upload Endpoints

### Upload Single Image
```http
POST /api/images/upload
Content-Type: multipart/form-data

Body (form-data):
- image: [file]
- userId: "123456789"
- ticketId: "TKT-ABC12345" (optional)
```

### Upload Multiple Images
```http
POST /api/images/upload-multiple
Content-Type: multipart/form-data

Body (form-data):
- images: [file1, file2, ...]
- userId: "123456789"
- ticketId: "TKT-ABC12345" (optional)
```

### Get Ticket Images
```http
GET /api/images/ticket/:ticketId
```

### Get User Images
```http
GET /api/images/user/:userId
```

### Delete Image
```http
DELETE /api/images/:imageId
Body: { "userId": "123456789" }
```

---

## 📊 Database Schema

### Tables Created

1. **users** - User information and ticket counts
2. **tickets** - Main ticket records
3. **ticket_responses** - Responses/comments on tickets
4. **department_tickets** - Analyzed tickets routed to departments
5. **images** - Image metadata and URLs

### Key Changes from MongoDB

| MongoDB Field | Supabase Field | Notes |
|--------------|----------------|-------|
| `ticketId` | `ticket_id` | Snake case in PostgreSQL |
| `userId` | `user_id` | Snake case |
| `firstName` | `first_name` | Snake case |
| `responses` (array) | `ticket_responses` table | Separate table with foreign key |
| `createdAt` | `created_at` | Auto-managed by triggers |

---

## 🐛 Troubleshooting

### Error: "Missing Supabase credentials"
- Check your `.env` file has `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Verify no extra spaces around the values

### Error: "relation 'tickets' does not exist"
- Run the migration SQL script again in Supabase SQL Editor
- Check **Table Editor** to confirm tables exist

### Error: "Failed to upload image"
- Verify `ticket-images` bucket exists in Supabase Storage
- Check storage policies are configured correctly
- Ensure the bucket is set to **Public**

### Bot not responding
- Verify `TELEGRAM_BOT_TOKEN` is correct in `.env`
- Check terminal shows "Telegram Bot started successfully"
- Test bot with `/start` command

### Images not displaying
- Verify the bucket is set to **Public** in Supabase Storage
- Check the storage policies allow SELECT operations
- Confirm images were uploaded successfully (check `images` table)

---

## 🔄 Migration from Old MongoDB Data (Optional)

If you have existing MongoDB data to migrate:

1. **Export from MongoDB:**
   ```bash
   mongoexport --db telegram-bot-db --collection tickets --out tickets.json
   mongoexport --db telegram-bot-db --collection users --out users.json
   ```

2. **Transform and Import:**
   - You'll need to write a script to transform MongoDB documents to PostgreSQL format
   - Convert field names (camelCase → snake_case)
   - Handle nested `responses` array → separate table inserts
   - Use Supabase client or psql to insert data

---

## 📝 API Endpoints Summary

### Tickets
- `POST /api/tickets` - Create ticket
- `GET /api/tickets` - Get all tickets (with filters)
- `GET /api/tickets/:ticketId` - Get single ticket
- `GET /api/user/:userId/tickets` - Get user's tickets
- `PATCH /api/tickets/:ticketId/status` - Update status
- `POST /api/tickets/:ticketId/response` - Add response
- `GET /api/dashboard/stats` - Get statistics

### Analysis (Gemini AI)
- `POST /api/analysis/analyze/:ticketId` - Analyze single ticket
- `POST /api/analysis/analyze-all` - Analyze all pending
- `GET /api/analysis/department-stats` - Department statistics
- `GET /api/analysis/department/:department/tickets` - Get by department

### Images (NEW!)
- `POST /api/images/upload` - Upload single image
- `POST /api/images/upload-multiple` - Upload multiple images
- `GET /api/images/ticket/:ticketId` - Get ticket images
- `GET /api/images/user/:userId` - Get user images
- `DELETE /api/images/:imageId` - Delete image

---

## 🌟 Benefits of Supabase Migration

✅ **Scalability** - PostgreSQL scales better than MongoDB for this use case  
✅ **Built-in Storage** - Supabase Storage for images (no need for AWS S3)  
✅ **Real-time** - Built-in real-time subscriptions (for future features)  
✅ **Better Queries** - SQL joins and complex queries are easier  
✅ **Free Tier** - 500MB database + 1GB storage free  
✅ **Auto Backups** - Automatic daily backups  
✅ **Dashboard** - Beautiful UI to manage data  

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Multer Documentation](https://github.com/expressjs/multer)

---

## 🎉 You're All Set!

Your bot is now running on Supabase! 

Test all features:
1. ✅ Create tickets via Telegram
2. ✅ View tickets in dashboard
3. ✅ Upload images via API
4. ✅ Analyze tickets with Gemini AI
5. ✅ Check Supabase dashboard to see data

**Need help?** Check the troubleshooting section or review Supabase logs in the dashboard.

---

## 🔐 Security Notes

- Never commit `.env` file to git
- Rotate your API keys regularly
- Use Row Level Security (RLS) in production
- Set proper CORS policies
- Validate file uploads (size, type)
- Implement rate limiting for uploads

---

**Happy Coding! 🚀**
