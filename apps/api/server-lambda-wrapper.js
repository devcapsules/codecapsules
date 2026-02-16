const serverlessExpress = require('@codegenie/serverless-express');

// CORS headers for Lambda Function URL
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://devcapsules.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400'
};

// Import your comprehensive server.ts (compiled to JS)
let cachedHandler;

async function createHandler() {
  if (!cachedHandler) {
    console.log('🚀 Initializing comprehensive CodeCapsule server...');
    
    try {
      // Import your comprehensive server with full AI generation pipeline
      const serverModule = require('./dist/apps/api/src/server.js');
      
      // The server exports the Express app as default
      const app = serverModule.default;
      
      if (!app) {
        throw new Error('Could not import Express app from server.js');
      }
      
      console.log('✅ Comprehensive server loaded with AI generation pipeline');
      
      // Create serverless handler
      cachedHandler = serverlessExpress({ app });
    } catch (initError) {
      console.error('❌ Server module load error:', initError.message);
      console.error('❌ Stack trace:', initError.stack);
      throw initError;
    }
  }
  
  return cachedHandler;
}

exports.handler = async (event, context) => {
  // Prevent Lambda from waiting for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    // UNIVERSAL PARSER: Handle Lambda Function URL, HTTP API v2, and REST API v1
    const method = event.requestContext?.http?.method || event.httpMethod || 'UNKNOWN';
    const path = event.requestContext?.http?.path || event.path || event.rawPath || '/';
    const origin = event.headers?.origin || event.headers?.Origin || '';
    
    console.log('📡 Lambda request:', method, path, 'Origin:', origin);
    
    // Determine allowed origin dynamically
    const allowedOrigins = [
      'https://devcapsules.com',
      'https://www.devcapsules.com',
      'https://codecapsule-dashboard.pages.dev',
      'http://localhost:3000'
    ];
    
    let allowOrigin = 'https://devcapsules.com';
    if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.codecapsule-dashboard.pages.dev'))) {
      allowOrigin = origin;
    }
    
    const dynamicCorsHeaders = {
      ...corsHeaders,
      'Access-Control-Allow-Origin': allowOrigin
    };
    
    // Handle preflight OPTIONS requests directly
    if (method === 'OPTIONS') {
      console.log('✅ Handling CORS preflight');
      return {
        statusCode: 200,
        headers: dynamicCorsHeaders,
        body: ''
      };
    }
    
    // Normalize event for serverless-express (convert Function URL/v2 to v1 format)
    if (!event.httpMethod) {
      event.httpMethod = method;
    }
    if (!event.path) {
      event.path = path;
    }
    
    const handler = await createHandler();
    const result = await handler(event, context);
    
    // Ensure CORS headers are always present in response
    result.headers = {
      ...result.headers,
      ...dynamicCorsHeaders
    };
    
    console.log('✅ Lambda response:', result.statusCode);
    return result;
    
  } catch (error) {
    console.error('❌ Lambda handler error:', error.message);
    console.error('❌ Full error:', JSON.stringify({ name: error.name, message: error.message, code: error.code }));
    console.error('❌ Stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Server initialization failed',
        errorDetail: error.message
      })
    };
  }
};