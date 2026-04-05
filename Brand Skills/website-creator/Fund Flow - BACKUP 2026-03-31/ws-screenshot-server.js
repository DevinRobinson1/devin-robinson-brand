// WebSocket server that receives screenshot data from the browser
// HTTPS pages CAN connect to ws://localhost (mixed content exception)
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUTPUT_DIR = path.join(__dirname, 'screenshots');

// Raw HTTP server that handles WebSocket upgrade
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WS Screenshot Server');
});

server.on('upgrade', (req, socket, head) => {
  // Minimal WebSocket handshake
  const key = req.headers['sec-websocket-key'];
  const accept = crypto.createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-5AB5A3F11BA5')
    .digest('base64');

  socket.write([
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${accept}`,
    '', ''
  ].join('\r\n'));

  let chunks = [];

  socket.on('data', (data) => {
    // Parse WebSocket frame
    const frames = parseFrames(data);
    for (const frame of frames) {
      if (frame.opcode === 1) { // Text frame
        try {
          const msg = JSON.parse(frame.payload.toString('utf8'));
          if (msg.type === 'screenshot') {
            const buffer = Buffer.from(msg.data, 'base64');
            const filePath = path.join(OUTPUT_DIR, `${msg.name}.jpg`);
            fs.writeFileSync(filePath, buffer);
            console.log(`Saved: ${msg.name}.jpg (${buffer.length} bytes)`);
            sendFrame(socket, JSON.stringify({ ok: true, name: msg.name, size: buffer.length }));
          }
        } catch (e) {
          console.error('Parse error:', e.message);
        }
      }
    }
  });

  socket.on('error', (err) => console.error('Socket error:', err.message));
  console.log('WebSocket client connected');
});

function parseFrames(data) {
  const frames = [];
  let offset = 0;

  while (offset < data.length) {
    if (offset + 2 > data.length) break;

    const firstByte = data[offset];
    const secondByte = data[offset + 1];
    const opcode = firstByte & 0x0f;
    const masked = (secondByte & 0x80) !== 0;
    let payloadLength = secondByte & 0x7f;
    offset += 2;

    if (payloadLength === 126) {
      if (offset + 2 > data.length) break;
      payloadLength = data.readUInt16BE(offset);
      offset += 2;
    } else if (payloadLength === 127) {
      if (offset + 8 > data.length) break;
      payloadLength = Number(data.readBigUInt64BE(offset));
      offset += 8;
    }

    let maskKey;
    if (masked) {
      if (offset + 4 > data.length) break;
      maskKey = data.slice(offset, offset + 4);
      offset += 4;
    }

    if (offset + payloadLength > data.length) break;
    let payload = data.slice(offset, offset + payloadLength);
    offset += payloadLength;

    if (masked) {
      for (let i = 0; i < payload.length; i++) {
        payload[i] ^= maskKey[i % 4];
      }
    }

    frames.push({ opcode, payload });
  }

  return frames;
}

function sendFrame(socket, text) {
  const payload = Buffer.from(text, 'utf8');
  const header = Buffer.alloc(2 + (payload.length > 125 ? 2 : 0));
  header[0] = 0x81; // text frame, FIN
  if (payload.length > 125) {
    header[1] = 126;
    header.writeUInt16BE(payload.length, 2);
  } else {
    header[1] = payload.length;
  }
  socket.write(Buffer.concat([header, payload]));
}

server.listen(9877, () => {
  console.log('WebSocket screenshot server on ws://localhost:9877');
});
