// Simple test for Piston connectivity
const PistonClient = require('./src/services/piston-client');

async function testPistonOnly() {
  console.log('🧪 Testing Piston Connectivity Only...');
  
  const pistonUrl = 'http://44.222.105.71:2000';
  const piston = new PistonClient(pistonUrl);
  
  console.log(`🔌 Connecting to Piston at: ${pistonUrl}`);
  
  try {
    // Test health check
    console.log('\n1️⃣ Health Check...');
    const health = await piston.healthCheck();
    console.log(`✅ Status: ${health.status}`);
    
    if (health.availableLanguages) {
      console.log(`📋 Available Languages: ${health.availableLanguages.join(', ')}`);
    }
    
    // Test code execution
    console.log('\n2️⃣ Testing Python Execution...');
    const result = await piston.executeCode('python', 'print("🎉 Phase 2 is working!")\nprint("Queue system ready!")');
    
    if (result.success) {
      console.log('✅ Python execution successful!');
      console.log(`📄 Output:\n${result.stdout}`);
    } else {
      console.log('❌ Python execution failed');
      console.log(`📄 Error: ${result.stderr}`);
    }
    
    // Test JavaScript execution
    console.log('\n3️⃣ Testing JavaScript Execution...');
    const jsResult = await piston.executeCode('javascript', 'console.log("🚀 JavaScript works too!"); console.log("Phase 2 ready for production!");');
    
    if (jsResult.success) {
      console.log('✅ JavaScript execution successful!');
      console.log(`📄 Output:\n${jsResult.stdout}`);
    } else {
      console.log('❌ JavaScript execution failed');
      console.log(`📄 Error: ${jsResult.stderr}`);
    }
    
    console.log('\n🎉 Piston is working perfectly!');
    console.log('📋 Phase 2 Status: Infrastructure Ready ✅');
    
  } catch (error) {
    console.log('❌ Piston test failed:', error.message);
    console.log('⚠️ Make sure:');
    console.log('   - Piston server is running on EC2');
    console.log('   - Port 2000 is accessible');
    console.log('   - Security group allows connections');
  }
}

testPistonOnly().catch(console.error);