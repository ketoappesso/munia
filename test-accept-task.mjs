#!/usr/bin/env node

// Test script to verify the accept task API
// Run with: node test-accept-task.mjs

async function testAcceptTask() {
  const baseUrl = 'http://localhost:3002';
  
  // You'll need to get these values from your browser's dev tools
  // 1. Open browser dev tools, go to Application/Storage > Cookies
  // 2. Find the session cookie (usually next-auth.session-token)
  const sessionCookie = 'YOUR_SESSION_COOKIE_HERE';
  const postId = 'YOUR_POST_ID_HERE'; // The ID of the task post
  const userId = 'YOUR_USER_ID_HERE'; // Your logged-in user ID
  
  console.log('Testing accept task API...');
  
  try {
    const response = await fetch(`${baseUrl}/api/posts/${postId}/accept-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `next-auth.session-token=${sessionCookie}`,
      },
      body: JSON.stringify({
        acceptorId: userId,
      }),
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Task accepted successfully!');
    } else {
      console.log('❌ Failed to accept task:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Instructions
console.log(`
===========================================
INSTRUCTIONS:
1. Make sure the dev server is running (npm run dev)
2. Log in to the app in your browser
3. Open browser dev tools > Application > Cookies
4. Copy the session cookie value
5. Find a task post ID from the browser
6. Update the variables in this script
7. Run: node test-accept-task.mjs
===========================================
`);

// Uncomment and run after setting the values
// testAcceptTask();
