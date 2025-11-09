# Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     TELEGRAM BOT SYSTEM                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────┐         ┌──────────────────┐      ┌──────────────────┐
│  TELEGRAM USERS │         │   TELEGRAM BOT   │      │  REACT DASHBOARD │
│                 │────────▶│  (Node.js)       │◀─────│                  │
│  /start         │         │  - Commands      │      │  - View Tickets  │
│  /ticket        │         │  - DB Updates    │      │  - Manage Tickets│
│  /mytickets     │         │  - Responses     │      │  - Statistics    │
└─────────────────┘         └────────┬─────────┘      └────────┬─────────┘
                                     │                         │
                                     │                         │
                              ┌──────▼─────────────────────────▼─────┐
                              │         EXPRESS REST API              │
                              │  (/api/tickets, /api/dashboard/stats) │
                              └────────────────┬──────────────────────┘
                                               │
                              ┌────────────────▼──────────────┐
                              │      MONGODB DATABASE         │
                              │  - Tickets Collection         │
                              │  - Users Collection           │
                              │  - Responses & History        │
                              └───────────────────────────────┘
```

## Data Flow

### 1. Creating a Ticket
```
User → /ticket command → Bot Handler → Controller 
→ Generate Ticket ID → Save to MongoDB → Response to User
```

### 2. Viewing Dashboard
```
Dashboard (React) → API Request → Express Route 
→ Controller → MongoDB Query → JSON Response → Display
```

### 3. Updating Ticket Status
```
Dashboard → PATCH Request → Express Route → Controller 
→ Update MongoDB → Webhook/Next Sync → User Notified
```

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Bot Framework**: Telegraf (Telegram Bot API)
- **Database**: MongoDB + Mongoose
- **API**: Express.js
- **Language**: JavaScript (ES6+)

### Frontend
- **Framework**: React 18
- **Styling**: CSS3
- **HTTP Client**: Axios
- **Routing**: React Router (optional)

### Database
- **Type**: NoSQL (MongoDB)
- **Collections**: 
  - Tickets (primary data)
  - Users (tracking)

## API Architecture

```
/api/
├── /tickets
│   ├── GET (list all)
│   ├── GET /:id (single ticket)
│   ├── PATCH /:id/status (update)
│   └── POST /:id/response (add response)
├── /user/:userId/tickets (user specific)
└── /dashboard/stats (statistics)
```

## Component Hierarchy (Frontend)

```
App
├── Header (Navigation)
├── Dashboard (Page)
│   ├── StatCards
│   │   ├── StatCard (Total)
│   │   ├── StatCard (Open)
│   │   ├── StatCard (In Progress)
│   │   └── StatCard (Resolved)
│   └── TicketsList (Recent)
│       └── TicketCard []
├── TicketsList (Page)
│   ├── Filters
│   └── TicketCard []
├── TicketDetail (Page)
│   ├── Ticket Info
│   ├── Query Section
│   ├── Responses
│   └── Actions Panel
└── Statistics (Page)
    ├── Category Chart
    ├── Priority Chart
    └── Summary
```

## Database Schema

### Tickets Collection
```json
{
  "_id": ObjectId,
  "ticketId": "TKT-ABC12345",
  "userId": "123456789",
  "username": "john_doe",
  "firstName": "John",
  "lastName": "Doe",
  "query": "I need help with my account",
  "category": "support",
  "status": "open",
  "priority": "medium",
  "responses": [
    {
      "message": "We will help you shortly",
      "timestamp": ISODate
    }
  ],
  "notes": "",
  "assignedTo": null,
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

### Users Collection
```json
{
  "_id": ObjectId,
  "userId": "123456789",
  "username": "john_doe",
  "firstName": "John",
  "lastName": "Doe",
  "chatId": "123456789",
  "isBot": false,
  "ticketsCount": 2,
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

## Request/Response Examples

### Create Ticket (Bot)
```
POST /api/tickets
{
  "userId": "123456789",
  "username": "john_doe",
  "query": "Cannot reset password",
  "category": "support"
}

Response:
{
  "success": true,
  "data": {
    "ticketId": "TKT-ABC12345",
    "status": "open",
    ...
  }
}
```

### Get Dashboard Stats
```
GET /api/dashboard/stats

Response:
{
  "success": true,
  "data": {
    "totalTickets": 45,
    "openTickets": 12,
    "inProgressTickets": 8,
    "resolvedTickets": 25,
    "totalUsers": 30,
    "ticketsByCategory": [
      { "_id": "support", "count": 20 },
      { "_id": "billing", "count": 15 }
    ],
    "ticketsByPriority": [
      { "_id": "high", "count": 10 }
    ]
  }
}
```

## Error Handling

- **Bot Level**: Try-catch in handlers, user-friendly messages
- **API Level**: Express middleware for error handling
- **Frontend**: Error states in components, fallback UI
- **Database**: Mongoose validation, transaction support

## Security Considerations

1. **Environment Variables**: Sensitive data in .env
2. **Input Validation**: Server-side validation in routes
3. **Rate Limiting**: Can be added to bot handlers
4. **CORS**: Configured in Express
5. **MongoDB**: Use connection string with credentials

## Scalability

### Current Setup
- Good for ~1000s of tickets
- Suitable for single server deployment

### For Production
- Add Redis for caching
- Implement database indexing
- Use message queues (Bull, RabbitMQ)
- Load balance API servers
- CDN for frontend assets
- Database replication

## Monitoring & Logging

Currently logs to console. For production:
- Winston or Bunyan for logging
- Error tracking (Sentry)
- Analytics (Mixpanel, Segment)
- Performance monitoring (New Relic)
