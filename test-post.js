// Test script to debug posting issue
const fetch = require('node-fetch');

async function testPost() {
  try {
    // First, simulate login with phone number
    console.log('1. Testing login with phone number...');
    const loginRes = await fetch('http://localhost:3002/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        phoneNumber: '19974749999',
        password: 'password123', // You'll need to use the actual password
        csrfToken: '', // This would normally come from the CSRF endpoint
      }),
    });
    
    console.log('Login response status:', loginRes.status);
    const cookies = loginRes.headers.get('set-cookie');
    console.log('Cookies received:', cookies);
    
    if (!cookies) {
      console.log('No session cookie received. Login might have failed.');
      return;
    }
    
    // Extract session token
    const sessionToken = cookies.match(/next-auth\.session-token=([^;]+)/)?.[1];
    console.log('Session token:', sessionToken);
    
    // Test creating a post
    console.log('\n2. Testing post creation...');
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('content', 'Test post from script');
    
    const postRes = await fetch('http://localhost:3002/api/posts', {
      method: 'POST',
      headers: {
        'Cookie': `next-auth.session-token=${sessionToken}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });
    
    console.log('Post response status:', postRes.status);
    const postBody = await postRes.text();
    console.log('Post response body:', postBody);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Check if node-fetch is installed
try {
  require.resolve('node-fetch');
  require.resolve('form-data');
  testPost();
} catch(e) {
  console.log('Installing required packages...');
  const { execSync } = require('child_process');
  execSync('npm install node-fetch@2 form-data', { stdio: 'inherit' });
  console.log('Packages installed. Please run the script again.');
}
