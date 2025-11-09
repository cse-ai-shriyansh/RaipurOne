const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabase } = require('../config/supabase');
const { validateWork, analyzeImage } = require('../services/geminiService');
const { sendNotification } = require('../services/notificationService');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

/**
 * GET /api/workers/available
 * Get list of available workers filtered by department/category
 */
router.get('/available', async (req, res) => {
  try {
    const { department, category } = req.query;

    let query = supabase
      .from('workers')
      .select('*')
      .eq('is_active', true)
      .order('rating', { ascending: false });

    // Filter by department if provided
    if (department) {
      query = query.contains('departments', [department]);
    }

    const { data: workers, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      workers: workers || [],
    });
  } catch (error) {
    console.error('Error fetching available workers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available workers',
      error: error.message,
    });
  }
});

/**
 * POST /api/workers/assign
 * Assign a worker to a ticket
 */
router.post('/assign', async (req, res) => {
  try {
    const {
      ticketId,
      workerId,
      deadline,
      message,
      forwardImages,
      forwardLocation,
      ticketDetails,
    } = req.body;

    // Update ticket with assigned worker
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .update({
        assigned_worker_id: workerId,
        status: 'in-progress',
        assigned_at: new Date().toISOString(),
        deadline: deadline || null,
      })
      .eq('ticketId', ticketId)
      .select()
      .single();

    if (ticketError) throw ticketError;

    // Create task record
    const { data: task, error: taskError } = await supabase
      .from('worker_tasks')
      .insert({
        ticket_id: ticketId,
        worker_id: workerId,
        status: 'assigned',
        assigned_at: new Date().toISOString(),
        deadline: deadline || null,
        task_description: message || ticketDetails.query,
        location: ticketDetails.location,
        priority: ticketDetails.priority,
        department: ticketDetails.department,
      })
      .select()
      .single();

    if (taskError) throw taskError;

    // Get worker details
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('*')
      .eq('worker_id', workerId)
      .single();

    if (workerError) throw workerError;

    // Update worker's active task count
    await supabase
      .from('workers')
      .update({
        active_tasks: (worker.active_tasks || 0) + 1,
      })
      .eq('worker_id', workerId);

    // Send notification to worker (WhatsApp/Telegram/App)
    await sendNotification({
      type: 'worker_assignment',
      workerId: workerId,
      workerName: worker.name,
      workerPhone: worker.phone_number,
      ticketId: ticketId,
      message: message || ticketDetails.query,
      location: forwardLocation ? ticketDetails.location : null,
      images: forwardImages ? ticketDetails.images : [],
      deadline: deadline,
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('worker_assigned', {
        ticketId,
        workerId,
        workerName: worker.name,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message: 'Worker assigned successfully',
      task,
      worker,
    });
  } catch (error) {
    console.error('Error assigning worker:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign worker',
      error: error.message,
    });
  }
});

/**
 * GET /api/workers/:workerId/tasks
 * Get all tasks for a specific worker
 */
router.get('/:workerId/tasks', async (req, res) => {
  try {
    const { workerId } = req.params;
    const { status } = req.query;

    let query = supabase
      .from('worker_tasks')
      .select('*, tickets(*)')
      .eq('worker_id', workerId)
      .order('assigned_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: tasks, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: tasks || [],
    });
  } catch (error) {
    console.error('Error fetching worker tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message,
    });
  }
});

/**
 * POST /api/workers/attendance
 * Update worker attendance status
 */
router.post('/attendance', async (req, res) => {
  try {
    const { worker_id, is_active } = req.body;

    const { data, error } = await supabase
      .from('workers')
      .update({
        is_active,
        last_active: new Date().toISOString(),
      })
      .eq('worker_id', worker_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `Worker is now ${is_active ? 'active' : 'inactive'}`,
      data,
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance',
      error: error.message,
    });
  }
});

/**
 * POST /api/workers/validate-work
 * Validate work submission with Gemini AI
 */
router.post('/validate-work', async (req, res) => {
  try {
    const { mediaBase64, location, taskLocation, taskDescription, taskDepartment } = req.body;

    // Validate with Gemini AI
    const validationResult = await validateWork({
      imageBase64: mediaBase64,
      currentLocation: location,
      taskLocation: taskLocation,
      taskDescription: taskDescription,
      department: taskDepartment,
    });

    res.json(validationResult);
  } catch (error) {
    console.error('Error validating work:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate work',
      error: error.message,
    });
  }
});

/**
 * POST /api/workers/submit-work
 * Submit completed work with proof
 */
router.post('/submit-work', upload.array('media', 10), async (req, res) => {
  try {
    const { ticketId, workerId, location } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No proof files provided',
      });
    }

    // Upload files to Supabase Storage
    const uploadedFiles = [];
    for (const file of files) {
      const fileName = `work-proof/${ticketId}/${Date.now()}_${file.originalname}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('worker-proofs')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('worker-proofs')
        .getPublicUrl(fileName);

      uploadedFiles.push({
        url: publicUrlData.publicUrl,
        type: file.mimetype.startsWith('image/') ? 'image' : 'video',
      });
    }

    // Update task status
    const { data: task, error: taskError } = await supabase
      .from('worker_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        proof_urls: uploadedFiles,
        completion_location: location,
      })
      .eq('ticket_id', ticketId)
      .eq('worker_id', workerId)
      .select()
      .single();

    if (taskError) throw taskError;

    // Update ticket status
    const { error: ticketUpdateError } = await supabase
      .from('tickets')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution_proof: uploadedFiles,
      })
      .eq('ticketId', ticketId);

    if (ticketUpdateError) throw ticketUpdateError;

    // Update worker stats
    const { data: worker } = await supabase
      .from('workers')
      .select('active_tasks, completed_tasks')
      .eq('worker_id', workerId)
      .single();

    await supabase
      .from('workers')
      .update({
        active_tasks: Math.max(0, (worker.active_tasks || 0) - 1),
        completed_tasks: (worker.completed_tasks || 0) + 1,
      })
      .eq('worker_id', workerId);

    // Get ticket details for notification
    const { data: ticket } = await supabase
      .from('tickets')
      .select('*')
      .eq('ticketId', ticketId)
      .single();

    // Send completion notification to user and admin
    await sendNotification({
      type: 'work_completed',
      ticketId: ticketId,
      userId: ticket.userId,
      userPhone: ticket.phoneNumber,
      workerId: workerId,
      proofUrls: uploadedFiles,
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('work_completed', {
        ticketId,
        workerId,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message: 'Work submitted successfully',
      task,
      proofUrls: uploadedFiles,
    });
  } catch (error) {
    console.error('Error submitting work:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit work',
      error: error.message,
    });
  }
});

/**
 * POST /api/workers/cancel-task
 * Cancel a task
 */
router.post('/cancel-task', async (req, res) => {
  try {
    const { ticketId, workerId, reason } = req.body;

    // Update task status
    const { data: task, error: taskError } = await supabase
      .from('worker_tasks')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || 'Cancelled by worker',
      })
      .eq('ticket_id', ticketId)
      .eq('worker_id', workerId)
      .select()
      .single();

    if (taskError) throw taskError;

    // Update ticket status back to open
    await supabase
      .from('tickets')
      .update({
        status: 'open',
        assigned_worker_id: null,
      })
      .eq('ticketId', ticketId);

    // Update worker active tasks count
    const { data: worker } = await supabase
      .from('workers')
      .select('active_tasks')
      .eq('worker_id', workerId)
      .single();

    await supabase
      .from('workers')
      .update({
        active_tasks: Math.max(0, (worker.active_tasks || 0) - 1),
      })
      .eq('worker_id', workerId);

    // Notify admin
    const io = req.app.get('io');
    if (io) {
      io.emit('task_cancelled', {
        ticketId,
        workerId,
        reason: reason || 'Cancelled by worker',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message: 'Task cancelled successfully',
      task,
    });
  } catch (error) {
    console.error('Error cancelling task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel task',
      error: error.message,
    });
  }
});

module.exports = router;
