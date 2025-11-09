/**
 * DEBUG: Check why dashboard shows "no tickets"
 * Run this to see what's actually in the database
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTickets() {
  console.log('\n🔍 DEBUG: Dashboard Tickets Issue\n');
  console.log('═'.repeat(50));

  try {
    // 1. Check raw tickets count
    const { count: ticketsCount, error: countError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    console.log(`\n📊 Total Tickets in Database: ${ticketsCount}`);

    // 2. Get sample tickets
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (ticketsError) throw ticketsError;

    console.log(`\n🎫 Sample Tickets (Last 5):`);
    console.log('═'.repeat(50));
    
    if (tickets.length === 0) {
      console.log('❌ NO TICKETS FOUND!');
      console.log('\nPossible Reasons:');
      console.log('1. Tickets table is empty');
      console.log('2. No tickets created yet');
      console.log('3. All tickets were deleted');
      console.log('\n💡 Solution: Run QUICK_FIX_SYNC.sql test section to create sample tickets');
    } else {
      tickets.forEach((ticket, index) => {
        console.log(`\n${index + 1}. Ticket: ${ticket.ticket_id}`);
        console.log(`   User: ${ticket.username || ticket.user_id}`);
        console.log(`   Query: ${(ticket.query || '').substring(0, 60)}...`);
        console.log(`   Status: ${ticket.status}`);
        console.log(`   Priority: ${ticket.priority}`);
        console.log(`   Category: ${ticket.category}`);
        console.log(`   Created: ${new Date(ticket.created_at).toLocaleString()}`);
        console.log(`   Complaint ID: ${ticket.complaint_id || 'N/A (not from app)'}`);
      });
    }

    // 3. Check what API would return
    console.log(`\n\n🔌 Testing API Format:`);
    console.log('═'.repeat(50));
    
    const { data: apiTickets, error: apiError } = await supabase
      .from('tickets')
      .select('*, ticket_responses(id, message, created_at)')
      .order('created_at', { ascending: false });

    if (apiError) throw apiError;

    console.log(`✅ API Query Works: ${apiTickets.length} tickets returned`);
    
    if (apiTickets.length > 0) {
      console.log('\nSample API Response (First Ticket):');
      console.log(JSON.stringify(apiTickets[0], null, 2));
    }

    // 4. Check frontend expectations
    console.log(`\n\n📱 Frontend Compatibility Check:`);
    console.log('═'.repeat(50));
    
    if (apiTickets.length > 0) {
      const firstTicket = apiTickets[0];
      const requiredFields = ['ticket_id', 'user_id', 'query', 'status', 'category', 'priority', 'created_at'];
      const missingFields = requiredFields.filter(field => !firstTicket[field]);
      
      if (missingFields.length > 0) {
        console.log(`❌ PROBLEM: Missing fields: ${missingFields.join(', ')}`);
      } else {
        console.log('✅ All required fields present');
      }

      // Check response format
      console.log(`\nTicket Responses: ${firstTicket.ticket_responses?.length || 0} responses`);
    }

    // 5. Check dashboard stats
    console.log(`\n\n📊 Dashboard Stats Check:`);
    console.log('═'.repeat(50));
    
    const { data: stats } = await supabase.rpc('get_dashboard_stats').catch(() => null);
    
    if (!stats) {
      // Manual count
      const statusCounts = {
        open: 0,
        'in-progress': 0,
        resolved: 0,
        closed: 0
      };

      tickets.forEach(t => {
        if (statusCounts[t.status] !== undefined) {
          statusCounts[t.status]++;
        }
      });

      console.log('Status Breakdown:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
    }

    // 6. Final diagnosis
    console.log(`\n\n🎯 DIAGNOSIS:`);
    console.log('═'.repeat(50));
    
    if (ticketsCount === 0) {
      console.log('❌ ISSUE: Database has NO tickets');
      console.log('\n📝 TO FIX:');
      console.log('1. Run test section of QUICK_FIX_SYNC.sql to create sample tickets');
      console.log('2. OR submit a complaint from the RaipurOne app');
      console.log('3. OR use Telegram bot to create tickets');
    } else if (ticketsCount > 0 && apiTickets.length === 0) {
      console.log('❌ ISSUE: Tickets exist but API query returns empty');
      console.log('\n📝 TO FIX: Check RLS policies or API query filters');
    } else {
      console.log('✅ Backend is working correctly!');
      console.log(`\n${ticketsCount} tickets found and API is returning them.`);
      console.log('\n🔍 If dashboard still shows "no tickets", the issue is in FRONTEND:');
      console.log('   - Check Dashboard/R1_final/dashboard-frontend/src/pages/TicketsList.js');
      console.log('   - Check Dashboard/R1_final/dashboard-frontend/src/pages/Dashboard.js');
      console.log('   - Verify API base URL is correct');
      console.log('   - Check browser console for errors');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
  }

  console.log('\n' + '═'.repeat(50) + '\n');
}

debugTickets();
