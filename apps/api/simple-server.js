const express = require('express');
const app = express();
const port = process.env.PORT || 8000;

// Basic middleware
app.use(express.json());
app.use(express.static('public'));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic API routes
app.get('/api/generate', async (req, res) => {
  try {
    // Proxy to Azure Functions
    const response = await fetch('https://codecapsule-api.azurewebsites.net/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Generation failed' });
  }
});

app.post('/api/execute', async (req, res) => {
  try {
    // Proxy to AWS Lambda
    const response = await fetch('https://q0qr0uqja7.execute-api.us-east-1.amazonaws.com/dev/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Execution failed' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`API Server running on port ${port}`);
});