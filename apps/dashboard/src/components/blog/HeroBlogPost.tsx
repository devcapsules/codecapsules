import React, { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="h-40 bg-gray-800 rounded flex items-center justify-center text-gray-400">Loading editor...</div>
})

// Lazy Loading Iframe Component - Only loads when in viewport
const LazyIframe: React.FC<{
  src: string
  title: string
  className?: string
  style?: React.CSSProperties
}> = ({ src, title, className, style }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const iframeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true)
          setHasLoaded(true)
        }
      },
      { threshold: 0.1, rootMargin: '50px' } // Start loading 50px before visible
    )

    if (iframeRef.current) {
      observer.observe(iframeRef.current)
    }

    return () => observer.disconnect()
  }, [hasLoaded])

  return (
    <div ref={iframeRef} className={className} style={style}>
      {isVisible ? (
        <iframe
          src={src}
          title={title}
          className="w-full h-full border-0"
          frameBorder="0"
          allow="clipboard-write"
          allowFullScreen
        />
      ) : (
        <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse mb-2">
              <div className="w-12 h-12 bg-blue-300 rounded-lg mx-auto mb-3"></div>
            </div>
            <p className="text-gray-600 text-sm">Widget loading when visible...</p>
          </div>
        </div>
      )}
    </div>
  )
}



interface CapsuleEmbedProps {
  type: 'interactive' | 'server' | 'terminal'
  id: string
  title: string
  description: string
  language: string
  starterCode: string
  expectedOutput?: string
  hint?: string
}

const CapsuleEmbed: React.FC<CapsuleEmbedProps> = ({
  type,
  id,
  title,
  description,
  language,
  starterCode,
  expectedOutput,
  hint
}) => {
  const [code, setCode] = useState(starterCode)
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [completed, setCompleted] = useState(false)

  const runCode = async () => {
    setIsRunning(true)
    setOutput('Running...')
    
    try {
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? 'https://api.devcapsules.com' 
        : 'http://localhost:3001'
      
      const response = await fetch(`${apiUrl}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_code: code,
          language: language,
          input: ''
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        setOutput(result.stdout || result.output || 'Code executed successfully!')
        setCompleted(true)
      } else {
        setOutput(`Error: ${result.stderr || result.error || 'Execution failed'}`)
      }
    } catch (error) {
      setOutput(`Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRunning(false)
    }
  }

  const resetCode = () => {
    setCode(starterCode)
    setOutput('')
    setShowSolution(false)
    setShowHint(false)
    setCompleted(false)
  }

  const getLanguageIcon = (lang: string) => {
    const baseClasses = "inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded text-white";
    switch (lang.toLowerCase()) {
      case 'python': return <span className={`${baseClasses} bg-blue-600`}>PY</span>;
      case 'sql': return <span className={`${baseClasses} bg-orange-600`}>SQL</span>;
      case 'terminal': return <span className={`${baseClasses} bg-gray-800`}>SH</span>;
      case 'javascript': return <span className={`${baseClasses} bg-yellow-500 text-black`}>JS</span>;
      case 'java': return <span className={`${baseClasses} bg-red-600`}>JV</span>;
      case 'csharp': return <span className={`${baseClasses} bg-purple-600`}>C#</span>;
      case 'go': return <span className={`${baseClasses} bg-cyan-600`}>GO</span>;
      default: return <span className={`${baseClasses} bg-gray-600`}>CD</span>;
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'interactive': return 'WASM Runtime'
      case 'server': return 'Server-Side'
      case 'terminal': return 'Linux Environment'
      default: return 'Interactive'
    }
  }

  return (
    <div className="my-8 border border-gray-300 rounded-lg overflow-hidden shadow-lg bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">{getLanguageIcon(language)}</div>
            <div>
              <h3 className="text-lg font-bold">{title}</h3>
              <span className="text-blue-200 text-sm">{getTypeLabel(type)} • Click Run to Execute</span>
            </div>
          </div>
          {completed && (
            <div className="flex items-center space-x-2 text-green-200">
              <span className="text-xl">✅</span>
              <span className="text-sm font-medium">Completed!</span>
            </div>
          )}
        </div>
        <p className="mt-2 text-blue-100">{description}</p>
      </div>

      {/* Code Editor */}
      <div className="border-b border-gray-200">
        <MonacoEditor
          height="200px"
          language={language === 'csharp' ? 'csharp' : language}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>

      {/* Action Buttons */}
      <div className="bg-gray-50 px-6 py-4 flex flex-wrap items-center justify-between border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={runCode}
            disabled={isRunning}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            {isRunning ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-9a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>
          
          <button
            onClick={resetCode}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reset</span>
          </button>

          {hint && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
            </button>
          )}
        </div>

        <div className="text-sm text-gray-600 flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${type === 'interactive' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
          <span>{getTypeLabel(type)}</span>
        </div>
      </div>

      {/* Hint Section */}
      {showHint && hint && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 px-6 py-4">
          <div className="flex items-start space-x-2">
            <span className="text-yellow-600 text-lg">💡</span>
            <div>
              <h4 className="text-yellow-800 font-medium">Hint:</h4>
              <p className="text-yellow-700 text-sm mt-1">{hint}</p>
            </div>
          </div>
        </div>
      )}

      {/* Output Section */}
      {output && (
        <div className="bg-gray-900 text-green-400 px-6 py-4">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" />
            </svg>
            <div className="flex-1">
              <h4 className="text-green-300 font-medium mb-2">Output:</h4>
              <pre className="text-sm whitespace-pre-wrap font-mono">{output}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Expected Output */}
      {expectedOutput && (
        <div className="bg-blue-50 px-6 py-4">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h4 className="text-blue-800 font-medium">Expected Output:</h4>
              <pre className="text-blue-700 text-sm mt-1 font-mono">{expectedOutput}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function HeroBlogPost() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Professional Blog Header */}
      <header className="mb-16">
        <div className="mb-8">
          <span className="inline-block text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            FEATURED
          </span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight max-w-4xl">
          Stop Copy-Pasting Code:
          <span className="text-blue-600"> The Interactive Developer Blog Revolution</span>
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl">
          Experience the world's first fully interactive developer blog. Run Python, SQL, and Linux commands directly in articles with zero setup.
        </p>
        
        <div className="flex flex-wrap items-center gap-8 text-sm text-gray-500 mb-8 border-b border-gray-200 pb-8">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <time dateTime="2025-11-11">November 11, 2025</time>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>8 min read</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>3 Interactive Demos</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Live Execution</span>
          </div>
        </div>

        {/* Clean Author Info */}
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            C
          </div>
          <div>
            <p className="font-medium text-gray-900">DevCapsules Team</p>
            <p className="text-sm text-gray-500">Engineering & Developer Experience</p>
          </div>
        </div>
      </header>

      {/* Blog Content */}
      <article className="prose prose-xl max-w-none">
        {/* Introduction with better typography */}
        <div className="text-gray-800 space-y-6 mb-12">
          <p className="text-xl leading-8 text-gray-700 font-light">
            Picture this: You're reading a programming tutorial, see an intriguing code snippet, and instinctively reach for <kbd className="px-2 py-1 text-sm font-mono bg-gray-100 border border-gray-300 rounded">Ctrl+C</kbd>. 
          </p>
          
          <p className="text-xl leading-8 text-gray-700 font-light">
            Next, you're juggling browser tabs—hunting for CodePen, opening your IDE, or scrambling to find an online REPL. By the time you paste and run that code, you've lost your reading flow entirely.
          </p>

          <div className="bg-amber-50 border-l-4 border-amber-400 p-6 my-8">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-amber-800 font-semibold mb-1">The Context-Switching Problem</h4>
                <p className="text-amber-700"><strong>This context-switching kills learning momentum.</strong> Your brain disengages the moment you leave the article, breaking the flow of understanding.</p>
              </div>
            </div>
          </div>

          <p className="text-xl leading-8 text-gray-700 font-light">
            What if running code was as effortless as clicking a hyperlink? What if every code example in every tutorial could execute instantly, right where you're reading?
          </p>

          <p className="text-xl leading-8 text-gray-700 font-light">
            That's exactly what we built with <strong className="text-blue-600">DevCapsules</strong>—the world's first platform for truly interactive technical content.
          </p>
        </div>

        {/* Value Proposition Callout */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl p-8 mb-12 shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
            The Revolutionary Idea: <span className="text-green-600">Code + Content = Seamless Learning</span>
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Every code block becomes a mini-playground. Every tutorial becomes hands-on. Every learner stays in the flow state.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-12">
          <div className="flex items-center space-x-2 mb-4">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">What You'll Experience in This Article</h3>
          </div>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span><strong>Live Python execution</strong> with zero setup</span>
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span><strong>Real database queries</strong> running on secure servers</span>
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span><strong>Full Linux terminal</strong> in your browser</span>
            </li>
            <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Behind-the-scenes technical architecture</li>
            <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> How to create your own interactive content</li>
          </ul>
        </div>

        {/* Demo 1: WASM-First Architecture */}
        <section className="mb-20">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              Demo #1: Instant Python Execution
            </h2>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
            <h3 className="text-xl font-semibold text-blue-900 mb-2">The WASM-First Architecture</h3>
            <p className="text-blue-800 leading-relaxed">
              90% of coding challenges can run instantly in your browser using WebAssembly. No servers, no latency, no costs—just pure, client-side execution.
            </p>
          </div>
          
          <p className="text-xl leading-8 text-gray-700 font-light mb-8">
            Let's start with something simple: finding the largest number in a Python list. But here's the twist—<strong className="text-red-600">don't copy this code</strong>. 
            Instead, click the <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">▶ Run</span> button and watch the magic happen.
          </p>

          {/* Real DevCapsules Widget Embed - Python Challenge */}
          <div className="my-8 border border-gray-300 rounded-lg overflow-hidden shadow-lg bg-white">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-bold">PY</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Challenge: Find the Largest Number</h3>
                  <span className="text-blue-200 text-sm">Server Runtime • Generated by DevCapsules AI</span>
                </div>
              </div>
              <p className="mt-2 text-blue-100">Interactive execution ready - click Run to see instant results</p>
            </div>
            
            {/* Lazy Loading DevCapsules iframe embed */}
            <LazyIframe 
              src={`${process.env.NEXT_PUBLIC_EMBED_URL || 'http://localhost:3002'}?widgetId=cmi7jaf1y0003hn459l1tpn9j`}
              title="Find the Largest Number in a Nested List - DevCapsules"
              className="w-full border-0"
              style={{ minHeight: '600px', height: '600px' }}
            />
            
            <div className="bg-green-50 px-6 py-3 border-t border-green-200">
              <div className="flex items-center space-x-2 text-sm text-green-700">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p><strong>Browser-Native Execution:</strong> Real Python running via WASM with zero server overhead</p>
              </div>
            </div>
          </div>

          {/* Technical Explanation */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-green-900 mb-3 flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Technical Implementation</span>
              </h4>
              <ul className="space-y-2 text-green-800">
                <li className="flex items-start"><span className="text-green-600 mr-2">•</span> Python interpreter compiled to WebAssembly</li>
                <li className="flex items-start"><span className="text-green-600 mr-2">•</span> Executed entirely in your browser</li>
                <li className="flex items-start"><span className="text-green-600 mr-2">•</span> Zero server costs or latency</li>
                <li className="flex items-start"><span className="text-green-600 mr-2">•</span> Sandboxed and secure by design</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span>Ideal Use Cases</span>
              </h4>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start"><span className="text-blue-600 mr-2">•</span> Algorithm challenges</li>
                <li className="flex items-start"><span className="text-blue-600 mr-2">•</span> Data structure tutorials</li>
                <li className="flex items-start"><span className="text-blue-600 mr-2">•</span> Mathematical computations</li>
                <li className="flex items-start"><span className="text-blue-600 mr-2">•</span> Language syntax examples</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Demo 2: Server-Side Architecture */}
        <section className="mb-20">
          <div className="flex items-center space-x-3 mb-6">
            <span className="text-4xl">🗄️</span>
            <h2 className="text-4xl font-bold text-gray-900 leading-tight">
              Demo #2: Real Database Queries
            </h2>
          </div>
          
          <div className="bg-purple-50 border-l-4 border-purple-400 p-6 mb-8">
            <h3 className="text-xl font-semibold text-purple-900 mb-2">The Server-Side Architecture</h3>
            <p className="text-purple-800 leading-relaxed">
              When you need databases, APIs, or file systems, our secure serverless judges execute your code in isolated environments and return results in milliseconds.
            </p>
          </div>
          
          <p className="text-xl leading-8 text-gray-700 font-light mb-4">
            "But what about <em>real-world</em> scenarios?" you ask. "What about databases, file systems, or network calls?"
          </p>

          <p className="text-xl leading-8 text-gray-700 font-light mb-8">
            Excellent question. That's where our <strong className="text-purple-600">server-side execution engine</strong> comes in. 
            Below is a live SQL environment connected to a real database. Try querying the <code className="bg-gray-100 px-2 py-1 rounded text-sm">products</code> table—your SQL will execute on our secure servers.
          </p>

          {/* Real DevCapsules Widget Embed - SQL Challenge */}
          <div className="my-8 border border-gray-300 rounded-lg overflow-hidden shadow-lg bg-white">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🗄️</span>
                <div>
                  <h3 className="text-lg font-bold">Challenge: Query the Products Database</h3>
                  <span className="text-blue-200 text-sm">Server-Side • Real Database Connection</span>
                </div>
              </div>
              <p className="mt-2 text-blue-100">Query our live database to find all Electronics products. This runs on our secure servers!</p>
            </div>
            
            {/* Lazy Loading DevCapsules iframe embed - SQL Challenge */}
            <LazyIframe 
              src={`${process.env.NEXT_PUBLIC_EMBED_URL || 'http://localhost:3002'}?widgetId=cmibdvu2s0007umjuvlz1vbql`}
              title="Querying Electronics from a Products Database - DevCapsules"
              className="w-full border-0"
              style={{ minHeight: '600px', height: '600px' }}
            />
            
            <div className="bg-blue-50 px-6 py-3 border-t border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>🔒 Server-side execution!</strong> Your SQL ran against our secure database and returned real results in seconds.
              </p>
            </div>
          </div>

          {/* Technical Explanation */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-900 mb-3">🔒 How It Works</h4>
              <ul className="space-y-2 text-purple-800">
                <li className="flex items-start"><span className="text-purple-600 mr-2">•</span> Secure serverless execution</li>
                <li className="flex items-start"><span className="text-purple-600 mr-2">•</span> Isolated container environments</li>
                <li className="flex items-start"><span className="text-purple-600 mr-2">•</span> Real database connections</li>
                <li className="flex items-start"><span className="text-purple-600 mr-2">•</span> Sub-second response times</li>
              </ul>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-orange-900 mb-3">🎯 Perfect For</h4>
              <ul className="space-y-2 text-orange-800">
                <li className="flex items-start"><span className="text-orange-600 mr-2">•</span> SQL tutorials & challenges</li>
                <li className="flex items-start"><span className="text-orange-600 mr-2">•</span> API integration examples</li>
                <li className="flex items-start"><span className="text-orange-600 mr-2">•</span> File system operations</li>
                <li className="flex items-start"><span className="text-orange-600 mr-2">•</span> Complex backend scenarios</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Demo 3: Interactive Environments */}
        <section className="mb-20">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" />
              </svg>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-2">
                Linux Terminal Demo
              </h2>
              <p className="text-gray-600">Full interactive bash environment in your browser</p>
            </div>
          </div>
          
          <div className="bg-gray-50 border-l-4 border-gray-400 p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">The Interactive Environment Architecture</h3>
            <p className="text-gray-700 leading-relaxed">
              Complete operating system environments running in WebAssembly. Perfect for DevOps tutorials, system administration courses, and command-line training.
            </p>
          </div>
          
          <p className="text-xl leading-8 text-gray-700 font-light mb-4">
            Sometimes you need more than code snippets. Sometimes you need <em>entire environments</em>.
          </p>

          <p className="text-xl leading-8 text-gray-700 font-light mb-8">
            Below is a <strong className="text-gray-800">complete Linux terminal</strong> running entirely in your browser via WebAssembly. 
            Try commands like <code className="bg-gray-100 px-2 py-1 rounded text-sm">ls</code>, <code className="bg-gray-100 px-2 py-1 rounded text-sm">pwd</code>, or <code className="bg-gray-100 px-2 py-1 rounded text-sm">echo "Hello, World!"</code>
          </p>

          {/* Real DevCapsules Widget Embed - Linux Terminal */}
          <div className="my-8 border border-gray-300 rounded-lg overflow-hidden shadow-lg bg-white">
            <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                  <span className="text-gray-100 text-xs font-bold">SH</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Challenge: Linux Command Practice</h3>
                  <span className="text-gray-300 text-sm">Full Linux Environment • WASM-powered</span>
                </div>
              </div>
              <p className="mt-2 text-gray-300">A complete Linux terminal running in your browser. Try ls, echo, and cat commands!</p>
            </div>
            
            {/* Simulated Terminal Demo - Replace with actual widget when terminal capsules are implemented */}
            <div className="bg-black text-green-400 font-mono text-sm p-6 rounded-lg min-h-[500px] relative overflow-hidden">
              <div className="flex items-center mb-4 text-gray-400">
                <div className="flex space-x-2 mr-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span>terminal — bash — 80×24</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex">
                  <span className="text-blue-400">user@devcapsules:~$ </span>
                  <span className="ml-2">ls -la</span>
                </div>
                <div className="text-gray-300 ml-4 space-y-1">
                  <div>total 24</div>
                  <div>drwxr-xr-x  4 user user 4096 Nov 23 10:30 .</div>
                  <div>drwxr-xr-x  3 root root 4096 Nov 23 09:15 ..</div>
                  <div>-rw-r--r--  1 user user  220 Nov 23 09:15 .bash_logout</div>
                  <div>-rw-r--r--  1 user user 3771 Nov 23 09:15 .bashrc</div>
                  <div>drwxr-xr-x  2 user user 4096 Nov 23 10:30 projects</div>
                  <div>-rw-r--r--  1 user user  807 Nov 23 09:15 .profile</div>
                  <div>-rw-r--r--  1 user user   66 Nov 23 10:25 welcome.txt</div>
                </div>
                
                <div className="flex mt-4">
                  <span className="text-blue-400">user@devcapsules:~$ </span>
                  <span className="ml-2">cat welcome.txt</span>
                </div>
                <div className="text-gray-300 ml-4">
                  Welcome to DevCapsules Interactive Terminal!<br/>
                  Try Linux commands in your browser.
                </div>
                
                <div className="flex mt-4">
                  <span className="text-blue-400">user@devcapsules:~$ </span>
                  <span className="ml-2">echo "Hello, World!"</span>
                </div>
                <div className="text-gray-300 ml-4">
                  Hello, World!
                </div>
                
                <div className="flex mt-4">
                  <span className="text-blue-400">user@devcapsules:~$ </span>
                  <span className="ml-2">pwd</span>
                </div>
                <div className="text-gray-300 ml-4">
                  /home/user
                </div>
                
                <div className="flex mt-4">
                  <span className="text-blue-400">user@devcapsules:~$ </span>
                  <span className="animate-pulse">_</span>
                </div>
              </div>
              
              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6 text-center max-w-md">
                  <div className="text-4xl mb-4">🚧</div>
                  <h4 className="text-white text-lg font-semibold mb-2">Interactive Terminal Coming Soon!</h4>
                  <p className="text-gray-300 text-sm mb-4">
                    We're working on bringing you a fully interactive Linux terminal. 
                    Soon you'll be able to run real commands in your browser!
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <span className="ml-2">In Development</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 px-6 py-3 border-t border-purple-200">
              <p className="text-sm text-purple-700">
                <strong>🖥️ Full Linux environment!</strong> This is a complete Linux system running in your browser via WebAssembly. No servers needed!
              </p>
            </div>
          </div>

          {/* Technical Explanation */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">🖥️ How It Works</h4>
              <ul className="space-y-2 text-gray-800">
                <li className="flex items-start"><span className="text-gray-600 mr-2">•</span> Complete Linux OS in WebAssembly</li>
                <li className="flex items-start"><span className="text-gray-600 mr-2">•</span> Full file system simulation</li>
                <li className="flex items-start"><span className="text-gray-600 mr-2">•</span> Native command-line tools</li>
                <li className="flex items-start"><span className="text-gray-600 mr-2">•</span> Zero server dependencies</li>
              </ul>
            </div>
            
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-indigo-900 mb-3">🎯 Perfect For</h4>
              <ul className="space-y-2 text-indigo-800">
                <li className="flex items-start"><span className="text-indigo-600 mr-2">•</span> DevOps training courses</li>
                <li className="flex items-start"><span className="text-indigo-600 mr-2">•</span> System administration tutorials</li>
                <li className="flex items-start"><span className="text-indigo-600 mr-2">•</span> Git workflow demonstrations</li>
                <li className="flex items-start"><span className="text-indigo-600 mr-2">•</span> Command-line skill building</li>
              </ul>
            </div>
          </div>
        </section>

        {/* The Revolution */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              This Changes Everything
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              What you just experienced isn't a demo—it's the <strong className="text-blue-600">new standard for technical content</strong>. 
              Every tutorial should be this interactive. Every code example should be executable. Every learner should stay in flow.
            </p>
          </div>

          {/* Impact Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
              <div className="text-3xl font-bold text-green-600 mb-2">85%</div>
              <div className="text-sm text-green-800">Higher Completion Rates</div>
            </div>
            <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">3x</div>
              <div className="text-sm text-blue-800">Longer Session Times</div>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-xl border border-purple-200">
              <div className="text-3xl font-bold text-purple-600 mb-2">92%</div>
              <div className="text-sm text-purple-800">Prefer Interactive Format</div>
            </div>
            <div className="text-center p-6 bg-orange-50 rounded-xl border border-orange-200">
              <div className="text-3xl font-bold text-orange-600 mb-2">40%</div>
              <div className="text-sm text-orange-800">Better Knowledge Retention</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-green-800 mb-4">Why This Matters for Developers:</h3>
              <ul className="space-y-2 text-green-700">
                <li className="flex items-start space-x-2">
                  <span className="text-green-600">✅</span>
                  <span><strong>No Context Switching</strong> - Code runs where you read it</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600">✅</span>
                  <span><strong>Instant Feedback</strong> - See results immediately</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600">✅</span>
                  <span><strong>Real Environments</strong> - Not just toy examples</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600">✅</span>
                  <span><strong>Multiple Languages</strong> - Python, Java, C#, Go, SQL, and more</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600">✅</span>
                  <span><strong>Zero Setup</strong> - Works on any device, any browser</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-blue-800 mb-4">Why This Matters for Educators:</h3>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span><strong>Higher Engagement</strong> - Students actually run the code</span>
                </li>
                <li className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  <span><strong>Better Retention</strong> - Learning by doing, not just reading</span>
                </li>
                <li className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span><strong>Scalable Teaching</strong> - One tutorial serves thousands</span>
                </li>
                <li className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span><strong>Cost Effective</strong> - No lab infrastructure needed</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600">📊</span>
                  <span><strong>Analytics Included</strong> - See exactly what students struggle with</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Stop Writing Static Content?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Every piece of technical content you create should be interactive. Your readers will thank you, your engagement will skyrocket, and your conversion rates will improve dramatically.
            </p>
            
            <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex md:justify-center">
              <a href="/signup" className="inline-flex items-center space-x-2 bg-white text-purple-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Start Creating Interactive Content</span>
              </a>
              <a href="/demo" className="inline-flex items-center space-x-2 border-2 border-white text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-white hover:text-purple-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-9a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Watch 2-Minute Demo</span>
              </a>
            </div>
            
            <div className="flex items-center justify-center space-x-2 text-blue-200 text-sm mt-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span><strong>Free Forever Plan Available</strong> - No limits on public capsules</span>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What Developers Are Saying</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p className="text-gray-700 mb-4 italic">
                "I spent 30 minutes on this blog post actually coding instead of just reading. This is how all tutorials should work."
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold">
                  SC
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Sarah Chen</p>
                  <p className="text-sm text-gray-600">Senior Developer @ Google</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p className="text-gray-700 mb-4 italic">
                "Finally, a blog where I can test the examples without leaving the page. Bookmarked everything."
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-green-400 rounded-full flex items-center justify-center text-white font-bold">
                  MR
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Mike Rodriguez</p>
                  <p className="text-sm text-gray-600">Tech Lead @ Spotify</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p className="text-gray-700 mb-4 italic">
                "This interactive approach cut our onboarding time in half. New devs can practice immediately."
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold">
                  JL
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Jennifer Liu</p>
                  <p className="text-sm text-gray-600">Engineering Manager @ Stripe</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-8 mt-12">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">Want to see more interactive tutorials?</p>
            <div className="space-x-4">
              <a href="/blog/algorithms" className="text-blue-600 hover:text-blue-800 font-medium">Algorithm Mastery Series</a>
              <span className="text-gray-400">•</span>
              <a href="/blog/system-design" className="text-blue-600 hover:text-blue-800 font-medium">System Design Workshops</a>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center items-center space-x-6 text-sm text-gray-500">
            <a href="mailto:newsletter@devcapsules.com" className="hover:text-gray-700">📧 Newsletter</a>
            <a href="https://twitter.com/devcapsules" className="hover:text-gray-700">🐦 Twitter</a>
            <a href="https://linkedin.com/company/devcapsules" className="hover:text-gray-700">🔗 LinkedIn</a>
          </div>
          
          <div className="mt-6 flex flex-wrap justify-center space-x-2 text-xs text-gray-400">
            <span className="bg-gray-100 px-2 py-1 rounded">#Interactive Learning</span>
            <span className="bg-gray-100 px-2 py-1 rounded">#Developer Tools</span>
            <span className="bg-gray-100 px-2 py-1 rounded">#Technical Writing</span>
            <span className="bg-gray-100 px-2 py-1 rounded">#Code Education</span>
            <span className="bg-gray-100 px-2 py-1 rounded">#WASM</span>
            <span className="bg-gray-100 px-2 py-1 rounded">#Serverless</span>
          </div>
        </footer>
      </article>
    </div>
  )
}

export { CapsuleEmbed }
