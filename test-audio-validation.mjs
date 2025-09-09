import fs from 'fs';

// Test if the previously generated audio file is actually valid
const audioFile = 'test-custom-voice-1757399801553.mp3';

try {
  const audioBuffer = fs.readFileSync(audioFile);
  console.log('Audio file analysis:');
  console.log('- File size:', audioBuffer.length, 'bytes');
  
  // Check MP3 header
  const header = audioBuffer.slice(0, 4);
  console.log('- Header (hex):', header.toString('hex'));
  
  // Check if it's a valid MP3 (should start with FFF3 or FFFB)
  const isMP3 = header[0] === 0xFF && (header[1] & 0xF0) === 0xF0;
  console.log('- Is valid MP3 header:', isMP3);
  
  // Check for silence pattern
  let silenceCount = 0;
  let totalFrames = 0;
  
  for (let i = 0; i < Math.min(audioBuffer.length, 10000); i += 100) {
    totalFrames++;
    const chunk = audioBuffer.slice(i, i + 100);
    const isAllZero = chunk.every(byte => byte === 0x00);
    const isMostlyZero = chunk.filter(byte => byte === 0x00).length > 90;
    
    if (isAllZero || isMostlyZero) {
      silenceCount++;
    }
  }
  
  console.log('- Silence analysis:');
  console.log('  - Total frames checked:', totalFrames);
  console.log('  - Silent frames:', silenceCount);
  console.log('  - Silence percentage:', ((silenceCount / totalFrames) * 100).toFixed(2) + '%');
  
  // Extract first non-zero section
  let firstNonZeroIndex = -1;
  for (let i = 0; i < audioBuffer.length; i++) {
    if (audioBuffer[i] !== 0x00 && audioBuffer[i] !== 0xFF) {
      firstNonZeroIndex = i;
      break;
    }
  }
  
  if (firstNonZeroIndex > 0) {
    console.log('- First non-header data at byte:', firstNonZeroIndex);
    const dataPreview = audioBuffer.slice(firstNonZeroIndex, firstNonZeroIndex + 20);
    console.log('- Data preview (hex):', dataPreview.toString('hex'));
  }
  
  // Convert to base64 and check
  const base64 = audioBuffer.toString('base64');
  console.log('\n- Base64 encoding:');
  console.log('  - Length:', base64.length);
  console.log('  - First 100 chars:', base64.substring(0, 100));
  
  // Check if it matches the silence pattern we've been seeing
  const isSilencePattern = base64.substring(0, 50) === '//PkxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  console.log('  - Matches silence pattern:', isSilencePattern);
  
  // Write a test HTML file to verify playback
  const testHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Audio Test</title>
</head>
<body>
  <h1>Audio Playback Test</h1>
  <audio controls id="testAudio"></audio>
  <div id="status"></div>
  <script>
    const base64Audio = '${base64}';
    const audio = document.getElementById('testAudio');
    const status = document.getElementById('status');
    
    audio.src = 'data:audio/mp3;base64,' + base64Audio;
    
    audio.onloadedmetadata = () => {
      status.innerHTML += '<p>✅ Metadata loaded - Duration: ' + audio.duration + ' seconds</p>';
    };
    
    audio.onerror = (e) => {
      status.innerHTML += '<p>❌ Error loading audio</p>';
      console.error('Audio error:', e);
    };
    
    audio.oncanplay = () => {
      status.innerHTML += '<p>✅ Audio can play</p>';
    };
  </script>
</body>
</html>`;
  
  fs.writeFileSync('test-audio-playback.html', testHtml);
  console.log('\n✅ Test HTML file created: test-audio-playback.html');
  console.log('Open this file in a browser to test audio playback');
  
} catch (error) {
  console.error('Error reading audio file:', error);
}