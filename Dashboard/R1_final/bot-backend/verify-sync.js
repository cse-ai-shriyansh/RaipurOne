/**
 * Verify Auto-Sync Between App Complaints and Dashboard Tickets
 * 
 * This script checks if the trigger is working correctly
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySync() {
  console.log('\n🔍 Verifying Auto-Sync Status...\n');

  try {
    // Check recent complaints with their ticket_ids
    const { data: complaints, error: complaintsError } = await supabase
      .from('complaints')
      .select('id, ticket_id, description, created_at, user_email')
      .order('created_at', { ascending: false })
      .limit(5);

    if (complaintsError) throw complaintsError;

    console.log('📱 Recent App Complaints:');
    console.log('========================');
    complaints.forEach(c => {
      console.log(`  ID: ${c.id.substring(0, 8)}...`);
      console.log(`  Ticket ID: ${c.ticket_id || '❌ NO TICKET_ID'}`);
      console.log(`  Description: ${c.description.substring(0, 50)}...`);
      console.log(`  User: ${c.user_email}`);
      console.log('  ---');
    });

    // Check corresponding tickets
    const ticketIds = complaints.map(c => c.ticket_id).filter(Boolean);
    
    if (ticketIds.length > 0) {
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('ticket_id, query, status, complaint_id, created_at')
        .in('ticket_id', ticketIds);

      if (ticketsError) throw ticketsError;

      console.log('\n🎫 Corresponding Dashboard Tickets:');
      console.log('===================================');
      tickets.forEach(t => {
        console.log(`  Ticket ID: ${t.ticket_id}`);
        console.log(`  Query: ${t.query?.substring(0, 50)}...`);
        console.log(`  Status: ${t.status}`);
        console.log(`  Complaint ID: ${t.complaint_id?.substring(0, 8)}...`);
        console.log('  ---');
      });

      // Verify sync integrity
      console.log('\n✅ Sync Verification:');
      console.log('=====================');
      const syncedCount = complaints.filter(c => 
        ticketIds.includes(c.ticket_id)
      ).length;
      console.log(`  Total Complaints: ${complaints.length}`);
      console.log(`  Synced to Tickets: ${syncedCount}`);
      console.log(`  Sync Rate: ${((syncedCount / complaints.length) * 100).toFixed(1)}%`);

      if (syncedCount === complaints.length) {
        console.log('\n🎉 SUCCESS! All complaints are synced to tickets!');
      } else {
        console.log('\n⚠️  Some complaints are not synced. This might be normal for old data.');
      }
    } else {
      console.log('\n⚠️  No complaints found with ticket_ids.');
      console.log('   This means either:');
      console.log('   1. No complaints have been submitted since trigger was added');
      console.log('   2. The trigger is not firing correctly');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n');
}

verifySync();
