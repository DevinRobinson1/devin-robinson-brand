// Simple HTTP server that receives base64 image data and saves to disk
const http = require('http');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'screenshots');

const server = http.createServer((req, res) => {
  // CORS headers so the browser page can POST to us
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { name, data } = JSON.parse(body);
        const buffer = Buffer.from(data, 'base64');
        const filePath = path.join(OUTPUT_DIR, `${name}.jpg`);
        fs.writeFileSync(filePath, buffer);
        console.log(`Saved: ${name}.jpg (${buffer.length} bytes)`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, size: buffer.length }));
      } catch (err) {
        console.error('Error:', err.message);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Serve the upload page
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<!DOCTYPE html>
<html><head><title>Screenshot Saver</title></head>
<body style="font-family:sans-serif;padding:40px;">
<h2>Screenshot Saver</h2>
<p>Status: <span id="status">Waiting for file...</span></p>
<input type="file" id="fileInput" accept="image/*" />
<script>
const input = document.getElementById('fileInput');
const status = document.getElementById('status');

// Get the screenshot name from the hash or default
function getName() {
  return window.location.hash.slice(1) || 'screenshot';
}

input.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  status.textContent = 'Reading file...';
  const reader = new FileReader();
  reader.onload = async () => {
    const base64 = reader.result.split(',')[1];
    status.textContent = 'Uploading ' + getName() + '...';

    try {
      const resp = await fetch('http://localhost:9876', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: getName(), data: base64 })
      });
      const result = await resp.json();
      status.textContent = 'Saved ' + getName() + '.jpg (' + result.size + ' bytes)';
      // Reset input for next upload
      input.value = '';
    } catch (err) {
      status.textContent = 'Error: ' + err.message;
    }
  };
  reader.readAsDataURL(file);
});
</script>
</body></html>`);
});

server.listen(9876, () => {
  console.log('Screenshot server running on http://localhost:9876');
  console.log('Waiting for screenshots...');
});
