/// <reference types="../vite-env.d.ts" />
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import { embedAnalytics } from '../utils/EmbedAnalytics'
import { useDCAnimation } from './DCAnimations'
import LeaderboardToast from './LeaderboardToast'

/* ═══════════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════════ */

interface CapsuleEmbedProps {
  widgetId: string
  capsuleData?: any // Pre-fetched by AdaptiveCapsuleEmbed (dedup)
  /** Headless Playlist context — courseId for analytics grouping */
  courseId?: string
}

interface Widget {
  id: string
  title: string
  description: string
  language: string
  difficulty: string
  problemStatement: string
  starterCode: string
  testCases: TestCase[]
  hints: string[]
  solutions: string[]
  tags: string[]
  isPublished: boolean
  createdAt: string
  /** Creator's plan — used for watermark gating */
  creatorPlan: string
}

interface TestCase {
  description: string
  input: any
  expected_output?: any
  expected?: any
}

interface TestResult {
  id: number
  description: string
  passed: boolean
  expected: any
  actual: any
  error?: string
}

interface ExecutionResult {
  success: boolean
  stdout?: string
  stderr?: string
  error?: string
  testResults: {
    allPassed: boolean
    passed: number
    total: number
    results: TestResult[]
  }
  passedTests?: number
  totalTests?: number
}

interface EdgeExplanation {
  hint: string
  fix: string
  explanation: string
  lineNumber: number | null
  errorType: string
  cached: boolean
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Markdown Renderer (lightweight, no dependency)
   ═══════════════════════════════════════════════════════════════════════════════ */

function renderMarkdown(md: string): React.ReactNode {
  if (!md) return null
  const lines = md.split('\n')
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeBuffer: string[] = []
  let key = 0

  const inlineFormat = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = []
    let remaining = text
    let k = 0
    while (remaining.length > 0) {
      const codeMatch = remaining.match(/^`([^`]+)`/)
      if (codeMatch) {
        parts.push(<code key={k++} className="md-inline-code">{codeMatch[1]}</code>)
        remaining = remaining.slice(codeMatch[0].length)
        continue
      }
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/)
      if (boldMatch) {
        parts.push(<strong key={k++}>{boldMatch[1]}</strong>)
        remaining = remaining.slice(boldMatch[0].length)
        continue
      }
      const italicMatch = remaining.match(/^\*(.+?)\*/)
      if (italicMatch) {
        parts.push(<em key={k++}>{italicMatch[1]}</em>)
        remaining = remaining.slice(italicMatch[0].length)
        continue
      }
      const nextSpecial = remaining.search(/[`*]/)
      if (nextSpecial === -1) {
        parts.push(remaining)
        break
      } else if (nextSpecial === 0) {
        parts.push(remaining[0])
        remaining = remaining.slice(1)
      } else {
        parts.push(remaining.slice(0, nextSpecial))
        remaining = remaining.slice(nextSpecial)
      }
    }
    return parts.length === 1 ? parts[0] : <>{parts}</>
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true
        codeBuffer = []
        continue
      } else {
        elements.push(
          <pre key={key++} className="md-code-block"><code>{codeBuffer.join('\n')}</code></pre>
        )
        inCodeBlock = false
        continue
      }
    }
    if (inCodeBlock) { codeBuffer.push(line); continue }
    if (line.trim() === '') continue
    if (line.startsWith('### ')) { elements.push(<h3 key={key++} className="md-h3">{inlineFormat(line.slice(4))}</h3>); continue }
    if (line.startsWith('## '))  { elements.push(<h2 key={key++} className="md-h2">{inlineFormat(line.slice(3))}</h2>); continue }
    if (line.startsWith('# '))   { elements.push(<h1 key={key++} className="md-h1">{inlineFormat(line.slice(2))}</h1>); continue }
    if (line.match(/^[\-\*] /))  { elements.push(<li key={key++} className="md-li">{inlineFormat(line.slice(2))}</li>); continue }
    const olMatch = line.match(/^(\d+)\.\s(.+)/)
    if (olMatch) { elements.push(<li key={key++} className="md-li">{inlineFormat(olMatch[2])}</li>); continue }
    elements.push(<p key={key++} className="md-p">{inlineFormat(line)}</p>)
  }
  return <div className="md-content">{elements}</div>
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════════════ */

const STORAGE_KEY_PREFIX = 'dc_code_'

function loadSavedCode(capsuleId: string): string | null {
  try { return localStorage.getItem(`${STORAGE_KEY_PREFIX}${capsuleId}`) }
  catch { return null }
}

function saveCode(capsuleId: string, code: string) {
  try { localStorage.setItem(`${STORAGE_KEY_PREFIX}${capsuleId}`, code) }
  catch { /* quota exceeded */ }
}

function extractFunctionName(code: string, language: string): string {
  if (language === 'python' || language === 'python3') {
    const match = code.match(/def\s+(\w+)\s*\(/)
    return match ? match[1] : 'solution'
  }
  let match = code.match(/function\s+(\w+)\s*\(/)
  if (match) return match[1]
  match = code.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:\(|async\s*\()/)
  if (match) return match[1]
  return 'solution'
}

function mapCapsuleToWidget(capsule: any): Widget {
  return {
    id: capsule.id,
    title: capsule.title || 'Untitled Capsule',
    description: capsule.description || '',
    language: capsule.language || 'python',
    difficulty: capsule.difficulty?.toLowerCase() || 'medium',
    problemStatement:
      capsule.content?.primary?.problemStatement ||
      capsule.problem_statement_md ||
      capsule.description || '',
    starterCode:
      capsule.content?.primary?.code?.wasmVersion?.starterCode ||
      capsule.config_data?.boilerplate_code ||
      capsule.config_data?.starterCode || '# Your code here',
    testCases:
      capsule.content?.primary?.code?.wasmVersion?.testCases ||
      capsule.config_data?.test_cases || [],
    hints: (() => {
      // Try all possible hint locations
      const rawHints =
        capsule.content?.pedagogy?.hints ||        // 3-agent pipeline (inside content)
        capsule.pedagogy?.hints?.sequence ||        // legacy sequence format
        capsule.pedagogy?.hints ||                  // top-level pedagogy
        capsule.config_data?.hints ||               // config_data format
        []
      if (!Array.isArray(rawHints)) return []
      return rawHints
        .map((h: any) => (typeof h === 'string' ? h : h?.content || h?.text || ''))
        .filter(Boolean)
    })(),
    solutions: (() => {
      const sol = capsule.content?.primary?.code?.wasmVersion?.solution ||
        capsule.config_data?.reference_solution || capsule.config_data?.solution
      return sol ? [sol] : []
    })(),
    tags: (() => {
      const rawConcepts =
        capsule.content?.pedagogy?.concepts ||
        capsule.pedagogy?.concepts ||
        []
      const fromConcepts = Array.isArray(rawConcepts)
        ? rawConcepts.map((c: any) => (typeof c === 'string' ? c : c?.concept || c?.name || '')).filter(Boolean)
        : []
      if (fromConcepts.length > 0) return fromConcepts
      return Array.isArray(capsule.tags) ? capsule.tags : []
    })(),
    isPublished: capsule.isPublished || false,
    createdAt: capsule.createdAt || new Date().toISOString(),
    creatorPlan: capsule.creator_plan || 'free',
  }
}

function formatValue(val: any): string {
  if (val === undefined || val === null) return String(val)
  if (typeof val === 'string') return val
  return JSON.stringify(val, null, 2)
}

async function fetchEdgeAssistant(
  apiUrl: string,
  widget: Widget,
  code: string,
  stderr: string,
  testResults: { passed: number; total: number; results: TestResult[] }
): Promise<EdgeExplanation> {
  const res = await fetch(`${apiUrl}/edge/assist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: widget.language,
      problemStatement: widget.problemStatement,
      studentCode: code,
      stderr,
      testResults: {
        passed: testResults.passed,
        total: testResults.total,
        results: testResults.results.map(r => ({
          description: r.description, passed: r.passed,
          expected: r.expected, actual: r.actual, error: r.error,
        })),
      },
      difficulty: widget.difficulty,
      capsuleId: widget.id,
    }),
  })
  if (!res.ok) throw new Error('EdGE Assistant unavailable')
  return res.json()
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Error Boundary
   ═══════════════════════════════════════════════════════════════════════════════ */

class EmbedErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <p style={{ color: '#fca5a5', marginBottom: 8 }}>Something went wrong</p>
            <p style={{ color: '#6b7280', fontSize: 13 }}>{this.state.error}</p>
            <button onClick={() => window.location.reload()} className="reset-btn" style={{ marginTop: 12 }}>
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════════════ */

function DevcapsulesEmbedInner({ widgetId, capsuleData, courseId }: CapsuleEmbedProps) {
  const [widget, setWidget] = useState<Widget | null>(null)
  const [loading, setLoading] = useState(!capsuleData)
  const [error, setError] = useState<string | null>(null)
  const [userCode, setUserCode] = useState('')
  const [savedUserCode, setSavedUserCode] = useState<string | null>(null)
  const [executing, setExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null)
  // activeTab removed — Output tab replaced by EdGE split panel
  const [instructionsCollapsed, setInstructionsCollapsed] = useState(false)
  const [showRawError, setShowRawError] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [revealedHintCount, setRevealedHintCount] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [failCount, setFailCount] = useState(0)

  // EdGE Assistant — inline error guidance state
  const [edgeStatus, setEdgeStatus] = useState<'idle' | 'analyzing' | 'ready'>('idle')
  const [edgeData, setEdgeData] = useState<EdgeExplanation | null>(null)
  const [revealLevel, setRevealLevel] = useState<1 | 2 | 3>(1)

  const editorRef = useRef<any>(null)
  const elapsedTimerRef = useRef<number | null>(null)
  const autoSaveRef = useRef<number | null>(null)
  const hintsRef = useRef<HTMLDivElement>(null)
  // Store executeCode as a ref so the Monaco keybinding always sees the latest closure
  const executeCodeRef = useRef<() => void>(() => {})

  const { toast, showTestPass, showPartialPass } = useDCAnimation()

  // ── Leaderboard name prompt ("Passive-Aggressive Upgrade") ─────────────────
  const [showLeaderboardToast, setShowLeaderboardToast] = useState(false)

  // ── Derive widget from capsuleData (dedup) ─────────────────────────────────
  useEffect(() => {
    if (capsuleData) {
      const mapped = mapCapsuleToWidget(capsuleData)
      setWidget(mapped)
      const saved = loadSavedCode(mapped.id)
      setUserCode(saved || mapped.starterCode)
      setLoading(false)
      embedAnalytics.trackSessionStarted(mapped.id, widgetId, mapped.language, mapped.difficulty)
      return
    }

    const fetchWidget = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        let capsule: any
        try {
          const cdnRes = await fetch(`https://cdn.devcapsules.com/capsules/${widgetId}.json`, { headers: { Accept: 'application/json' } })
          if (cdnRes.ok) { capsule = await cdnRes.json() } else { throw new Error('CDN miss') }
        } catch {
          const res = await fetch(`${apiUrl}/capsules/${widgetId}`)
          if (!res.ok) throw new Error('Failed to load capsule')
          const data = await res.json()
          if (!data.success) throw new Error(data.error || 'Failed to load capsule')
          capsule = data.data || data.capsule
          if (!capsule) throw new Error('No capsule data')
        }
        const mapped = mapCapsuleToWidget(capsule)
        setWidget(mapped)
        const saved = loadSavedCode(mapped.id)
        setUserCode(saved || mapped.starterCode)
        embedAnalytics.trackSessionStarted(mapped.id, widgetId, mapped.language, mapped.difficulty)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchWidget()
  }, [widgetId, capsuleData])

  // ── Auto-save to localStorage (debounced 1s) ───────────────────────────────
  useEffect(() => {
    if (!widget || showSolution) return
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = window.setTimeout(() => saveCode(widget.id, userCode), 1000)
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current) }
  }, [userCode, widget, showSolution])

  // ── Timer utilities ─────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    setElapsedTime(0)
    elapsedTimerRef.current = window.setInterval(() => setElapsedTime(t => t + 1), 1000)
  }, [])
  const stopTimer = useCallback(() => {
    if (elapsedTimerRef.current) { clearInterval(elapsedTimerRef.current); elapsedTimerRef.current = null }
  }, [])

  // ── Execute code ────────────────────────────────────────────────────────────
  const executeCode = useCallback(async () => {
    if (!widget || executing) return

    const startTime = Date.now()
    embedAnalytics.trackRunClicked(widget.id, widgetId, widget.language)

    try {
      setExecuting(true)
      setExecutionResult(null)
      startTimer()

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/execute/tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userCode,
          testCases: widget.testCases || [],
          language: widget.language,
          functionName: extractFunctionName(userCode, widget.language),
        }),
      })

      let data: any

      if (response.status === 202) {
        const queueResult = await response.json()
        const jobId = queueResult.jobId
        if (!jobId) throw new Error('Server returned 202 but no jobId')

        let pollInterval = 2000
        const deadline = Date.now() + 60_000

        while (Date.now() < deadline) {
          await new Promise(r => setTimeout(r, pollInterval))
          pollInterval = Math.min(pollInterval * 1.5, 6000)
          const pollRes = await fetch(`${apiUrl}/execute/runs/${jobId}`)
          if (pollRes.ok) {
            const pollData = await pollRes.json() as any
            if (pollData.status === 'completed' && pollData.testResult) {
              data = { success: true, results: pollData.testResult.results, summary: pollData.testResult.summary, output: '', stderr: '' }
              break
            } else if (pollData.status === 'failed') {
              data = { success: false, error: pollData.error || 'Execution failed' }
              break
            }
          }
        }
        if (!data) throw new Error('Execution timed out — server may be under heavy load')
      } else if (response.ok) {
        data = await response.json()
      } else {
        const err = await response.json().catch(() => ({ error: 'Execution failed' }))
        throw new Error((err as any).error || 'Execution failed')
      }

      const executionTime = Date.now() - startTime

      if (data.success && data.results) {
        const passedCount = data.results.filter((r: any) => r.passed).length
        const totalCount = data.results.length
        const allPassed = passedCount === totalCount && totalCount > 0

        const testResults = {
          allPassed, passed: passedCount, total: totalCount,
          results: data.results.map((r: any, idx: number) => ({
            id: idx, description: r.description || `Test case ${idx + 1}`,
            passed: r.passed, expected: r.expected, actual: r.actual, error: r.error,
          })),
        }

        setExecutionResult({
          success: allPassed, stdout: data.output || '', stderr: data.stderr || '',
          testResults, passedTests: passedCount, totalTests: totalCount,
        })

        if (allPassed) {
          embedAnalytics.trackTestPassed(widget.id, widgetId, widget.language, executionTime, totalCount)
          showTestPass(passedCount, totalCount, `${(executionTime / 1000).toFixed(2)}s`)
          // Show leaderboard name toast on first success (if not already named)
          if (embedAnalytics.shouldPromptForName()) {
            // Delay slightly so the success overlay gets attention first
            setTimeout(() => setShowLeaderboardToast(true), 2000)
          }
          // Clear EdGE Assistant on success
          setEdgeStatus('idle')
          setEdgeData(null)
          setRevealLevel(1)
          // Dispatch event for PlaylistEmbed (Seamless Arcade)
          window.dispatchEvent(new CustomEvent('capsule-complete', {
            detail: { capsuleId: widget.id, allPassed: true, passed: passedCount, total: totalCount, courseId }
          }))

          // Headless Playlist: fire progress ping when courseId is present
          if (courseId) {
            const progressUrl = (import.meta as any).env?.VITE_API_URL || 'https://devcapsules-api.devleep-edu.workers.dev/api/v1'
            fetch(`${progressUrl}/playlists/${courseId}/progress`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ capsule_id: widget.id, status: 'completed' }),
            }).catch(() => {}) // fire-and-forget
          }
        } else {
          const failedTests = testResults.results.filter((r: TestResult) => !r.passed)
          embedAnalytics.trackTestFailed(widget.id, widgetId, failedTests, passedCount, totalCount, widget.language, executionTime)
          if (passedCount > 0) { showPartialPass(passedCount, totalCount) }
          else { toast('error', 'Tests Failed', `0/${totalCount} tests passed. Check your solution.`) }

          // Progressive hint reveal on failure
          setFailCount(c => {
            const newCount = c + 1
            if (widget.hints.length > 0) setRevealedHintCount(Math.min(newCount, widget.hints.length))
            return newCount
          })

          // EdGE Assistant — silently fetch error explanation in background
          setEdgeStatus('analyzing')
          fetchEdgeAssistant(apiUrl, widget, userCode, data.stderr || '', testResults)
            .then(result => { setEdgeData(result); setEdgeStatus('ready'); setRevealLevel(1) })
            .catch(() => setEdgeStatus('idle'))
        }
      } else {
        setExecutionResult({
          success: false, error: data.error || 'Execution failed', stderr: data.stderr,
          testResults: { allPassed: false, passed: 0, total: widget.testCases.length, results: [] },
        })
        embedAnalytics.trackTestFailed(widget.id, widgetId, [{ error: data.error }], 0, widget.testCases.length, widget.language, executionTime)
        toast('error', 'Execution Failed', data.error || 'Code execution failed.')

        // EdGE Assistant — also trigger on compilation/runtime errors
        setEdgeStatus('analyzing')
        fetchEdgeAssistant(apiUrl, widget, userCode, data.stderr || data.error || '', {
          passed: 0, total: widget.testCases.length, results: [],
        })
          .then(result => { setEdgeData(result); setEdgeStatus('ready'); setRevealLevel(1) })
          .catch(() => setEdgeStatus('idle'))
      }
    } catch (err) {
      setExecutionResult({
        success: false, error: err instanceof Error ? err.message : 'Unknown error',
        testResults: { allPassed: false, passed: 0, total: widget.testCases.length, results: [] },
      })
      toast('error', 'Runtime Error', err instanceof Error ? err.message : 'Execution failed.')
    } finally {
      setExecuting(false)
      stopTimer()
    }
  }, [widget, widgetId, userCode, executing, startTimer, stopTimer, toast, showTestPass, showPartialPass])

  // Keep the ref up-to-date so Monaco keybinding always calls the latest
  useEffect(() => { executeCodeRef.current = executeCode }, [executeCode])

  // ── Global keyboard shortcut: Ctrl/Cmd+Enter ───────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        executeCodeRef.current()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // ── Monaco mount: register Ctrl+Enter inside editor ─────────────────────────
  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    editor.addAction({
      id: 'run-code',
      label: 'Run Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => executeCodeRef.current(),
    })
  }, [])

  // ── Reset code ──────────────────────────────────────────────────────────────
  const resetCode = useCallback(() => {
    if (!widget) return
    setUserCode(widget.starterCode)
    setShowSolution(false)
    setSavedUserCode(null)
    saveCode(widget.id, widget.starterCode)
  }, [widget])

  // ── Toggle solution (preserves user code) ───────────────────────────────────
  const toggleSolution = useCallback(() => {
    if (!widget || !widget.solutions.length) return
    if (showSolution) {
      setUserCode(savedUserCode || widget.starterCode)
      setShowSolution(false)
    } else {
      setSavedUserCode(userCode)
      setUserCode(widget.solutions[0])
      setShowSolution(true)
      embedAnalytics.trackSolutionViewed(widget.id, widgetId)
    }
  }, [widget, widgetId, showSolution, savedUserCode, userCode])

  // ── Toggle hints ────────────────────────────────────────────────────────────
  const toggleHints = useCallback(() => {
    if (!widget) return
    const next = !showHints
    setShowHints(next)
    if (next) {
      // Ensure instructions panel is visible
      setInstructionsCollapsed(false)
      setRevealedHintCount(c => Math.max(c, 1))
      embedAnalytics.trackHintViewed(widget.id, widgetId, 0)
      // Scroll to hints after render
      setTimeout(() => {
        hintsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }, [widget, widgetId, showHints])

  // ── Language label ──────────────────────────────────────────────────────────
  const languageLabel = useMemo(() => {
    if (!widget) return ''
    const lang = widget.language.toLowerCase()
    const map: Record<string, string> = {
      python: 'Python', python3: 'Python', javascript: 'JavaScript', typescript: 'TypeScript',
      java: 'Java', cpp: 'C++', c: 'C', go: 'Go', rust: 'Rust', ruby: 'Ruby', sql: 'SQL',
    }
    return map[lang] || lang.charAt(0).toUpperCase() + lang.slice(1)
  }, [widget])

  // ── Render helpers ──────────────────────────────────────────────────────────
  const renderTestResults = () => {
    if (!executionResult || !widget) return null
    const { testResults } = executionResult

    if (executionResult.success) {
      return (
        <div className="test-result" role="status" aria-live="polite">
          <div className="test-success-banner">
            <span className="test-icon">✅</span>
            <span className="test-label">All {testResults.total} tests passed!</span>
          </div>
          <ul className="test-list" role="list">
            {testResults.results.map((result, index) => (
              <li key={index} className="test-item test-pass" role="listitem">
                <span className="test-check" aria-hidden="true">✓</span>
                <span className="test-desc">{result.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    }

    return (
      <div className="test-result" role="status" aria-live="polite">
        <div className="test-fail-banner">
          <span className="test-icon">❌</span>
          <span className="test-label">{testResults.passed}/{testResults.total} tests passed</span>
        </div>

        <ul className="test-list" role="list">
          {testResults.results.map((result, index) => (
            <li key={index} className={`test-item ${result.passed ? 'test-pass' : 'test-fail'}`} role="listitem">
              <span className="test-check" aria-hidden="true">{result.passed ? '✓' : '✗'}</span>
              <div className="test-detail">
                <span className="test-desc">{result.description}</span>
                {!result.passed && (
                  <div className="test-diff">
                    <div className="diff-row">
                      <span className="diff-label">Expected:</span>
                      <code className="diff-value expected">{formatValue(result.expected)}</code>
                    </div>
                    <div className="diff-row">
                      <span className="diff-label">Got:</span>
                      <code className="diff-value actual">{formatValue(result.actual)}</code>
                    </div>
                    {result.error && (
                      <div className="diff-row">
                        <span className="diff-label">Error:</span>
                        <code className="diff-value error">{result.error}</code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Progressive hints */}
        {widget.hints.length > 0 && revealedHintCount > 0 && (
          <div className="hints-section">
            {widget.hints.slice(0, revealedHintCount).map((hint, idx) => (
              <div key={idx} className="hint-card">
                <div className="hint-header">
                  <span className="hint-icon" aria-hidden="true">💡</span>
                  <span className="hint-title">Hint {idx + 1}</span>
                </div>
                <div className="hint-text">{hint}</div>
              </div>
            ))}
            {revealedHintCount < widget.hints.length && (
              <div className="hint-more">More hints unlock after the next attempt</div>
            )}
          </div>
        )}

        {(executionResult.stderr || executionResult.error) && (
          <div className="raw-error-section">
            <button onClick={() => setShowRawError(!showRawError)} className="error-toggle" aria-expanded={showRawError}>
              {showRawError ? '▾ Hide raw error' : '▸ Show raw error'}
            </button>
            {showRawError && (
              <div className="raw-error"><pre>{executionResult.stderr || executionResult.error}</pre></div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── Loading / Error states ──────────────────────────────────────────────────
  if (loading) return <div className="loading-container"><div className="spinner"></div></div>
  if (error) return <div className="error-container"><p>Error loading capsule: {error}</p></div>
  if (!widget) return <div className="error-container"><p>Capsule not found</p></div>

  const monacoLanguage = widget.language === 'python3' ? 'python' : widget.language

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="devcapsules-embed" role="main">
      {/* Header */}
      <header className="embed-header" role="banner">
        <div className="header-left">
          <h1 className="embed-title">{widget.title}</h1>
          <div className="embed-tags" aria-label="Tags">
            <span className="tag tag-language">{widget.language}</span>
            {widget.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="tag tag-concept">{tag}</span>
            ))}
          </div>
        </div>

        <div className="embed-controls">
          <button onClick={resetCode} className="control-btn" title="Reset to starter code" aria-label="Reset to starter code">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>

          <button onClick={toggleHints} className={`control-btn ${showHints ? 'active' : ''}`} title={showHints ? 'Hide hints' : 'Show hints'} aria-label={showHints ? 'Hide hints' : 'Show hints'} aria-pressed={showHints}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </button>

          <button onClick={toggleSolution} className={`control-btn ${showSolution ? 'active' : ''}`} title={showSolution ? 'Back to your code' : 'Show solution'} aria-label={showSolution ? 'Back to your code' : 'Show solution'} aria-pressed={showSolution} disabled={!widget.solutions.length}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </button>

          <button onClick={executeCode} disabled={executing} className="run-btn" title="Run code (Ctrl+Enter)" aria-label="Run code">
            {executing ? (
              <>
                <div className="spinner small" aria-hidden="true"></div>
                <span>{elapsedTime > 0 ? `${elapsedTime}s` : 'Running...'}</span>
              </>
            ) : (
              <><span aria-hidden="true">▶</span><span>Run</span></>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="embed-main">
        {/* Instructions Panel */}
        {!instructionsCollapsed && (
          <aside className="instructions-panel" role="complementary" aria-label="Instructions">
            <div className="instructions-header">
              <h2 className="instructions-title">Instructions</h2>
              <button onClick={() => setInstructionsCollapsed(true)} className="collapse-btn" title="Collapse" aria-label="Collapse instructions">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="instructions-content">
              <div className="instructions-section">
                <h3 className="section-label">Problem</h3>
                {renderMarkdown(widget.problemStatement)}
              </div>

              {widget.testCases.length > 0 && (
                <div className="instructions-section">
                  <h3 className="section-label">Examples</h3>
                  <div className="test-case-list">
                    {widget.testCases.slice(0, 3).map((tc, idx) => (
                      <div key={idx} className="test-case-preview">
                        <div className="tc-title">{tc.description || `Example ${idx + 1}`}</div>
                        {tc.input !== undefined && (
                          <div className="tc-row">
                            <span className="tc-label">Input:</span>
                            <code className="tc-value">{formatValue(tc.input)}</code>
                          </div>
                        )}
                        <div className="tc-row">
                          <span className="tc-label">Expected:</span>
                          <code className="tc-value">{formatValue(tc.expected_output || tc.expected)}</code>
                        </div>
                      </div>
                    ))}
                    {widget.testCases.length > 3 && (
                      <div className="tc-more">+{widget.testCases.length - 3} hidden test cases</div>
                    )}
                  </div>
                </div>
              )}

              {showHints && (
                <div className="instructions-section" ref={hintsRef}>
                  <h3 className="section-label">💡 Hints</h3>
                  {widget.hints.length > 0 ? (
                    widget.hints.slice(0, Math.max(revealedHintCount, 1)).map((hint, idx) => (
                      <div key={idx} className="hint-card">
                        <div className="hint-header">
                          <span className="hint-icon" aria-hidden="true">💡</span>
                          <span className="hint-title">Hint {idx + 1}</span>
                        </div>
                        <div className="hint-text">{hint}</div>
                      </div>
                    ))
                  ) : (
                    <div className="hint-card">
                      <div className="hint-text" style={{ color: 'var(--dc-text-muted)' }}>
                        No hints available for this capsule. Try running your code — hints unlock after failed attempts.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {widget.tags.length > 0 && (
                <div className="instructions-section">
                  <h3 className="section-label">Concepts</h3>
                  <div className="concept-tags">
                    {widget.tags.map((tag, idx) => (
                      <span key={idx} className="concept-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {instructionsCollapsed && (
          <button onClick={() => setInstructionsCollapsed(false)} className="collapsed-btn" title="Show Instructions" aria-label="Expand instructions">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        {/* Editor + Console */}
        <div className="editor-area">
          {showSolution && (
            <div className="solution-banner" role="status">
              <span aria-hidden="true">📖</span>
              <span>Viewing reference solution</span>
              <button onClick={toggleSolution} className="solution-back-btn">Back to your code</button>
            </div>
          )}

          <div className="editor-wrapper">
            <Editor
              height="100%"
              defaultLanguage={monacoLanguage}
              theme="vs-dark"
              value={userCode}
              onChange={(value) => { if (!showSolution) setUserCode(value || '') }}
              onMount={handleEditorMount}
              options={{
                fontSize: 14, lineNumbers: 'on', wordWrap: 'on',
                minimap: { enabled: false }, scrollBeyondLastLine: false,
                automaticLayout: true, tabSize: 2, insertSpaces: true,
                readOnly: showSolution, renderValidationDecorations: 'on',
                padding: { top: 8 },
              }}
            />
          </div>

          {/* Console — Intelligent Split */}
          <div className={`console-panel ${edgeStatus !== 'idle' ? 'console-split' : ''}`} role="region" aria-label="Console">
            <div className="console-tabs" role="tablist">
              <button className="console-tab active" role="tab" aria-selected={true}>
                Tests
                {executionResult && (
                  <span className={`tab-badge ${executionResult.success ? 'pass' : 'fail'}`}>
                    {executionResult.testResults.passed}/{executionResult.testResults.total}
                  </span>
                )}
              </button>
              {edgeStatus !== 'idle' && (
                <span className="console-tab edge-tab-indicator">
                  <span className="edge-tab-dot" />
                  ⚡ EdGE
                </span>
              )}
              <div className="shortcut-hint" aria-hidden="true">
                <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to run
              </div>
            </div>

            <div className="console-split-body">
              {/* Left Column — Tests (always full width when no EdGE) */}
              <div className="console-content" role="tabpanel">
                {executionResult ? renderTestResults() : (
                  <div className="no-output">Click <strong>Run</strong> or press <kbd>Ctrl+Enter</kbd> to execute your code.</div>
                )}
                {/* Stdout as collapsible section inside tests */}
                {executionResult?.stdout && (
                  <details className="stdout-details">
                    <summary className="stdout-summary">Console Output</summary>
                    <pre className="output-text">{executionResult.stdout}</pre>
                  </details>
                )}
              </div>

              {/* Right Column — EdGE Assistant (slides in on error) */}
              {edgeStatus !== 'idle' && (
                <div className="edge-panel" role="complementary" aria-label="EdGE Assistant">
                  <div className="edge-panel-header">
                    <span className="edge-panel-title">⚡ EdGE Assistant</span>
                    {edgeData?.cached && <span className="edge-cached">Instant</span>}
                  </div>
                  <div className="edge-panel-content">
                    {edgeStatus === 'analyzing' ? (
                      <div className="edge-analyzing">
                        <div className="edge-pulse-dot" />
                        <span>Analyzing your code…</span>
                      </div>
                    ) : edgeData && (
                      <div className="edge-levels">
                        {/* Level 1 — Hint (always visible) */}
                        <div className="edge-level edge-hint">
                          <div className="edge-level-header">
                            <span className="edge-icon">💡</span>
                            <span className="edge-label">Hint</span>
                            {edgeData.lineNumber && <span className="edge-line">Line {edgeData.lineNumber}</span>}
                          </div>
                          <p className="edge-text">{edgeData.hint}</p>
                        </div>

                        {/* Level 2 — Fix (progressive reveal) */}
                        {revealLevel >= 2 ? (
                          <div className="edge-level edge-fix">
                            <div className="edge-level-header">
                              <span className="edge-icon">🔧</span>
                              <span className="edge-label">Fix</span>
                            </div>
                            <pre className="edge-code"><code>{edgeData.fix}</code></pre>
                          </div>
                        ) : (
                          <button onClick={() => setRevealLevel(2)} className="edge-reveal-btn">
                            🔧 Show Fix →
                          </button>
                        )}

                        {/* Level 3 — Deep explanation (progressive reveal) */}
                        {revealLevel >= 3 ? (
                          <div className="edge-level edge-explanation">
                            <div className="edge-level-header">
                              <span className="edge-icon">📖</span>
                              <span className="edge-label">Why This Happens</span>
                            </div>
                            <p className="edge-text">{edgeData.explanation}</p>
                          </div>
                        ) : revealLevel === 2 ? (
                          <button onClick={() => setRevealLevel(3)} className="edge-reveal-btn">
                            📖 Explain Why →
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Name Toast ("Passive-Aggressive Upgrade") */}
      {showLeaderboardToast && widget && (
        <LeaderboardToast
          capsuleId={widget.id}
          widgetId={widgetId}
          onDone={() => setShowLeaderboardToast(false)}
        />
      )}

      {/* Status Bar */}
      <footer className="status-bar" role="contentinfo">
        <div className="status-left">
          <span className="status-dot" aria-hidden="true"></span>
          <span>{languageLabel}</span>
          {executing && <span className="status-running">Executing… {elapsedTime > 0 ? `${elapsedTime}s` : ''}</span>}
        </div>
        <div className="status-right">
          {widget.creatorPlan === 'free' ? (
            <a href="https://devcapsules.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
              Powered by <span className="brand">DevCapsules</span>
            </a>
          ) : (
            <>Powered by <span className="brand">EdGE</span></>
          )}
        </div>
      </footer>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Export with Error Boundary
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function DevcapsulesEmbed(props: CapsuleEmbedProps) {
  return (
    <EmbedErrorBoundary>
      <DevcapsulesEmbedInner {...props} />
    </EmbedErrorBoundary>
  )
}
