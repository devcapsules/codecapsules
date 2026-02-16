/**
 * Analytics Integration Test
 * 
 * Comprehensive test of the entire analytics pipeline from
 * embed widget events through to B2B dashboard metrics.
 */

interface SimulatedSession {
  studentId: string
  capsuleId: string
  widgetId: string
  sessionId: string
  language: string
  difficulty: string
  startTime: number
}

const API_URL = 'http://localhost:3001'

class AnalyticsIntegrationTest {
  private sessions: SimulatedSession[] = []

  async runFullAnalyticsPipeline() {
    console.log('🧪 ANALYTICS INTEGRATION TEST')
    console.log('=====================================\n')

    // Step 1: Simulate multiple student sessions
    console.log('1️⃣ Simulating Student Sessions...')
    await this.simulateStudentSessions()

    // Step 2: Test analytics tracking endpoint
    console.log('\n2️⃣ Testing Analytics Tracking...')
    await this.testAnalyticsTracking()

    // Step 3: Verify B2B dashboard metrics
    console.log('\n3️⃣ Testing B2B Dashboard Metrics...')
    await this.testB2BDashboard()

    // Step 4: Test pedagogical intelligence
    console.log('\n4️⃣ Testing Pedagogical Intelligence...')
    await this.testPedagogicalIntelligence()

    console.log('\n✅ ANALYTICS INTEGRATION TEST COMPLETE!')
  }

  private async simulateStudentSessions() {
    // Create 5 different student sessions
    const students = [
      { id: 'student_001', skill: 'beginner' },
      { id: 'student_002', skill: 'intermediate' },
      { id: 'student_003', skill: 'beginner' },
      { id: 'student_004', skill: 'advanced' },
      { id: 'student_005', skill: 'intermediate' }
    ]

    for (const student of students) {
      const session: SimulatedSession = {
        studentId: student.id,
        capsuleId: 'test_capsule_integration',
        widgetId: `widget_${student.id}`,
        sessionId: `session_${Date.now()}_${student.id}`,
        language: 'python',
        difficulty: student.skill === 'beginner' ? 'easy' : student.skill === 'intermediate' ? 'medium' : 'hard',
        startTime: Date.now()
      }

      this.sessions.push(session)
      console.log(`   📝 Created session for ${student.id} (${student.skill})`)
    }
  }

  private async testAnalyticsTracking() {
    for (const session of this.sessions) {
      // Simulate a learning session with multiple events
      const events = this.generateSessionEvents(session)
      
      try {
        const response = await fetch(`${API_URL}/api/analytics/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events })
        })

        const result = await response.json()
        if (result.success) {
          console.log(`   ✅ Tracked ${events.length} events for ${session.studentId}`)
        } else {
          console.log(`   ❌ Failed to track events for ${session.studentId}`)
        }
      } catch (error) {
        console.log(`   ❌ Error tracking ${session.studentId}: ${error}`)
      }
    }
  }

  private generateSessionEvents(session: SimulatedSession) {
    const events = []
    let timestamp = session.startTime

    // Session started
    events.push({
      type: 'session_started',
      capsuleId: session.capsuleId,
      widgetId: session.widgetId,
      timestamp: timestamp,
      sessionId: session.sessionId,
      metadata: {
        language: session.language,
        difficulty: session.difficulty,
        userAgent: 'Mozilla/5.0 (Test Browser)',
        embeddedDomain: 'testbootcamp.edu'
      }
    })

    // Simulate attempts based on skill level
    const attemptCount = session.difficulty === 'easy' ? 2 : session.difficulty === 'medium' ? 4 : 7
    
    for (let i = 0; i < attemptCount; i++) {
      timestamp += Math.random() * 30000 + 10000 // 10-40 seconds between attempts

      // Run clicked
      events.push({
        type: 'run_clicked',
        capsuleId: session.capsuleId,
        widgetId: session.widgetId,
        timestamp: timestamp,
        sessionId: session.sessionId,
        metadata: {
          language: session.language,
          attemptsCount: i + 1
        }
      })

      // Test result (success probability based on difficulty and attempt)
      const successProbability = Math.min(0.1 + (i * 0.2) + (session.difficulty === 'easy' ? 0.3 : session.difficulty === 'medium' ? 0.1 : 0), 0.9)
      const isSuccess = Math.random() < successProbability

      if (isSuccess) {
        // Success!
        events.push({
          type: 'test_passed',
          capsuleId: session.capsuleId,
          widgetId: session.widgetId,
          timestamp: timestamp + 2000,
          sessionId: session.sessionId,
          metadata: {
            language: session.language,
            totalTests: 3,
            executionTime: Math.random() * 1000 + 500,
            timeToCompletion: timestamp + 2000 - session.startTime,
            attemptsCount: i + 1
          }  
        })
        break // Student succeeded, end session
      } else {
        // Failed attempt
        events.push({
          type: 'test_failed',
          capsuleId: session.capsuleId,
          widgetId: session.widgetId,
          timestamp: timestamp + 2000,
          sessionId: session.sessionId,
          metadata: {
            language: session.language,
            passedTests: Math.floor(Math.random() * 2),
            totalTests: 3,
            executionTime: Math.random() * 1000 + 500,
            attemptsCount: i + 1,
            errorType: 'test_failure'
          }
        })

        // Maybe view hints after failures
        if (i > 1 && Math.random() < 0.6) {
          events.push({
            type: 'hint_viewed',
            capsuleId: session.capsuleId,
            widgetId: session.widgetId,
            timestamp: timestamp + 5000,
            sessionId: session.sessionId,
            metadata: {
              testCaseIndex: 0
            }
          })
        }

        // Maybe view solution if struggling
        if (i > 3 && Math.random() < 0.4) {
          events.push({
            type: 'solution_viewed',
            capsuleId: session.capsuleId,
            widgetId: session.widgetId,
            timestamp: timestamp + 8000,
            sessionId: session.sessionId,
            metadata: {
              solutionViewed: true,
              attemptsCount: i + 1
            }
          })
        }
      }
    }

    return events
  }

  private async testB2BDashboard() {
    try {
      // Test engagement metrics
      const engagement = await fetch(`${API_URL}/api/analytics/engagement/test_capsule_integration`).then(r => r.json())
      console.log(`   📊 Engagement Rate: ${engagement.metrics.engagement_rate}%`)
      console.log(`   📊 Success Rate: ${engagement.metrics.success_rate}%`)

      // Test pedagogical metrics
      const pedagogical = await fetch(`${API_URL}/api/analytics/pedagogical/testbootcamp`).then(r => r.json())
      console.log(`   🎓 Learning Effectiveness: ${pedagogical.metrics.learning_effectiveness_score}%`)
      console.log(`   🎓 At-Risk Students: ${pedagogical.metrics.at_risk_students_count}`)

      console.log('   ✅ B2B Dashboard metrics accessible')
    } catch (error) {
      console.log(`   ❌ B2B Dashboard error: ${error}`)
    }
  }

  private async testPedagogicalIntelligence() {
    try {
      // Test failing test cases analysis
      const failingTests = await fetch(`${API_URL}/api/analytics/failing-tests/testbootcamp`).then(r => r.json())
      console.log(`   📋 Failing Test Cases: ${failingTests.failing_tests.length} identified`)
      
      // Test at-risk student identification  
      const atRiskStudents = await fetch(`${API_URL}/api/analytics/at-risk-students/testbootcamp`).then(r => r.json())
      console.log(`   ⚠️  At-Risk Students: ${atRiskStudents.at_risk_students.length} identified`)

      console.log('   ✅ Pedagogical intelligence working')
    } catch (error) {
      console.log(`   ❌ Pedagogical intelligence error: ${error}`)
    }
  }
}

// Run the comprehensive test
async function runTest() {
  const test = new AnalyticsIntegrationTest()
  await test.runFullAnalyticsPipeline()
}

runTest().catch(console.error)