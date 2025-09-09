import fs from 'fs';
import crypto from 'crypto';

// Direct API call to get raw audio data
async function fetchAudioFromAPI(text) {
    const requestId = crypto.randomUUID();
    
    const payload = {
        app: {
            appid: '7820115171',
            token: 'access_token',
            cluster: 'volcano_icl'
        },
        user: {
            uid: 'uid123'
        },
        audio: {
            voice_type: 'S_r3YGBCoB1',
            encoding: 'mp3',
            speed_ratio: 1.1
        },
        request: {
            reqid: requestId,
            text: text,
            operation: 'query'
        }
    };
    
    const response = await fetch('https://openspeech.bytedance.com/api/v1/tts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer;o2H8GJLh9eO-7kuzzyw93To2iJ1C6YC-',
            'X-Api-Resource-Id': 'volc.megatts.default',
        },
        body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    
    if (result.code === 3000 && result.data) {
        return result.data;
    }
    
    throw new Error(`API error: ${result.Message || result.code}`);
}

// Deep analysis of audio data
function analyzeAudioData(base64Data, label) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Analyzing: ${label}`);
    console.log(`${'='.repeat(60)}`);
    
    const audioBuffer = Buffer.from(base64Data, 'base64');
    
    // Basic info
    console.log('Basic Info:');
    console.log('- Total size:', audioBuffer.length, 'bytes');
    console.log('- Base64 length:', base64Data.length);
    console.log('- First 50 chars:', base64Data.substring(0, 50));
    
    // Check for MP3 header
    console.log('\nMP3 Header Analysis:');
    const header = audioBuffer.slice(0, 4);
    console.log('- Header bytes (hex):', header.toString('hex'));
    const isValidMP3 = header[0] === 0xFF && (header[1] & 0xF0) === 0xF0;
    console.log('- Valid MP3 header:', isValidMP3 ? '✅ YES' : '❌ NO');
    
    // Analyze data distribution
    console.log('\nData Distribution:');
    const chunks = 10;
    const chunkSize = Math.floor(audioBuffer.length / chunks);
    
    for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, audioBuffer.length);
        const chunk = audioBuffer.slice(start, end);
        
        let nonZeroCount = 0;
        let uniqueBytes = new Set();
        
        for (let j = 0; j < chunk.length; j++) {
            const byte = chunk[j];
            uniqueBytes.add(byte);
            if (byte !== 0x00 && byte !== 0xFF) {
                nonZeroCount++;
            }
        }
        
        const percentage = ((nonZeroCount / chunk.length) * 100).toFixed(1);
        const bar = '█'.repeat(Math.floor(parseFloat(percentage) / 10));
        console.log(`  Chunk ${i}: ${bar.padEnd(10)} ${percentage}% non-zero (${uniqueBytes.size} unique values)`);
    }
    
    // Find first significant audio data
    console.log('\nFirst Significant Data:');
    let firstSignificantIndex = -1;
    let consecutiveNonZero = 0;
    
    for (let i = 0; i < audioBuffer.length; i++) {
        if (audioBuffer[i] !== 0x00 && audioBuffer[i] !== 0xFF) {
            consecutiveNonZero++;
            if (consecutiveNonZero >= 10 && firstSignificantIndex === -1) {
                firstSignificantIndex = i - 9;
                break;
            }
        } else {
            consecutiveNonZero = 0;
        }
    }
    
    if (firstSignificantIndex > 0) {
        console.log('- First significant data at byte:', firstSignificantIndex);
        console.log('- Percentage into file:', ((firstSignificantIndex / audioBuffer.length) * 100).toFixed(2) + '%');
        const preview = audioBuffer.slice(firstSignificantIndex, firstSignificantIndex + 20);
        console.log('- Data preview (hex):', preview.toString('hex'));
    } else {
        console.log('- No significant data found');
    }
    
    // Pattern detection
    console.log('\nPattern Detection:');
    const isSilencePattern = base64Data.substring(0, 50) === '//PkxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    console.log('- Starts with silence pattern:', isSilencePattern ? '❌ YES' : '✅ NO');
    
    // Check for repeating patterns
    const sampleSize = 100;
    const sample1 = audioBuffer.slice(1000, 1000 + sampleSize);
    const sample2 = audioBuffer.slice(2000, 2000 + sampleSize);
    const sample3 = audioBuffer.slice(3000, 3000 + sampleSize);
    
    const samplesEqual = sample1.equals(sample2) || sample2.equals(sample3) || sample1.equals(sample3);
    console.log('- Repeating patterns detected:', samplesEqual ? '⚠️ YES' : '✅ NO');
    
    // Overall quality assessment
    console.log('\nQuality Assessment:');
    let totalNonZero = 0;
    let totalUniqueBytes = new Set();
    
    for (let i = 0; i < audioBuffer.length; i++) {
        const byte = audioBuffer[i];
        totalUniqueBytes.add(byte);
        if (byte !== 0x00 && byte !== 0xFF) {
            totalNonZero++;
        }
    }
    
    const nonZeroPercentage = ((totalNonZero / audioBuffer.length) * 100).toFixed(2);
    console.log('- Total non-zero bytes:', totalNonZero, `(${nonZeroPercentage}%)`);
    console.log('- Unique byte values:', totalUniqueBytes.size, '/ 256');
    
    if (parseFloat(nonZeroPercentage) > 20 && totalUniqueBytes.size > 100) {
        console.log('- Overall quality: ✅ GOOD (likely contains audio)');
    } else if (parseFloat(nonZeroPercentage) > 5 && totalUniqueBytes.size > 50) {
        console.log('- Overall quality: ⚠️ POOR (may contain partial audio)');
    } else {
        console.log('- Overall quality: ❌ SILENT (no meaningful audio data)');
    }
    
    return {
        size: audioBuffer.length,
        nonZeroPercentage: parseFloat(nonZeroPercentage),
        uniqueBytes: totalUniqueBytes.size,
        isSilencePattern,
        firstSignificantIndex
    };
}

async function main() {
    console.log('Deep Audio Analysis for Custom Voice');
    console.log('Voice ID: S_r3YGBCoB1\n');
    
    const tests = [
        { text: "不停的测试，再测试，字体出不出来？", label: "Problematic text" },
        { text: "你好，这是自定义语音测试。我是猿素大师兄。", label: "Working text" },
        { text: "测试", label: "Simple test" },
        { text: "字体", label: "Just '字体'" },
        { text: "出不出来", label: "Just '出不出来'" },
        { text: "不停的测试", label: "Just '不停的测试'" }
    ];
    
    const results = [];
    
    for (const test of tests) {
        try {
            console.log(`\nFetching audio for: "${test.text}"`);
            const audioData = await fetchAudioFromAPI(test.text);
            const analysis = analyzeAudioData(audioData, test.label);
            
            results.push({
                ...test,
                ...analysis,
                success: true
            });
            
            // Save audio file for manual inspection
            const filename = `audio-${test.label.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.mp3`;
            fs.writeFileSync(filename, Buffer.from(audioData, 'base64'));
            console.log(`\n📄 Audio saved to: ${filename}`);
            
        } catch (error) {
            console.error(`Error processing "${test.text}":`, error.message);
            results.push({
                ...test,
                success: false,
                error: error.message
            });
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('SUMMARY');
    console.log(`${'='.repeat(60)}`);
    
    results.forEach(r => {
        if (r.success) {
            const quality = r.nonZeroPercentage > 20 ? '✅' : r.nonZeroPercentage > 5 ? '⚠️' : '❌';
            console.log(`${quality} "${r.text}": ${r.nonZeroPercentage}% non-zero, ${r.uniqueBytes} unique bytes`);
        } else {
            console.log(`❌ "${r.text}": Failed - ${r.error}`);
        }
    });
    
    // Save detailed report
    const report = {
        timestamp: new Date().toISOString(),
        voiceId: 'S_r3YGBCoB1',
        results
    };
    
    fs.writeFileSync('deep-audio-analysis-report.json', JSON.stringify(report, null, 2));
    console.log('\n📊 Detailed report saved to: deep-audio-analysis-report.json');
}

main().catch(console.error);