import React, { useState, useEffect, useRef } from 'react'

interface TerminalCapsuleEmbedProps {
  widgetId: string
}

interface TerminalCapsule {
  id: string
  title: string
  description: string
  type: 'TERMINAL'
  difficulty: string
  problemStatement: string
  tasks: Array<{
    id: string
    description: string
    completed: boolean
  }>
  runtimeTier: 'wasm-linux' | 'server-vm'
  diskImageUrl?: string
  validationScript?: string
  sessionId?: string
  websocketUrl?: string
  isPublished: boolean
  createdAt: string
}

interface TerminalLine {
  id: string
  type: 'input' | 'output' | 'error'
  content: string
  timestamp: Date
}

export default function TerminalCapsuleEmbed({ widgetId }: TerminalCapsuleEmbedProps) {
  const [capsule, setCapsule] = useState<TerminalCapsule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentDirectory, setCurrentDirectory] = useState('~')
  const [tasks, setTasks] = useState<TerminalCapsule['tasks']>([])
  const terminalEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchCapsule = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        const response = await fetch(`${apiUrl}/api/capsules/${widgetId}`)
        if (!response.ok) {
          throw new Error('Failed to load capsule')
        }
        const data = await response.json()
        if (data.success && data.capsule) {
          const capsuleData = data.capsule
          // Map to Terminal capsule format with proper data structure handling
          const terminalCapsule: TerminalCapsule = {
            id: capsuleData.id,
            title: capsuleData.title || 'Terminal Challenge',
            description: capsuleData.description || '',
            type: 'TERMINAL',
            difficulty: capsuleData.difficulty?.toLowerCase() || 'medium',
            // Fix: Use proper path for problem statement
            problemStatement: capsuleData.content?.primary?.problemStatement || capsuleData.problem_statement_md || capsuleData.description || '',
            // Fix: Extract tasks from test cases or create default ones
            tasks: (() => {
              const testCases = capsuleData.content?.primary?.terminal?.testCases || capsuleData.config_data?.test_cases || [];
              if (testCases.length > 0) {
                return testCases.map((testCase: any, index: number) => ({
                  id: String(index + 1),
                  description: testCase.description || testCase.test_call || `Task ${index + 1}`,
                  completed: false
                }));
              }
              // Fallback tasks based on problem statement
              const problemText = capsuleData.problem_statement_md || capsuleData.description || '';
              if (problemText.includes('ls') || problemText.includes('list')) {
                return [
                  { id: '1', description: 'List files in current directory using ls', completed: false },
                  { id: '2', description: 'Show current directory path using pwd', completed: false },
                  { id: '3', description: 'Use echo command to print text', completed: false }
                ];
              }
              return [
                { id: '1', description: 'Execute the required terminal commands', completed: false }
              ];
            })(),
            runtimeTier: 'wasm-linux',
            diskImageUrl: capsuleData.content?.primary?.diskImageUrl,
            validationScript: capsuleData.content?.primary?.validationScript,
            isPublished: capsuleData.isPublished || false,
            createdAt: capsuleData.createdAt || new Date().toISOString()
          }
          setCapsule(terminalCapsule)
          setTasks(terminalCapsule.tasks)
          
          // Initialize terminal with welcome message
          setTerminalLines([
            {
              id: '1',
              type: 'output',
              content: 'Welcome to the Linux Terminal Challenge!',
              timestamp: new Date()
            },
            {
              id: '2',
              type: 'output',
              content: 'Type your commands below. Use "help" for available commands.',
              timestamp: new Date()
            }
          ])
        } else {
          throw new Error(data.error || 'Failed to load capsule')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchCapsule()
  }, [widgetId])

  useEffect(() => {
    // Auto-scroll to bottom when new lines are added
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [terminalLines])

  useEffect(() => {
    // Focus input when component mounts
    inputRef.current?.focus()
  }, [])

  const executeCommand = async (command: string) => {
    if (!capsule || !command.trim()) return

    const newInputLine: TerminalLine = {
      id: Date.now().toString(),
      type: 'input',
      content: `${currentDirectory} $ ${command}`,
      timestamp: new Date()
    }

    setTerminalLines(prev => [...prev, newInputLine])
    setCurrentInput('')
    setIsExecuting(true)

    try {
      // Call the backend terminal execution API
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/terminal/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: command.trim(),
          sessionId: `sess_${capsule.id}`,
          capsuleId: capsule.id
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      const outputLine: TerminalLine = {
        id: (Date.now() + 1).toString(),
        type: result.success ? 'output' : 'error',
        content: result.output || result.error || 'No output',
        timestamp: new Date()
      }

      setTerminalLines(prev => [...prev, outputLine])

    } catch (err) {
      const errorLine: TerminalLine = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        content: `Network Error: ${err instanceof Error ? err.message : 'Could not connect to server'}`,
        timestamp: new Date()
      }
      setTerminalLines(prev => [...prev, errorLine])
    } finally {
      setIsExecuting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isExecuting) {
      executeCommand(currentInput)
    }
  }

  const checkWork = async () => {
    if (!capsule) return

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/terminal/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          capsuleId: capsule.id,
          sessionId: `sess_${capsule.id}`
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success && result.tasks) {
        setTasks(result.tasks)
        
        // Add a validation message to terminal
        const validationLine: TerminalLine = {
          id: Date.now().toString(),
          type: 'output',
          content: `✅ Validation complete: ${result.completedTasks}/${result.totalTasks} tasks completed (${result.progress}%)`,
          timestamp: new Date()
        }
        setTerminalLines(prev => [...prev, validationLine])
      }
    } catch (err) {
      const errorLine: TerminalLine = {
        id: Date.now().toString(),
        type: 'error',
        content: `Validation Error: ${err instanceof Error ? err.message : 'Could not validate tasks'}`,
        timestamp: new Date()
      }
      setTerminalLines(prev => [...prev, errorLine])
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
        <p>Error loading terminal capsule: {error}</p>
      </div>
    )
  }

  if (!capsule) {
    return (
      <div className="error-container">
        <p>Terminal capsule not found</p>
      </div>
    )
  }

  return (
    <div className="codecapsule-embed terminal-embed">
      {/* Header */}
      <div className="embed-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 className="embed-title">{capsule.title}</h1>
          <div className="embed-tags">
            <span className="tag tag-language">Terminal</span>
            <span className="tag tag-difficulty">{capsule.difficulty}</span>
          </div>
        </div>
        
        <div className="embed-controls">
          <button
            onClick={checkWork}
            className="run-btn"
          >
            <span>✓</span>
            Check Work
          </button>
        </div>
      </div>

      {/* Main Content - 2 Pane Quest Layout */}
      <div className="embed-main terminal-main">
        {/* Quest Log (Instructions) */}
        <div className="instructions-panel quest-panel">
          <div className="instructions-header">
            <h2 className="instructions-title">Quest Log</h2>
          </div>
          <div className="instructions-content">
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#e2e8f0' }}>Objective</h3>
              <p style={{ color: '#cbd5e1', lineHeight: '1.6', marginBottom: '16px' }}>
                {capsule.problemStatement}
              </p>
            </div>
            
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#e2e8f0' }}>Tasks</h3>
              <div className="task-list">
                {tasks.map((task, index) => (
                  <div key={task.id} className="task-item" style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    marginBottom: '8px',
                    padding: '8px',
                    backgroundColor: task.completed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(75, 85, 99, 0.3)',
                    borderRadius: '6px',
                    border: task.completed ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(75, 85, 99, 0.5)'
                  }}>
                    <span style={{ 
                      color: task.completed ? '#22c55e' : '#9ca3af',
                      fontSize: '14px',
                      flexShrink: 0
                    }}>
                      {task.completed ? '✅' : '⬜'}
                    </span>
                    <span style={{ 
                      color: task.completed ? '#86efac' : '#cbd5e1',
                      fontSize: '13px',
                      lineHeight: '1.4'
                    }}>
                      {task.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Terminal Interface */}
        <div className="terminal-area">
          <div className="terminal-container">
            <div className="terminal-header">
              <div className="terminal-controls">
                <span className="terminal-dot red"></span>
                <span className="terminal-dot yellow"></span>
                <span className="terminal-dot green"></span>
              </div>
              <span className="terminal-title">user@terminal</span>
            </div>
            
            <div className="terminal-content">
              {terminalLines.map((line) => (
                <div key={line.id} className={`terminal-line ${line.type}`}>
                  <pre style={{ margin: 0, fontFamily: 'Monaco, monospace', fontSize: '13px' }}>
                    {line.content}
                  </pre>
                </div>
              ))}
              
              {/* Current Input Line */}
              <div className="terminal-line input-line">
                <span className="terminal-prompt">{currentDirectory} $ </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isExecuting}
                  className="terminal-input"
                  autoFocus
                />
                {isExecuting && <span className="terminal-cursor">_</span>}
              </div>
              
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <span>Terminal: Connected (Alpine Linux)</span>
          <span>Runtime: WASM</span>
        </div>
        <div className="status-right">
          Powered by <span className="brand">Devcapsules</span>
        </div>
      </div>
    </div>
  )
}