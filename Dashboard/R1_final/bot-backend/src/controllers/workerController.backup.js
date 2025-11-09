const {
  getAllWorkers,
  getWorkerById,
  getAvailableWorkers,
  createWorker,
  updateWorker,
  assignWorkerToTicket,
  completeTask
} = require('../models/Worker');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Worker Registration (for mobile app)
exports.registerWorker = async (req, res) => {
  try {
    const { name, phone, email, password, address, work_type, departments } = req.body;

    // Validate required fields
    if (!name || !phone || !password || !address || !work_type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, phone, password, address, and work type'
      });
    }

    // Check if phone already exists
    const { supabase } = require('../config/supabaseClient');
    const { data: existingWorker } = await supabase
      .from('workers')
      .select('phone')
      .eq('phone', phone)
      .single();

    if (existingWorker) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered'
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Generate worker ID
    const worker_id = `WRK-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Create worker
    const worker = await createWorker({
      worker_id,
      name,
      phone,
      email: email || null,
      password_hash,
      address,
      work_type,
      departments: departments || [],
      status: 'offline',
      is_active: false,
      active_tasks: 0,
      completed_tasks: 0,
      created_at: new Date().toISOString()
    });

    // Remove password hash from response
    delete worker.password_hash;

    res.status(201).json({
      success: true,
      message: 'Worker registered successfully',
      data: worker
    });
  } catch (error) {
    console.error('Error registering worker:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register worker',
      error: error.message
    });
  }
};

// Worker Login (for mobile app)
exports.loginWorker = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone and password'
      });
    }

    // Get worker by phone
    const { supabase } = require('../config/supabaseClient');
    const { data: worker, error } = await supabase
      .from('workers')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error || !worker) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, worker.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }

    // Update last active
    await updateWorker(worker.worker_id, {
      last_active_at: new Date().toISOString()
    });

    // Remove password hash from response
    delete worker.password_hash;

    res.json({
      success: true,
      message: 'Login successful',
      data: worker
    });
  } catch (error) {
    console.error('Error logging in worker:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Mark worker as active (attendance)
exports.markAttendance = async (req, res) => {
  try {
    const { worker_id } = req.body;
    const { is_active } = req.body;

    await updateWorker(worker_id, {
      is_active,
      status: is_active ? 'available' : 'offline',
      last_active_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `Attendance marked as ${is_active ? 'active' : 'inactive'}`
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message
    });
  }
};

// Get worker's assigned tasks
exports.getWorkerTasks = async (req, res) => {
  try {
    const { worker_id } = req.params;

    const { supabase } = require('../config/supabaseClient');
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('assigned_worker_id', worker_id)
      .in('status', ['assigned', 'in-progress'])
      .order('assignment_deadline', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: tickets || [],
      count: tickets?.length || 0
    });
  } catch (error) {
    console.error('Error fetching worker tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message
    });
  }
};

// Get all workers
exports.getWorkers = async (req, res) => {
  try {
    const workers = await getAllWorkers();
    res.json({
      success: true,
      data: workers,
      count: workers.length
    });
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workers',
      error: error.message
    });
  }
};

// Get available workers (optionally by department)
exports.getAvailableWorkersHandler = async (req, res) => {
  try {
    const { department } = req.query;
    const workers = await getAvailableWorkers(department);
    res.json({
      success: true,
      data: workers,
      count: workers.length
    });
  } catch (error) {
    console.error('Error fetching available workers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available workers',
      error: error.message
    });
  }
};

// Get worker by ID
exports.getWorkerByIdHandler = async (req, res) => {
  try {
    const { workerId } = req.params;
    const worker = await getWorkerById(workerId);
    res.json({
      success: true,
      data: worker
    });
  } catch (error) {
    console.error('Error fetching worker:', error);
    res.status(404).json({
      success: false,
      message: 'Worker not found',
      error: error.message
    });
  }
};

// Create new worker
exports.createWorkerHandler = async (req, res) => {
  try {
    const workerData = req.body;
    const worker = await createWorker({
      ...workerData,
      status: 'available',
      active_tasks: 0,
      completed_tasks: 0,
      created_at: new Date().toISOString()
    });
    
    res.status(201).json({
      success: true,
      data: worker,
      message: 'Worker created successfully'
    });
  } catch (error) {
    console.error('Error creating worker:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create worker',
      error: error.message
    });
  }
};

// Update worker
exports.updateWorkerHandler = async (req, res) => {
  try {
    const { workerId } = req.params;
    const updates = req.body;
    const worker = await updateWorker(workerId, updates);
    
    res.json({
      success: true,
      data: worker,
      message: 'Worker updated successfully'
    });
  } catch (error) {
    console.error('Error updating worker:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update worker',
      error: error.message
    });
  }
};

// Assign worker to ticket
exports.assignWorker = async (req, res) => {
  try {
    const { ticketId, workerId, message, deadline } = req.body;
    const assignedBy = req.body.adminId || 'admin'; // In production, get from auth token
    
    await assignWorkerToTicket(workerId, ticketId, assignedBy, message, deadline);
    
    // Emit Socket.IO event for worker assignment
    if (global.io) {
      const worker = await getWorkerById(workerId);
      global.io.emit('worker_assigned', {
        ticketId,
        workerId,
        workerName: worker.name,
        workerPhone: worker.phone,
        message,
        deadline,
        assignedAt: new Date().toISOString()
      });
      console.log(`🔔 Notification sent: Worker assigned to ${ticketId}`);
    }
    
    res.json({
      success: true,
      message: 'Worker assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning worker:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign worker',
      error: error.message
    });
  }
};

// Mark task as complete
exports.completeTaskHandler = async (req, res) => {
  try {
    const { ticketId, workerId, notes, images } = req.body;
    
    await completeTask(workerId, ticketId, { notes, images });
    
    // Emit Socket.IO event for work completion
    if (global.io) {
      global.io.emit('work_completed', {
        ticketId,
        workerId,
        completedAt: new Date().toISOString(),
        notes,
        images
      });
      console.log(`🔔 Notification sent: Work completed for ${ticketId}`);
    }
    
    res.json({
      success: true,
      message: 'Task marked as complete'
    });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete task',
      error: error.message
    });
  }
};



// ==========================================
// WORKER VIDEO SUBMISSION & ADMIN APPROVAL
// ==========================================

// Submit task with video and documents
exports.submitTaskWithMedia = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { video_url, document_url, submission_notes } = req.body;

    if (!video_url) {
      return res.status(400).json({
        success: false,
        message: 'Video URL is required'
      });
    }

    const { supabase } = require('../config/supabaseClient');

    const { data, error } = await supabase
      .from('workers_tasks')
      .update({
        video_url,
        document_url,
        submission_notes,
        submitted_at: new Date().toISOString(),
        status: 'submitted',
        admin_review_status: 'pending'
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    if (global.io) {
      global.io.emit('new_submission', { taskId, message: 'New task submission for review' });
    }

    res.json({ success: true, message: 'Task submitted successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = exports;
