const WebSocket = require('ws');

const ws = new WebSocket('wss://xyuan.chat/voice-ws');

ws.on('open', function open() {
  console.log('✅ WebSocket connected!');
  ws.send(JSON.stringify({ type: 'config' }));
  
  setTimeout(() => {
    ws.close();
    process.exit(0);
  }, 2000);
});

ws.on('message', function message(data) {
  console.log('📨 Received:', data.toString());
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.error('⏱️ Timeout - no connection');
  process.exit(1);
}, 5000);
