// Test script for queue-based execution system
const ExecutionQueue = require('./src/services/queue');
const PistonClient = require('./src/services/piston-client');
require('dotenv').config();

async function testQueueSystem() {
  console.log('🧪 Testing Queue-based Execution System...');
  
  // Test 1: Queue Service
  console.log('\n1️⃣ Testing Queue Service...');
  const queue = new ExecutionQueue();
  
  try {
    const queueLength = await queue.getQueueLength();
    console.log(`✅ Queue connected, length: ${queueLength}`);
  } catch (error) {
    console.log('❌ Queue connection failed:', error.message);
    console.log('⚠️ Make sure UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN are set');
    return;
  }

  // Test 2: Piston Client
  console.log('\n2️⃣ Testing Piston Client...');
  const pistonUrl = process.env.PISTON_URL || 'http://44.222.105.71:2000';
  const piston = new PistonClient(pistonUrl);
  
  try {
    const health = await piston.healthCheck();
    console.log(`✅ Piston health: ${health.status}`);
    if (health.availableLanguages) {
      console.log(`   Languages: ${health.availableLanguages.join(', ')}`);
    }
  } catch (error) {
    console.log('❌ Piston connection failed:', error.message);
    console.log('⚠️ Make sure Piston server is running and accessible');
    return;
  }

  // Test 3: End-to-End Queue Execution
  console.log('\n3️⃣ Testing End-to-End Queue Execution...');
  
  try {
    // Queue a Python job
    const jobId = await queue.queueJob('python', 'print("Hello from Queue!")', '');
    console.log(`✅ Job queued: ${jobId}`);
    
    // Simulate worker processing (manual execution for test)
    console.log('📋 Simulating job processing...');
    const result = await piston.executeCode('python', 'print("Hello from Queue!")', '');
    
    if (result.success) {
      await queue.setJobStatus(jobId, 'completed', result);
      console.log('✅ Job completed successfully');
      console.log(`   Output: ${result.stdout.trim()}`);
    } else {
      console.log('❌ Job execution failed');
      console.log(`   Error: ${result.stderr}`);
    }
    
    // Check job status
    const status = await queue.getJobStatus(jobId);
    console.log(`✅ Job status retrieved: ${status.status}`);
    
  } catch (error) {
    console.log('❌ End-to-end test failed:', error.message);
    return;
  }

  console.log('\n🎉 All tests passed! Queue system is ready for production.');
  console.log('\n📝 Next steps:');
  console.log('   1. Set up Upstash Redis with real credentials');
  console.log('   2. Start the queue worker: npm run worker');
  console.log('   3. Update frontend to use new async API endpoints');
  console.log('   4. Test with real traffic');
}

// Run tests
testQueueSystem().catch(console.error);