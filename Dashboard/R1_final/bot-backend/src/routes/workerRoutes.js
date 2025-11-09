const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');

// IMPORTANT: Specific routes MUST come before parameterized routes
// Otherwise /workers/available will match /workers/:workerId

// Worker Authentication (for mobile app)
router.post('/workers/register', workerController.registerWorker);
router.post('/workers/login', workerController.loginWorker);
router.post('/workers/attendance', workerController.markAttendance);
router.post('/workers/assign', workerController.assignWorker);
router.post('/workers/complete', workerController.completeTaskHandler);

// Worker task submission with video and documents
router.post('/workers/tasks/:taskId/submit', workerController.submitTaskWithMedia);
router.get('/workers/tasks/:taskId/submission', workerController.getTaskSubmission);

// Admin approval endpoints
router.patch('/workers/tasks/:taskId/approve', workerController.approveTaskSubmission);
router.patch('/workers/tasks/:taskId/reject', workerController.rejectTaskSubmission);
router.get('/workers/submissions/pending', workerController.getPendingSubmissions);

// Admin: Assign ticket to worker
router.post('/workers/assign-from-ticket', workerController.assignTicketToWorker);

// Worker notifications
router.post('/workers/:workerId/notify', async (req, res) => {
  try {
    const { workerId } = req.params;
    const { type, message, data } = req.body;
    
    const notification = {
      type,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    
    // Emit notification via Socket.IO
    if (req.app.get('io')) {
      req.app.get('io').emit(`worker_notification_${workerId}`, notification);
    }
    
    res.json({
      success: true,
      message: 'Notification sent successfully',
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending notification',
      error: error.message,
    });
  }
});

// Specific GET routes (must come before /:workerId)
router.get('/workers/available', workerController.getAvailableWorkersHandler);

// Worker location tracking
router.post('/workers/:workerId/location', workerController.updateWorkerLocation);

// Admin endpoints - Get all workers
router.get('/workers', workerController.getWorkers);

// Parameterized routes (must come last)
router.get('/workers/:worker_id/tasks', workerController.getWorkerTasks);
router.get('/workers/:workerId', workerController.getWorkerByIdHandler);
router.post('/workers/:workerId', workerController.createWorkerHandler);
router.patch('/workers/:workerId', workerController.updateWorkerHandler);

module.exports = router;
