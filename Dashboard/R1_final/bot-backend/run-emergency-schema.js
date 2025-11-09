require('dotenv').config();
const { supabase } = require('./src/config/supabaseClient');
const fs = require('fs');

async function runSchema() {
  console.log('📋 Reading EMERGENCY_BROADCAST_SCHEMA.sql...');
  const sqlPath = '../../../EMERGENCY_BROADCAST_SCHEMA.sql';
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('\n⚠️  MANUAL STEP REQUIRED:');
  console.log('=' .repeat(60));
  console.log('Please run the SQL schema manually in Supabase SQL Editor:');
  console.log('\n1. Go to: https://app.supabase.com/project/svkffnyzkmgtgtpqkuyr/sql/new');
  console.log('2. Copy the content from: EMERGENCY_BROADCAST_SCHEMA.sql');
  console.log('3. Paste it in SQL Editor');
  console.log('4. Click RUN');
  console.log('=' .repeat(60));
  
  console.log('\n⏳ Waiting 10 seconds for you to run the SQL...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Verify the table was created
  console.log('\n🔍 Verifying emergency_broadcasts table...');
  const { data, error } = await supabase
    .from('emergency_broadcasts')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Table not found:', error.message);
    console.log('\n⚠️ Please run EMERGENCY_BROADCAST_SCHEMA.sql manually.');
    console.log('Once done, run this script again to verify.');
  } else {
    console.log('✅ emergency_broadcasts table exists!');
    
    // Check if users table has new columns
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('push_token, telegram_chat_id, phone')
      .limit(1);
    
    if (!userError) {
      console.log('✅ users table columns updated!');
    }
    
    console.log('\n🎉 Emergency Broadcast System is ready!');
    console.log('\n📡 Next steps:');
    console.log('  1. Start backend: npm start');
    console.log('  2. Test endpoint: POST http://localhost:3001/api/emergency/broadcast');
  }
}

runSchema();
