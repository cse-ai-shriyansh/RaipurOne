const express = require('express');
const router = express.Router();
const {
  analyzeSingleTicket,
  analyzeAllPendingTickets,
  getDepartmentStats,
  getTicketsByDepartment,
} = require('../controllers/analysisController');

// Analyze single ticket
router.post('/analyze/:ticketId', async (req, res) => {
  try {
    const result = await analyzeSingleTicket(req.params.ticketId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error analyzing ticket',
      error: error.message,
    });
  }
});

// Analyze all pending tickets
router.post('/analyze-all', async (req, res) => {
  try {
    const result = await analyzeAllPendingTickets();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error analyzing tickets',
      error: error.message,
    });
  }
});

// Get department statistics
router.get('/departments/stats', async (req, res) => {
  try {
    const stats = await getDepartmentStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching department stats',
      error: error.message,
    });
  }
});

// Get tickets by department
router.get('/departments/:department', async (req, res) => {
  try {
    const tickets = await getTicketsByDepartment(req.params.department);
    res.json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching department tickets',
      error: error.message,
    });
  }
});

module.exports = router;
