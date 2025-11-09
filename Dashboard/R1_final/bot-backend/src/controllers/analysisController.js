const { supabase } = require('../config/supabaseClient');
const { analyzeTicketWithGemini, batchAnalyzeTickets } = require('../services/geminiService');

/**
 * Analyze a single ticket and route to department
 */
async function analyzeSingleTicket(ticketId) {
  try {
    // Find the original ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('ticket_id', ticketId)
      .single();

    if (ticketError || !ticket) {
      throw new Error('Ticket not found');
    }

    // Analyze with Gemini
    const analysis = await analyzeTicketWithGemini(ticket.query);

    // Determine department based on analysis
    let department = analysis.department;
    if (analysis.requestType === 'invalid') {
      department = 'invalid';
    } else if (analysis.requestType === 'garbage') {
      department = 'garbage';
    }

    // Create department ticket
    const { data: departmentTicket, error: deptError } = await supabase
      .from('department_tickets')
      .insert([
        {
          ticket_id: `DEPT-${ticketId}`,
          original_ticket_id: ticketId,
          department,
          request_type: analysis.requestType,
          user_id: ticket.user_id,
          username: ticket.username,
          first_name: ticket.first_name,
          last_name: ticket.last_name,
          original_query: ticket.query,
          simplified_summary: analysis.simplifiedSummary,
          priority: analysis.priority,
          confidence: analysis.confidence,
          reasoning: analysis.reasoning,
          suggested_actions: analysis.suggestedActions,
        },
      ])
      .select()
      .single();

    if (deptError) throw deptError;

    return {
      success: true,
      ticket: convertDeptTicketFromDb(departmentTicket),
      analysis,
    };
  } catch (error) {
    console.error('Error analyzing ticket:', error);
    throw error;
  }
}

/**
 * Analyze all pending tickets and route to departments
 */
async function analyzeAllPendingTickets() {
  try {
    // Get all open tickets that haven't been analyzed yet
    const { data: pendingTickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq('status', 'open');

    if (ticketsError) throw ticketsError;

    if (!pendingTickets || pendingTickets.length === 0) {
      return {
        success: true,
        message: 'No pending tickets to analyze',
        processed: 0,
        results: [],
      };
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const ticket of pendingTickets) {
      try {
        // Check if already analyzed
        const { data: exists } = await supabase
          .from('department_tickets')
          .select('id')
          .eq('original_ticket_id', ticket.ticket_id)
          .single();

        if (exists) {
          continue; // Skip already analyzed tickets
        }

        // Analyze with Gemini
        const analysis = await analyzeTicketWithGemini(ticket.query);

        // Determine department
        let department = analysis.department;
        if (analysis.requestType === 'invalid') {
          department = 'invalid';
        } else if (analysis.requestType === 'garbage') {
          department = 'garbage';
        }

        // Create department ticket
        const { error: deptError } = await supabase
          .from('department_tickets')
          .insert([
            {
              ticket_id: `DEPT-${ticket.ticket_id}`,
              original_ticket_id: ticket.ticket_id,
              department,
              request_type: analysis.requestType,
              user_id: ticket.user_id,
              username: ticket.username,
              first_name: ticket.first_name,
              last_name: ticket.last_name,
              original_query: ticket.query,
              simplified_summary: analysis.simplifiedSummary,
              priority: analysis.priority,
              confidence: analysis.confidence,
              reasoning: analysis.reasoning,
              suggested_actions: analysis.suggestedActions,
            },
          ]);

        if (deptError) throw deptError;

        results.push({
          ticketId: ticket.ticket_id,
          department,
          requestType: analysis.requestType,
          summary: analysis.simplifiedSummary,
          success: true,
        });

        successCount++;

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error analyzing ticket ${ticket.ticket_id}:`, error);
        results.push({
          ticketId: ticket.ticket_id,
          success: false,
          error: error.message,
        });
        failCount++;
      }
    }

    return {
      success: true,
      message: `Analysis complete. Processed ${successCount} tickets successfully, ${failCount} failed.`,
      processed: successCount,
      failed: failCount,
      total: pendingTickets.length,
      results,
    };
  } catch (error) {
    console.error('Error in batch analysis:', error);
    throw error;
  }
}

/**
 * Get department statistics
 */
async function getDepartmentStats() {
  try {
    // Get total department tickets
    const { count: totalDepartmentTickets, error: countError } = await supabase
      .from('department_tickets')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Get all department tickets for grouping
    const { data: allTickets, error: allError } = await supabase
      .from('department_tickets')
      .select('department, request_type, priority');

    if (allError) throw allError;

    // Count by department
    const byDepartment = allTickets.reduce((acc, ticket) => {
      const existing = acc.find((item) => item._id === ticket.department);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ _id: ticket.department, count: 1 });
      }
      return acc;
    }, []);

    // Count by request type
    const byRequestType = allTickets.reduce((acc, ticket) => {
      const existing = acc.find((item) => item._id === ticket.request_type);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ _id: ticket.request_type, count: 1 });
      }
      return acc;
    }, []);

    // Count by priority
    const byPriority = allTickets.reduce((acc, ticket) => {
      const existing = acc.find((item) => item._id === ticket.priority);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ _id: ticket.priority, count: 1 });
      }
      return acc;
    }, []);

    return {
      total: totalDepartmentTickets || 0,
      byDepartment,
      byRequestType,
      byPriority,
    };
  } catch (error) {
    console.error('Error getting department stats:', error);
    throw error;
  }
}

/**
 * Get tickets by department
 */
async function getTicketsByDepartment(department) {
  try {
    const { data: tickets, error } = await supabase
      .from('department_tickets')
      .select('*')
      .eq('department', department)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return tickets.map(convertDeptTicketFromDb);
  } catch (error) {
    console.error('Error fetching department tickets:', error);
    throw error;
  }
}

// Helper function to convert DB format to API format
const convertDeptTicketFromDb = (ticket) => {
  if (!ticket) return null;

  return {
    ticketId: ticket.ticket_id,
    originalTicketId: ticket.original_ticket_id,
    department: ticket.department,
    requestType: ticket.request_type,
    userId: ticket.user_id,
    username: ticket.username,
    firstName: ticket.first_name,
    lastName: ticket.last_name,
    originalQuery: ticket.original_query,
    simplifiedSummary: ticket.simplified_summary,
    priority: ticket.priority,
    status: ticket.status,
    geminiAnalysis: {
      confidence: ticket.confidence,
      reasoning: ticket.reasoning,
      suggestedActions: ticket.suggested_actions,
    },
    processedAt: ticket.processed_at,
    createdAt: ticket.created_at,
  };
};

module.exports = {
  analyzeSingleTicket,
  analyzeAllPendingTickets,
  getDepartmentStats,
  getTicketsByDepartment,
};
