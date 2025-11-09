const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Create a simple test image (1x1 pixel PNG)
const createTestImage = () => {
  // Base64 encoded 1x1 transparent PNG
  const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const buffer = Buffer.from(base64Image, 'base64');
  const imagePath = path.join(__dirname, 'test-image.png');
  fs.writeFileSync(imagePath, buffer);
  return imagePath;
};

// Test image upload
async function testImageUpload() {
  try {
    console.log('🖼️ Testing Image Upload to Supabase...\n');

    // Create test image
    const imagePath = createTestImage();
    console.log('✅ Test image created:', imagePath);

    // Create form data
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));
    formData.append('userId', '123456789');
    // Don't add ticketId - upload without ticket association

    console.log('📤 Uploading to http://localhost:3001/api/images/upload...\n');

    // Upload image
    const response = await axios.post(
      'http://localhost:3001/api/images/upload',
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    console.log('✅ Upload Successful!\n');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));

    // Cleanup
    fs.unlinkSync(imagePath);
    console.log('\n🧹 Test image cleaned up');

    if (response.data.success) {
      console.log('\n🎉 SUCCESS! Image URL:');
      console.log(response.data.image.url);
      console.log('\n✅ You can view this image in:');
      console.log('   - Supabase Dashboard → Storage → ticket-images');
      console.log('   - Or open the URL in your browser');
    }

  } catch (error) {
    console.error('❌ Upload Failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run test
testImageUpload();
