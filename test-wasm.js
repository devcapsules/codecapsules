/**
 * Test script for WASM Engine
 * Tests the QuickJS WASM integration directly
 */

import { getQuickJS } from 'quickjs-emscripten'

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
    
    // Test function execution
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
    
    // Test memory/security constraints
    const dangerousCode = `
      // This should be safe in WASM
      try {
        require('fs')
      } catch (e) {
        'File system access blocked: ' + e.message
      }
    `
    
    const securityResult = vm.evalCode(dangerousCode)
    if (securityResult.error) {
      console.log('✅ Security constraint working - dangerous code blocked')
      securityResult.error.dispose()
    } else {
      console.log('⚠️  Security result:', vm.dump(securityResult.value))
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