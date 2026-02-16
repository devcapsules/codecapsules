import React, { useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => <div className="h-40 bg-gray-800 rounded flex items-center justify-center text-gray-400">Loading editor...</div>
  }
)

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setOutput(`Network Error: ${errorMessage}`)
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
              <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">Completed!</span>
            </div>
          )}
        </div>
        <p className="mt-2 text-blue-100">{description}</p>
      </div>

      {/* Code Editor */}
      <div className="border-b border-gray-200">
        {/* @ts-ignore - Monaco Editor types not properly resolved */}
        <MonacoEditor
          height="200px"
          language={language === 'csharp' ? 'csharp' : language}
          value={code}
          onChange={(value: string | undefined) => setCode(value || '')}
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
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
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
      <header className="mb-12">
        <div className="mb-6">
          <span className="inline-block text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            FEATURED
          </span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight max-w-3xl">
          Stop Copy-Pasting Code:
          <span className="text-blue-600"> The Interactive Developer Blog Revolution</span>
        </h1>
        
        <p className="text-lg text-gray-600 mb-6 leading-relaxed max-w-2xl">
          Experience the world's first fully interactive developer blog. Run Python, SQL, and Linux commands directly in articles with zero setup.
        </p>
        
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6 border-b border-gray-200 pb-6">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <time dateTime="2025-11-23">November 23, 2025</time>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>5 min read</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>3 Interactive Demos</span>
          </div>
        </div>

        {/* Clean Author Info */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            C
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">CodeCapsule Team</p>
            <p className="text-xs text-gray-500">Engineering & Developer Experience</p>
          </div>
        </div>
      </header>

      {/* Blog Content */}
      <article className="prose prose-lg max-w-none">
        <p className="text-lg text-gray-700 leading-relaxed mb-8">
          We've all been there. You find a great tutorial, see a snippet of code, and what do you do?
        </p>
        
        <p className="text-lg text-gray-700 leading-relaxed mb-8">
          You highlight it, copy it, open a new tab, find an online REPL (or open your local IDE), paste it, and <em>then</em> finally run it.
        </p>

        <p className="text-lg text-gray-700 leading-relaxed mb-8">
          <strong>This is a terrible experience.</strong> Learning should be seamless.
        </p>

          <p className="text-lg text-gray-700 leading-relaxed mb-12">
            We believe the "run" button should be right next to the "read" button. So, we built Devcapsules to make it possible.
          </p>        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-lg border border-green-200 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            What if you could just... <strong className="text-green-600">run it right here?</strong>
          </h2>
        </div>

        {/* Exhibit A */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Exhibit A: The "WASM-First" Magic (90% of Use Cases)
          </h2>
          
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            Here's a simple Python challenge. Find the largest number in a list. <strong>Don't copy it. Just hit <code>▶ Run</code>.</strong>
          </p>

          <CapsuleEmbed
            type="interactive"
            id="python-find-largest"
            title="Challenge: Find the Largest Number"
            description="Write a Python function find_largest(nums) that returns the largest number in a list."
            language="python"
            starterCode={`def find_largest(nums):
    # Your code here
    pass

# Test cases (click Run to test)
print(find_largest([1, 5, 3, 9, 2]))  # Should return 9
print(find_largest([-1, -5, -3]))     # Should return -1
print(find_largest([42]))              # Should return 42`}
            expectedOutput={`9
-1
42`}
            hint="You can use Python's built-in max() function, or implement it with a loop!"
          />

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              <strong>What just happened?</strong> You ran real Python <em>inside your browser</em>. That's our <strong>WASM-First</strong> architecture. It's instant, secure, and <strong>costs $0 in server fees</strong> to run. This is the 90% solution, and it's completely free.
            </p>
          </div>
        </section>

        {/* Exhibit B */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Exhibit B: The "Server-Based" Power (The Pro Tier)
          </h2>
          
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            "Okay," you say, "but what about <em>real</em> stuff? Like databases?"
          </p>

          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            Great question. Some tasks <em>need</em> a secure, server-side environment. For that, we have our "Server-Based" capsules. Here's a live SQL sandbox. Go ahead, <code>SELECT *</code> from the <code>products</code> table.
          </p>

          <CapsuleEmbed
            type="server"
            id="sql-products-demo"
            title="Challenge: Query the Products Database"
            description="Find all products in the 'Electronics' category. The table is named products with columns: id, name, category, price."
            language="sql"
            starterCode={`-- Your SQL query here
SELECT * FROM products WHERE category = 'Electronics';`}
            expectedOutput={`id | name                 | category    | price
1  | iPhone 15           | Electronics | 999.99
3  | Laptop Pro          | Electronics | 1299.99
4  | Bluetooth Headphones| Electronics | 199.99

(3 rows returned)`}
            hint="Use WHERE clause to filter by category. Remember to use quotes around string values!"
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              That's our "Pro" tier. Your code was sent to our secure, serverless judge and returned the result in seconds. <strong>Real database, real results.</strong>
            </p>
          </div>
        </section>

        {/* Exhibit C */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Exhibit C: The "Interactive Environment" (The "Wow" Moment)
          </h2>
          
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            But it's not just about single scripts. It's about <em>environments</em>. What if you're teaching DevOps?
          </p>

          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            Here is a <strong>full Linux terminal</strong>. This is <em>also</em> running <strong>100% in your browser</strong> using our WASM-Linux runtime. Try the <code>ls</code> and <code>echo "hello"</code> commands.
          </p>

          <CapsuleEmbed
            type="terminal"
            id="linux-terminal-demo"
            title="Challenge: Linux Command Practice"
            description="Complete these tasks: 1. List files, 2. Create hello.txt, 3. Display file contents"
            language="bash"
            starterCode={`# Linux Terminal - Try these commands:
ls -la
echo "Hello Devcapsules!" > hello.txt
cat hello.txt`}
            expectedOutput={`user@devcapsules:~$ ls -la
total 12
drwxr-xr-x 2 user user 4096 Nov 11 10:30 .
drwxr-xr-x 3 root root 4096 Nov 11 10:29 ..
-rw-r--r-- 1 user user   18 Nov 11 10:30 hello.txt

user@devcapsules:~$ cat hello.txt
Hello Devcapsules!`}
            hint="Use 'ls -la' for detailed file listing, '>' to redirect output to a file, and 'cat' to display file contents."
          />

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              <strong>This is running a full Linux environment in your browser.</strong> No servers, no containers, no limits. Perfect for teaching command-line tools, Git workflows, or system administration.
            </p>
          </div>
        </section>

        {/* The New Standard */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            This is the New Standard.
          </h2>
          
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            Every post on this blog will be this interactive. We built Devcapsules because we believe <strong>this is how learning should work</strong>.
          </p>

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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 004.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
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
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
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
            
            <p className="text-blue-200 text-sm mt-4">
              <span className="inline-block w-2 h-2 bg-blue-300 rounded-full mr-2"></span>
              <strong>Free Forever Plan Available</strong> - No limits on public capsules
            </p>
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
            <a href="mailto:newsletter@codecapsule.com" className="flex items-center space-x-1 hover:text-gray-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Newsletter</span>
            </a>
            <a href="https://twitter.com/codecapsule" className="flex items-center space-x-1 hover:text-gray-700 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              <span>Twitter</span>
            </a>
            <a href="https://linkedin.com/company/codecapsule" className="flex items-center space-x-1 hover:text-gray-700 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span>LinkedIn</span>
            </a>
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