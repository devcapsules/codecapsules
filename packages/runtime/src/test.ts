/**
 * WASM Runtime Test - Verify code execution works
 */
import { executeCode, createWASMRuntime } from '../src/wasm-engine'

async function testBasicExecution() {
  console.log('🧪 Testing basic JavaScript execution...')
  
  const result = await executeCode(`
    function factorial(n) {
      if (n <= 1) return 1;
      return n * factorial(n - 1);
    }
    
    console.log('Testing factorial function');
    factorial(5);
  `)

  console.log('Result:', result)
  return result.success
}

async function testWithTestCases() {
  console.log('🧪 Testing with test cases...')
  
  const testCases = [
    { input: 5, expected: 120, description: 'factorial of 5' },
    { input: 0, expected: 1, description: 'factorial of 0' },
    { input: 3, expected: 6, description: 'factorial of 3' }
  ]

  const result = await executeCode(`
    function factorial(n) {
      if (n <= 1) return 1;
      return n * factorial(n - 1);
    }
    
    function main(input) {
      return factorial(input);
    }
  `, 'javascript', testCases)

  console.log('Test Results:')
  result.testResults?.forEach((test, i) => {
    console.log(`  Test ${i + 1}: ${test.passed ? '✅' : '❌'} ${testCases[i].description}`)
    if (!test.passed) {
      console.log(`    Expected: ${test.expected}, Got: ${test.actual}`)
    }
  })

  return result.success && result.testResults?.every(t => t.passed)
}

async function testSecurityRestrictions() {
  console.log('🛡️ Testing security restrictions...')
  
  // Test network access restriction
  const networkTest = await executeCode(`
    fetch('https://example.com')
  `)

  console.log('Network restriction test:', networkTest.success ? '❌ FAILED' : '✅ PASSED')

  // Test file system restriction
  const fileTest = await executeCode(`
    require('fs')
  `)

  console.log('File system restriction test:', fileTest.success ? '❌ FAILED' : '✅ PASSED')

  return !networkTest.success && !fileTest.success
}

async function runAllTests() {
  console.log('🚀 Starting WASM Runtime Tests\n')
  
  try {
    const basicTest = await testBasicExecution()
    const testCaseTest = await testWithTestCases()
    const securityTest = await testSecurityRestrictions()
    
    console.log('\n📊 Test Summary:')
    console.log(`  Basic Execution: ${basicTest ? '✅' : '❌'}`)
    console.log(`  Test Cases: ${testCaseTest ? '✅' : '❌'}`)
    console.log(`  Security: ${securityTest ? '✅' : '❌'}`)
    
    const allPassed = basicTest && testCaseTest && securityTest
    console.log(`\n${allPassed ? '🎉 All tests passed!' : '❌ Some tests failed'}`)
    
    return allPassed
  } catch (error) {
    console.error('❌ Test suite failed:', error)
    return false
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1)
  })
}

export { runAllTests }