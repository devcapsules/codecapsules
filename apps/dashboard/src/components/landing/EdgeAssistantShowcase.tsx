import React, { useState, useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════════
   EdGE Assistant Showcase — "Show, Don't Tell" Hero Section
   
   A high-fidelity simulation of the embed widget with intentionally buggy code.
   Visitor clicks Run → tests fail → 50/50 split with EdGE Assistant appears.
   ═══════════════════════════════════════════════════════════════════════════════ */

const BUGGY_CODE = `def reverse_words(sentence):
    words = sentence.split()
    reversed_words = []
    for word in words:
        reversed_words.append(word[::-1])
    return reversed_words`;

const FIXED_CODE = `def reverse_words(sentence):
    words = sentence.split()
    reversed_words = []
    for word in words:
        reversed_words.append(word[::-1])
    return ' '.join(reversed_words)`;

const TEST_CASES = [
  { desc: 'Single word reversal', input: '"hello"', expected: '"olleh"', actual: "['olleh']", passed: false },
  { desc: 'Two word sentence', input: '"hello world"', expected: '"olleh dlrow"', actual: "['olleh', 'dlrow']", passed: false },
  { desc: 'Empty string', input: '""', expected: '""', actual: '[]', passed: false },
  { desc: 'Palindrome word', input: '"madam"', expected: '"madam"', actual: "['madam']", passed: false },
  { desc: 'Sentence with spaces', input: '"the quick fox"', expected: '"eht kciuq xof"', actual: "['eht', 'kciuq', 'xof']", passed: false },
];

const EDGE_HINT = `Your function reverses each character in every word correctly, but it's **returning a list** instead of a **string**.\n\nThe test expects a single string like \`"olleh dlrow"\`, but your code returns \`['olleh', 'dlrow']\`.\n\nThink about how to **join** list elements back into one string with spaces between them.`;

const EDGE_FIX = `On **line 6**, change your return statement:\n\n\`\`\`python\n# Before (returns a list)\nreturn reversed_words\n\n# After (returns a joined string)\nreturn ' '.join(reversed_words)\n\`\`\`\n\nThe \`' '.join()\` method concatenates all list items with a space separator, producing the expected string output.`;

const EDGE_EXPLANATION = `Python's \`split()\` breaks a string into a **list** of words. Your loop correctly reverses each word with \`[::-1]\`, but the result stays in a list.\n\nWhen the tests compare your output to the expected string, **a list ≠ a string** — even if the contents match.\n\n\`' '.join(list)\` is the idiomatic way to convert a list of strings back to a single space-separated string. This is one of the most common beginner mistakes in Python string manipulation.`;

function renderSimpleMarkdown(md: string): React.ReactNode {
  if (!md) return null;
  const lines = md.split('\n');
  const elements: React.ReactNode[] = [];
  let inCode = false;
  let codeLines: string[] = [];
  let key = 0;

  const inlineFormat = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let k = 0;
    while (remaining.length > 0) {
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(<code key={k++} style={{
          background: 'rgba(0,255,135,0.1)', color: '#00ff87',
          padding: '1px 5px', borderRadius: '3px', fontSize: '0.8em', fontFamily: 'monospace'
        }}>{codeMatch[1]}</code>);
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        parts.push(<strong key={k++} style={{ color: '#e2e8f0' }}>{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    }
    return parts;
  };

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCode) {
        elements.push(
          <pre key={key++} style={{
            background: '#04040a', borderRadius: 6, padding: '10px 12px', margin: '8px 0',
            fontSize: '0.78rem', lineHeight: 1.6, overflowX: 'auto',
            border: '1px solid rgba(0,255,135,0.1)', fontFamily: "'Fira Code', monospace",
          }}>
            <code style={{ color: '#94a3b8' }}>{codeLines.join('\n')}</code>
          </pre>
        );
        codeLines = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }
    if (line.trim() === '') { elements.push(<br key={key++} />); continue; }
    elements.push(<p key={key++} style={{ margin: '4px 0', lineHeight: 1.6 }}>{inlineFormat(line)}</p>);
  }
  return elements;
}

export function EdgeAssistantShowcase() {
  const [phase, setPhase] = useState<'idle' | 'running' | 'results' | 'edge'>('idle');
  const [visibleTests, setVisibleTests] = useState<number>(0);
  const [edgeLevel, setEdgeLevel] = useState(0); // 0=analyzing, 1=hint, 2=fix, 3=explanation
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [hasRun, setHasRun] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  const runDemo = () => {
    if (phase === 'running') return;
    setPhase('running');
    setVisibleTests(0);
    setEdgeLevel(0);
    setAnalyzeProgress(0);
    setHasRun(true);

    // Simulate test execution with staggered reveals
    const testDelay = 280;
    TEST_CASES.forEach((_, i) => {
      setTimeout(() => {
        setVisibleTests(i + 1);
        if (i === TEST_CASES.length - 1) {
          // All tests shown, transition to edge after a beat
          setTimeout(() => {
            setPhase('edge');
            // Simulate analyzing progress
            let prog = 0;
            const interval = setInterval(() => {
              prog += Math.random() * 18 + 8;
              if (prog >= 100) {
                prog = 100;
                clearInterval(interval);
                setAnalyzeProgress(100);
                setTimeout(() => setEdgeLevel(1), 400); // Show hint
              }
              setAnalyzeProgress(Math.min(100, Math.round(prog)));
            }, 120);
          }, 500);
        }
      }, 600 + i * testDelay);
    });
  };

  const reset = () => {
    setPhase('idle');
    setVisibleTests(0);
    setEdgeLevel(0);
    setAnalyzeProgress(0);
  };

  return (
    <section id="edge-assistant" className="relative py-16 lg:py-24 overflow-hidden" style={{ background: '#04040a' }}>
      {/* Background orbs */}
      <div className="absolute top-[-100px] right-[10%] w-[500px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,255,135,0.08) 0%, transparent 70%)', filter: 'blur(100px)' }} />
      <div className="absolute bottom-[-50px] left-[5%] w-[400px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-5"
            style={{ background: 'rgba(0,255,135,0.07)', border: '1px solid rgba(0,255,135,0.18)', color: '#00ff87' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Experience EdGE Assistant
          </span>
          <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white mb-4" style={{ letterSpacing: '-0.03em' }}>
            Zero Manual Grading.{' '}
            <span style={{
              background: 'linear-gradient(90deg, #00ff87 0%, #86efac 30%, #00ff87 50%, #00b894 80%, #00ff87 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmerText 3s linear infinite',
            }}>Zero TA Bottlenecks.</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Stop paying instructors $20/hour to debug missing commas. The EdGE Assistant intercepts
            student errors in milliseconds and provides pedagogical, human-like explanations directly inside the terminal.
          </p>
        </div>

        {/* CTA Arrow + Text */}
        {!hasRun && (
          <div className="flex items-center justify-center gap-3 mb-6 animate-bounce-subtle">
            <span className="text-sm font-semibold text-[#00ff87]" style={{ textShadow: '0 0 20px rgba(0,255,135,0.3)' }}>
              Hit <strong>&quot;Run&quot;</strong> on the widget below to see EdGE in action
            </span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00ff87" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </div>
        )}

        {/* ═══ THE WIDGET ═══ */}
        <div ref={widgetRef} className="max-w-[920px] mx-auto">
          <div className="rounded-2xl overflow-hidden"
            style={{
              border: '1px solid rgba(0,255,135,0.2)',
              background: '#08080f',
              boxShadow: '0 0 60px rgba(0,255,135,0.08), 0 25px 50px rgba(0,0,0,0.5)',
            }}>

            {/* ── Title Bar ── */}
            <div className="flex items-center gap-2 px-4 py-2.5" style={{
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(239,68,68,0.6)' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(234,179,8,0.6)' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(34,197,94,0.5)' }} />
              </div>
              <span className="ml-2 text-xs text-slate-500 font-mono">reverse_words.py</span>
              <span className="ml-auto text-[0.65rem] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(234,179,8,0.12)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.2)' }}>
                Medium
              </span>
            </div>

            {/* ── Problem Statement ── */}
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
              <h4 className="text-sm font-bold text-white mb-1">Reverse Words in a Sentence</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Write a function that takes a sentence and returns a new string where each word&apos;s characters are reversed, 
                but the word order stays the same. E.g. <code className="text-[#00ff87] text-[0.7rem]">&quot;hello world&quot;</code> → <code className="text-[#00ff87] text-[0.7rem]">&quot;olleh dlrow&quot;</code>
              </p>
            </div>

            {/* ── Code Editor (Simulated) ── */}
            <div className="relative" style={{ background: '#0a0a14' }}>
              <div className="flex">
                {/* Line numbers */}
                <div className="py-3 pl-3 pr-2 select-none text-right" style={{ minWidth: 38 }}>
                  {BUGGY_CODE.split('\n').map((_, i) => (
                    <div key={i} className="text-[0.75rem] leading-[1.65] font-mono" style={{ color: '#334155' }}>{i + 1}</div>
                  ))}
                </div>
                {/* Code */}
                <pre className="py-3 pr-4 flex-1 overflow-x-auto text-[0.8rem] leading-[1.65] font-mono" style={{ color: '#94a3b8' }}>
                  <code>
                    <span style={{ color: '#c084fc' }}>def</span>{' '}
                    <span style={{ color: '#fde047' }}>reverse_words</span>
                    <span style={{ color: '#94a3b8' }}>(</span>
                    <span style={{ color: '#fb923c' }}>sentence</span>
                    <span style={{ color: '#94a3b8' }}>):</span>{'\n'}
                    {'    '}words = sentence.<span style={{ color: '#60a5fa' }}>split</span>(){'\n'}
                    {'    '}reversed_words = []{'\n'}
                    {'    '}<span style={{ color: '#c084fc' }}>for</span> word <span style={{ color: '#c084fc' }}>in</span> words:{'\n'}
                    {'        '}reversed_words.<span style={{ color: '#60a5fa' }}>append</span>(word[<span style={{ color: '#c084fc' }}>::-1</span>]){'\n'}
                    {'    '}<span style={{ color: '#c084fc' }}>return</span> reversed_words
                    <span className="inline-block w-[2px] h-[14px] ml-[1px] align-middle" style={{ background: '#00ff87', animation: 'cursorBlink 1.2s step-end infinite' }} />
                  </code>
                </pre>
              </div>
            </div>

            {/* ── Action Bar ── */}
            <div className="flex items-center gap-2 px-4 py-2" style={{
              borderTop: '1px solid rgba(255,255,255,0.04)',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              background: 'rgba(255,255,255,0.015)',
            }}>
              <button
                onClick={runDemo}
                disabled={phase === 'running'}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all"
                style={{
                  background: phase === 'running' ? 'rgba(0,255,135,0.15)' : 'linear-gradient(135deg, #00ff87, #00b894)',
                  color: phase === 'running' ? '#00ff87' : '#04040a',
                  boxShadow: phase === 'running' ? 'none' : '0 0 16px rgba(0,255,135,0.3)',
                  cursor: phase === 'running' ? 'not-allowed' : 'pointer',
                }}
              >
                {phase === 'running' ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                    </svg>
                    Running...
                  </>
                ) : (
                  <>
                    <svg width="10" height="10" fill="currentColor" viewBox="0 0 10 10"><path d="M2 1.5l7 3.5-7 3.5V1.5z"/></svg>
                    Run
                  </>
                )}
              </button>
              {hasRun && phase !== 'running' && (
                <button onClick={reset} className="text-[0.7rem] text-slate-500 hover:text-slate-300 transition-colors px-2 py-1">
                  Reset Demo
                </button>
              )}
              <span className="ml-auto text-[0.65rem] font-mono text-slate-600">Python 3.11 &nbsp;·&nbsp; Sandboxed</span>
            </div>

            {/* ═══ CONSOLE PANEL ═══ */}
            {(phase !== 'idle' || hasRun) && (
              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                background: '#06060c',
                transition: 'max-height 0.4s ease',
              }}>
                {/* Tab bar */}
                <div className="flex items-center px-3 py-1.5 gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-[0.7rem] font-bold text-white" style={{ borderBottom: '2px solid #00ff87', paddingBottom: 2 }}>
                    Tests
                  </span>
                  {phase === 'edge' && (
                    <span className="flex items-center gap-1.5 text-[0.7rem] font-semibold" style={{ color: '#00ff87' }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{
                        background: '#00ff87', boxShadow: '0 0 6px #00ff87',
                        animation: 'edgePulseDot 2s ease-in-out infinite',
                      }} />
                      EdGE Assistant
                    </span>
                  )}
                </div>

                {/* Console body — 50/50 split when EdGE active */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: phase === 'edge' ? '1fr 1fr' : '1fr',
                  transition: 'grid-template-columns 0.4s ease',
                  minHeight: phase === 'edge' ? 280 : 'auto',
                }}>
                  {/* LEFT: Test Results */}
                  <div className="p-3 overflow-y-auto" style={{
                    maxHeight: 320,
                    borderRight: phase === 'edge' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}>
                    <div className="space-y-1">
                      {TEST_CASES.slice(0, visibleTests).map((tc, i) => (
                        <div key={i} className="flex items-center gap-2 py-1 px-2 rounded text-[0.75rem] font-mono"
                          style={{
                            background: 'rgba(239,68,68,0.06)',
                            border: '1px solid rgba(239,68,68,0.12)',
                            animation: 'testFadeIn 0.3s ease forwards',
                          }}>
                          <span style={{ color: '#ef4444' }}>✕</span>
                          <span className="flex-1 text-slate-400">{tc.desc}</span>
                          <span className="text-[0.65rem] text-red-400/70">FAIL</span>
                        </div>
                      ))}
                    </div>
                    {visibleTests === TEST_CASES.length && (
                      <div className="mt-2 flex items-center gap-2 py-1.5 px-2 rounded text-[0.75rem] font-bold"
                        style={{
                          background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.15)',
                          animation: 'testFadeIn 0.3s ease forwards',
                        }}>
                        <span style={{ color: '#ef4444' }}>✕ 0/5 Tests Passed</span>
                        <span className="ml-auto text-[0.65rem] text-slate-600 font-normal">0.18s</span>
                      </div>
                    )}
                    {/* Expected vs Actual detail for first test */}
                    {visibleTests > 0 && phase !== 'running' && (
                      <div className="mt-2 rounded p-2 text-[0.7rem] font-mono" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="text-slate-500 mb-1">Test 1: {TEST_CASES[0].desc}</div>
                        <div><span className="text-slate-600">Expected:</span> <span className="text-green-400">{TEST_CASES[0].expected}</span></div>
                        <div><span className="text-slate-600">Actual: &nbsp;&nbsp;</span> <span className="text-red-400">{TEST_CASES[0].actual}</span></div>
                      </div>
                    )}
                  </div>

                  {/* RIGHT: EdGE Assistant Panel */}
                  {phase === 'edge' && (
                    <div className="overflow-y-auto" style={{
                      maxHeight: 320,
                      animation: 'edgeSlideIn 0.4s ease forwards',
                    }}>
                      {/* EdGE Header */}
                      <div className="flex items-center gap-2 px-3 py-2" style={{
                        borderBottom: '1px solid rgba(0,255,135,0.1)',
                        background: 'rgba(0,255,135,0.03)',
                      }}>
                        <div className="w-1 h-4 rounded-full" style={{ background: '#00ff87' }} />
                        <span className="text-[0.72rem] font-bold text-white">EdGE Assistant</span>
                        <span className="text-[0.6rem] text-slate-600 ml-auto">Type Error • Line 6</span>
                      </div>

                      <div className="p-3 space-y-2 text-[0.75rem] text-slate-400">
                        {/* Analyzing state */}
                        {edgeLevel === 0 && (
                          <div style={{ animation: 'edgeFadeIn 0.3s ease' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <svg className="w-3.5 h-3.5 animate-spin" style={{ color: '#00ff87' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                              </svg>
                              <span className="text-[0.72rem] font-semibold" style={{ color: '#00ff87' }}>
                                Analyzing your code...
                              </span>
                            </div>
                            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                              <div className="h-full rounded-full transition-all" style={{
                                width: `${analyzeProgress}%`,
                                background: 'linear-gradient(90deg, #00ff87, #00b894)',
                                boxShadow: '0 0 8px rgba(0,255,135,0.4)',
                                transition: 'width 0.15s ease',
                              }} />
                            </div>
                          </div>
                        )}

                        {/* Level 1: Hint */}
                        {edgeLevel >= 1 && (
                          <div style={{ animation: 'edgeFadeIn 0.4s ease' }}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <svg width="12" height="12" fill="none" stroke="#fbbf24" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                              <span className="text-[0.72rem] font-bold" style={{ color: '#fbbf24' }}>Hint</span>
                            </div>
                            <div className="text-[0.73rem] leading-relaxed">{renderSimpleMarkdown(EDGE_HINT)}</div>
                            {edgeLevel === 1 && (
                              <button onClick={() => setEdgeLevel(2)}
                                className="mt-3 flex items-center gap-1 text-[0.7rem] font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-[1.02]"
                                style={{
                                  background: 'rgba(0,255,135,0.08)', color: '#00ff87',
                                  border: '1px solid rgba(0,255,135,0.2)',
                                }}>
                                Show Fix
                                <svg width="10" height="10" fill="none" viewBox="0 0 10 10"><path d="M3 2l5 3-5 3V2z" fill="currentColor"/></svg>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Level 2: Fix */}
                        {edgeLevel >= 2 && (
                          <div style={{ animation: 'edgeFadeIn 0.4s ease', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8, marginTop: 8 }}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <svg width="12" height="12" fill="none" stroke="#00ff87" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                              <span className="text-[0.72rem] font-bold" style={{ color: '#00ff87' }}>Fix</span>
                            </div>
                            <div className="text-[0.73rem] leading-relaxed">{renderSimpleMarkdown(EDGE_FIX)}</div>
                            {edgeLevel === 2 && (
                              <button onClick={() => setEdgeLevel(3)}
                                className="mt-3 flex items-center gap-1 text-[0.7rem] font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-[1.02]"
                                style={{
                                  background: 'rgba(0,255,135,0.08)', color: '#00ff87',
                                  border: '1px solid rgba(0,255,135,0.2)',
                                }}>
                                Show Explanation
                                <svg width="10" height="10" fill="none" viewBox="0 0 10 10"><path d="M3 2l5 3-5 3V2z" fill="currentColor"/></svg>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Level 3: Explanation */}
                        {edgeLevel >= 3 && (
                          <div style={{ animation: 'edgeFadeIn 0.4s ease', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8, marginTop: 8 }}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <svg width="12" height="12" fill="none" stroke="#818cf8" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                              <span className="text-[0.72rem] font-bold" style={{ color: '#818cf8' }}>Why This Happens</span>
                            </div>
                            <div className="text-[0.73rem] leading-relaxed">{renderSimpleMarkdown(EDGE_EXPLANATION)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Status Bar ── */}
            <div className="flex items-center justify-between px-3 py-1" style={{
              borderTop: '1px solid rgba(255,255,255,0.04)',
              background: 'rgba(255,255,255,0.015)',
            }}>
              <span className="text-[0.6rem] text-slate-600 font-mono">Powered by EdGE</span>
              <span className="text-[0.6rem] text-slate-700 font-mono">devcapsules.com</span>
            </div>
          </div>
        </div>

        {/* Trust signals below widget */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-[0.75rem] text-slate-500">
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" fill="none" stroke="#00ff87" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Response in <strong className="text-slate-400">&lt;800ms</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" fill="none" stroke="#00ff87" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Progressive <strong className="text-slate-400">3-level reveal</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" fill="none" stroke="#00ff87" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Works with <strong className="text-slate-400">every capsule</strong></span>
          </span>
        </div>
      </div>

      {/* Inline keyframe styles */}
      <style>{`
        @keyframes cursorBlink { 0%, 50% { opacity: 1 } 51%, 100% { opacity: 0 } }
        @keyframes edgePulseDot { 0%, 100% { opacity: 1; transform: scale(1) } 50% { opacity: 0.5; transform: scale(1.3) } }
        @keyframes edgeSlideIn { from { opacity: 0; transform: translateX(12px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes edgeFadeIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes testFadeIn { from { opacity: 0; transform: translateX(-8px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes animate-bounce-subtle {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-6px) }
        }
        .animate-bounce-subtle { animation: animate-bounce-subtle 2s ease-in-out infinite; }
      `}</style>
    </section>
  );
}
