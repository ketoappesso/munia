const fs = require('fs');
const path = require('path');

// Test file upload through the API
async function testUpload() {
  try {
    // Read test image
    const testImagePath = path.join(__dirname, 'tests/test-assets/test-image.jpg');
    const imageBuffer = fs.readFileSync(testImagePath);
    
    // Create FormData
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', imageBuffer, {
      filename: 'test-image.jpg',
      contentType: 'image/jpeg'
    });
    form.append('conversationId', 'test-conversation-123');
    
    // Make request
    const response = await fetch('http://localhost:3002/api/messages/upload-image', {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders(),
        // Add a test session cookie if needed
        'Cookie': 'authjs.session-token=test-token'
      }
    });
    
    const result = await response.json();
    console.log('Upload response:', result);
    
    if (result.imageUrl) {
      console.log('✅ Upload successful!');
      console.log('Image URL:', result.imageUrl);
      
      // Verify the URL format
      if (result.imageUrl.includes('xiaoyuan-chat.tos-cn-guangzhou.volces.com')) {
        console.log('✅ Using correct TOS URL format!');
      } else {
        console.log('❌ Not using TOS URL format');
      }
    } else {
      console.log('❌ Upload failed:', result.error);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testUpload();