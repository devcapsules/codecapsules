/**
 * Test Generated Capsule WASM Execution
 * Use real generated capsule data to test WASM execution
 */

const { getQuickJS } = require('quickjs-emscripten')

// Real generated capsule data from our API
const generatedCapsule = {
  title: "Find the Maximum Number in an Array",
  starterCode: `// Write a function to find the maximum number in an array
function findMaxNumber(arr) {
  // TODO: Implement logic to find the maximum number in the array
  // Hint: Use a loop to iterate through the array and compare values

  return -1; // Placeholder return value, replace with actual maximum
}`,
  solution: `// Function to find the maximum number in an array
function findMaxNumber(arr) {
  if (arr.length === 0) {
    return null; // Return null for an empty array
  }

  let max = arr[0]; // Initialize max with the first element of the array
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i]; // Update max if the current element is greater
    }
  }

  return max; // Return the largest number found
}`,
  testCases: [
    { input: "[3, 5, 7, 2, 8]", expected: "8", description: "Test with an array of positive numbers" },
    { input: "[-10, -20, -5, -15]", expected: "-5", description: "Test with an array of negative numbers" },
    { input: "[1]", expected: "1", description: "Test with a single-element array" },
    { input: "[]", expected: "null", description: "Test with an empty array" },
    { input: "[3, -5, 10, -20, 0]", expected: "10", description: "Test with a mixed array of positive and negative numbers" }
  ]
}

async function testGeneratedCapsuleExecution() {
  console.log('🧪 Testing Generated Capsule WASM Execution...')
  console.log(`📝 Testing: "${generatedCapsule.title}"`)
  
  try {
    const QuickJS = await getQuickJS()
    console.log('✅ QuickJS WASM loaded')
    
    // Test 1: Execute starter code
    console.log('\n📋 Testing Starter Code:')
    const vm1 = QuickJS.newContext()
    
    const starterTestCode = `
      ${generatedCapsule.starterCode}
      
      // Test the starter code
      const testResults = [];
      const testCases = ${JSON.stringify(generatedCapsule.testCases)};
      
      for (const testCase of testCases) {
        const input = JSON.parse(testCase.input);
        const expected = testCase.expected === "null" ? null : JSON.parse(testCase.expected);
        const actual = findMaxNumber(input);
        
        testResults.push({
          description: testCase.description,
          input: input,
          expected: expected,
          actual: actual,
          passed: actual === expected
        });
      }
      
      testResults
    `
    
    const starterResult = vm1.evalCode(starterTestCode)
    if (starterResult.error) {
      console.error('❌ Starter code execution failed:', vm1.dump(starterResult.error))
      starterResult.error.dispose()
    } else {
      const results = vm1.dump(starterResult.value)
      console.log('📊 Starter Code Test Results:')
      results.forEach((result, index) => {
        const status = result.passed ? '✅' : '❌'
        console.log(`  ${status} ${result.description}`)
        console.log(`     Input: ${JSON.stringify(result.input)}, Expected: ${JSON.stringify(result.expected)}, Got: ${JSON.stringify(result.actual)}`)
      })
      starterResult.value.dispose()
    }
    vm1.dispose()
    
    // Test 2: Execute solution code
    console.log('\n💡 Testing Solution Code:')
    const vm2 = QuickJS.newContext()
    
    const solutionTestCode = `
      ${generatedCapsule.solution}
      
      // Test the solution code
      const testResults = [];
      const testCases = ${JSON.stringify(generatedCapsule.testCases)};
      
      for (const testCase of testCases) {
        const input = JSON.parse(testCase.input);
        const expected = testCase.expected === "null" ? null : JSON.parse(testCase.expected);
        const actual = findMaxNumber(input);
        
        testResults.push({
          description: testCase.description,
          input: input,
          expected: expected,
          actual: actual,
          passed: actual === expected
        });
      }
      
      testResults
    `
    
    const solutionResult = vm2.evalCode(solutionTestCode)
    if (solutionResult.error) {
      console.error('❌ Solution code execution failed:', vm2.dump(solutionResult.error))
      solutionResult.error.dispose()
    } else {
      const results = vm2.dump(solutionResult.value)
      console.log('📊 Solution Code Test Results:')
      let passedCount = 0
      results.forEach((result, index) => {
        const status = result.passed ? '✅' : '❌'
        console.log(`  ${status} ${result.description}`)
        console.log(`     Input: ${JSON.stringify(result.input)}, Expected: ${JSON.stringify(result.expected)}, Got: ${JSON.stringify(result.actual)}`)
        if (result.passed) passedCount++
      })
      console.log(`\n🎯 Solution Results: ${passedCount}/${results.length} tests passed`)
      solutionResult.value.dispose()
    }
    vm2.dispose()
    
    console.log('\n🎉 Generated Capsule WASM Execution test completed!')
    
  } catch (error) {
    console.error('❌ Generated Capsule WASM test failed:', error)
  }
}

// Run the test
testGeneratedCapsuleExecution()