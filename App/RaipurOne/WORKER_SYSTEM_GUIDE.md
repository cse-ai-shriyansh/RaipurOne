# Worker Management System - Complete Guide

## Overview
The Worker Management System allows municipal workers to register, login, receive task assignments, and complete work orders through the RaipurOne mobile app.

## Features Implemented

### 1. Worker Authentication
- **Registration**: Workers can self-register with their details
- **Login**: Secure authentication with phone + password
- **Password Security**: bcrypt hashing with 10 salt rounds
- **Session Management**: AsyncStorage for persistent login

### 2. Worker Dashboard
- **Profile Display**: Shows worker name, work type, stats
- **Statistics**: Active tasks, completed tasks, rating
- **Attendance Marking**: Toggle active/offline status
- **Real-time Updates**: Socket.IO for instant task assignments
- **Task List**: View all assigned tasks with details

### 3. Task Management
- **View Tasks**: See all assigned tickets with images, location, deadline
- **Task Details**: Full complaint information
- **Completion Flow**: Add notes and photos to mark tasks complete
- **Photo Upload**: Camera-only (no gallery) for completion verification

## Architecture

### Mobile App (React Native)
```
app/
├── screens/
│   ├── WorkerMain.jsx          # Main worker container
│   ├── WorkerAuth.jsx           # Login & Registration
│   ├── WorkerDashboard.jsx      # Task list & profile
│   └── WorkerTaskDetail.jsx     # Complete task flow
├── services/
│   └── config.js                # Backend URL configuration
└── AppNavigator.jsx             # Navigation with mode switching
```

### Backend (Node.js + Express)
```
bot-backend/
└── src/
    ├── models/
    │   └── Worker.js            # Database operations
    ├── controllers/
    │   └── workerController.js  # Business logic
    └── routes/
        └── workerRoutes.js      # API endpoints
```

### Database (PostgreSQL)
```
workers table:
- worker_id (Primary Key, WRK-XXXXXXXX)
- name, phone (unique), email
- password_hash (bcrypt)
- address, work_type
- departments (array)
- status (available/busy/offline)
- is_active (attendance tracking)
- active_tasks, completed_tasks, rating
- created_at, last_active_at
```

## API Endpoints

### Authentication
```
POST /api/workers/register
Body: {
  name: string,
  phone: string,
  email: string (optional),
  password: string,
  address: string,
  work_type: string,
  departments: string[]
}
Response: { success, data: worker, message }

POST /api/workers/login
Body: { phone: string, password: string }
Response: { success, data: worker, message }
```

### Attendance
```
POST /api/workers/attendance
Body: { worker_id: string, is_active: boolean }
Response: { success, data: worker, message }
```

### Tasks
```
GET /api/workers/:worker_id/tasks
Response: { success, data: tickets[], message }

POST /api/workers/complete
Body: {
  ticket_id: string,
  worker_id: string,
  completion_notes: string,
  completion_images: string[]
}
Response: { success, data: ticket, message }
```

### Worker Management (Admin)
```
GET /api/workers
Response: { success, data: workers[], message }

POST /api/workers/assign
Body: { ticket_id: string, worker_id: string }
Response: { success, data: ticket, message }
```

## User Flow

### Worker Registration
1. Open app → Switch to "Worker" mode on login screen
2. Click "Register" tab
3. Fill form:
   - Full Name *
   - Phone Number * (unique)
   - Email (optional)
   - Password *
   - Address *
   - Work Type * (e.g., "Plumber", "Electrician")
   - Departments * (select from: WATER, ROAD, GARBAGE, etc.)
4. Submit → Success message → Automatically switches to Login tab

### Worker Login
1. Enter Phone Number
2. Enter Password
3. Login → Worker Dashboard

### Worker Dashboard
1. **Profile Section**:
   - Worker name & work type
   - Stats: Active tasks, Completed tasks, Rating
   - Logout button

2. **Attendance Toggle**:
   - Mark Active (green) / Offline (red)
   - Only active workers receive new assignments

3. **Task List**:
   - Shows all assigned tasks
   - Each card displays: Ticket ID, status, query, location, deadline, images
   - Pull-to-refresh to update
   - Click task → Task Detail screen

### Task Completion
1. Click on task from dashboard
2. View:
   - Ticket details (ID, status, query, location, phone, deadline)
   - Original complaint images
3. Complete Task:
   - Add completion notes (required)
   - Take completion photos (required, camera only)
   - Click "Mark as Completed"
4. Confirmation → Task completed → Back to dashboard

### Admin Workflow (Dashboard)
1. Admin views complaint in TicketViewer
2. Clicks "Assign Worker" button
3. System fetches available workers (filtered by department)
4. Admin selects worker
5. System:
   - Updates ticket status to "assigned"
   - Assigns worker_id to ticket
   - Increments worker's active_tasks
   - Emits Socket.IO 'worker_assigned' event
6. Worker receives real-time notification on mobile app
7. Task appears in worker's dashboard

## Configuration

### Backend URL (app/services/config.js)
```javascript
// Development (choose one based on your setup)
export const BACKEND_URL = 'http://localhost:3001'; // Emulator
export const BACKEND_URL = 'http://10.0.2.2:3001'; // Android Emulator
export const BACKEND_URL = 'http://192.168.x.x:3001'; // Physical device

// Production
export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
```

### Environment Variable
Create `.env` file in RaipurOne folder:
```
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

## Real-time Features (Socket.IO)

### Events Emitted by Backend
```javascript
// When worker is assigned to ticket
socket.emit('worker_assigned', {
  ticket_id: 'TICK-12345678',
  worker_id: 'WRK-ABCD1234',
  message: 'New task assigned'
});

// When work is completed
socket.emit('work_completed', {
  ticket_id: 'TICK-12345678',
  worker_id: 'WRK-ABCD1234',
  status: 'completed'
});
```

### Events Received by Mobile App
```javascript
socket.on('worker_assigned', (data) => {
  if (data.worker_id === currentWorker.worker_id) {
    Alert.alert('New Task Assigned!');
    fetchTasks(); // Refresh task list
  }
});
```

## Security

### Password Hashing
```javascript
// Registration
const hashedPassword = await bcrypt.hash(password, 10);

// Login
const isMatch = await bcrypt.compare(password, worker.password_hash);
```

### Data Protection
- Passwords never returned in API responses
- Phone numbers are unique (enforced in database and API)
- Worker data stored in AsyncStorage (encrypted by OS)

## Database Schema

```sql
CREATE TABLE workers (
  worker_id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100),
  password_hash TEXT NOT NULL,
  address TEXT NOT NULL,
  work_type VARCHAR(100) NOT NULL,
  departments TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'offline',
  is_active BOOLEAN DEFAULT false,
  active_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP
);

CREATE INDEX idx_workers_phone ON workers(phone);
CREATE INDEX idx_workers_status ON workers(status);
CREATE INDEX idx_workers_departments ON workers USING GIN(departments);
```

## Testing

### Test Worker Registration
1. Phone: `+91-9876543210`
2. Name: `Test Worker`
3. Password: `worker123`
4. Address: `123 Test Street, Raipur`
5. Work Type: `Plumber`
6. Departments: `WATER`, `ROAD`

### Test Worker Login
1. Phone: `+91-9876543210`
2. Password: `worker123`

### Test Task Assignment (From Dashboard)
1. Create a complaint (user mode)
2. Login to dashboard as admin
3. Open TicketViewer
4. Click "Assign Worker"
5. Select test worker
6. Check mobile app → Task should appear instantly

## Troubleshooting

### Connection Issues
**Problem**: Cannot connect to backend
**Solution**: 
- Check BACKEND_URL in `app/services/config.js`
- For physical device, use local IP (192.168.x.x)
- For Android emulator, use 10.0.2.2
- Ensure backend is running on correct port

### Socket.IO Not Connecting
**Problem**: Real-time updates not working
**Solution**:
- Verify backend Socket.IO server is running
- Check BACKEND_URL matches Socket.IO server
- Inspect console logs for connection errors
- Ensure CORS is configured on backend

### AsyncStorage Not Persisting
**Problem**: Worker logged out on app restart
**Solution**:
- Check AsyncStorage.setItem is awaited
- Verify key is 'worker' (consistent across files)
- Clear app data and re-login

### Image Upload Failing
**Problem**: Completion photos not uploading
**Solution**:
- Verify camera permissions granted
- Check image picker configuration
- Implement proper upload to Supabase Storage (currently uses local URIs)

## Dependencies

### Mobile App
```json
{
  "@react-native-async-storage/async-storage": "^1.x.x",
  "socket.io-client": "^4.x.x",
  "expo-image-picker": "~17.0.8",
  "@expo/vector-icons": "^15.0.3"
}
```

### Backend
```json
{
  "bcrypt": "^5.x.x",
  "socket.io": "^4.x.x",
  "express": "^4.x.x",
  "uuid": "^9.x.x"
}
```

## Future Enhancements

### Phase 1 (Completed)
- ✅ Worker registration and authentication
- ✅ Worker dashboard with task list
- ✅ Attendance marking
- ✅ Task completion flow
- ✅ Real-time notifications
- ✅ Black/White theme

### Phase 2 (Planned)
- ⏳ Live camera with GPS lock
- ⏳ Gemini AI verification
- ⏳ Push notifications (FCM)
- ⏳ Worker ratings and reviews
- ⏳ Attendance history
- ⏳ Task filters and sorting

### Phase 3 (Future)
- ⏳ Multi-language support
- ⏳ Offline mode
- ⏳ Worker analytics dashboard
- ⏳ Salary/payment tracking
- ⏳ Worker leaderboard

## License
Part of RaipurOne Municipal Services Platform

## Support
For issues or questions, contact the development team.
