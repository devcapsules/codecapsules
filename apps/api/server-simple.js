const express = require('express');
const cors = require('cors');
// Using built-in fetch (Node 18+)

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Environment variables (with fallbacks)
const AWS_LAMBDA_URL = 'https://q0qr0uqja7.execute-api.us-east-1.amazonaws.com/dev';
const AZURE_FUNCTIONS_URL = 'https://codecapsule-api.azurewebsites.net/api';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// AI Generation endpoint
app.post('/api/generate', async (req, res) => {
  try {
    console.log('Proxying generate request to Azure Functions');
    const response = await fetch(`${AZURE_FUNCTIONS_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });
    
    if (!response.ok) {
      throw new Error(`Azure Functions responded with ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Generate proxy error:', error.message);
    res.status(500).json({ 
      error: 'Generation service temporarily unavailable',
      details: error.message 
    });
  }
});

// Code execution endpoint
app.post('/api/execute', async (req, res) => {
  try {
    console.log('Proxying execute request to AWS Lambda');
    const { language } = req.body;
    
    if (!language) {
      return res.status(400).json({ error: 'Language is required' });
    }
    
    // Map language to API Gateway endpoint
    const languageEndpoint = language.toLowerCase();
    const response = await fetch(`${AWS_LAMBDA_URL}/execute/${languageEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });
    
    if (!response.ok) {
      throw new Error(`AWS Lambda responded with ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Execute proxy error:', error.message);
    res.status(500).json({ 
      error: 'Execution service temporarily unavailable',
      details: error.message 
    });
  }
});

// Capsule management endpoints
app.get('/api/my-capsules', (req, res) => {
  console.log('Fetching my capsules');
  // Return sample capsules for now
  res.json({
    success: true,
    capsules: [
      {
        id: 'sample-1',
        title: 'Hello World Python',
        language: 'python',
        code: 'print("Hello, World!")',
        description: 'A simple Python hello world example',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: true,
        tags: ['python', 'beginner'],
        author: 'CodeCapsule'
      },
      {
        id: 'sample-2', 
        title: 'JavaScript Array Methods',
        language: 'javascript',
        code: 'const numbers = [1, 2, 3, 4, 5];\nconst doubled = numbers.map(n => n * 2);\nconsole.log(doubled);',
        description: 'Demonstrating JavaScript array methods',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: true,
        tags: ['javascript', 'arrays'],
        author: 'CodeCapsule'
      }
    ]
  });
});

app.get('/api/capsules', (req, res) => {
  console.log('Fetching public capsules');
  // Return public capsules
  res.json({
    success: true,
    capsules: [
      {
        id: 'public-1',
        title: 'SQL Query Example',
        language: 'sql',
        code: 'SELECT name, email FROM users WHERE active = 1 ORDER BY name;',
        description: 'Basic SQL query example',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: true,
        tags: ['sql', 'database'],
        author: 'CodeCapsule',
        likes: 15,
        views: 42
      }
    ]
  });
});

app.get('/api/capsules/:id', (req, res) => {
  const { id } = req.params;
  console.log(`Fetching capsule: ${id}`);
  
  // Return a sample capsule based on ID
  res.json({
    success: true,
    capsule: {
      id,
      title: `Sample Capsule ${id}`,
      language: 'python',
      code: 'print("This is a sample capsule")',
      description: 'A sample code capsule',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: true,
      tags: ['sample'],
      author: 'CodeCapsule'
    }
  });
});

app.post('/api/capsules', (req, res) => {
  console.log('Creating new capsule:', req.body);
  const newCapsule = {
    id: `capsule-${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: 'CodeCapsule'
  };
  
  res.json({
    success: true,
    capsule: newCapsule
  });
});

app.post('/api/capsules/:id/fork', (req, res) => {
  const { id } = req.params;
  console.log(`Forking capsule: ${id}`);
  res.json({ 
    success: true, 
    message: 'Capsule forked successfully',
    forkedId: `fork-${id}-${Date.now()}`
  });
});

app.post('/api/capsules/:id/like', (req, res) => {
  const { id } = req.params;
  console.log(`Liking capsule: ${id}`);
  res.json({ 
    success: true, 
    message: 'Capsule liked successfully',
    likes: Math.floor(Math.random() * 100) + 1
  });
});

// Combined generate and execute endpoint
app.post('/api/generate-and-execute', async (req, res) => {
  try {
    console.log('Generate and execute request:', req.body);
    const { prompt, language } = req.body;
    
    if (!prompt || !language) {
      return res.status(400).json({ error: 'Prompt and language are required' });
    }
    
    // Step 1: Generate code
    console.log('Generating code...');
    const generateResponse = await fetch(`${AZURE_FUNCTIONS_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, language })
    });
    
    if (!generateResponse.ok) {
      throw new Error(`Generation failed: ${generateResponse.status}`);
    }
    
    const generateResult = await generateResponse.json();
    
    if (!generateResult.success || !generateResult.generated?.code) {
      return res.json({
        success: false,
        error: 'Code generation failed'
      });
    }
    
    // Step 2: Execute the generated code
    console.log('Executing generated code...');
    const executeResponse = await fetch(`${AWS_LAMBDA_URL}/execute/${language.toLowerCase()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        code: generateResult.generated.code, 
        language: language.toLowerCase() 
      })
    });
    
    if (!executeResponse.ok) {
      // If execution fails, still return the generated code
      return res.json({
        success: true,
        generated: generateResult.generated,
        execution: {
          success: false,
          error: 'Execution failed but code was generated successfully'
        }
      });
    }
    
    const executeResult = await executeResponse.json();
    
    res.json({
      success: true,
      generated: generateResult.generated,
      execution: executeResult
    });
    
  } catch (error) {
    console.error('Generate and execute error:', error);
    res.status(500).json({
      success: false,
      error: 'Generate and execute failed',
      details: error.message
    });
  }
});

// Analytics endpoints (minimal implementation)
app.get('/api/analytics/overview', (req, res) => {
  res.json({
    totalCapsules: 12,
    totalExecutions: 156,
    totalUsers: 8,
    averageExecutionTime: 2.4
  });
});

app.get('/api/analytics/usage', (req, res) => {
  res.json({
    daily: [
      { date: '2025-11-28', executions: 45, generations: 32 },
      { date: '2025-11-27', executions: 38, generations: 29 },
      { date: '2025-11-26', executions: 52, generations: 41 }
    ],
    weekly: [
      { week: '2025-W48', executions: 287, generations: 234 },
      { week: '2025-W47', executions: 312, generations: 267 }
    ],
    monthly: [
      { month: '2025-11', executions: 1247, generations: 1089 },
      { month: '2025-10', executions: 1456, generations: 1234 }
    ]
  });
});

// Catch all for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 CodeCapsule API Server running on port ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 AWS Lambda URL: ${AWS_LAMBDA_URL}`);
  console.log(`☁️  Azure Functions URL: ${AZURE_FUNCTIONS_URL}`);
});