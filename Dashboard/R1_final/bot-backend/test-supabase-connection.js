/**
 * SUPABASE CONNECTION TEST SCRIPT
 * Tests all critical Supabase features needed for the app
 */

require('dotenv').config();
const { supabase } = require('./src/config/supabaseClient');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

async function runTests() {
  console.log(`\n${colors.cyan}${colors.bright}=================================================`);
  console.log(`SUPABASE CONNECTION TEST`);
  console.log(`=================================================${colors.reset}\n`);

  let allPassed = true;

  // Test 1: Basic Connection
  console.log(`${colors.bright}[1/5] Testing basic connection...${colors.reset}`);
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error && error.code !== 'PGRST116') throw error;
    console.log(`${colors.green}✓ Connected to Supabase successfully${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ Connection failed: ${error.message}${colors.reset}`);
    allPassed = false;
  }

  // Test 2: Tables Exist
  console.log(`\n${colors.bright}[2/5] Checking required tables...${colors.reset}`);
  const requiredTables = ['tickets', 'users', 'ticket_responses', 'workers', 'worker_tasks', 'complaint_sessions', 'complaint_messages'];
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error && error.code !== 'PGRST116') throw error;
      console.log(`${colors.green}  ✓ Table '${table}' exists${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}  ✗ Table '${table}' missing or inaccessible: ${error.message}${colors.reset}`);
      allPassed = false;
    }
  }

  // Test 3: Storage Bucket (Try upload to verify it exists)
  console.log(`\n${colors.bright}[3/5] Checking storage bucket...${colors.reset}`);
  try {
    // Try to upload a tiny test file to verify bucket exists
    const testFileName = `bucket-test-${Date.now()}.txt`;
    const { error } = await supabase.storage
      .from('complaint-images')
      .upload(testFileName, Buffer.from('test'), {
        contentType: 'text/plain',
      });
    
    if (error) throw error;
    
    // Cleanup
    await supabase.storage.from('complaint-images').remove([testFileName]);
    
    console.log(`${colors.green}✓ Storage bucket 'complaint-images' exists and is writable${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ Storage bucket check failed: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}  → Run SIMPLE_FIX.sql to create the bucket${colors.reset}`);
    allPassed = false;
  }

  // Test 4: Create Test Ticket
  console.log(`\n${colors.bright}[4/5] Testing ticket creation...${colors.reset}`);
  try {
    const testTicket = {
      ticket_id: `TEST-${Date.now()}`,
      user_id: 'test-user',
      username: 'Test User',
      query: 'Test complaint from connection script',
      category: 'general',
      status: 'open',
      priority: 'low',
    };

    const { data, error } = await supabase
      .from('tickets')
      .insert([testTicket])
      .select()
      .single();

    if (error) throw error;
    console.log(`${colors.green}✓ Successfully created test ticket: ${data.ticket_id}${colors.reset}`);

    // Cleanup
    await supabase.from('tickets').delete().eq('ticket_id', data.ticket_id);
    console.log(`${colors.green}  ✓ Test ticket cleaned up${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ Ticket creation failed: ${error.message}${colors.reset}`);
    allPassed = false;
  }

  // Test 5: Storage Upload Test
  console.log(`\n${colors.bright}[5/5] Testing storage upload...${colors.reset}`);
  try {
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'This is a test file';

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('complaint-images')
      .upload(testFileName, Buffer.from(testContent), {
        contentType: 'text/plain',
      });

    if (uploadError) throw uploadError;
    console.log(`${colors.green}✓ Successfully uploaded test file${colors.reset}`);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('complaint-images')
      .getPublicUrl(testFileName);
    console.log(`${colors.green}  ✓ Public URL: ${urlData.publicUrl.substring(0, 60)}...${colors.reset}`);

    // Cleanup
    await supabase.storage.from('complaint-images').remove([testFileName]);
    console.log(`${colors.green}  ✓ Test file cleaned up${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ Storage upload failed: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}  → Make sure storage bucket exists and has correct policies${colors.reset}`);
    allPassed = false;
  }

  // Final Summary
  console.log(`\n${colors.cyan}${colors.bright}=================================================`);
  if (allPassed) {
    console.log(`${colors.green}${colors.bright}ALL TESTS PASSED! ✓${colors.reset}`);
    console.log(`${colors.cyan}Your Supabase setup is working perfectly!${colors.reset}`);
    console.log(`${colors.cyan}You can now:${colors.reset}`);
    console.log(`  1. Start backend: npm start`);
    console.log(`  2. Start mobile app: npx expo start`);
    console.log(`  3. Submit complaints with images`);
  } else {
    console.log(`${colors.red}${colors.bright}SOME TESTS FAILED ✗${colors.reset}`);
    console.log(`${colors.yellow}Action required:${colors.reset}`);
    console.log(`  1. Open Supabase SQL Editor`);
    console.log(`  2. Run: SUPABASE_SETUP_COMPLETE.sql`);
    console.log(`  3. Run this test again: node test-supabase-connection.js`);
  }
  console.log(`=================================================${colors.reset}\n`);

  process.exit(allPassed ? 0 : 1);
}

runTests().catch((error) => {
  console.error(`\n${colors.red}${colors.bright}FATAL ERROR:${colors.reset}`, error);
  process.exit(1);
});
