const https = require('https');
const querystring = require('querystring');

async function testImageUpload() {
  console.log('🎯 Testing production image upload functionality...');

  // Step 1: Login to get session
  console.log('1️⃣ Logging in to get session...');

  const loginData = querystring.stringify({
    phoneNumber: '13374743333',
    password: '123456',
    smsCode: '123456',
    mode: 'auto'
  });

  const loginOptions = {
    hostname: 'xyuan.chat',
    port: 443,
    path: '/api/auth/signin',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  try {
    const sessionCookie = await new Promise((resolve, reject) => {
      const req = https.request(loginOptions, (res) => {
        console.log(`   Login status: ${res.statusCode}`);

        // Get session cookie
        const cookies = res.headers['set-cookie'];
        let sessionCookie = '';
        if (cookies) {
          cookies.forEach(cookie => {
            if (cookie.includes('next-auth.session-token') || cookie.includes('__Secure-next-auth.session-token')) {
              sessionCookie = cookie.split(';')[0];
              console.log(`   Session cookie: ${sessionCookie.substring(0, 50)}...`);
            }
          });
        }

        resolve(sessionCookie);
      });

      req.on('error', reject);
      req.write(loginData);
      req.end();
    });

    if (!sessionCookie) {
      console.log('❌ No session cookie received');
      return;
    }

    // Step 2: Test image upload with session
    console.log('2️⃣ Testing image upload with session...');

    // Create a simple test image (1x1 PNG)
    const imageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    // Create multipart form data
    const boundary = '----formdata-boundary-' + Math.random().toString(36);
    const formData = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="content"',
      '',
      'Test image upload after TOS_ENDPOINT fix 🎉',
      `--${boundary}`,
      'Content-Disposition: form-data; name="images"; filename="test.png"',
      'Content-Type: image/png',
      '',
    ].join('\r\n') + '\r\n';

    const formDataEnd = `\r\n--${boundary}--\r\n`;
    const formDataBuffer = Buffer.concat([
      Buffer.from(formData),
      imageBuffer,
      Buffer.from(formDataEnd)
    ]);

    const postOptions = {
      hostname: 'xyuan.chat',
      port: 443,
      path: '/api/posts',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': formDataBuffer.length,
        'Cookie': sessionCookie
      }
    };

    const result = await new Promise((resolve, reject) => {
      const req = https.request(postOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`   Image upload status: ${res.statusCode}`);
          console.log(`   Response: ${data}`);
          resolve({
            status: res.statusCode,
            data: data,
            success: res.statusCode === 200
          });
        });
      });

      req.on('error', reject);
      req.write(formDataBuffer);
      req.end();
    });

    if (result.success) {
      console.log('✅ SUCCESS! Image upload is working on production!');
      console.log('🎉 TOS_ENDPOINT fix resolved the issue!');
    } else {
      console.log('❌ Image upload still failing');
      console.log('Response:', result.data);
    }

  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
}

testImageUpload();