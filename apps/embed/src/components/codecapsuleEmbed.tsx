/// <reference types="../vite-env.d.ts" />
import React, { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'

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
  isPublished: boolean
  createdAt: string
}

export default function CodeCapsuleEmbed({ widgetId }: CapsuleEmbedProps) {
  const [widget, setWidget] = useState<Widget | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userCode, setUserCode] = useState('')
  const [executing, setExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'tests' | 'output'>('tests')
  const [instructionsCollapsed, setInstructionsCollapsed] = useState(false)
  const [showRawError, setShowRawError] = useState(false)

  useEffect(() => {
    const fetchWidget = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        const response = await fetch(`${apiUrl}/api/widgets/${widgetId}`)
        if (!response.ok) {
          throw new Error('Failed to load widget')
        }
        const data = await response.json()
        if (data.success) {
          setWidget(data.widget)
          setUserCode(data.widget.starterCode)
        } else {
          throw new Error(data.error || 'Failed to load widget')
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
    
    try {
      setExecuting(true)
      setExecutionResult(null)
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/widgets/${widgetId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: userCode,
          language: widget.language
        }),
      })
      
      const data = await response.json()
      if (data.success) {
        setExecutionResult(data.execution)
        setActiveTab('tests')
      } else {
        throw new Error(data.error || 'Execution failed')
      }
    } catch (err) {
      setExecutionResult({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
      setActiveTab('tests')
    } finally {
      setExecuting(false)
    }
  }

  const renderTestResults = () => {
    if (!executionResult) return null

    if (executionResult.success) {
      return (
        <div className="test-result">
          <div className="test-success" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>✅</span>
            <span style={{ fontWeight: '500' }}>All tests passed!</span>
          </div>
          <ul className="test-list">
            <li className="test-item test-success">
              <span>✓</span>
              <span>Handles positive numbers</span>
            </li>
            <li className="test-item test-success">
              <span>✓</span>
              <span>Handles empty list</span>
            </li>
            <li className="test-item test-success">
              <span>✓</span>
              <span>Handles duplicate numbers</span>
            </li>
          </ul>
        </div>
      )
    } else {
      return (
        <div className="test-result">
          <div className="test-error" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>❌</span>
            <span style={{ fontWeight: '500' }}>1/3 tests passed. Keep going!</span>
          </div>
          
          <ul className="test-list" style={{ marginBottom: '16px' }}>
            <li className="test-item test-success">
              <span>✓</span>
              <span>Handles positive numbers</span>
            </li>
            <li className="test-item test-error">
              <span>❌</span>
              <span>Handles empty list</span>
            </li>
            <li className="test-item test-pending">
              <span>○</span>
              <span>Handles duplicate numbers</span>
            </li>
          </ul>

          {/* AI Mentor Feedback */}
          <div className="ai-mentor">
            <div className="ai-mentor-header">
              <span style={{ color: '#60a5fa', marginTop: '2px' }}>🧠</span>
              <div>
                <div className="ai-mentor-title">AI Mentor</div>
                <div className="ai-mentor-text">
                  It looks like your code failed on an empty list. A good first step is to check if the list is empty before trying to access its elements.
                </div>
              </div>
            </div>
          </div>

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
                  {executionResult.stderr || executionResult.error || 'IndexError: list index out of range on line 5'}
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
    <div className="codecapsule-embed">
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
          <button className="control-btn" title="Settings">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button 
            onClick={() => setUserCode(widget.starterCode)} 
            className="control-btn" 
            title="Reset"
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
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
              <p>{widget.problemStatement}</p>
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
          Powered by <span className="brand">Devleep</span>
        </div>
      </div>
    </div>
  )
}