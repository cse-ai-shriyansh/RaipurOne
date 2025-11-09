const express = require('express');
const router = express.Router();
const {
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  addTicketResponse,
  getUserTickets,
  getDashboardStats,
  createTicket,
} = require('../controllers/ticketController');

// POST - Create a new ticket/query
router.post('/tickets', async (req, res) => {
  try {
    const { userId, username, firstName, lastName, query, category, latitude, longitude } = req.body;
    
    // Validate required fields
    if (!userId || !query) {
      return res.status(400).json({
        success: false,
        message: 'userId and query are required',
      });
    }

    const ticket = await createTicket(
      userId,
      username || 'Anonymous',
      firstName || '',
      lastName || '',
      query,
      category || 'general',
      latitude,
      longitude
    );

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating ticket',
      error: error.message,
    });
  }
});

// Get all tickets with optional filters
router.get('/tickets', async (req, res) => {
  try {
    const { status, category, priority, userId } = req.query;
    const filters = {};

    if (status) filters.status = status;
    if (category) filters.category = category;
    if (priority) filters.priority = priority;
    if (userId) filters.userId = userId;

    const tickets = await getAllTickets(filters);
    res.json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tickets',
      error: error.message,
    });
  }
});

// Get ticket by ID (support both /tickets/:ticketId and /ticket/:ticketId)
router.get('/tickets/:ticketId', async (req, res) => {
  try {
    const ticket = await getTicketById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }
    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ticket',
      error: error.message,
    });
  }
});

// Alternate route for backwards compatibility
router.get('/ticket/:ticketId', async (req, res) => {
  try {
    const ticket = await getTicketById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }
    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ticket',
      error: error.message,
    });
  }
});

// Get user's tickets
router.get('/user/:userId/tickets', async (req, res) => {
  try {
    const tickets = await getUserTickets(req.params.userId);
    res.json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user tickets',
      error: error.message,
    });
  }
});

// Update ticket status
router.patch('/tickets/:ticketId/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'in-progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }
    const ticket = await updateTicketStatus(req.params.ticketId, status);
    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating ticket',
      error: error.message,
    });
  }
});

// Add response to ticket
router.post('/tickets/:ticketId/response', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Response message is required',
      });
    }
    const ticket = await addTicketResponse(req.params.ticketId, message);
    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding response',
      error: error.message,
    });
  }
});

// Get dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message,
    });
  }
});

module.exports = router;
