// Simple Supabase Connection Test
// Run from Dashboard/R1_final/bot-backend: node test-connection.js

require('dotenv').config(); // Load .env file
const { supabase, testConnection } = require('./src/config/supabaseClient');

console.log('\n╔════════════════════════════════════════╗');
console.log('║  Testing Supabase Connection...       ║');
console.log('╚════════════════════════════════════════╝\n');

async function runTests() {
  // Test 1: Basic connection
  console.log('🔌 Testing basic connection...');
  const connected = await testConnection();
  
  if (!connected) {
    console.log('❌ Connection failed. Check .env file.\n');
    process.exit(1);
  }

  // Test 2: Check complaints table
  console.log('\n📋 Checking complaints table...');
  try {
    const { data, error } = await supabase
      .from('complaints')
      .select('id, user_email, description, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.log(`⚠️  Complaints table: ${error.message}`);
      console.log('→  Run UNIFIED_SUPABASE_SCHEMA.sql in Supabase SQL Editor');
    } else {
      console.log(`✅ Complaints table exists (${data.length} recent records)`);
      if (data.length > 0) {
        console.log('   Latest complaint:', data[0].description.substring(0, 50) + '...');
      }
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // Test 3: Check tickets table
  console.log('\n🎫 Checking tickets table...');
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('id, ticket_id, query, status')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.log(`⚠️  Tickets table: ${error.message}`);
      console.log('→  Run UNIFIED_SUPABASE_SCHEMA.sql in Supabase SQL Editor');
    } else {
      console.log(`✅ Tickets table exists (${data.length} recent records)`);
      if (data.length > 0) {
        console.log(`   Latest ticket: ${data[0].ticket_id} - ${data[0].query.substring(0, 40)}...`);
      }
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // Test 4: Check department_tickets
  console.log('\n🏢 Checking department_tickets table...');
  try {
    const { count, error } = await supabase
      .from('department_tickets')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`⚠️  Department tickets: ${error.message}`);
    } else {
      console.log(`✅ Department tickets table exists (${count || 0} records)`);
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // Summary
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  ✓ Connection test complete           ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('\n📝 Next: Run UNIFIED_SUPABASE_SCHEMA.sql if tables are missing\n');
}

runTests().catch(err => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
