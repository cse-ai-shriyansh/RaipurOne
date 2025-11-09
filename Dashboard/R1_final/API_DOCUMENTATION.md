# 🚀 Municipal Services Bot - Complete API Documentation

## Base URL
```
http://localhost:3001
```

For production, use your deployed URL or localtunnel URL.

---

## 📋 Table of Contents
1. [General Endpoints](#general-endpoints)
2. [Ticket Management APIs](#ticket-management-apis)
3. [AI Analysis APIs](#ai-analysis-apis)
4. [Image Management APIs](#image-management-apis)
5. [Response Models](#response-models)
6. [Error Handling](#error-handling)

---

## General Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "Bot backend is running"
}
```

### Root Info
```http
GET /
```

**Response:**
```json
{
  "message": "Municipal Services Bot Backend API",
  "version": "2.0.0",
  "database": "Supabase (PostgreSQL)",
  "platforms": ["Telegram", "WhatsApp (Twilio Official API)"],
  "status": "running"
}
```

---

## 🎫 Ticket Management APIs

### 1. Create Ticket
```http
POST /api/tickets
```

**Request Body:**
```json
{
  "userId": "123456789",          // Required
  "username": "john_doe",          // Optional
  "firstName": "John",             // Optional
  "lastName": "Doe",               // Optional
  "query": "Street light broken", // Required
  "category": "general"            // Optional (default: "general")
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ticket created successfully",
  "data": {
    "id": "uuid",
    "ticketId": "TKT-ABC12345",
    "userId": "123456789",
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe",
    "query": "Street light broken",
    "category": "general",
    "status": "open",
    "priority": "medium",
    "createdAt": "2025-11-05T12:00:00Z",
    "updatedAt": "2025-11-05T12:00:00Z",
    "responses": []
  }
}
```

**Note:** Tickets are automatically analyzed by AI after creation.

---

### 2. Get All Tickets (with filters)
```http
GET /api/tickets?status=open&priority=high&category=general&userId=123
```

**Query Parameters:**
- `status` (optional): `open`, `in-progress`, `resolved`, `closed`
- `priority` (optional): `low`, `medium`, `high`, `urgent`
- `category` (optional): `general`, etc.
- `userId` (optional): Filter by specific user

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "ticketId": "TKT-ABC12345",
      "userId": "123456789",
      "username": "john_doe",
      "firstName": "John",
      "lastName": "Doe",
      "query": "Street light broken",
      "category": "general",
      "status": "open",
      "priority": "high",
      "createdAt": "2025-11-05T12:00:00Z",
      "updatedAt": "2025-11-05T12:00:00Z",
      "responses": []
    }
  ]
}
```

---

### 3. Get Ticket by ID
```http
GET /api/tickets/:ticketId
```

**Example:**
```http
GET /api/tickets/TKT-ABC12345
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "ticketId": "TKT-ABC12345",
    "userId": "123456789",
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe",
    "query": "Street light broken",
    "category": "general",
    "status": "open",
    "priority": "high",
    "createdAt": "2025-11-05T12:00:00Z",
    "updatedAt": "2025-11-05T12:00:00Z",
    "responses": [
      {
        "message": "We are looking into this issue",
        "timestamp": "2025-11-05T12:30:00Z"
      }
    ]
  }
}
```

---

### 4. Get User's Tickets
```http
GET /api/user/:userId/tickets
```

**Example:**
```http
GET /api/user/123456789/tickets
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ticketId": "TKT-ABC12345",
      "query": "Street light broken",
      "status": "open",
      "priority": "high",
      "createdAt": "2025-11-05T12:00:00Z"
    }
  ]
}
```

---

### 5. Update Ticket Status
```http
PATCH /api/tickets/:ticketId/status
```

**Request Body:**
```json
{
  "status": "in-progress"  // open | in-progress | resolved | closed
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticketId": "TKT-ABC12345",
    "status": "in-progress",
    "updatedAt": "2025-11-05T13:00:00Z"
  }
}
```

---

### 6. Add Response to Ticket
```http
POST /api/tickets/:ticketId/response
```

**Request Body:**
```json
{
  "message": "We have dispatched a team to fix this issue"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticketId": "TKT-ABC12345",
    "responses": [
      {
        "message": "We have dispatched a team to fix this issue",
        "timestamp": "2025-11-05T14:00:00Z"
      }
    ],
    "updatedAt": "2025-11-05T14:00:00Z"
  }
}
```

---

### 7. Get Dashboard Statistics
```http
GET /api/dashboard/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTickets": 150,
    "openTickets": 45,
    "inProgressTickets": 30,
    "resolvedTickets": 60,
    "closedTickets": 15,
    "totalUsers": 85,
    "statusBreakdown": {
      "open": 45,
      "in-progress": 30,
      "resolved": 60,
      "closed": 15
    },
    "priorityBreakdown": {
      "low": 20,
      "medium": 60,
      "high": 50,
      "urgent": 20
    }
  }
}
```

---

## 🤖 AI Analysis APIs

### 1. Analyze Single Ticket
```http
POST /api/analysis/analyze/:ticketId
```

**Example:**
```http
POST /api/analysis/analyze/TKT-ABC12345
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticketId": "TKT-ABC12345",
    "department": "roadway",
    "priority": "high",
    "requestType": "complaint",
    "confidence": 0.95,
    "analyzedAt": "2025-11-05T12:00:00Z"
  }
}
```

**Note:** Tickets are automatically analyzed when created. This endpoint is for manual re-analysis.

---

### 2. Analyze All Pending Tickets
```http
POST /api/analysis/analyze-all
```

**Response:**
```json
{
  "success": true,
  "message": "Analyzed 10 tickets",
  "analyzed": 10,
  "failed": 0,
  "data": [
    {
      "ticketId": "TKT-ABC12345",
      "department": "roadway",
      "priority": "high"
    }
  ]
}
```

---

### 3. Get Department Statistics
```http
GET /api/analysis/departments/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "departments": [
      {
        "department": "roadway",
        "totalTickets": 45,
        "openTickets": 15,
        "inProgressTickets": 10,
        "resolvedTickets": 18,
        "closedTickets": 2,
        "avgConfidence": 0.92,
        "priorityBreakdown": {
          "low": 5,
          "medium": 20,
          "high": 15,
          "urgent": 5
        }
      },
      {
        "department": "cleaning",
        "totalTickets": 30,
        "openTickets": 10,
        "inProgressTickets": 8,
        "resolvedTickets": 10,
        "closedTickets": 2
      },
      {
        "department": "drainage",
        "totalTickets": 25,
        "openTickets": 8,
        "inProgressTickets": 7,
        "resolvedTickets": 9,
        "closedTickets": 1
      },
      {
        "department": "water-supply",
        "totalTickets": 20,
        "openTickets": 6,
        "inProgressTickets": 5,
        "resolvedTickets": 8,
        "closedTickets": 1
      },
      {
        "department": "general",
        "totalTickets": 30,
        "openTickets": 6,
        "inProgressTickets": 10,
        "resolvedTickets": 12,
        "closedTickets": 2
      }
    ],
    "totalDepartmentTickets": 150
  }
}
```

**Departments:**
- `roadway` - Roads, street lights, potholes, traffic signals
- `cleaning` - Garbage, sanitation, public cleanliness
- `drainage` - Sewage, drainage blockage, flooding
- `water-supply` - Water leaks, supply issues
- `general` - Other issues

---

### 4. Get Tickets by Department
```http
GET /api/analysis/departments/:department
```

**Example:**
```http
GET /api/analysis/departments/roadway
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ticketId": "TKT-ABC12345",
      "department": "roadway",
      "priority": "high",
      "query": "Street light broken",
      "status": "open",
      "confidence": 0.95,
      "createdAt": "2025-11-05T12:00:00Z"
    }
  ]
}
```

---

## 📷 Image Management APIs

### 1. Upload Single Image
```http
POST /api/images/upload
```

**Content-Type:** `multipart/form-data`

**Form Data:**
```
image: [file]              // Required - Image file
userId: "123456789"        // Required
ticketId: "TKT-ABC12345"   // Optional
```

**Response:**
```json
{
  "success": true,
  "image": {
    "id": "uuid",
    "fileName": "image.jpg",
    "url": "https://supabase.co/storage/.../image.jpg",
    "ticketId": "TKT-ABC12345",
    "userId": "123456789",
    "fileSize": 86432,
    "mimeType": "image/jpeg",
    "createdAt": "2025-11-05T12:00:00Z"
  }
}
```

**Limits:**
- Max file size: 10MB
- Allowed types: Images only (jpg, png, gif, webp, etc.)

---

### 2. Upload Multiple Images
```http
POST /api/images/upload-multiple
```

**Content-Type:** `multipart/form-data`

**Form Data:**
```
images: [file1, file2, file3]  // Required - Up to 10 images
userId: "123456789"            // Required
ticketId: "TKT-ABC12345"       // Optional
```

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "id": "uuid-1",
      "fileName": "image1.jpg",
      "url": "https://supabase.co/storage/.../image1.jpg",
      "ticketId": "TKT-ABC12345",
      "userId": "123456789",
      "fileSize": 86432,
      "mimeType": "image/jpeg"
    },
    {
      "id": "uuid-2",
      "fileName": "image2.jpg",
      "url": "https://supabase.co/storage/.../image2.jpg",
      "ticketId": "TKT-ABC12345",
      "userId": "123456789",
      "fileSize": 92145,
      "mimeType": "image/jpeg"
    }
  ]
}
```

---

### 3. Get Ticket Images
```http
GET /api/images/ticket/:ticketId
```

**Example:**
```http
GET /api/images/ticket/TKT-ABC12345
```

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "id": "uuid",
      "fileName": "image.jpg",
      "url": "https://supabase.co/storage/.../image.jpg",
      "ticketId": "TKT-ABC12345",
      "userId": "123456789",
      "fileSize": 86432,
      "mimeType": "image/jpeg",
      "createdAt": "2025-11-05T12:00:00Z"
    }
  ]
}
```

---

### 4. Get User Images
```http
GET /api/images/user/:userId
```

**Example:**
```http
GET /api/images/user/123456789
```

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "id": "uuid",
      "fileName": "image.jpg",
      "url": "https://supabase.co/storage/.../image.jpg",
      "ticketId": "TKT-ABC12345",
      "userId": "123456789",
      "fileSize": 86432,
      "mimeType": "image/jpeg",
      "createdAt": "2025-11-05T12:00:00Z"
    }
  ]
}
```

---

### 5. Delete Image
```http
DELETE /api/images/:imageId
```

**Request Body:**
```json
{
  "userId": "123456789"  // Required for verification
}
```

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

---

## 📦 Response Models

### Ticket Model
```typescript
{
  id: string;              // UUID
  ticketId: string;        // TKT-XXXXXXXX
  userId: string;          // User's unique ID
  username: string;        // Username
  firstName: string;       // User's first name
  lastName: string;        // User's last name
  query: string;           // Complaint/query text
  category: string;        // Ticket category
  status: "open" | "in-progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;       // ISO 8601 timestamp
  updatedAt: string;       // ISO 8601 timestamp
  responses: Response[];   // Array of responses
}
```

### Response Model
```typescript
{
  message: string;         // Response message
  timestamp: string;       // ISO 8601 timestamp
}
```

### Image Model
```typescript
{
  id: string;              // UUID
  fileName: string;        // Original file name
  url: string;             // Public URL
  ticketId: string;        // Associated ticket ID
  userId: string;          // Uploader's user ID
  fileSize: number;        // File size in bytes
  mimeType: string;        // MIME type (e.g., image/jpeg)
  createdAt: string;       // ISO 8601 timestamp
}
```

### Department Analysis Model
```typescript
{
  ticketId: string;
  department: "roadway" | "cleaning" | "drainage" | "water-supply" | "general";
  priority: "low" | "medium" | "high" | "urgent";
  requestType: "complaint" | "request" | "inquiry" | "feedback";
  confidence: number;      // 0.0 to 1.0
  analyzedAt: string;      // ISO 8601 timestamp
}
```

---

## ⚠️ Error Handling

All API errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created (for POST requests)
- `400` - Bad Request (invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "message": "userId and query are required"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Ticket not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error creating ticket",
  "error": "Database connection failed"
}
```

---

## 🔒 CORS Configuration

CORS is enabled for all origins. In production, configure specific origins in `.env`:

```env
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

---

## 🚀 Quick Start Examples

### JavaScript/Fetch Example
```javascript
// Create a ticket
const createTicket = async () => {
  const response = await fetch('http://localhost:3001/api/tickets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: '123456789',
      username: 'john_doe',
      firstName: 'John',
      lastName: 'Doe',
      query: 'Street light broken on Main Street',
      category: 'general'
    })
  });
  
  const data = await response.json();
  console.log(data);
};

// Get all tickets
const getTickets = async () => {
  const response = await fetch('http://localhost:3001/api/tickets?status=open');
  const data = await response.json();
  console.log(data);
};

// Upload image
const uploadImage = async (file, userId, ticketId) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('userId', userId);
  formData.append('ticketId', ticketId);
  
  const response = await fetch('http://localhost:3001/api/images/upload', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  console.log(data);
};
```

### Axios Example
```javascript
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Create ticket
const createTicket = async (ticketData) => {
  const response = await axios.post(`${API_URL}/tickets`, ticketData);
  return response.data;
};

// Get department stats
const getDepartmentStats = async () => {
  const response = await axios.get(`${API_URL}/analysis/departments/stats`);
  return response.data;
};

// Get ticket images
const getTicketImages = async (ticketId) => {
  const response = await axios.get(`${API_URL}/images/ticket/${ticketId}`);
  return response.data;
};
```

---

## 📝 Notes

1. **Automatic AI Analysis**: When a ticket is created, it's automatically analyzed by Google Gemini AI and assigned to a department with priority.

2. **Multi-Key Fallback**: The AI service uses 3 API keys with automatic fallback if one fails.

3. **Image Storage**: Images are stored in Supabase Storage with public URLs.

4. **Real-time Updates**: Tickets are updated in real-time in the database.

5. **Bot Integration**: Tickets can be created via Telegram bot or WhatsApp (Twilio).

---

## 🔧 Environment Variables Required

```env
# Server
PORT=3001

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini AI (3 keys for fallback)
GEMINI_API_KEY_1=your_gemini_key_1
GEMINI_API_KEY_2=your_gemini_key_2
GEMINI_API_KEY_3=your_gemini_key_3

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

---

**API Version:** 2.0.0  
**Last Updated:** November 5, 2025  
**Database:** Supabase (PostgreSQL)  
**AI Engine:** Google Gemini 2.0 Flash  

For support, check the documentation in the `/Markdown` folder. 🚀
