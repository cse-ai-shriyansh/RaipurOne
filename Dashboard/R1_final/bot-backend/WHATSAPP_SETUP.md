# WhatsApp Bot Setup Guide 📱

## Overview
This guide explains how to set up and use the WhatsApp bot for the Municipal Services complaint system using the free Baileys library (WhatsApp Web API).

## Features
✅ Free WhatsApp integration (no official WhatsApp Business API costs)
✅ Same commands as Telegram bot
✅ QR code authentication
✅ Persistent session storage
✅ Municipal complaint management
✅ AI-powered ticket routing

## Installation

### 1. Install Dependencies
```bash
cd bot-backend
npm install
```

New dependencies added:
- `@whiskeysockets/baileys` - WhatsApp Web API
- `qrcode-terminal` - Display QR codes in terminal
- `pino` - Logging library

### 2. Start the Backend
```bash
cd bot-backend
node src/index.js
```

### 3. Scan QR Code
When you start the backend, you'll see:
```
📱 WhatsApp QR Code:
[QR CODE DISPLAYED IN TERMINAL]

Scan the QR code above with WhatsApp to connect
```

**To Scan:**
1. Open WhatsApp on your phone
2. Go to **Settings** > **Linked Devices**
3. Tap **Link a Device**
4. Scan the QR code from terminal
5. Wait for "✅ WhatsApp Bot connected successfully!"

## Bot Commands

### User Commands

#### `/start` - Welcome Message
```
User: /start
Bot: 🏛️ Welcome to Municipal Services Bot!
     Available Commands: /help, /ticket, /mytickets, /status
     Departments: Roadway, Cleaning, Drainage, Water Supply
```

#### `/help` - Show Help
```
User: /help
Bot: 📚 Help & Commands
     Creating Complaints: /ticket
     Tracking: /mytickets, /status
```

#### `/ticket` - Report Complaint (Two Ways)

**Method 1: Direct**
```
User: /ticket Large pothole on Main Street near City Hall
Bot: ✅ Complaint Registered Successfully!
     Complaint ID: TKT-ABC123
     Status: OPEN
```

**Method 2: Interactive**
```
User: /ticket
Bot: 📝 Report Municipal Complaint
     Please describe your complaint in detail...

User: Large pothole on Main Street near City Hall
Bot: ✅ Complaint Registered Successfully!
     Complaint ID: TKT-ABC123
```

#### `/mytickets` - View Your Complaints
```
User: /mytickets
Bot: 📋 Your Complaints (3)
     1. 🔴 TKT-ABC123
        Large pothole on Main Street...
        Status: OPEN
     2. ✅ TKT-XYZ789
        Garbage not collected...
        Status: RESOLVED
```

#### `/status` - Check Complaint Status
```
User: /status TKT-ABC123
Bot: 🎫 Complaint Details
     ID: TKT-ABC123
     Status: IN-PROGRESS
     Priority: high
     Category: roadway
     Description: Large pothole on Main Street...
```

#### `/cancel` - Cancel Current Action
```
User: /cancel
Bot: ❌ Action cancelled
     Use /help to see available commands
```

## User Flow Examples

### Example 1: Report Pothole
```
1. User: /ticket
2. Bot: Please describe your complaint...
3. User: Large pothole on Main Street causing damage to vehicles
4. Bot: ✅ Complaint Registered! ID: TKT-123
        AI Analysis in Progress
        Use /status TKT-123 to track
```

### Example 2: Check All Complaints
```
1. User: /mytickets
2. Bot: Shows list of all user's complaints
3. User: /status TKT-123
4. Bot: Shows detailed status of specific complaint
```

### Example 3: Track Complaint
```
1. User: /status TKT-123
2. Bot: Shows full details including:
        - Current status (open/in-progress/resolved)
        - Priority level
        - Department assigned
        - Admin response (if any)
```

## Technical Details

### Session Storage
- Sessions stored in `whatsapp-session/` folder
- Contains authentication credentials
- Persists across restarts
- **DO NOT** commit to git (add to .gitignore)

### Multi-Device Support
- Uses WhatsApp Multi-Device protocol
- Can link multiple devices
- Each device scans its own QR code
- Sessions remain independent

### Message Handling
The bot handles:
- ✅ Text messages (commands and descriptions)
- ✅ User identification (phone number)
- ✅ Conversation states (awaiting ticket description)
- ❌ Media (images, videos - not implemented)
- ❌ Groups (only personal chats supported)

### Error Handling
- Connection failures → Auto-reconnect
- Invalid commands → Helpful error messages
- Missing ticket IDs → Guidance provided
- Database errors → User-friendly notifications

## Architecture

### File Structure
```
bot-backend/
├── src/
│   ├── whatsappHandlers.js     # WhatsApp bot logic
│   ├── botHandlers.js          # Telegram bot logic
│   ├── index.js                # Main entry (both bots)
│   └── controllers/
│       └── ticketController.js # Shared ticket logic
├── whatsapp-session/           # Auth credentials (auto-created)
└── package.json
```

### Code Integration
```javascript
// Both bots use same backend:
createTicket(userId, query)    // Create ticket
getUserTickets(userId)         // Get user's tickets
getTicketById(ticketId)       // Get ticket details

// WhatsApp-specific:
initWhatsAppBot()             // Initialize connection
handleCommand()               // Process commands
handleConversation()          // Manage user states
```

### Database Integration
- Uses same MongoDB collections as Telegram
- `tickets` collection stores all complaints
- `users` collection tracks users from both platforms
- `departmenttickets` stores AI-analyzed tickets

## Limitations & Notes

### Free vs Paid WhatsApp API

**Baileys (Current - FREE):**
✅ No costs
✅ Full access to WhatsApp features
✅ No message limits
❌ Requires phone scanning QR code
❌ Session can expire (need re-scan)
❌ Against WhatsApp ToS (risk of ban)

**Official WhatsApp Business API (PAID):**
✅ Official support
✅ No ban risk
✅ Webhook integration
❌ Costs per message
❌ Requires business verification
❌ Complex setup

### Current Implementation
- **Single device mode** (one QR scan at a time)
- **Text-only** (no media support yet)
- **Personal chats only** (no group support)
- **English interface** (can be localized)

## Troubleshooting

### QR Code Not Appearing
```bash
# Check if backend started
curl http://localhost:3001/health

# Check terminal output for errors
# Restart backend: Ctrl+C and node src/index.js
```

### Connection Lost
```
❌ WhatsApp connection closed. Reconnecting: true
```
**Solution:** Bot will auto-reconnect. If it fails, restart backend and scan QR again.

### "Session Expired" Error
**Solution:**
1. Delete `whatsapp-session/` folder
2. Restart backend
3. Scan new QR code

### Commands Not Working
**Check:**
- Command starts with `/` (e.g., `/ticket` not `ticket`)
- Spelling is correct
- Backend is running (check terminal)
- MongoDB is connected

### Ticket Creation Fails
**Check:**
1. Backend logs for errors
2. MongoDB is running: `Get-Service MongoDB`
3. Database connection: Check terminal for "✅ MongoDB Connected"

## Security & Privacy

### Session Security
- Session files contain auth tokens
- Keep `whatsapp-session/` folder secure
- Add to `.gitignore`
- Don't share session files

### User Privacy
- Phone numbers used as user IDs
- No message content stored beyond tickets
- Comply with data protection laws
- Clear privacy policy needed for production

### Production Recommendations
⚠️ **Warning:** Baileys violates WhatsApp ToS. For production:
1. Use official WhatsApp Business API
2. Get business verification
3. Implement proper logging
4. Add rate limiting
5. Set up monitoring
6. Use proper hosting (not personal phone)

## Comparison: Telegram vs WhatsApp

| Feature | Telegram | WhatsApp |
|---------|----------|----------|
| **Cost** | Free API | Free (Baileys) |
| **Setup** | Bot token | QR scan |
| **Reliability** | Very high | Medium |
| **Official Support** | Yes | No (with Baileys) |
| **Ban Risk** | None | Yes (ToS violation) |
| **User Base** | Tech-savvy | General public |
| **Message Limits** | None | None |
| **Media Support** | Full | Not implemented |

## Next Steps

### Recommended Enhancements
1. **Add media support** - Images for better complaint documentation
2. **Location sharing** - GPS coordinates for precise issue location
3. **Status notifications** - Auto-notify users on status changes
4. **Multi-language** - Support local languages
5. **Group support** - Community complaint groups
6. **Admin commands** - Admins can respond via WhatsApp

### Migration to Official API
For production deployment:
1. Register for WhatsApp Business API
2. Get Meta business account
3. Complete verification process
4. Switch from Baileys to official API
5. Set up webhooks
6. Implement message templates

## Support

### Getting Help
- Check terminal logs for errors
- Review `FUNCTIONALITY_CHECK.md` for system status
- Test Telegram bot first (easier to debug)
- Check MongoDB connection

### Common Issues
1. **QR not scanning:** Restart backend, try different phone
2. **Messages not received:** Check phone has internet
3. **Commands failing:** Verify backend running and DB connected
4. **Session expired:** Delete session folder and re-scan

## Additional Resources
- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Main Documentation](INDEX.md)
- [Telegram Setup](QUICKSTART.md)

---

**Status:** ✅ WhatsApp bot integrated and ready to use
**Platform:** Free (Baileys library)
**Last Updated:** Current session
