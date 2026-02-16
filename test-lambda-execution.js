/**
 * Test AWS Lambda execution via API call
 */

const https = require('https')

async function testLambdaDirectly() {
  const apiUrl = 'https://q0qr0uqja7.execute-api.us-east-1.amazonaws.com/dev'
  
  const testPayload = {
    code: `
function multiply(a, b) {
  return a * b;
}

console.log('Testing multiply function...');
const result = multiply(5, 3);
console.log('Result:', result);
console.log('Expected: 15');

if (result === 15) {
  console.log('✅ TEST PASSED');
} else {
  console.log('❌ TEST FAILED');
  process.exit(1);
}
`,
    testInput: '',
    timeout: 10
  }
  
  console.log('� Testing AWS Lambda directly...')
  console.log('📝 Payload:', JSON.stringify(testPayload, null, 2))
  
  // Try JavaScript endpoint
  const jsEndpoint = `${apiUrl}/execute/javascript`
  console.log(`🌐 Calling: ${jsEndpoint}`)
  
  try {
    const response = await fetch(jsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    })
    
    const result = await response.text()
    console.log('\n📊 Lambda Response:')
    console.log('Status:', response.status)
    console.log('Body:', result)
    
  } catch (error) {
    console.error('❌ Direct Lambda test failed:', error.message)
  }
}

// Simple fetch implementation using Node.js built-ins
function fetch(url, options = {}) {
  const urlObj = new URL(url)
  const isHttps = urlObj.protocol === 'https:'
  const httpModule = isHttps ? https : require('http')
  
  return new Promise((resolve, reject) => {
    const req = httpModule.request({
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          text: () => Promise.resolve(data),
          json: () => Promise.resolve(JSON.parse(data))
        })
      })
    })
    
    req.on('error', reject)
    
    if (options.body) {
      req.write(options.body)
    }
    
    req.end()
  })
}

testLambdaDirectly()