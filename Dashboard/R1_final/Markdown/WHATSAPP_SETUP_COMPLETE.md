# 📱 WhatsApp Setup Guide (Complete)

## ✅ Current Status

Your WhatsApp integration is configured with:
- **Twilio Account SID**: `ACbdeeda52aea79bd412b0d0e5be8f18d9`
- **WhatsApp Number**: `whatsapp:+14155238886` (Twilio Sandbox)
- **Webhook URL**: `https://cyan-garlics-lead.loca.lt/webhook/whatsapp`

---

## 🔧 Step-by-Step Setup

### **Step 1: Configure Twilio Webhook**

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Messaging** → **Try it out** → **Send a WhatsApp message**
3. Scroll to **Sandbox Configuration**
4. Set the webhook URL:
   ```
   https://cyan-garlics-lead.loca.lt/webhook/whatsapp
   ```
5. Set HTTP Method to **POST**
6. Click **Save**

---

### **Step 2: Join WhatsApp Sandbox**

To use the Twilio WhatsApp sandbox, you need to join it first:

1. Open WhatsApp on your phone
2. Send this message to **+1 415 523 8886**:
   ```
   join <your-sandbox-code>
   ```
   
   **To find your sandbox code:**
   - Go to [Twilio Console](https://console.twilio.com/)
   - Navigate to **Messaging** → **Try it out** → **Send a WhatsApp message**
   - You'll see something like: "join capital-dinner" or "join blue-sky"
   - Send that exact message to the Twilio number

3. You should receive a confirmation message from Twilio

---

### **Step 3: Test WhatsApp Bot**

Once you've joined the sandbox, send these commands to test:

#### **Start the Bot:**
```
/start
```

#### **Get Help:**
```
/help
```

#### **Create a Ticket:**
```
/ticket
```
Then send your complaint like:
```
There is a large pothole on Main Street near the park
```

#### **View Your Tickets:**
```
/mytickets
```

#### **Check Ticket Status:**
```
/status TKT-XXXXX
```

---

## 🌐 Public Webhook URL

Your current public webhook URL (via localtunnel):
```
https://cyan-garlics-lead.loca.lt/webhook/whatsapp
```

**Important Notes:**
- ⚠️ This URL changes every time you restart localtunnel
- ⚠️ You'll need to update the Twilio webhook URL in the console when it changes
- ⚠️ Keep the localtunnel PowerShell window open

---

## 🔄 If Localtunnel URL Changes

When you restart localtunnel and get a new URL:

1. Update `.env` file with new URL
2. Restart backend server
3. Update webhook in Twilio Console
4. Test with a WhatsApp message

---

## 🧪 Quick Test

Send this to your WhatsApp (after joining sandbox):

**Test Message:**
```
/start
```

**Expected Response:**
```
🏛️ Welcome to Municipal Services Bot!

I'm here to help you report and track municipal complaints.

📋 Available Commands:
/help - Show all commands
/ticket - Report a new complaint
/mytickets - View your complaints
/status <ticket-id> - Check complaint status

💡 Departments we handle:
🛣️ Roadway (potholes, roads)
🧹 Cleaning (garbage, sanitation)
🚰 Drainage (blocked drains)
💧 Water Supply (water issues)

Let's make our city better together! 🌟
```

---

## 🐛 Troubleshooting

### **Issue: Not receiving messages**
**Solution:**
1. Make sure you joined the sandbox (send "join xxx-xxx" message)
2. Verify webhook URL is correct in Twilio Console
3. Check that localtunnel is running
4. Check backend server logs

### **Issue: Bot not responding**
**Solution:**
1. Restart backend server
2. Check console logs for errors
3. Test webhook with: `POST https://cyan-garlics-lead.loca.lt/webhook/whatsapp`

### **Issue: Localtunnel URL changed**
**Solution:**
1. Copy new URL from localtunnel terminal
2. Update Twilio webhook in console
3. Update `.env` file
4. Restart backend

---

## 📊 Monitor Messages

Check backend console logs to see incoming messages:
```
📨 WhatsApp message from +1234567890: /start
✅ Message sent to whatsapp:+1234567890: SMxxxxx
```

---

## 🚀 Production Setup (Optional)

For production, replace localtunnel with:

1. **Ngrok** (more stable):
   ```bash
   ngrok http 3001
   ```

2. **Deploy to cloud**:
   - Heroku
   - AWS
   - Azure
   - DigitalOcean

3. **Get own Twilio number**:
   - Purchase a WhatsApp-enabled number from Twilio
   - No sandbox limitations
   - Professional setup

---

## 📞 Twilio Support

Need help? Contact Twilio Support:
- **Website**: https://support.twilio.com/
- **Docs**: https://www.twilio.com/docs/whatsapp
- **Console**: https://console.twilio.com/

---

## ✅ Checklist

Before testing:
- [ ] Localtunnel is running and showing URL
- [ ] Backend server is running on port 3001
- [ ] Webhook URL is set in Twilio Console
- [ ] You've joined the WhatsApp sandbox
- [ ] .env file has correct webhook URL

---

Your WhatsApp bot is ready to receive messages! 🎉
