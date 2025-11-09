// Test script to check images in Supabase
require('dotenv').config();
const { supabase } = require('./src/config/supabaseClient');

async function testImages() {
  console.log('🔍 Checking images in database...\n');

  try {
    // Get all images
    const { data: allImages, error: allError } = await supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Error fetching images:', allError);
      return;
    }

    console.log(`📊 Total images in database: ${allImages.length}\n`);

    if (allImages.length > 0) {
      console.log('📷 Recent images:');
      allImages.slice(0, 5).forEach((img, idx) => {
        console.log(`\n${idx + 1}. Image ID: ${img.id}`);
        console.log(`   Ticket ID: ${img.ticket_id}`);
        console.log(`   User ID: ${img.user_id}`);
        console.log(`   File: ${img.file_name}`);
        console.log(`   Size: ${(img.file_size / 1024).toFixed(2)} KB`);
        console.log(`   URL: ${img.storage_url}`);
        console.log(`   Created: ${new Date(img.created_at).toLocaleString()}`);
      });

      // Group by ticket
      const byTicket = {};
      allImages.forEach(img => {
        if (img.ticket_id) {
          if (!byTicket[img.ticket_id]) byTicket[img.ticket_id] = [];
          byTicket[img.ticket_id].push(img);
        }
      });

      console.log('\n\n📊 Images grouped by ticket:');
      Object.entries(byTicket).forEach(([ticketId, images]) => {
        console.log(`\n🎫 ${ticketId}: ${images.length} image(s)`);
      });
    } else {
      console.log('❌ No images found in database');
      console.log('\n💡 This could mean:');
      console.log('   1. No tickets with images have been created yet');
      console.log('   2. Image upload is failing silently');
      console.log('   3. Images table is empty');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testImages();
