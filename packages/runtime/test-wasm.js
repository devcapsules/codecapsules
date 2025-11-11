/**
 * Test script for WASM Engine
 * Tests the QuickJS WASM integration directly
 */

const { getQuickJS } = require('quickjs-emscripten')

async function testWASMEngine() {
  console.log('🧪 Testing WASM Engine with QuickJS...')
  
  try {
    // Initialize QuickJS WASM
    const QuickJS = await getQuickJS()
    console.log('✅ QuickJS WASM loaded successfully')
    
    // Create VM context
    const vm = QuickJS.newContext()
    console.log('✅ Created VM context')
    
    // Test basic execution
    const basicCode = 'console.log("Hello from WASM!"); 2 + 3'
    const result = vm.evalCode(basicCode)
    
    if (result.error) {
      console.error('❌ Basic execution failed:', vm.dump(result.error))
      result.error.dispose()
    } else {
      console.log('✅ Basic execution result:', vm.dump(result.value))
      result.value.dispose()
    }
    
    // Test function execution (simulate generated capsule)
    const functionCode = `
      function findMax(arr) {
        if (arr.length === 0) return null;
        let max = arr[0];
        for (let i = 1; i < arr.length; i++) {
          if (arr[i] > max) max = arr[i];
        }
        return max;
      }
      findMax([3, 7, 2, 9, 1])
    `
    
    const funcResult = vm.evalCode(functionCode)
    if (funcResult.error) {
      console.error('❌ Function execution failed:', vm.dump(funcResult.error))
      funcResult.error.dispose()
    } else {
      console.log('✅ Function execution result:', vm.dump(funcResult.value))
      funcResult.value.dispose()
    }
    
    // Test with test cases
    const testCaseCode = `
      function findMax(arr) {
        if (arr.length === 0) return null;
        let max = arr[0];
        for (let i = 1; i < arr.length; i++) {
          if (arr[i] > max) max = arr[i];
        }
        return max;
      }
      
      // Test cases
      const tests = [
        { input: [3, 5, 7, 2, 8], expected: 8 },
        { input: [-10, -20, -5, -15], expected: -5 },
        { input: [1], expected: 1 },
        { input: [], expected: null }
      ];
      
      const results = tests.map(test => ({
        input: test.input,
        expected: test.expected,
        actual: findMax(test.input),
        passed: findMax(test.input) === test.expected
      }));
      
      results
    `
    
    const testResult = vm.evalCode(testCaseCode)
    if (testResult.error) {
      console.error('❌ Test case execution failed:', vm.dump(testResult.error))
      testResult.error.dispose()
    } else {
      console.log('✅ Test case results:', vm.dump(testResult.value))
      testResult.value.dispose()
    }
    
    // Test memory/security constraints
    const dangerousCode = `
      // This should be safe in WASM - no require available
      let result = 'File system not accessible in WASM';
      try {
        if (typeof require !== 'undefined') {
          result = 'require is available!';
        }
      } catch (e) {
        result = 'require blocked: ' + e.message;
      }
      result
    `
    
    const securityResult = vm.evalCode(dangerousCode)
    if (securityResult.error) {
      console.log('✅ Security constraint working - dangerous code blocked')
      securityResult.error.dispose()
    } else {
      console.log('🔒 Security result:', vm.dump(securityResult.value))
      securityResult.value.dispose()
    }
    
    // Cleanup
    vm.dispose()
    QuickJS.dispose()
    
    console.log('🎉 WASM Engine test completed!')
    
  } catch (error) {
    console.error('❌ WASM Engine test failed:', error)
  }
}

// Run the test
testWASMEngine()