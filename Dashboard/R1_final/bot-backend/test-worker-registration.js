const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';

async function testRegistration() {
  try {
    console.log('Testing worker registration endpoint...\n');
    
    const testWorker = {
      name: 'Test Worker',
      phone: '+91-9999999999',
      email: 'test@example.com',
      password: 'testpass123',
      address: 'Test Address, Raipur',
      work_type: 'Electrician',
      departments: ['ELECTRICITY', 'GENERAL']
    };

    console.log('Sending registration request with data:', testWorker);
    
    const response = await axios.post(
      `${BACKEND_URL}/api/workers/register`,
      testWorker,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ Registration successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('\n❌ Registration failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function testLogin() {
  try {
    console.log('\n\nTesting worker login endpoint...\n');
    
    const loginData = {
      phone: '+91-9999999999',
      password: 'testpass123'
    };

    console.log('Sending login request with data:', loginData);
    
    const response = await axios.post(
      `${BACKEND_URL}/api/workers/login`,
      loginData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('\n❌ Login failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function testBackendHealth() {
  try {
    console.log('Testing backend health...\n');
    const response = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Backend is running!');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Backend is not responding!');
    console.error('Error:', error.message);
    return false;
  }
}

async function runTests() {
  const isHealthy = await testBackendHealth();
  
  if (!isHealthy) {
    console.log('\n⚠️  Please start the backend server first with: npm start');
    return;
  }

  await testRegistration();
  await testLogin();
}

runTests();
