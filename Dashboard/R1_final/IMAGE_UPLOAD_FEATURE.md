# 📸 Image Upload Feature for Telegram & WhatsApp

## Overview
Added image upload capability to both Telegram and WhatsApp bots. Users can now attach photos when reporting complaints before the ticket ID is generated.

---

## 🎯 How It Works

### **Telegram Bot Flow:**

```
User: /ticket pothole on main street

Bot: 📸 Would you like to add photos to your complaint?
     ✅ Send "yes" to upload photos
     ❌ Send "no" to skip and create ticket

User: yes

Bot: 📸 Great! Send your photos now.
     • You can send up to 5 photos
     • Send one photo at a time
     • When done, send "done"

User: [sends photo 1]
Bot: ✅ Photo 1 received! Send more or type "done"

User: [sends photo 2]
Bot: ✅ Photo 2 received! Send more or type "done"

User: done

Bot: ⏳ Creating your complaint...
     📤 Uploading 2 photo(s)...
     
     ✅ Complaint Created Successfully!
     📌 Ticket ID: TKT-ABC12345
     📸 Photos: 2 uploaded
     🤖 Automatically analyzed and routed!
```

### **WhatsApp Bot Flow:**

```
User: /ticket garbage overflow near park

Bot: 📸 Would you like to add photos to your complaint?
     ✅ Reply "yes" to upload photos
     ❌ Reply "no" to skip

User: yes

Bot: 📸 Great! Send your photos now.
     • You can send up to 3 photos
     • When done, reply "done"

User: [sends image]
Bot: ✅ Photo 1 received! (1/3)

User: done

Bot: ⏳ Creating your complaint...
     📤 Uploading 1 photo(s)...
     
     ✅ Complaint Registered Successfully!
     📌 Complaint ID: TKT-XYZ78901
     📸 Photos: 1 uploaded
```

---

## 🔧 Technical Implementation

### **Files Modified:**

#### 1. **bot-backend/src/botHandlers.js** (Telegram)
```javascript
// Added imports
const { uploadImage } = require('./controllers/imageController.js');
const axios = require('axios');

// Added user state management
const userStates = new Map();

// New states:
// - awaiting_image_confirmation
// - collecting_images

// New handlers:
// - bot.on('photo') - handles photo uploads
// - bot.on('text') - manages conversation flow
// - createTicketWithImages() - creates ticket with images
```

#### 2. **bot-backend/src/twilioWhatsappHandler.js** (WhatsApp)
```javascript
// Added imports
const { uploadImage } = require('./controllers/imageController.js');
const axios = require('axios');

// Enhanced handleIncomingMessage to detect media
// Added handleMediaMessage() for image processing
// Updated conversation states
// Added createTicketWithImagesWhatsApp()
```

---

## 📊 Features

### **Telegram:**
- ✅ Supports up to **5 photos** per complaint
- ✅ High-resolution image support
- ✅ Real-time confirmation for each photo
- ✅ Auto-submit when 5 photos reached
- ✅ /cancel command to abort

### **WhatsApp:**
- ✅ Supports up to **3 photos** per complaint
- ✅ Twilio media URL authentication
- ✅ Real-time photo count tracking
- ✅ Auto-submit when 3 photos reached
- ✅ /cancel command to abort

---

## 🗄️ Database Storage

Images are stored in:

1. **Supabase Storage** (`ticket-images` bucket):
   - Path: `{userId}/{uuid}.jpg`
   - Public URLs generated automatically

2. **Supabase Database** (`images` table):
   ```sql
   {
     id: uuid,
     ticket_id: "TKT-ABC12345",
     user_id: "123456789",
     file_name: "photo.jpg",
     file_path: "123456789/uuid.jpg",
     file_size: 245678,
     mime_type: "image/jpeg",
     storage_url: "https://...supabase.co/..."
   }
   ```

---

## 🎨 User Experience

### **Benefits:**
- 📸 Visual evidence helps faster resolution
- 🎯 Context-rich complaints with photos
- ⚡ Seamless upload process
- 🚀 Automatic AI analysis with images
- 📊 Better tracking with visual proof

### **User Messages:**
- Clear instructions at each step
- Photo count tracking (1/5, 2/5, etc.)
- Upload progress indicators
- Success confirmation with photo count

---

## 🧪 Testing

### **Test Telegram Bot:**

1. Send: `/ticket street light broken on elm street`
2. Reply: `yes`
3. Send photo (use your camera or gallery)
4. Send another photo (optional)
5. Type: `done`
6. Verify ticket created with photos

### **Test WhatsApp Bot:**

1. Send: `/ticket pothole on main road`
2. Reply: `yes`
3. Send photo via WhatsApp
4. Type: `done`
5. Verify ticket created with photo

### **Verify in Database:**

```bash
# Check images table
GET /api/images/ticket/TKT-ABC12345

# Response:
{
  "success": true,
  "images": [
    {
      "id": "uuid",
      "fileName": "photo.jpg",
      "url": "https://...supabase.co/storage/...",
      "ticketId": "TKT-ABC12345"
    }
  ]
}
```

---

## 🔄 Conversation States

### **State Machine:**

```
START
  ↓
awaiting_image_confirmation
  ↓ (yes)
collecting_images
  ↓ (done)
CREATE_TICKET_WITH_IMAGES
  ↓
END (clear state)
```

### **State Details:**

| State | Purpose | Valid Actions |
|-------|---------|---------------|
| `awaiting_image_confirmation` | Ask if user wants to add photos | "yes", "no", /cancel |
| `collecting_images` | Collect photo uploads | send photos, "done", /cancel |

---

## 🚨 Error Handling

### **Scenarios Covered:**

1. **User sends photo without /ticket:**
   ```
   📸 Please use /ticket first to start a complaint
   ```

2. **Photo upload fails:**
   ```
   ❌ Error uploading photo. Please try again.
   (Ticket still created without that photo)
   ```

3. **Network timeout:**
   ```
   ⚠️ Sorry, something went wrong. Please try again.
   ```

4. **Maximum photos reached:**
   ```
   (Auto-creates ticket with all uploaded photos)
   ```

---

## 📱 API Endpoints

Images can also be viewed via API:

```bash
# Get all images for a ticket
GET /api/images/ticket/:ticketId

# Get all images by a user
GET /api/images/user/:userId

# Delete an image
DELETE /api/images/:imageId
```

---

## 🎯 Next Steps

To enable this feature:

1. **Restart Backend:**
   ```bash
   cd bot-backend
   npm start
   ```

2. **Test Telegram:**
   - Open Telegram
   - Message your bot
   - Use `/ticket [description]`
   - Follow prompts

3. **Test WhatsApp:**
   - Join sandbox if not already
   - Send `/ticket [description]`
   - Follow prompts

---

## 📝 User Instructions

### **For Citizens:**

**Via Telegram:**
1. Start chat with bot
2. Send `/ticket [your complaint]`
3. Reply `yes` when asked about photos
4. Send photos (up to 5)
5. Type `done` when finished
6. Get ticket ID with photo confirmation

**Via WhatsApp:**
1. Message bot on WhatsApp
2. Send `/ticket [your complaint]`
3. Reply `yes` for photos
4. Send photos (up to 3)
5. Type `done` when finished
6. Get ticket confirmation

---

## ✅ Success Criteria

- ✅ Users can add photos before ticket creation
- ✅ Photos tagged with ticket ID
- ✅ Images stored in Supabase
- ✅ Public URLs generated
- ✅ Works on both Telegram and WhatsApp
- ✅ Graceful error handling
- ✅ Automatic AI analysis with or without photos

---

**Photo upload feature is now live!** 📸🎉
