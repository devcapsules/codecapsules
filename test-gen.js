const http = require('http');
const data = JSON.stringify({
  jobId: 'cli-test',
  userId: 'cli',
  prompt: 'Create a function route_intent that routes based on keywords',
  language: 'python',
  difficulty: 'medium',
  type: 'code'
});

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/internal/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Worker-Signature': 'bypass',
    'X-Worker-Timestamp': '9999999999999',
    'X-Worker-Caller': 'generation-consumer',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', (c) => body += c);
  res.on('end', () => {
    try {
      const j = JSON.parse(body);
      console.log('=== CONCEPTS CHECK ===');
      console.log('pedagogy.concepts:', JSON.stringify(j.capsule?.pedagogy?.concepts));
      console.log('tags:', JSON.stringify(j.capsule?.tags));
      console.log('learning.concepts:', JSON.stringify(j.capsule?.learning?.concepts));
      console.log('pedagogical_idea.key_concepts:', JSON.stringify(j.pedagogical_idea?.key_concepts));
      console.log('=== END ===');
    } catch(e) {
      console.log('Error parsing:', e.message);
      console.log('Raw response status:', res.statusCode);
      console.log('Raw body (first 500):', body.substring(0, 500));
    }
  });
});
req.on('error', (e) => console.log('Request error:', e.message));
req.write(data);
req.end();
