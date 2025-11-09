require('dotenv').config();
const { analyzeTicketWithGemini } = require('./src/services/geminiService');

// Test queries
const testQueries = [
  'There is a big pothole on Main Street near the park. My car got damaged yesterday.',
  'Garbage has not been collected for 3 days in our area. Very bad smell.',
  'hello',
  'Water supply is completely stopped in our locality since morning.',
  'asdfghjkl',
];

async function testGeminiAPI() {
  console.log('==============================================');
  console.log('🧪 TESTING GEMINI API WITH FALLBACK');
  console.log('==============================================\n');

  let successCount = 0;
  let fallbackCount = 0;
  let errorCount = 0;

  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    console.log(`\n📋 Test ${i + 1}/${testQueries.length}`);
    console.log(`Query: "${query}"`);
    console.log('─'.repeat(50));

    try {
      const startTime = Date.now();
      const result = await analyzeTicketWithGemini(query);
      const duration = Date.now() - startTime;

      if (result.fallback) {
        fallbackCount++;
        console.log('⚠️ FALLBACK RESPONSE (API Error)');
      } else {
        successCount++;
        console.log('✅ SUCCESS');
      }

      console.log(`⏱️ Duration: ${duration}ms`);
      console.log('📊 Result:', JSON.stringify(result, null, 2));

      // Small delay between requests
      if (i < testQueries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      errorCount++;
      console.log('❌ ERROR:', error.message);
    }
  }

  console.log('\n==============================================');
  console.log('📊 TEST SUMMARY');
  console.log('==============================================');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`⚠️ Fallback: ${fallbackCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📈 Total: ${testQueries.length}`);
  console.log(`💯 Success Rate: ${((successCount / testQueries.length) * 100).toFixed(1)}%`);

  if (successCount > 0) {
    console.log('\n🎉 Gemini API is working!');
  } else if (fallbackCount > 0) {
    console.log('\n⚠️ API had issues but fallback responses provided');
  } else {
    console.log('\n❌ All tests failed - check your API keys');
  }
}

// Run tests
testGeminiAPI().catch(console.error);
