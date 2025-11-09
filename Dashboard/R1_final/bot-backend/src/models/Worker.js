const { supabase } = require('../config/supabaseClient');

// Worker model for managing workers in the system

const getAllWorkers = async () => {
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

const getWorkerById = async (workerId) => {
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .eq('worker_id', workerId)
    .single();

  if (error) throw error;
  return data;
};

const getAvailableWorkers = async (department = null) => {
  let query = supabase
    .from('workers')
    .select('*')
    .eq('status', 'available');

  if (department) {
    query = query.contains('departments', [department]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const createWorker = async (workerData) => {
  const { data, error } = await supabase
    .from('workers')
    .insert([workerData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateWorker = async (workerId, updates) => {
  const { data, error } = await supabase
    .from('workers')
    .update(updates)
    .eq('worker_id', workerId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const assignWorkerToTicket = async (workerId, ticketId, assignedBy, message, deadline) => {
  // Update ticket with worker assignment
  const { error: ticketError } = await supabase
    .from('tickets')
    .update({
      assigned_worker_id: workerId,
      assigned_at: new Date().toISOString(),
      assigned_by: assignedBy,
      assignment_message: message,
      assignment_deadline: deadline,
      status: 'assigned'
    })
    .eq('ticket_id', ticketId);

  if (ticketError) throw ticketError;

  // Update worker task count
  const worker = await getWorkerById(workerId);
  await updateWorker(workerId, {
    active_tasks: (worker.active_tasks || 0) + 1,
    status: 'busy'
  });

  return { success: true };
};

const completeTask = async (workerId, ticketId, completionData) => {
  // Update ticket status
  const { error: ticketError } = await supabase
    .from('tickets')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completion_notes: completionData.notes,
      completion_images: completionData.images || []
    })
    .eq('ticket_id', ticketId);

  if (ticketError) throw ticketError;

  // Update worker task count
  const worker = await getWorkerById(workerId);
  const newTaskCount = Math.max((worker.active_tasks || 0) - 1, 0);
  
  await updateWorker(workerId, {
    active_tasks: newTaskCount,
    completed_tasks: (worker.completed_tasks || 0) + 1,
    status: newTaskCount === 0 ? 'available' : 'busy'
  });

  return { success: true };
};

module.exports = {
  getAllWorkers,
  getWorkerById,
  getAvailableWorkers,
  createWorker,
  updateWorker,
  assignWorkerToTicket,
  completeTask
};
