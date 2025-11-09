const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/supabaseClient');
const { analyzeTicketWithGemini } = require('../services/geminiService');

// Generate unique ticket ID
const generateTicketId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `TKT-${timestamp}-${random}`;
};

// Create a new ticket (OLD WORKING SCHEMA - before push notifications)
const createTicket = async (userId, username, firstName, lastName, query, category = 'general', latitude = null, longitude = null) => {
  try {
    const ticketId = generateTicketId();
    const now = new Date().toISOString();

    // OLD SIMPLE SCHEMA - as it was before push notifications
    const ticketData = {
      ticket_id: ticketId,
      user_id: userId,
      username: username || 'Anonymous',
      first_name: firstName || '',
      last_name: lastName || '',
      query,
      category,
      status: 'open',
      priority: 'medium',
      created_at: now,
      updated_at: now,
    };

    // Add location (old way - separate columns)
    if (latitude && longitude) {
      ticketData.latitude = parseFloat(latitude);
      ticketData.longitude = parseFloat(longitude);
    }

    console.log('📝 Creating ticket with data:', {
      ticket_id: ticketData.ticket_id,
      user_id: ticketData.user_id,
      username: ticketData.username,
      query: ticketData.query,
      created_at: ticketData.created_at
    });

    // Insert ticket using OLD schema columns
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert([ticketData])
      .select()
      .single();

    if (ticketError) {
      console.error('Ticket creation error:', ticketError);
      throw ticketError;
    }

    console.log(`✅ Ticket created: ${ticketId} at ${now}`);
    console.log('✅ Returned ticket data:', ticket);

    // Try AI analysis (optional - don't fail if it errors)
    try {
      console.log(`🤖 Auto-analyzing ticket ${ticketId}...`);
      const analysis = await analyzeTicketWithGemini(query);
      
      await supabase
        .from('tickets')
        .update({ priority: analysis.priority || 'medium' })
        .eq('ticket_id', ticketId);

      console.log(`✅ Ticket ${ticketId} auto-analyzed: ${analysis.department} (${analysis.priority})`);
    } catch (analysisError) {
      console.error(`⚠️ Failed to auto-analyze ticket ${ticketId}:`, analysisError.message);
    }

    // Emit Socket.IO event for dashboard
    if (global.io) {
      global.io.emit('new_complaint', {
        ticketId: ticket.ticket_id || ticketId,
        userId: ticket.user_id || userId,
        username: ticket.username || username,
        query: ticket.query || query,
        category: ticket.category || category,
        priority: ticket.priority || 'medium',
        status: ticket.status || 'open',
        latitude: ticket.latitude,
        longitude: ticket.longitude,
        createdAt: ticket.created_at || now,
      });
      console.log(`🔔 Notification sent: New complaint ${ticket.ticket_id || ticketId}`);
    }

    // Return OLD format
    return ticket;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
};

// Get all tickets with optional filters
const getAllTickets = async (filters = {}) => {
  try {
    let query = supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    const { data: tickets, error } = await query;

    if (error) throw error;

    return tickets || [];
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw error;
  }
};

// Get ticket by ID (OLD SCHEMA)
const getTicketById = async (ticketId) => {
  try {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('ticket_id', ticketId)
      .single();

    if (error) throw error;

    return ticket;
  } catch (error) {
    console.error('Error fetching ticket:', error);
    throw error;
  }
};

// Update ticket status (OLD SCHEMA)
const updateTicketStatus = async (ticketId, status) => {
  try {
    const updateData = { status };
    
    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data: ticket, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('ticket_id', ticketId)
      .select()
      .single();

    if (error) throw error;

    return ticket;
  } catch (error) {
    console.error('Error updating ticket status:', error);
    throw error;
  }
};

// Add response to ticket (OLD SCHEMA - using responses array)
const addTicketResponse = async (ticketId, message) => {
  try {
    // Get current responses
    const { data: ticket } = await supabase
      .from('tickets')
      .select('responses')
      .eq('ticket_id', ticketId)
      .single();

    const responses = ticket?.responses || [];
    responses.push({
      message,
      timestamp: new Date().toISOString(),
    });

    // Update ticket with new response
    const { data: updatedTicket, error } = await supabase
      .from('tickets')
      .update({ 
        responses,
        updated_at: new Date().toISOString()
      })
      .eq('ticket_id', ticketId)
      .select()
      .single();

    if (error) throw error;

    return updatedTicket;
  } catch (error) {
    console.error('Error adding response:', error);
    throw error;
  }
};

// Get user tickets (OLD SCHEMA)
const getUserTickets = async (userId) => {
  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return tickets || [];
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    return [];
  }
};

// Get dashboard statistics (OLD SCHEMA)
const getDashboardStats = async () => {
  try {
    // Get total tickets
    const { count: totalTickets, error: totalError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Get counts by status
    const { count: openTickets } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    const { count: inProgressTickets } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in-progress');

    const { count: resolvedTickets } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved');

    // Get unique users from tickets
    const { data: allTickets } = await supabase
      .from('tickets')
      .select('user_id');

    const totalUsers = allTickets ? new Set(allTickets.map(t => t.user_id)).size : 0;

    // Get tickets by category
    const { data: categoryData } = await supabase
      .from('tickets')
      .select('category');

    const ticketsByCategory = categoryData?.reduce((acc, ticket) => {
      const existing = acc.find((item) => item._id === ticket.category);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ _id: ticket.category, count: 1 });
      }
      return acc;
    }, []) || [];

    // Get tickets by priority
    const { data: priorityData } = await supabase
      .from('tickets')
      .select('priority');

    const ticketsByPriority = priorityData?.reduce((acc, ticket) => {
      const existing = acc.find((item) => item._id === ticket.priority);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ _id: ticket.priority, count: 1 });
      }
      return acc;
    }, []) || [];

    return {
      totalTickets: totalTickets || 0,
      openTickets: openTickets || 0,
      inProgressTickets: inProgressTickets || 0,
      resolvedTickets: resolvedTickets || 0,
      totalUsers,
      ticketsByCategory,
      ticketsByPriority,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

module.exports = {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  addTicketResponse,
  getUserTickets,
  getDashboardStats,
};
