const mongoose = require('mongoose');

const departmentTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
  },
  originalTicketId: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
    enum: ['roadway', 'cleaning', 'drainage', 'water-supply', 'general', 'invalid', 'garbage'],
  },
  requestType: {
    type: String,
    required: true,
    enum: ['valid', 'invalid', 'garbage'],
  },
  userId: {
    type: String,
    required: true,
  },
  username: String,
  firstName: String,
  lastName: String,
  originalQuery: {
    type: String,
    required: true,
  },
  simplifiedSummary: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'resolved', 'closed'],
    default: 'pending',
  },
  geminiAnalysis: {
    confidence: Number,
    reasoning: String,
    suggestedActions: [String],
  },
  processedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('DepartmentTicket', departmentTicketSchema);
