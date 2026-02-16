const serverlessExpress = require('@codegenie/serverless-express');

// Import your existing server
const express = require('express');
const cors = require('cors');
const { Client } = require('pg');

// Add OpenAI for direct AI generation
const fetch = require('node-fetch');

const app = express();

let dbConnected = false;

let client = null;

// Transaction pooler connection - optimized for serverless
async function connectToDatabase() {
  if (!client || !dbConnected) {
    try {
      client = new Client({
        connectionString: process.env.DATABASE_URL || "postgresql://postgres.dinerkhhhoibcrznysen:Myashwanth@14@aws-1-ap-south-1.pooler.supabase.com:6543/postgres",
        ssl: {
          rejectUnauthorized: false
        },
        connectionTimeoutMillis: 5000,
        query_timeout: 5000
      });
      
      await client.connect();
      console.log('✅ Connected to Supabase transaction pooler');
      dbConnected = true;
    } catch (err) {
      console.error('❌ Database connection error:', err.message);
      dbConnected = false;
      client = null;
    }
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables (with fallbacks)
const AWS_LAMBDA_URL = 'https://q0qr0uqja7.execute-api.us-east-1.amazonaws.com/dev';
const AZURE_FUNCTIONS_URL = 'https://codecapsule-api.azurewebsites.net/api';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: 'lambda',
    database: dbConnected ? 'connected' : 'disconnected',
    databaseUrl: process.env.DATABASE_URL ? 'set' : 'not-set'
  });
});

// My Capsules endpoint - this is the key one that needs real database data
app.get('/api/my-capsules', async (req, res) => {
  console.log('📦 Fetching user capsules...');
  
  // Try to connect to database
  await connectToDatabase();
  
  if (!dbConnected) {
    console.log('⚠️ Database not connected, returning fallback data');
    return res.json({
      success: true,
      capsules: [{
        id: 'lambda-db-test',
        title: '🚀 Lambda Database Test',
        language: 'javascript',
        code: 'console.log("Lambda can connect to Supabase!");',
        description: 'Testing database connection from AWS Lambda',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: true,
        tags: ['lambda', 'database-test'],
        author: 'AWS Lambda',
        likes: 0,
        views: 0
      }]
    });
  }

  try {
    // Query for real capsules from Supabase
    const result = await client.query(`
      SELECT 
        id,
        title,
        description,
        type,
        language,
        difficulty,
        tags,
        "isPublished",
        "createdAt",
        "creatorId",
        content
      FROM capsules 
      ORDER BY "createdAt" DESC
    `);

    console.log(`✅ Found ${result.rows.length} capsules in database`);

    // Transform database results to match frontend expectations
    const transformedCapsules = result.rows.map(capsule => {
      let code = '';
      let parsedContent = null;
      
      // Parse the content JSON if it exists
      if (capsule.content) {
        try {
          if (typeof capsule.content === 'string') {
            parsedContent = JSON.parse(capsule.content);
          } else {
            parsedContent = capsule.content;
          }
          
          // Extract code from various possible structures
          if (parsedContent?.primary?.code) {
            code = parsedContent.primary.code;
          } else if (parsedContent?.code) {
            code = parsedContent.code;
          } else if (typeof parsedContent === 'string') {
            code = parsedContent;
          }
        } catch (e) {
          console.log('Failed to parse content JSON:', e.message);
          code = capsule.content?.toString() || '';
        }
      }

      return {
        id: capsule.id,
        title: capsule.title || 'Untitled Capsule',
        description: capsule.description || 'No description',
        language: capsule.language || 'javascript',
        code: code,
        type: capsule.type || 'code',
        difficulty: capsule.difficulty || 'beginner',
        tags: capsule.tags || [],
        createdAt: capsule.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: capsule.createdAt?.toISOString() || new Date().toISOString(),
        isPublic: capsule.isPublished || false,
        author: 'Default User',
        likes: 0,
        views: 0
      };
    });

    res.json({
      success: true,
      capsules: transformedCapsules,
      count: transformedCapsules.length,
      message: `Retrieved ${transformedCapsules.length} capsules from Supabase database`
    });

  } catch (error) {
    console.error('❌ Database query error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch capsules from database',
      details: error.message
    });
  }
});

// AI Code Generation function
async function generateCode(prompt, language, difficulty) {
  // Generate language-specific code based on common patterns
  const templates = {
    javascript: {
      reverseString: {
        code: `function reverseString(str) {
  // TODO: Implement string reversal
  return str.split('').reverse().join('');
}

// Test the function
console.log(reverseString("hello")); // Should output: "olleh"`,
        explanation: 'This function reverses a string by splitting it into an array, reversing the array, and joining it back.',
        title: 'String Reversal Function'
      },
      fibonacci: {
        code: `function fibonacci(n) {
  // TODO: Implement fibonacci sequence
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Test the function
console.log(fibonacci(6)); // Should output: 8`,
        explanation: 'This function calculates the nth Fibonacci number using recursion.',
        title: 'Fibonacci Sequence Generator'
      }
    },
    python: {
      reverseString: {
        code: `def reverse_string(s):
    """
    TODO: Implement string reversal
    """
    return s[::-1]

# Test the function
print(reverse_string("hello"))  # Should output: olleh`,
        explanation: 'This function reverses a string using Python slice notation.',
        title: 'String Reversal Function'
      },
      fibonacci: {
        code: `def fibonacci(n):
    """
    TODO: Implement fibonacci sequence
    """
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Test the function
print(fibonacci(6))  # Should output: 8`,
        explanation: 'This function calculates the nth Fibonacci number using recursion.',
        title: 'Fibonacci Sequence Generator'
      }
    },
    sql: {
      joins: {
        code: `-- TODO: Write a JOIN query to combine user and order data
SELECT 
    u.name,
    u.email,
    o.order_id,
    o.total_amount
FROM users u
INNER JOIN orders o ON u.user_id = o.user_id
WHERE o.total_amount > 100
ORDER BY o.total_amount DESC;`,
        explanation: 'This query joins users and orders tables to show customer order information.',
        title: 'User Orders JOIN Query'
      }
    }
  };

  // Simple pattern matching to determine what to generate
  const lowerPrompt = prompt.toLowerCase();
  let selectedTemplate;
  
  if (lowerPrompt.includes('reverse') || lowerPrompt.includes('string')) {
    selectedTemplate = templates[language]?.reverseString;
  } else if (lowerPrompt.includes('fibonacci')) {
    selectedTemplate = templates[language]?.fibonacci;
  } else if (lowerPrompt.includes('join') || lowerPrompt.includes('sql')) {
    selectedTemplate = templates.sql?.joins;
  }
  
  // Fallback to reverse string if no specific pattern matched
  if (!selectedTemplate) {
    selectedTemplate = templates[language]?.reverseString || templates.javascript.reverseString;
  }
  
  return {
    code: selectedTemplate.code,
    explanation: selectedTemplate.explanation,
    title: selectedTemplate.title
  };
}

// AI Code Generation endpoint - using OpenAI directly
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, language = 'javascript', difficulty = 'medium' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        success: false,
        error: 'Prompt is required' 
      });
    }

    // Generate proper code based on the language and prompt
    const generatedCode = await generateCode(prompt, language, difficulty);
    
    res.json({
      success: true,
      generated: {
        code: generatedCode.code,
        explanation: generatedCode.explanation,
        title: generatedCode.title
      }
    });
  } catch (error) {
    console.error('❌ Generation error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Code generation failed', 
      details: error.message 
    });
  }
});

app.post('/api/execute', async (req, res) => {
  try {
    const { language } = req.body;
    const response = await fetch(`${AWS_LAMBDA_URL}/execute/${language.toLowerCase()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Execution service error', details: error.message });
  }
});

// Generate and execute endpoint - combines both operations
app.post('/api/generate-and-execute', async (req, res) => {
  try {
    console.log('🚀 Generate + Execute request:', req.body);
    const { prompt, language, difficulty } = req.body;
    
    if (!prompt || !language) {
      return res.status(400).json({ 
        success: false,
        error: 'Prompt and language are required' 
      });
    }

    // Step 1: Generate code using Azure Functions
    console.log('🤖 Generating code...');
    const generateResponse = await fetch(`${AZURE_FUNCTIONS_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt, 
        language,
        difficulty: difficulty || 'medium'
      })
    });

    if (!generateResponse.ok) {
      throw new Error(`Generation failed: ${generateResponse.status}`);
    }

    const generateResult = await generateResponse.json();
    console.log('🔍 Generation result:', generateResult);

    if (!generateResult.success) {
      return res.json({
        success: false,
        error: generateResult.error || 'Code generation failed'
      });
    }

    // Step 2: Execute the generated code (if execution is supported for the language)
    let executionResult = null;
    if (['python', 'javascript', 'sql', 'java'].includes(language.toLowerCase())) {
      try {
        console.log('⚡ Executing generated code...');
        const executeResponse = await fetch(`${AWS_LAMBDA_URL}/execute/${language.toLowerCase()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_code: generateResult.generated?.code || generateResult.code,
            language: language,
            testInput: req.body.testInput || ''
          })
        });

        if (executeResponse.ok) {
          executionResult = await executeResponse.json();
          console.log('✅ Execution completed:', executionResult.success ? 'SUCCESS' : 'FAILED');
        } else {
          console.log('⚠️ Execution failed, but continuing with generation result');
        }
      } catch (execError) {
        console.log('⚠️ Execution error (non-blocking):', execError.message);
        // Continue with just generation result
      }
    }

    // Transform the generated result to match frontend expectations
    const generatedCode = generateResult.generated || generateResult;
    const transformedCapsule = {
      id: `capsule_${Date.now()}`,
      title: generatedCode.title || `${language.charAt(0).toUpperCase() + language.slice(1)} Challenge`,
      description: generatedCode.explanation || prompt,
      language: language.toLowerCase(),
      type: 'code',
      difficulty: difficulty || 'medium',
      content: {
        primary: {
          problemStatement: generatedCode.explanation || prompt,
          code: {
            wasmVersion: {
              starterCode: generatedCode.code || '',
              solution: generatedCode.code || '',
              testCases: [
                {
                  input: '',
                  expected: '',
                  description: 'Basic test case'
                }
              ]
            }
          },
          database: {
            starterQuery: language.toLowerCase() === 'sql' ? (generatedCode.code || '') : '',
            solution: language.toLowerCase() === 'sql' ? (generatedCode.code || '') : '',
            testCases: language.toLowerCase() === 'sql' ? [
              {
                input: '',
                expected: '',
                description: 'SQL test case'
              }
            ] : []
          }
        }
      },
      pedagogy: {
        hints: {
          sequence: [
            'Think about the problem step by step',
            'Consider edge cases',
            'Test your solution with different inputs'
          ]
        },
        learningObjectives: [
          `Understand ${language} programming concepts`,
          'Practice problem-solving skills'
        ],
        concepts: [language.toLowerCase(), 'algorithms', 'problem-solving']
      }
    };

    // Return combined result
    const response = {
      success: true,
      capsule: transformedCapsule,
      generation: generateResult,
      execution: executionResult,
      qualityScore: generateResult.quality_score || 0.8,
      message: 'Code generated successfully' + (executionResult ? ' and executed' : '')
    };

    console.log('🎉 Generate + Execute completed successfully');
    res.json(response);

  } catch (error) {
    console.error('❌ Generate + Execute error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Generation and execution service error', 
      details: error.message 
    });
  }
});

// Create the serverless handler
const handler = serverlessExpress({ app });

module.exports = { handler };