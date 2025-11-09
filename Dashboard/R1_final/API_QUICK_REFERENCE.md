# 🚀 API Quick Reference

Base URL: `http://localhost:3001`

## 📋 Endpoints Summary

### Tickets
```
POST   /api/tickets                        - Create ticket
GET    /api/tickets                        - Get all tickets (with filters)
GET    /api/tickets/:ticketId              - Get ticket by ID
GET    /api/user/:userId/tickets           - Get user's tickets
PATCH  /api/tickets/:ticketId/status       - Update status
POST   /api/tickets/:ticketId/response     - Add response
GET    /api/dashboard/stats                - Get dashboard stats
```

### AI Analysis
```
POST   /api/analysis/analyze/:ticketId     - Analyze single ticket
POST   /api/analysis/analyze-all           - Analyze all pending
GET    /api/analysis/departments/stats     - Department statistics
GET    /api/analysis/departments/:dept     - Get tickets by department
```

### Images
```
POST   /api/images/upload                  - Upload single image
POST   /api/images/upload-multiple         - Upload multiple images
GET    /api/images/ticket/:ticketId        - Get ticket images
GET    /api/images/user/:userId            - Get user images
DELETE /api/images/:imageId                - Delete image
```

### General
```
GET    /health                             - Health check
GET    /                                   - API info
POST   /webhook/whatsapp                   - WhatsApp webhook
```

---

## 🎯 Common Use Cases

### 1. Create Ticket with Images
```javascript
// Step 1: Create ticket
const ticket = await fetch('/api/tickets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: '123456789',
    query: 'Pothole on Main Street'
  })
});
const ticketData = await ticket.json();

// Step 2: Upload images
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('userId', '123456789');
formData.append('ticketId', ticketData.data.ticketId);

await fetch('/api/images/upload', {
  method: 'POST',
  body: formData
});
```

### 2. Get Dashboard Data
```javascript
// Get overall stats
const stats = await fetch('/api/dashboard/stats');

// Get department breakdown
const deptStats = await fetch('/api/analysis/departments/stats');

// Get tickets by status
const openTickets = await fetch('/api/tickets?status=open');
```

### 3. View Ticket Details with Images
```javascript
// Get ticket
const ticket = await fetch('/api/tickets/TKT-ABC12345');

// Get ticket images
const images = await fetch('/api/images/ticket/TKT-ABC12345');
```

---

## 📊 Response Format

All responses follow this structure:

### Success
```json
{
  "success": true,
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "message": "Error description",
  "error": "Details"
}
```

---

## 🏷️ Status Values

- `open` - New ticket
- `in-progress` - Being worked on
- `resolved` - Fixed, awaiting closure
- `closed` - Completed

## 🎯 Priority Values

- `low` - Can wait
- `medium` - Normal priority
- `high` - Needs attention soon
- `urgent` - Critical issue

## 🏢 Departments

- `roadway` - Roads, street lights, traffic
- `cleaning` - Garbage, sanitation
- `drainage` - Sewage, flooding
- `water-supply` - Water issues
- `general` - Other

---

See **API_DOCUMENTATION.md** for complete details!
