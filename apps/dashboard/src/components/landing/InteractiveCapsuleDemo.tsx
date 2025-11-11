import React, { useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="h-full bg-gray-800 rounded flex items-center justify-center text-gray-400">Loading editor...</div>
})

interface GeneratedCapsule {
  title: string
  description: string
  language: string
  difficulty: string
  problemStatement: string
  starterCode: string
  solution: string
  testCases: any[]
  hints: string[]
  id?: string
}

interface ExecutionResult {
  success: boolean
  stdout?: string
  stderr?: string
  output?: string
  error?: string
}

export default function InteractiveCapsuleDemo() {
  const [generating, setGenerating] = useState(false)
  const [generatedCapsule, setGeneratedCapsule] = useState<GeneratedCapsule | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState('python')
  const [selectedDifficulty, setSelectedDifficulty] = useState('easy')
  const [prompt, setPrompt] = useState('Create a function that adds two numbers and returns the result')
  
  // Interactive coding state
  const [userCode, setUserCode] = useState('')
  const [executing, setExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null)
  const [showHint, setShowHint] = useState(false)

  const generateCapsule = async () => {
    setGenerating(true)
    try {
      const apiUrl = 'http://localhost:3001' // API server URL
      const response = await fetch(`${apiUrl}/api/generate-and-execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          language: selectedLanguage,
          difficulty: selectedDifficulty,
          input: '', // Required by the API
          archetype: 'generated' // Required by the API
        }),
      })

      const data = await response.json()
      console.log('API Response:', data) // Debug logging
      
      if (data.success && data.generation) {
        // Extract structured data from the full capsule
        const fullCapsule = data.generation.fullCapsule
        const primaryContent = fullCapsule?.content?.primary || {}
        
        console.log('Full API Response:', JSON.stringify(data, null, 2))
        console.log('Full Capsule Structure:', JSON.stringify(fullCapsule, null, 2))
        console.log('Primary Content:', JSON.stringify(primaryContent, null, 2))
        
        // Generate contextual fallback test cases and hints if not provided by AI
        const generateFallbackContent = (title: string, description: string) => {
          const isArrayProblem = /array|list|maximum|minimum|sum|average/i.test(title + description)
          const isStringProblem = /string|text|reverse|palindrome|character/i.test(title + description)
          const isPrimeProblem = /prime|number|divisible/i.test(title + description)
          
          let testCases = []
          let hints = []
          
          if (isArrayProblem) {
            testCases = [
              { description: "Test with a normal array: [1, 5, 3, 9, 2]", expected: "expected result" },
              { description: "Test with an empty array: []", expected: "handle empty case" },
              { description: "Test with single element: [42]", expected: "single element result" }
            ]
            hints = [
              "Consider what happens with an empty array",
              "Think about the algorithm's time complexity",
              "Remember to handle edge cases like single elements"
            ]
          } else if (isStringProblem) {
            testCases = [
              { description: "Test with regular text: 'hello'", expected: "transformed result" },
              { description: "Test with empty string: ''", expected: "empty case" },
              { description: "Test with special characters: 'a1b2c3'", expected: "special case result" }
            ]
            hints = [
              "Consider case sensitivity in your solution",
              "Think about how to handle empty strings",
              "Remember string methods like charAt() or substring()"
            ]
          } else if (isPrimeProblem) {
            testCases = [
              { description: "Test with a prime number: 7", expected: true },
              { description: "Test with a non-prime: 4", expected: false },
              { description: "Test edge cases: 1, 2", expected: "varies" }
            ]
            hints = [
              "A prime number is only divisible by 1 and itself",
              "Check divisibility from 2 up to the square root",
              "Handle edge cases: 1 is not prime, 2 is the only even prime"
            ]
          } else {
            // Generic fallbacks
            testCases = [
              { description: "Test with typical input", expected: "expected output" },
              { description: "Test with edge case", expected: "edge case result" },
              { description: "Test with boundary values", expected: "boundary result" }
            ]
            hints = [
              "Break down the problem into smaller steps",
              "Consider edge cases and boundary conditions",
              "Think about the most efficient approach"
            ]
          }
          
          return { testCases, hints }
        }
        
        const fallbackContent = generateFallbackContent(data.generation.title, data.generation.description)
        
        // Map the API response to our expected format with proper structure
        const capsule = {
          id: data.generation.savedCapsuleId,
          title: data.generation.title,
          description: data.generation.description,
          language: selectedLanguage,
          difficulty: selectedDifficulty,
          problemStatement: primaryContent.problemStatement || data.generation.description,
          starterCode: primaryContent.code?.wasmVersion?.starterCode || primaryContent.solutionStub || data.generation.code,
          solution: primaryContent.code?.wasmVersion?.solution || data.generation.code,
          testCases: primaryContent.testCases && primaryContent.testCases.length > 0 ? primaryContent.testCases : fallbackContent.testCases,
          hints: primaryContent.hints && primaryContent.hints.length > 0 ? primaryContent.hints : fallbackContent.hints
        }
        
        console.log('Final Mapped Capsule:', capsule)
        setGeneratedCapsule(capsule)
        setUserCode(capsule.starterCode) // Initialize the editor with starter code
      } else {
        console.error('Generation failed:', data.error || data.details || 'No generation data returned')
        alert(`Failed to generate capsule: ${data.error || data.details || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error generating capsule:', error)
      alert('Network error. Please check if the API server is running.')
    } finally {
      setGenerating(false)
    }
  }

  const executeCode = async () => {
    if (!userCode.trim()) {
      alert('Please write some code first!')
      return
    }

    setExecuting(true)
    setExecutionResult(null)
    
    try {
      const apiUrl = 'http://localhost:3001'
      const language = generatedCapsule?.language || selectedLanguage
      
      console.log('Executing code with:', {
        code: userCode,
        language: language,
        generatedCapsuleLanguage: generatedCapsule?.language,
        selectedLanguage: selectedLanguage
      })
      
      const response = await fetch(`${apiUrl}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_code: userCode,
          language: language,
          input: '' // Could be enhanced to allow user input
        }),
      })

      const result = await response.json()
      console.log('Execution result:', result)
      console.log('stdout:', result.stdout)
      console.log('stderr:', result.stderr)
      console.log('success:', result.success)
      
      const executionData = {
        success: result.success || false,
        stdout: result.stdout,
        stderr: result.stderr,
        output: result.output,
        error: result.error || result.stderr
      }
      
      console.log('Setting execution result:', executionData)
      setExecutionResult(executionData)
    } catch (error) {
      console.error('Execution error:', error)
      setExecutionResult({
        success: false,
        error: 'Network error. Please check if the API server is running.'
      })
    } finally {
      setExecuting(false)
    }
  }

  const resetCode = () => {
    if (generatedCapsule) {
      setUserCode(generatedCapsule.starterCode)
      setExecutionResult(null)
    }
  }

  const getLanguageForMonaco = (lang: string) => {
    switch(lang.toLowerCase()) {
      case 'python': return 'python'
      case 'javascript': return 'javascript'
      case 'java': return 'java'
      case 'cpp': return 'cpp'
      case 'c++': return 'cpp'
      default: return 'javascript'
    }
  }

  const getEmbedUrl = () => {
    if (!generatedCapsule?.id) return ''
    return `http://localhost:3002?widgetId=${generatedCapsule.id}`
  }

  if (generatedCapsule) {
    return (
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-green-600/10 rounded-2xl blur-xl"></div>
          
          <div className="relative bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-medium">Challenge Generated</span>
                </div>
                <h3 className="text-2xl font-bold text-white leading-tight">{generatedCapsule.title}</h3>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center space-x-1 bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-600/30">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                    </svg>
                    <span>{generatedCapsule.language}</span>
                  </span>
                  <span className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium border ${
                    generatedCapsule.difficulty === 'easy' ? 'bg-green-600/20 text-green-400 border-green-600/30' :
                    generatedCapsule.difficulty === 'medium' ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' :
                    'bg-red-600/20 text-red-400 border-red-600/30'
                  }`}>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    <span className="capitalize">{generatedCapsule.difficulty}</span>
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setGeneratedCapsule(null)
                  setUserCode('')
                  setExecutionResult(null)
                  setShowHint(false)
                }}
                className="group flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white px-4 py-2 rounded-xl transition-all duration-200 border border-gray-600/30 hover:border-gray-500/50"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm font-medium">Generate Another</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Two Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[650px]">
          
          {/* Left Panel - Problem Statement & Test Cases */}
          <div className="relative group overflow-hidden">
            {/* Panel glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl blur-xl group-hover:from-blue-600/10 group-hover:to-purple-600/10 transition-all duration-300"></div>
            
            <div className="relative bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden flex flex-col h-full shadow-xl">
              {/* Enhanced Left Panel Header */}
              <div className="bg-gray-800/60 px-6 py-4 border-b border-gray-600/50 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center border border-blue-600/30">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-white">Problem & Requirements</h4>
                </div>
              </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
              {/* Enhanced Problem Statement */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-purple-600/20 rounded-lg flex items-center justify-center border border-purple-600/30">
                    <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h5 className="text-base font-semibold text-white">Problem Statement</h5>
                </div>
                <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-600/30">
                  <p className="text-gray-200 text-sm leading-relaxed break-words whitespace-pre-wrap">
                    {generatedCapsule.problemStatement}
                  </p>
                </div>
              </div>

              {/* Enhanced Test Cases */}
              {generatedCapsule.testCases && generatedCapsule.testCases.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-600/20 rounded-lg flex items-center justify-center border border-green-600/30">
                      <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h5 className="text-base font-semibold text-white">Test Cases</h5>
                  </div>
                  <div className="space-y-3">
                    {generatedCapsule.testCases.slice(0, 3).map((testCase, index) => (
                      <div key={index} className="bg-gray-800/40 rounded-xl p-4 border border-gray-600/30 hover:border-green-600/30 transition-colors duration-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-5 h-5 bg-green-600/20 rounded-full flex items-center justify-center text-xs text-green-400 font-medium">
                            {index + 1}
                          </div>
                          <span className="text-green-400 font-medium text-sm">Test Case {index + 1}</span>
                        </div>
                        <div className="text-gray-200 text-sm leading-relaxed break-words whitespace-pre-wrap">
                          {typeof testCase === 'string' ? testCase : 
                           testCase.description || testCase.input || 'Test case defined'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced Hints Section */}
              {generatedCapsule.hints && generatedCapsule.hints.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-yellow-600/20 rounded-lg flex items-center justify-center border border-yellow-600/30">
                      <svg className="w-3 h-3 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h5 className="text-base font-semibold text-white">Hints</h5>
                    <button
                      onClick={() => setShowHint(!showHint)}
                      className="ml-auto text-xs text-yellow-400 hover:text-yellow-300 transition-colors px-2 py-1 rounded-lg hover:bg-yellow-600/10"
                    >
                      {showHint ? 'Hide Hints' : 'Show Hints'}
                    </button>
                  </div>
                  {showHint && (
                    <div className="space-y-3 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-600/30 scrollbar-track-transparent">
                      {generatedCapsule.hints.slice(0, 2).map((hint, index) => (
                        <div key={index} className="bg-yellow-900/20 border border-yellow-600/30 rounded-xl p-4 hover:bg-yellow-900/30 transition-colors duration-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-5 h-5 bg-yellow-600/20 rounded-full flex items-center justify-center text-xs text-yellow-400 font-medium mt-0.5 flex-shrink-0">
                              💡
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-yellow-400 font-medium text-sm mb-2">Hint {index + 1}</div>
                              <div className="text-yellow-200 text-sm leading-relaxed break-words overflow-wrap-anywhere">{hint}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="relative group">
          {/* Panel glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-blue-600/5 rounded-2xl blur-xl group-hover:from-green-600/10 group-hover:to-blue-600/10 transition-all duration-300"></div>
          <div className="relative bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden flex flex-col h-full shadow-xl">
            
            {/* Enhanced Right Panel Header */}
            <div className="bg-gray-800/60 px-6 py-4 border-b border-gray-600/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center border border-green-600/30">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-white">Code Editor</h4>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={executeCode}
                    disabled={executing || !userCode.trim()}
                    className="group relative bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl disabled:shadow-none"
                  >
                    {executing ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                        <span>Running...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8" />
                        </svg>
                        <span>Run Code</span>
                        <svg className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Monaco Editor */}
            <div className="flex-1 min-h-0 relative">
              <div className="absolute inset-0 bg-gray-900/30 rounded-lg overflow-hidden border border-gray-600/20">
                <MonacoEditor
                  height="60%"
                  language={getLanguageForMonaco(generatedCapsule.language)}
                  theme="vs-dark"
                  value={userCode}
                  onChange={(value) => setUserCode(value || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'on',
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                    padding: { top: 12, bottom: 12 },
                    scrollbar: {
                      verticalScrollbarSize: 8,
                      horizontalScrollbarSize: 8,
                    },
                    renderLineHighlight: 'gutter',
                    bracketPairColorization: { enabled: true },
                  }}
                />
              </div>
            </div>

            {/* Output Section */}
            <div className="bg-gray-800/50 border-t border-gray-600 p-4 max-h-40 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-medium text-gray-300">Output</h5>
                {executionResult && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    executionResult.success ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                  }`}>
                    {executionResult.success ? '✓ Success' : '✗ Error'}
                  </span>
                )}
              </div>
              
              {executionResult ? (
                <div className="space-y-2">
                  {executionResult.success && (
                    <div className="bg-gray-900 rounded p-3">
                      <div className="text-green-400 text-xs mb-1">Output:</div>
                      <pre className="text-white text-sm font-mono whitespace-pre-wrap">
                        {executionResult.stdout || executionResult.output || '(no output)'}
                      </pre>
                    </div>
                  )}
                  {(executionResult.error || executionResult.stderr) && (
                    <div className="bg-red-900/30 border border-red-600/30 rounded p-3">
                      <div className="text-red-400 text-xs mb-1">Error:</div>
                      <pre className="text-red-300 text-sm font-mono whitespace-pre-wrap">
                        {executionResult.error || executionResult.stderr}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  Click "Run Code" to see output here...
                </div>
              )}
            </div>

          </div>
        </div>
        
        {/* Close grid layout and space-y-6 container */}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Demo Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-4 py-2 rounded-full border border-blue-500/20">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span className="text-blue-400 text-sm font-medium">AI-Powered Challenge Generator</span>
        </div>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
          Watch AI transform your idea into a complete coding challenge with real-time execution
        </p>
      </div>

      {/* Enhanced Generator Form */}
      <div className="relative">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 rounded-2xl blur-xl"></div>
        
        <div className="relative bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
          <div className="space-y-6">
            {/* Prompt Input with Icon */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-200">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Describe your coding challenge</span>
              </label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Create a function that finds the maximum value in an array and returns both the value and its index"
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 hover:border-gray-500/50"
                  rows={4}
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                  {prompt.length}/500
                </div>
              </div>
            </div>

            {/* Language & Difficulty with Icons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-200">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span>Programming Language</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none cursor-pointer transition-all duration-200 hover:border-gray-500/50"
                  >
                    <option value="javascript">🟨 JavaScript</option>
                    <option value="python">🐍 Python</option>
                    <option value="java">☕ Java</option>
                    <option value="cpp">⚡ C++</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-200">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Difficulty Level</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent appearance-none cursor-pointer transition-all duration-200 hover:border-gray-500/50"
                  >
                    <option value="easy">🟢 Easy</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="hard">🔴 Hard</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Generate Button */}
            <div className="pt-4">
              <button
                onClick={generateCapsule}
                disabled={generating || !prompt.trim()}
                className="group relative w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                {/* Button glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                
                <div className="relative flex items-center justify-center space-x-3">
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Generating your capsule...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Generate Interactive Capsule</span>
                      <svg className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* Quick Examples */}
            <div className="pt-4 border-t border-gray-700/50">
              <p className="text-xs text-gray-400 mb-3">Quick examples to try:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Find the second largest number in an array",
                  "Check if a string is a palindrome",
                  "Implement a binary search algorithm",
                  "Calculate factorial recursively"
                ].map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(example)}
                    className="text-xs px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-lg border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}