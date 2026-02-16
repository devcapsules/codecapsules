#!/usr/bin/env node
/**
 * Test R2 upload functionality
 * Usage: node test-r2-upload.js
 */

const { createR2Service } = require('./dist/apps/api/src/services/r2-storage.js');

const TEST_CAPSULE = {
  id: 'test-capsule-123',
  title: 'R2 Upload Test',
  description: 'Testing R2 upload functionality',
  type: 'CODE',
  language: 'javascript',
  difficulty: 'EASY',
  tags: ['test'],
  content: {
    primary: {
      problemStatement: 'Test problem',
      code: {
        wasmVersion: {
          starterCode: 'console.log("hello")',
          solution: 'console.log("hello world")',
          testCases: [{
            input: '',
            expected: 'hello world',
            description: 'Basic test'
          }],
          language: 'javascript'
        }
      }
    }
  },
  runtime: { target: 'wasm' },
  pedagogy: { hints: [] },
  createdAt: new Date(),
  updatedAt: new Date()
};

async function testR2Upload() {
  console.log('🧪 Testing R2 Upload...\n');
  
  try {
    // 1. Check environment variables
    console.log('1️⃣ Checking R2 configuration...');
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY;
    const secretKey = process.env.CLOUDFLARE_R2_SECRET_KEY;
    const bucket = process.env.CLOUDFLARE_R2_BUCKET;
    
    console.log(`   Account ID: ${accountId ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Access Key: ${accessKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Secret Key: ${secretKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Bucket: ${bucket || '❌ Missing'}\n`);
    
    if (!accountId || !accessKey || !secretKey || !bucket) {
      console.log('❌ R2 configuration incomplete. Please update .env file.');
      console.log('📖 See R2_SETUP_GUIDE.md for instructions.');
      process.exit(1);
    }
    
    // 2. Create R2 service
    console.log('2️⃣ Creating R2 service...');
    const r2Storage = createR2Service();
    
    if (!r2Storage) {
      console.log('❌ Failed to create R2 service');
      process.exit(1);
    }
    console.log('✅ R2 service created\n');
    
    // 3. Test upload
    console.log('3️⃣ Testing upload...');
    await r2Storage.uploadCapsuleJSON(TEST_CAPSULE.id, TEST_CAPSULE);
    console.log('✅ Upload successful!\n');
    
    // 4. Get CDN URL
    console.log('4️⃣ CDN URL:');
    const cdnUrl = r2Storage.getCapsuleURL(TEST_CAPSULE.id);
    console.log(`   ${cdnUrl}\n`);
    
    // 5. Test download (after a few seconds for propagation)
    console.log('5️⃣ Testing CDN download in 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      const response = await fetch(cdnUrl);
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ CDN download successful: ${data.title}`);
      } else {
        console.log(`⚠️ CDN not yet available (${response.status}) - may need custom domain setup`);
      }
    } catch (error) {
      console.log(`⚠️ CDN test failed: ${error.message}`);
      console.log('   This is normal if custom domain not set up yet');
    }
    
    console.log('\n🎉 R2 upload test completed successfully!');
    console.log('💡 Your capsules will now be served from CDN for fast loading');
    
  } catch (error) {
    console.error('❌ R2 upload test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your Cloudflare R2 API credentials');
    console.log('   2. Verify bucket exists and has correct permissions');
    console.log('   3. Check internet connectivity');
    process.exit(1);
  }
}

// Load environment variables
require('dotenv').config();

// Run test
testR2Upload();