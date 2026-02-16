const serverlessExpress = require('@codegenie/serverless-express');

// Import the comprehensive TypeScript server
const app = require('./dist/apps/api/src/server').default;

// Create the serverless handler using the full Express app
const handler = serverlessExpress({ app });

module.exports = { handler };