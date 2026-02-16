/// <reference types="../vite-env.d.ts" />
import React, { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { embedAnalytics } from '../utils/EmbedAnalytics'
import { executeCodeAsync } from '../utils/queueExecution'

// Feature flag: Use queue-based execution (Phase 2)
const USE_QUEUE_EXECUTION = true
interface CapsuleEmbedProps {
  widgetId: string
}

interface Widget {
  id: string
  title: string
  description: string
  language: string
  difficulty: string
  problemStatement: string
  starterCode: string
  testCases: any[]
  hints: string[]
  solutions?: string[]
  tags?: string[]
  isPublished: boolean
  createdAt: string
  content?: {
    primary?: {
      problem_statement?: string
      starter_code?: string
      solution?: string
      test_cases?: Array<{
        description: string
        input: any
        expected_output: any
      }>
      hints?: string[]
      difficulty?: string
      concepts?: string[]
    }
  }
}

export default function DevcapsulesEmbed({ widgetId }: CapsuleEmbedProps) {
  const [widget, setWidget] = useState<Widget | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userCode, setUserCode] = useState('')
  const [executing, setExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'tests' | 'output'>('tests')
  const [instructionsCollapsed, setInstructionsCollapsed] = useState(false)
  const [showRawError, setShowRawError] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [showSolution, setShowSolution] = useState(false)

  useEffect(() => {
    const fetchWidget = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        const response = await fetch(`${apiUrl}/api/capsules/${widgetId}`)
        if (!response.ok) {
          throw new Error('Failed to load capsule')
        }
        const data = await response.json()
        if (data.success && data.capsule) {
          const capsule = data.capsule
          // Map the capsule data to widget format
          const mappedWidget: Widget = {
            id: capsule.id,
            title: capsule.title || 'Untitled Capsule',
            description: capsule.description || '',
            language: capsule.language || 'python',
            difficulty: capsule.difficulty?.toLowerCase() || 'medium',
            // Fix: Use proper path for problem statement
            problemStatement: capsule.content?.primary?.problemStatement || capsule.problem_statement_md || capsule.description || '',
            // Fix: Use proper path for starter code
            starterCode: capsule.content?.primary?.code?.wasmVersion?.starterCode || capsule.config_data?.boilerplate_code || capsule.config_data?.starterCode || '# Your code here',
            // Fix: Use properly formatted test cases
            testCases: capsule.content?.primary?.code?.wasmVersion?.testCases || capsule.config_data?.test_cases || [],
            // Fix: Extract hints from pedagogy or config_data
            hints: capsule.pedagogy?.hints?.sequence?.map((hint: any) => hint.content) || capsule.config_data?.hints || [],
            // Fix: Use proper path for solution
            solutions: (() => {
              const solution = capsule.content?.primary?.code?.wasmVersion?.solution || capsule.config_data?.reference_solution || capsule.config_data?.solution;
              return solution ? [solution] : [];
            })(),
            // Fix: Extract tags from pedagogy or fallback to empty array
            tags: capsule.pedagogy?.concepts?.map((concept: any) => concept.concept) || capsule.tags || [],
            isPublished: capsule.isPublished || false,
            createdAt: capsule.createdAt || new Date().toISOString(),
            content: capsule.content
          }
          setWidget(mappedWidget)
          setUserCode(mappedWidget.starterCode)
          
          // Track session started
          embedAnalytics.trackSessionStarted(
            mappedWidget.id,
            widgetId,
            mappedWidget.language,
            mappedWidget.difficulty
          )
        } else {
          throw new Error(data.error || 'Failed to load capsule')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchWidget()
  }, [widgetId])

  const executeCode = async () => {
    if (!widget) return
    
    const startTime = Date.now()
    
    // Track run clicked
    embedAnalytics.trackRunClicked(widget.id, widgetId, widget.language)
    
    try {
      setExecuting(true)
      setExecutionResult(null)
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      
      // Extract function name from user code for test execution
      const extractFunctionName = (code: string): string => {
        let match = code.match(/function\s+(\w+)\s*\(/)
        if (match) return match[1]
        match = code.match(/const\s+(\w+)\s*=\s*\(/)
        if (match) return match[1]
        match = code.match(/def\s+(\w+)\s*\(/)
        if (match) return match[1]
        return 'solution'
      }

      // Phase 2: Use queue-based execution for scalability
      if (USE_QUEUE_EXECUTION && (widget.language === 'python' || widget.language === 'javascript')) {
        const testCases = widget.testCases || []
        const functionName = extractFunctionName(userCode)
        const results: any[] = []
        
        for (let i = 0; i < testCases.length; i++) {
          const testCase = testCases[i]
          
          // Generate test code
          let testCode = userCode
          if (widget.language === 'python') {
            const inputArgs = Array.isArray(testCase.input) 
              ? testCase.input.map((i: any) => JSON.stringify(i)).join(', ')
              : JSON.stringify(testCase.input)
            testCode = `${userCode}\n\n# Test execution\nresult = ${functionName}(${inputArgs})\nprint(result)`
          } else if (widget.language === 'javascript') {
            const inputArgs = Array.isArray(testCase.input)
              ? testCase.input.map((i: any) => JSON.stringify(i)).join(', ')
              : JSON.stringify(testCase.input)
            testCode = `${userCode}\n\n// Test execution\nconst result = ${functionName}(${inputArgs});\nconsole.log(result);`
          }
          
          try {
            const result = await executeCodeAsync(widget.language, testCode)
            const actualOutput = result.stdout.trim()
            const expectedOutput = String(testCase.expected_output).trim()
            const passed = actualOutput === expectedOutput
            
            results.push({
              id: i,
              passed,
              description: testCase.description || `Test case ${i + 1}`,
              expected: testCase.expected_output,
              actual: actualOutput || result.stderr,
              error: result.success ? undefined : result.stderr
            })
          } catch (error: any) {
            results.push({
              id: i,
              passed: false,
              description: testCase.description || `Test case ${i + 1}`,
              expected: testCase.expected_output,
              actual: '',
              error: error.message || 'Execution failed'
            })
          }
        }
        
        const executionTime = Date.now() - startTime
        const passedCount = results.filter((r: any) => r.passed).length
        const totalCount = results.length
        const allPassed = passedCount === totalCount && totalCount > 0
        
        const testResults = { allPassed, passed: passedCount, total: totalCount, results }
        
        setExecutionResult({
          success: allPassed,
          stdout: '',
          stderr: '',
          testResults,
          passedTests: passedCount,
          totalTests: totalCount
        })
        
        if (allPassed) {
          embedAnalytics.trackTestPassed(widget.id, widgetId, widget.language, executionTime, totalCount)
        } else {
          embedAnalytics.trackTestFailed(widget.id, widgetId, results.filter((r: any) => !r.passed), passedCount, totalCount, widget.language, executionTime)
        }
        
        setActiveTab('tests')
        return
      }
      
      // Fallback: Use execute-tests endpoint for other languages
      const response = await fetch(`${apiUrl}/api/execute-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userCode: userCode,
          testCases: widget.testCases || [],
          language: widget.language,
          functionName: extractFunctionName(userCode)
        }),
      })
      
      const data = await response.json()
      const executionTime = Date.now() - startTime
      
      if (data.success && data.results) {
        // Use server-side test results
        const passedCount = data.results.filter((r: any) => r.passed).length
        const totalCount = data.results.length
        const allPassed = passedCount === totalCount && totalCount > 0
        
        const testResults = {
          allPassed,
          passed: passedCount,
          total: totalCount,
          results: data.results.map((r: any, idx: number) => ({
            id: idx,
            description: r.description || `Test case ${idx + 1}`,
            passed: r.passed,
            expected: r.expected,
            actual: r.actual,
            error: r.error
          }))
        }
        
        setExecutionResult({
          success: allPassed,
          stdout: data.output || '',
          stderr: data.stderr || '',
          testResults: testResults,
          passedTests: passedCount,
          totalTests: totalCount
        })
        
        // Track analytics based on results
        if (testResults.allPassed) {
          embedAnalytics.trackTestPassed(
            widget.id,
            widgetId,
            widget.language,
            executionTime,
            testResults.total
          )
        } else {
          const failedTests = testResults.results.filter((r: any) => !r.passed)
          embedAnalytics.trackTestFailed(
            widget.id,
            widgetId,
            failedTests,
            testResults.passed,
            testResults.total,
            widget.language,
            executionTime
          )
        }
        
        setActiveTab('tests')
      } else {
        const testResults = {
          allPassed: false,
          passed: 0,
          total: widget.testCases.length,
          results: []
        }
        
        setExecutionResult({
          success: false,
          error: data.error || 'Execution failed',
          stderr: data.stderr,
          testResults
        })
        
        // Track execution failure
        embedAnalytics.trackTestFailed(
          widget.id,
          widgetId,
          [{ error: data.error || 'Execution failed' }],
          0,
          widget.testCases.length,
          widget.language,
          executionTime
        )
        
        setActiveTab('tests')
      }
    } catch (err) {
      const executionTime = Date.now() - startTime
      const testResults = {
        allPassed: false,
        passed: 0,
        total: widget.testCases.length,
        results: []
      }
      
      setExecutionResult({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        testResults
      })
      
      // Track execution error
      embedAnalytics.trackTestFailed(
        widget.id,
        widgetId,
        [{ error: err instanceof Error ? err.message : 'Unknown error' }],
        0,
        widget.testCases.length,
        widget.language,
        executionTime
      )
      
      setActiveTab('tests')
    } finally {
      setExecuting(false)
    }
  }

  const renderTestResults = () => {
    if (!executionResult || !widget) return null

    const { testResults } = executionResult

    if (executionResult.success) {
      return (
        <div className="test-result">
          <div className="test-success" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>✅</span>
            <span style={{ fontWeight: '500' }}>All tests passed!</span>
          </div>
          <ul className="test-list">
            {testResults.results.map((result: any, index: number) => (
              <li key={index} className="test-item test-success">
                <span>✓</span>
                <span>{result.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    } else {
      return (
        <div className="test-result">
          <div className="test-error" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>❌</span>
            <span style={{ fontWeight: '500' }}>
              {testResults.passed}/{testResults.total} tests passed. Keep going!
            </span>
          </div>
          
          <ul className="test-list" style={{ marginBottom: '16px' }}>
            {testResults.results.map((result: any, index: number) => (
              <li key={index} className={`test-item ${result.passed ? 'test-success' : 'test-error'}`}>
                <span>{result.passed ? '✓' : '❌'}</span>
                <span>{result.description}</span>
              </li>
            ))}
          </ul>

          {/* AI Mentor Feedback */}
          {widget.hints && widget.hints.length > 0 && (
            <div className="ai-mentor">
              <div className="ai-mentor-header">
                <span style={{ color: '#60a5fa', marginTop: '2px' }}>💡</span>
                <div>
                  <div className="ai-mentor-title">Hint</div>
                  <div className="ai-mentor-text">
                    {widget.hints[0]}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Raw Error */}
          <div>
            <button
              onClick={() => setShowRawError(!showRawError)}
              className="error-toggle"
            >
              {showRawError ? 'Hide raw error' : 'Click to show raw error'}
            </button>
            
            {showRawError && (
              <div className="raw-error">
                <pre>
                  {executionResult.stderr || executionResult.error || 'No error details available'}
                </pre>
              </div>
            )}
          </div>
        </div>
      )
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error loading widget: {error}</p>
      </div>
    )
  }

  if (!widget) {
    return (
      <div className="error-container">
        <p>Widget not found</p>
      </div>
    )
  }

  return (
    <div className="devcapsules-embed">
      {/* Header */}
      <div className="embed-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 className="embed-title">{widget.title}</h1>
          <div className="embed-tags">
            <span className="tag tag-language">
              {widget.language}
            </span>
            <span className="tag tag-difficulty">
              {widget.difficulty}
            </span>
          </div>
        </div>
        
        <div className="embed-controls">
          <button 
            onClick={() => {
              const newShowHints = !showHints
              setShowHints(newShowHints)
              
              // Track hint viewing
              if (newShowHints) {
                embedAnalytics.trackHintViewed(widget.id, widgetId, 0)
              }
            }} 
            className={`control-btn ${showHints ? 'active' : ''}`} 
            title="Show Hints"
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button 
            onClick={() => {
              if (showSolution) {
                // Reset to starter code
                setUserCode(widget.starterCode)
                setShowSolution(false)
              } else {
                // Show solution
                if (widget.solutions && widget.solutions.length > 0) {
                  setUserCode(widget.solutions[0])
                  setShowSolution(true)
                  
                  // Track solution viewing
                  embedAnalytics.trackSolutionViewed(widget.id, widgetId)
                }
              }
            }} 
            className={`control-btn ${showSolution ? 'active' : ''}`} 
            title={showSolution ? "Reset to Starter Code" : "Show Solution"}
            disabled={!widget.solutions || widget.solutions.length === 0}
          >
            {showSolution ? (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          <button
            onClick={executeCode}
            disabled={executing}
            className="run-btn"
          >
            {executing ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                Running...
              </>
            ) : (
              <>
                <span>▶</span>
                Run
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="embed-main">
        {/* Instructions Panel */}
        {!instructionsCollapsed && (
          <div className="instructions-panel">
            <div className="instructions-header">
              <h2 className="instructions-title">Instructions</h2>
              <button
                onClick={() => setInstructionsCollapsed(true)}
                className="collapse-btn"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="instructions-content">
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#e2e8f0' }}>Problem</h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>{widget.problemStatement}</p>
              </div>
              
              {widget.testCases && widget.testCases.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#e2e8f0' }}>Test Cases</h3>
                  <div style={{ color: '#cbd5e1', fontSize: '13px' }}>
                    {widget.testCases.slice(0, 3).map((testCase: any, index: number) => (
                      <div key={index} style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#374151', borderRadius: '4px' }}>
                        <div style={{ fontWeight: '500' }}>{testCase.description || `Test ${index + 1}`}</div>
                        {testCase.input && <div style={{ marginTop: '4px' }}>Input: {JSON.stringify(testCase.input)}</div>}
                        <div style={{ marginTop: '4px' }}>Expected: {JSON.stringify(testCase.expected_output || testCase.expected)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {showHints && widget.hints && widget.hints.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#e2e8f0' }}>💡 Hints</h3>
                  <div style={{ color: '#cbd5e1', fontSize: '13px' }}>
                    {widget.hints.map((hint: string, index: number) => (
                      <div key={index} style={{ 
                        marginBottom: '8px', 
                        padding: '12px', 
                        backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        borderRadius: '6px',
                        borderLeft: '3px solid #22c55e'
                      }}>
                        <div style={{ fontWeight: '500', color: '#86efac', marginBottom: '4px' }}>Hint {index + 1}</div>
                        <div style={{ lineHeight: '1.5' }}>{hint}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {widget.tags && widget.tags.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#e2e8f0' }}>Concepts</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {widget.tags.map((tag: string, index: number) => (
                      <span 
                        key={index} 
                        style={{ 
                          padding: '2px 8px', 
                          backgroundColor: '#1e40af', 
                          color: '#bfdbfe', 
                          borderRadius: '12px', 
                          fontSize: '12px' 
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collapsed Instructions Button */}
        {instructionsCollapsed && (
          <button
            onClick={() => setInstructionsCollapsed(false)}
            className="collapsed-btn"
            title="Show Instructions"
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        {/* Code Editor + Console */}
        <div className="editor-area">
          {/* Solution Banner */}
          {showSolution && (
            <div style={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderLeft: '3px solid #22c55e',
              padding: '8px 12px',
              fontSize: '13px',
              color: '#86efac',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>✅</span>
              <span>Solution is now displayed in the editor</span>
            </div>
          )}
          
          {/* Code Editor */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <Editor
              height="100%"
              defaultLanguage={widget.language === 'javascript' ? 'javascript' : widget.language}
              theme="vs-dark"
              value={userCode}
              onChange={(value) => setUserCode(value || '')}
              options={{
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                insertSpaces: true,
              }}
            />
          </div>

          {/* Console Panel */}
          <div className="console-panel">
            {/* Console Tabs */}
            <div className="console-tabs">
              <button
                onClick={() => setActiveTab('tests')}
                className={`console-tab ${activeTab === 'tests' ? 'active' : ''}`}
              >
                Tests
              </button>
              <button
                onClick={() => setActiveTab('output')}
                className={`console-tab ${activeTab === 'output' ? 'active' : ''}`}
              >
                Output
              </button>
            </div>

            {/* Console Content */}
            <div className="console-content">
              {activeTab === 'tests' ? (
                renderTestResults()
              ) : (
                <div>
                  {executionResult?.stdout ? (
                    <pre className="output-text">
                      {executionResult.stdout}
                    </pre>
                  ) : (
                    <div className="no-output">No output yet. Run your code to see results.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <span>WASM: Ready ({widget.language} 3.11)</span>
          <span>Server: Connected (PostgreSQL 15)</span>
        </div>
        <div className="status-right">
          Powered by <span className="brand">Devcapsules</span>
        </div>
      </div>
    </div>
  )
}