/**
 * Phase 1A Integration Test - Validates Analytics & AI Mentor Integration
 * 
 * This tests that our new analytics and mentor systems are properly integrated
 * into the CodeCapsule API and work correctly.
 */

const API_BASE = 'http://localhost:3001'

async function testPhase1AIntegration() {
  console.log('🧪 Phase 1A Integration Test - Analytics & AI Mentor System')
  console.log('=' .repeat(60))
  
  const results = {
    healthCheck: false,
    analyticsTrack: false,
    mentorHint: false,
    qualityMetrics: false,
    feedbackProcess: false
  }

  // Test 1: Health Check
  console.log('\n1️⃣ Testing Health Check...')
  try {
    const response = await fetch(`${API_BASE}/health`)
    const data = await response.json()
    
    if (response.ok) {
      console.log('   ✅ Health check passed')
      console.log(`   📊 Status: ${data.status}`)
      console.log(`   🤖 AI Service: ${data.ai_service}`)
      console.log(`   ⚡ Execution Mode: ${data.execution_mode}`)
      results.healthCheck = true
    } else {
      console.log('   ❌ Health check failed')
    }
  } catch (error) {
    console.log('   ❌ Health check error:', error.message)
  }

  // Test 2: Analytics Event Tracking
  console.log('\n2️⃣ Testing Analytics Event Tracking...')
  try {
    const response = await fetch(`${API_BASE}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'capsule_started',
        user_id: 'test-user-123',
        metadata: {
          capsule_id: 'test-capsule',
          session_id: 'test-session'
        }
      })
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      console.log('   ✅ Analytics tracking successful')
      console.log(`   📈 Message: ${data.message}`)
      results.analyticsTrack = true
    } else {
      console.log('   ❌ Analytics tracking failed:', data.error)
    }
  } catch (error) {
    console.log('   ❌ Analytics tracking error:', error.message)
  }

  // Test 3: AI Mentor Hint
  console.log('\n3️⃣ Testing AI Mentor Hint System...')
  try {
    const response = await fetch(`${API_BASE}/api/mentor/hint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'test-user-123',
        capsule_id: 'test-capsule',
        test_case_id: 'test-case-1',
        submitted_code: 'def hello(): print("hello")',
        error_signature: {
          error_type: 'IndexError',
          error_message: 'list index out of range',
          test_case_id: 'test-case-1',
          capsule_id: 'test-capsule'
        }
      })
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      console.log('   ✅ AI Mentor hint successful')
      console.log(`   💡 Hint: ${data.data?.hint?.substring(0, 50)}...`)
      console.log(`   💰 Cost: $${data.debug_info?.cost_estimate?.toFixed(4) || '0.0000'}`)
      results.mentorHint = true
    } else {
      console.log('   ❌ AI Mentor hint failed:', data.error)
    }
  } catch (error) {
    console.log('   ❌ AI Mentor hint error:', error.message)
  }

  // Test 4: Quality Metrics Analysis
  console.log('\n4️⃣ Testing Quality Metrics Analysis...')
  try {
    const response = await fetch(`${API_BASE}/api/analytics/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      console.log('   ✅ Quality analysis successful')
      console.log(`   📊 Suggestions found: ${data.count}`)
      results.qualityMetrics = true
    } else {
      console.log('   ❌ Quality analysis failed:', data.error)
    }
  } catch (error) {
    console.log('   ❌ Quality analysis error:', error.message)
  }

  // Test 5: Feedback Processing
  console.log('\n5️⃣ Testing Feedback Processing...')
  try {
    const response = await fetch(`${API_BASE}/api/feedback/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        capsule_id: 'test-capsule',
        improvement_suggestions: []
      })
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      console.log('   ✅ Feedback processing successful')
      console.log(`   🔄 Message: ${data.message}`)
      results.feedbackProcess = true
    } else {
      console.log('   ❌ Feedback processing failed:', data.error)
    }
  } catch (error) {
    console.log('   ❌ Feedback processing error:', error.message)
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📋 Phase 1A Integration Test Results:')
  console.log('=' .repeat(60))
  
  const passed = Object.values(results).filter(Boolean).length
  const total = Object.keys(results).length
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL'
    const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase()
    console.log(`   ${status} ${testName}`)
  })
  
  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`)
  
  if (passed === total) {
    console.log('🎉 Phase 1A Integration: SUCCESS!')
    console.log('✅ Analytics and AI Mentor systems are fully integrated and working')
    console.log('🚀 Ready to proceed to Phase 1B: AI Agents Integration')
  } else {
    console.log('⚠️  Phase 1A Integration: PARTIAL SUCCESS')
    console.log('📝 Some components need fixes before proceeding to Phase 1B')
  }
}

// Check if running from command line
if (import.meta.url === `file://${process.argv[1]}`) {
  testPhase1AIntegration().catch(console.error)
}

export { testPhase1AIntegration }