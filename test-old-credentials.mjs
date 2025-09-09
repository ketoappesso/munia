import crypto from 'crypto';
import fs from 'fs';

// Test with OLD credentials that were working
const OLD_CUSTOM_APP_ID = '7820115171';
const OLD_CUSTOM_TOKEN = 'o2H8GJLh9eO-7kuzzyw93To2iJ1C6YC-';

// Test with CURRENT credentials
const CURRENT_CUSTOM_APP_ID = '7820115171';
const CURRENT_CUSTOM_TOKEN = 'o2H8GJLh9eO-7kuzzyw93To2iJ1C6YC-';

const testText = "不停的测试，再测试，字体出不出来？";
const voiceId = 'S_r3YGBCoB1';

async function testWithCredentials(appId, token, label) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing with ${label}`);
    console.log(`App ID: ${appId}`);
    console.log(`Token: ${token.substring(0, 10)}...`);
    console.log(`${'='.repeat(60)}`);
    
    const requestId = crypto.randomUUID();
    
    const payload = {
        app: {
            appid: appId,
            token: 'access_token',
            cluster: 'volcano_icl'
        },
        user: {
            uid: 'uid123'
        },
        audio: {
            voice_type: voiceId,
            encoding: 'mp3',
            speed_ratio: 1.1
        },
        request: {
            reqid: requestId,
            text: testText,
            operation: 'query'
        }
    };
    
    try {
        const response = await fetch('https://openspeech.bytedance.com/api/v1/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer;${token}`,
                'X-Api-Resource-Id': 'volc.megatts.default',
            },
            body: JSON.stringify(payload),
        });
        
        const result = await response.json();
        
        console.log('Response Code:', result.code);
        console.log('Response Message:', result.Message);
        
        if (result.code === 3000 && result.data) {
            // Decode and analyze
            const audioBuffer = Buffer.from(result.data, 'base64');
            const isSilence = result.data.substring(0, 50) === '//PkxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
            
            // Count non-zero bytes
            let nonZeroBytes = 0;
            for (let i = 100; i < Math.min(audioBuffer.length, 1000); i++) {
                if (audioBuffer[i] !== 0x00 && audioBuffer[i] !== 0xFF) {
                    nonZeroBytes++;
                }
            }
            
            console.log('Audio Analysis:');
            console.log('- Size:', audioBuffer.length, 'bytes');
            console.log('- Is Silence:', isSilence ? '❌ YES' : '✅ NO');
            console.log('- Non-zero bytes (100-1000):', nonZeroBytes);
            console.log('- Quality:', nonZeroBytes > 100 ? '✅ GOOD' : nonZeroBytes > 10 ? '⚠️ POOR' : '❌ SILENT');
            console.log('- Data preview:', result.data.substring(0, 30) + '...');
            
            // Save to file for further testing
            if (!isSilence && nonZeroBytes > 100) {
                const filename = `test-${label.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.mp3`;
                fs.writeFileSync(filename, audioBuffer);
                console.log(`✅ Audio saved to: ${filename}`);
            }
            
            return { success: true, isSilence, nonZeroBytes };
        } else {
            console.log('❌ API Error:', result);
            return { success: false };
        }
        
    } catch (error) {
        console.error('❌ Request failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Also test directly with the working text
async function testWorkingText() {
    console.log(`\n${'='.repeat(60)}`);
    console.log('Testing with KNOWN WORKING text');
    console.log(`${'='.repeat(60)}`);
    
    const workingText = "你好，这是自定义语音测试。我是猿素大师兄。";
    const requestId = crypto.randomUUID();
    
    const payload = {
        app: {
            appid: CURRENT_CUSTOM_APP_ID,
            token: 'access_token',
            cluster: 'volcano_icl'
        },
        user: {
            uid: 'uid123'
        },
        audio: {
            voice_type: voiceId,
            encoding: 'mp3',
            speed_ratio: 1.1
        },
        request: {
            reqid: requestId,
            text: workingText,
            operation: 'query'
        }
    };
    
    try {
        const response = await fetch('https://openspeech.bytedance.com/api/v1/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer;${CURRENT_CUSTOM_TOKEN}`,
                'X-Api-Resource-Id': 'volc.megatts.default',
            },
            body: JSON.stringify(payload),
        });
        
        const result = await response.json();
        console.log('Working text result:', result.code === 3000 ? '✅ SUCCESS' : '❌ FAILED');
        
        if (result.data) {
            const audioBuffer = Buffer.from(result.data, 'base64');
            let nonZeroBytes = 0;
            for (let i = 100; i < Math.min(audioBuffer.length, 1000); i++) {
                if (audioBuffer[i] !== 0x00 && audioBuffer[i] !== 0xFF) {
                    nonZeroBytes++;
                }
            }
            console.log('Working text audio quality:', nonZeroBytes > 100 ? '✅ GOOD' : '❌ POOR');
        }
    } catch (error) {
        console.error('Working text test failed:', error.message);
    }
}

async function main() {
    console.log('Testing Volcengine TTS with different credentials');
    console.log('Test text:', testText);
    console.log('Voice ID:', voiceId);
    
    // Test with current credentials
    const currentResult = await testWithCredentials(
        CURRENT_CUSTOM_APP_ID,
        CURRENT_CUSTOM_TOKEN,
        'CURRENT Credentials'
    );
    
    // Also test with working text
    await testWorkingText();
    
    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('SUMMARY');
    console.log(`${'='.repeat(60)}`);
    
    if (currentResult.success && !currentResult.isSilence) {
        console.log('✅ The problem text CAN be synthesized with current credentials!');
    } else {
        console.log('❌ The problem text CANNOT be synthesized properly.');
        console.log('This appears to be a limitation of the custom voice model.');
    }
}

main().catch(console.error);