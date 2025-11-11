# 🚀 Quick Start with Your Azure OpenAI Credentials

## ✅ **Azure OpenAI Configuration Complete!**

Your Azure OpenAI credentials have been successfully configured:

- **API Key**: `DYQ3CMKhHFcoHnLuuvilKXWBpYmyOyzum5IYRvB8JjfKgTjqH6tCJQQJ99BHAC77bzfXJ3w3AAABACOGPpqW`
- **Endpoint**: `https://ai-capsule-recomendation.openai.azure.com/`
- **API Version**: `2024-04-01-preview`
- **Deployment**: `gpt-4o`

## 🏃‍♂️ **Quick Start Steps**

### 1. Install Dependencies
```bash
# Navigate to API directory
cd apps/api

# Install dependencies (including OpenAI package)
npm install
```

### 2. Test Azure OpenAI Connection
```bash
# Test your Azure OpenAI setup
npm run test-connection
```

### 3. Start the API Server
```bash
# Start the development server
npm run dev
```
The API will be available at `http://localhost:3001`

### 4. Start the Dashboard (New Terminal)
```bash
# Navigate to dashboard
cd apps/dashboard

# Install dependencies
npm install

# Start the dashboard
npm run dev
```
The dashboard will be available at `http://localhost:3000`

## 🧪 **Test Your Setup**

1. **Connection Test**: Run `npm run test-connection` in the API directory
2. **API Test**: Visit `http://localhost:3001/health`
3. **Full Test**: Go to `http://localhost:3000/create` and generate content!

## 🎯 **Quick Generation Test**

1. Open `http://localhost:3000/create`
2. Select "Code" capsule type
3. Enter prompt: "Create a function that reverses a string"
4. Choose "WASM (Free)" runtime
5. Click "Generate with AI"
6. Watch your AI generate professional coding challenges! 🚀

## 🛠️ **API Endpoints Available**

- `POST /api/generate` - Generate educational content
- `POST /api/assess-quality` - Assess content quality
- `GET /health` - Health check

## 📊 **What You Can Generate**

### Code Challenges
- Programming exercises with test cases
- Starter code and solutions
- Hints and explanations
- Runtime-optimized for WASM/Docker

### Quizzes
- Multiple choice questions
- Detailed explanations
- Difficulty-appropriate content
- Educational objectives

### Terminal Exercises
- Command-line tutorials
- Step-by-step instructions
- Interactive learning paths
- Environment-specific optimization

## 🔧 **Environment Configuration**

Your `.env` file has been created with:
- ✅ Azure OpenAI credentials
- ✅ CORS settings for localhost:3000
- ✅ Rate limiting configuration
- ✅ Quality thresholds
- ✅ Runtime limits for WASM/Docker

## 🚨 **Troubleshooting**

If the connection test fails:
1. Verify your Azure OpenAI resource is active
2. Check that the deployment name "gpt-4o" exists
3. Ensure your API key has proper permissions
4. Confirm the endpoint URL is correct

## 🎉 **You're Ready!**

Your CodeCapsule platform is now fully configured with Azure OpenAI GPT-4o and ready to generate professional educational content with AI! 

**Generate your first piece of content at http://localhost:3000/create** 🚀