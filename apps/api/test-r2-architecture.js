#!/usr/bin/env node
/**
 * Test script for R2/CDN-first architecture
 * Usage: node test-r2-architecture.js
 */

const API_BASE = 'http://localhost:3001';
const TEST_CAPSULE = {
  capsule: {
    title: "R2 Test Capsule",
    description: "Testing CDN-first architecture",
    type: "code",
    language: "javascript",
    difficulty: "easy",
    content: {
      primary: {
        problemStatement: "Test problem",
        code: {
          wasmVersion: {
            starterCode: "console.log('hello')",
            solution: "console.log('hello world')",
            testCases: [{input: "", expected: "hello world", description: "Basic test"}],
            language: "javascript"
          }
        }
      }
    },
    runtime: { target: "wasm" },
    pedagogy: { hints: [] }
  },
  publish: true
};

async function testArchitecture() {
  console.log('🧪 Testing R2/CDN-first architecture...\n');
  
  try {
    // 1. Test Health Endpoint
    console.log('1️⃣ Checking server health...');
    const health = await fetch(`${API_BASE}/health`).then(r => r.json());
    console.log(`   Status: ${health.status}`);
    console.log(`   CDN Storage: ${health.cdn_storage}`);
    console.log(`   Queue Execution: ${health.queue_execution}\n`);
    
    // 2. Publish a capsule (should write to DB + R2)
    console.log('2️⃣ Publishing test capsule...');
    const publishResponse = await fetch(`${API_BASE}/api/capsules/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_CAPSULE)
    });
    
    if (!publishResponse.ok) {
      throw new Error(`Publish failed: ${publishResponse.status}`);
    }
    
    const publishResult = await publishResponse.json();
    console.log(`   ✅ Published: ${publishResult.capsule.id}`);
    console.log(`   Message: ${publishResult.message}\n`);
    
    const capsuleId = publishResult.capsule.id;
    
    // 3. Test GET endpoint (should have cache headers)
    console.log('3️⃣ Testing cached GET endpoint...');
    const getResponse = await fetch(`${API_BASE}/api/capsules/${capsuleId}`);
    
    console.log(`   Status: ${getResponse.status}`);
    console.log(`   Cache-Control: ${getResponse.headers.get('cache-control')}`);
    console.log(`   CDN-Cache-Control: ${getResponse.headers.get('cdn-cache-control')}`);
    
    const getCapsule = await getResponse.json();
    console.log(`   ✅ Retrieved: ${getCapsule.capsule.title}\n`);
    
    // 4. Test CDN URL (would fail without real R2 setup)
    console.log('4️⃣ Testing CDN availability...');
    try {
      const cdnResponse = await fetch(`https://cdn.devcapsules.com/capsules/${capsuleId}.json`);
      console.log(`   CDN Status: ${cdnResponse.status}`);
      if (cdnResponse.ok) {
        const cdnCapsule = await cdnResponse.json();
        console.log(`   ✅ CDN Retrieved: ${cdnCapsule.title}`);
      }
    } catch (err) {
      console.log(`   ⚠️  CDN not available: ${err.message}`);
    }
    
    console.log('\n🎉 Architecture test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testArchitecture();
}

module.exports = testArchitecture;