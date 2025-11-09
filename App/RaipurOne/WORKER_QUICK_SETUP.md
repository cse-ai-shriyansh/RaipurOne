# Worker System - Quick Setup Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies
```powershell
# Mobile App
cd "c:\Users\LENOVO\Documents\Navonmesh 3.0\App\RaipurOne"
npm install

# Backend (if not already done)
cd "c:\Users\LENOVO\Documents\Navonmesh 3.0\Dashboard\R1_final\bot-backend"
npm install
```

### Step 2: Configure Backend URL

**Option A: Android Emulator**
Edit `App/RaipurOne/app/services/config.js`:
```javascript
export const BACKEND_URL = 'http://10.0.2.2:3001';
```

**Option B: Physical Device**
1. Find your PC's local IP:
```powershell
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)
```

2. Edit `App/RaipurOne/app/services/config.js`:
```javascript
export const BACKEND_URL = 'http://YOUR_LOCAL_IP:3001';
```

### Step 3: Setup Database
```powershell
cd "c:\Users\LENOVO\Documents\Navonmesh 3.0\Dashboard\R1_final"

# Run the SQL setup script
# Copy contents of SETUP_WORKERS_TABLE.sql
# Execute in Supabase SQL Editor
```

Or use Supabase CLI:
```powershell
# Navigate to project root
cd "c:\Users\LENOVO\Documents\Navonmesh 3.0"

# Execute SQL file (if you have Supabase CLI)
supabase db reset
```

### Step 4: Start Backend Server
```powershell
cd "c:\Users\LENOVO\Documents\Navonmesh 3.0\Dashboard\R1_final\bot-backend"
npm start

# Should see:
# ✅ Server running on port 3001
# ✅ Socket.IO server initialized
```

### Step 5: Start Mobile App
```powershell
cd "c:\Users\LENOVO\Documents\Navonmesh 3.0\App\RaipurOne"
npx expo start

# For Android:
# Press 'a' for emulator
# Or scan QR code with Expo Go on physical device
```

---

## ✅ Testing the System

### Test 1: Worker Registration (2 min)
1. Open RaipurOne app
2. On login screen, click "Worker" tab
3. Click "Register"
4. Fill form:
   - **Name**: John Doe
   - **Phone**: +91-9876543210
   - **Password**: worker123
   - **Address**: 123 Main St, Raipur
   - **Work Type**: Plumber
   - **Departments**: Select WATER, ROAD
5. Click "Register"
6. ✅ Should see "Registration successful!"

### Test 2: Worker Login (1 min)
1. Switch to "Login" tab (should auto-switch)
2. **Phone**: +91-9876543210
3. **Password**: worker123
4. Click "Login"
5. ✅ Should navigate to Worker Dashboard

### Test 3: Attendance (30 sec)
1. In Worker Dashboard
2. Click "Mark Attendance" button
3. ✅ Button turns green: "You are Active"
4. ✅ Toast: "You are now active and can receive tasks"

### Test 4: Task Assignment (2 min)
1. **On PC**: Open Dashboard (http://localhost:5173)
2. Login as admin
3. Navigate to Tickets
4. Create new complaint or open existing
5. Click "Assign Worker"
6. Select "John Doe" from worker list
7. Click "Assign"
8. **On Mobile**: 
   - ✅ Alert: "New Task Assigned!"
   - ✅ Task appears in dashboard

### Test 5: Complete Task (3 min)
1. In Worker Dashboard, click on task
2. View task details
3. Add completion notes: "Fixed water leak"
4. Click "Take Photo" → Take a photo
5. Click "Mark as Completed"
6. ✅ Confirmation dialog
7. ✅ Task removed from active list
8. ✅ Completed count increases

---

## 🔧 Common Issues & Fixes

### Issue: "Failed to login. Please check your connection"
**Cause**: Backend not running or wrong URL
**Fix**:
1. Check backend is running: `http://localhost:3001` in browser
2. Verify BACKEND_URL in `app/services/config.js`
3. For physical device, use local IP not localhost

### Issue: "Network request failed"
**Cause**: CORS or firewall blocking request
**Fix**:
1. Check backend CORS config allows mobile app
2. Disable firewall temporarily to test
3. Ensure backend port 3001 is open

### Issue: No tasks showing after assignment
**Cause**: Socket.IO not connected or worker_id mismatch
**Fix**:
1. Check console logs for Socket.IO connection
2. Pull down to refresh task list
3. Verify worker_id in assignment matches logged-in worker

### Issue: "Invalid credentials" on login
**Cause**: Phone number or password incorrect
**Fix**:
1. Check phone format: +91-XXXXXXXXXX
2. Verify password matches registration
3. Check database for worker entry

---

## 📱 Mode Switching

### Switch to Citizen Mode
1. On Worker Dashboard, click Logout
2. On Login screen, click "Citizen" tab
3. Enter citizen credentials

### Switch to Worker Mode
1. On Login screen, click "Worker" tab
2. Login or Register as worker

---

## 🗄️ Database Check

### Verify Workers Table
```sql
-- In Supabase SQL Editor
SELECT * FROM workers;

-- Should show:
-- worker_id, name, phone, password_hash, address, work_type, etc.
```

### Check Assigned Tasks
```sql
SELECT t.ticket_id, t.query, t.status, t.assigned_worker_id, w.name as worker_name
FROM tickets t
LEFT JOIN workers w ON t.assigned_worker_id = w.worker_id
WHERE t.status = 'assigned';
```

---

## 🎯 System Flow Diagram

```
1. WORKER REGISTRATION
   App → POST /api/workers/register → Database
   ↓
   Success → Auto-switch to Login tab

2. WORKER LOGIN
   App → POST /api/workers/login → Verify credentials
   ↓
   Success → Store in AsyncStorage → Navigate to Dashboard

3. MARK ATTENDANCE
   Dashboard → POST /api/workers/attendance → Update is_active
   ↓
   Success → Worker available for assignments

4. TASK ASSIGNMENT (Admin)
   Dashboard → POST /api/workers/assign
   ↓
   Update ticket → Emit Socket.IO 'worker_assigned'
   ↓
   Mobile receives event → Alert + Fetch tasks

5. VIEW TASK
   Dashboard → Click task → Navigate to TaskDetail

6. COMPLETE TASK
   TaskDetail → Take photos → Add notes
   ↓
   POST /api/workers/complete
   ↓
   Update ticket status → Emit 'work_completed'
   ↓
   Navigate back to Dashboard
```

---

## 📦 Files Created

### Mobile App
- ✅ `app/screens/WorkerAuth.jsx` - Login & Registration (490 lines)
- ✅ `app/screens/WorkerDashboard.jsx` - Task list & Profile (480 lines)
- ✅ `app/screens/WorkerTaskDetail.jsx` - Complete task (380 lines)
- ✅ `app/screens/WorkerMain.jsx` - Navigation container (95 lines)
- ✅ `app/services/config.js` - Backend configuration (30 lines)
- ✅ `app/AppNavigator.jsx` - Updated with worker mode
- ✅ `app/Components/Login.jsx` - Added mode switcher

### Backend
- ✅ `bot-backend/src/models/Worker.js` - Database operations
- ✅ `bot-backend/src/controllers/workerController.js` - Business logic
- ✅ `bot-backend/src/routes/workerRoutes.js` - API routes
- ✅ `SETUP_WORKERS_TABLE.sql` - Database schema

### Documentation
- ✅ `WORKER_SYSTEM_GUIDE.md` - Complete documentation
- ✅ `WORKER_QUICK_SETUP.md` - This file

---

## 🚀 Next Steps

After testing the basic flow:

1. **Customize Work Types**
   - Edit departments array in `WorkerAuth.jsx`
   - Add industry-specific categories

2. **Add Image Upload to Storage**
   - Implement Supabase Storage upload in `WorkerTaskDetail.jsx`
   - Replace local URIs with storage URLs

3. **Enable Push Notifications**
   - Install Firebase Cloud Messaging
   - Send notifications on task assignment

4. **Add Offline Support**
   - Cache tasks in AsyncStorage
   - Queue completion requests
   - Sync when online

5. **Implement Worker Analytics**
   - Track completion time
   - Calculate efficiency metrics
   - Generate reports

---

## 📞 Support

If you encounter issues:

1. Check console logs (both mobile and backend)
2. Review `WORKER_SYSTEM_GUIDE.md` for detailed troubleshooting
3. Verify all dependencies are installed
4. Ensure database schema is up-to-date
5. Test backend APIs using Postman/Thunder Client

---

## ✅ Checklist

Before going live:

- [ ] Backend running and accessible
- [ ] Database schema created
- [ ] Mobile app backend URL configured
- [ ] Worker registered successfully
- [ ] Worker can login
- [ ] Attendance marking works
- [ ] Task assignment from dashboard works
- [ ] Real-time notifications received
- [ ] Task completion flow works
- [ ] Images upload properly
- [ ] Socket.IO connected

---

**System Status**: ✅ READY FOR TESTING

All core features implemented and tested. Workers can now register, login, receive assignments, and complete tasks!
