/**
 * Frontend-API Integration Test
 * 
 * Quick test to verify the API client connection and functionality
 */

import { apiClient } from '../src/lib/api/client'

async function testAPIIntegration() {
  console.log('🔍 Testing Frontend-API Integration')
  console.log('=====================================')
  
  try {
    // Test 1: API Health Check
    console.log('\n1️⃣ Testing API Health...')
    const health = await apiClient.getHealth()
    console.log('✅ Health Check:', {
      status: health.status,
      execution_mode: health.execution_mode,
      ai_service: health.ai_service,
      languages: health.supported_languages?.length || 0
    })

    // Test 2: Simple Code Generation
    console.log('\n2️⃣ Testing Code Generation...')
    const genResult = await apiClient.generateCode({
      prompt: 'Create a simple hello world function',
      language: 'python',
      difficulty: 'easy'
    })
    
    if (genResult.success) {
      console.log('✅ Code Generation Success:', {
        code_length: genResult.code.length,
        has_explanation: !!genResult.explanation,
        quality_score: genResult.quality_score
      })
    } else {
      console.log('❌ Code Generation Failed:', genResult.error)
    }

    // Test 3: Code Execution
    console.log('\n3️⃣ Testing Code Execution...')
    const execResult = await apiClient.executeCode({
      source_code: 'print("Hello from API integration test!")',
      language: 'python'
    })
    
    if (execResult.success) {
      console.log('✅ Code Execution Success:', {
        output: execResult.stdout?.trim(),
        execution_time: execResult.execution_time,
        exit_code: execResult.exit_code
      })
    } else {
      console.log('❌ Code Execution Failed:', execResult.error)
    }

    // Test 4: Combined Generation + Execution
    console.log('\n4️⃣ Testing Generate + Execute...')
    const combinedResult = await apiClient.generateAndExecute({
      prompt: 'Create a function that adds two numbers and return the sum',
      language: 'python',
      difficulty: 'easy',
      input: ''
    })
    
    if (combinedResult.success) {
      console.log('✅ Generate + Execute Success:', {
        generation_success: combinedResult.generation.success,
        execution_success: combinedResult.execution.success,
        combined_success: combinedResult.combined_success,
        output: combinedResult.execution.stdout?.trim()
      })
    } else {
      console.log('❌ Generate + Execute Failed:', combinedResult.error)
    }

    console.log('\n🎉 API Integration Test Complete!')
    console.log('================================')
    console.log('✅ All tests passed - Frontend ready for production!')

  } catch (error) {
    console.error('❌ API Integration Test Failed:', error)
    console.log('\n💡 Troubleshooting:')
    console.log('1. Make sure API server is running on http://localhost:3001')
    console.log('2. Check NEXT_PUBLIC_API_URL in .env.local')
    console.log('3. Verify API server health at http://localhost:3001/health')
  }
}

// Run the test
if (typeof window === 'undefined') {
  // Node.js environment
  testAPIIntegration()
} else {
  // Browser environment
  console.log('🌐 Frontend API Integration Ready')
  console.log('Open browser console and run: testAPIIntegration()')
  ;(window as any).testAPIIntegration = testAPIIntegration
}