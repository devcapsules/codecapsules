import React, { useState, useEffect, useCallback, useRef } from 'react';

/* ────────────────────────────────────────────────────────────────────────
 *  PHASES:  terminal → capsule card → loop
 * ──────────────────────────────────────────────────────────────────────── */
type Phase = 'terminal' | 'morphing' | 'capsule';

interface Frame {
  type: 'cmd' | 'output' | 'success' | 'link' | 'pause' | 'clear';
  text?: string;
  time?: string;
  delay: number;
}

const SCRIPT: Frame[] = [
  { type: 'cmd',     text: 'devcapsules create "Two Sum in Python"',     delay: 0 },
  { type: 'output',  text: 'Analyzing prompt…',                          delay: 600 },
  { type: 'success', text: 'Code generated',        time: '1.2s',        delay: 1000 },
  { type: 'success', text: 'EdGE hints added',        time: '0.8s',        delay: 800 },
  { type: 'success', text: 'Test cases passed 4/4', time: '0.4s',        delay: 700 },
  { type: 'success', text: 'Capsule published',     time: '0.1s',        delay: 500 },
  { type: 'link',    text: '→ app.devcapsules.com/embed/two-sum',        delay: 400 },
  { type: 'pause',                                                       delay: 1600 },
];

/* ── Capsule preview data ────────────────────────────────────────────── */
const CAPSULE_CODE = `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        diff = target - n
        if diff in seen:
            return [seen[diff], i]
        seen[n] = i`;

const CAPSULE_TESTS = [
  { input: '[2,7,11,15], 9',  expected: '[0, 1]', passed: true },
  { input: '[3,2,4], 6',      expected: '[1, 2]', passed: true },
  { input: '[3,3], 6',        expected: '[0, 1]', passed: true },
];

const TYPING_SPEED = 32;
const CURSOR_BLINK  = 530;

/* ───────────────────────────── Component ─────────────────────────────── */
export default function TerminalReplay() {
  const [phase, setPhase] = useState<Phase>('terminal');
  const [lines, setLines] = useState<Frame[]>([]);
  const [typedCmd, setTypedCmd] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [showGlow, setShowGlow] = useState(false);
  const [capsuleReady, setCapsuleReady] = useState(false);
  const [visibleTests, setVisibleTests] = useState(0);
  const [runClicked, setRunClicked] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);
  const mounted = useRef(true);
  const loopRef = useRef<ReturnType<typeof setTimeout>>();

  /* ── cursor blink ─────────────────────────────────────────────────── */
  useEffect(() => {
    const id = setInterval(() => setCursorVisible(v => !v), CURSOR_BLINK);
    return () => clearInterval(id);
  }, []);

  /* ── helpers ──────────────────────────────────────────────────────── */
  const wait = useCallback((ms: number) => new Promise<void>(r => {
    loopRef.current = setTimeout(r, ms);
  }), []);

  const typeCommand = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      setIsTyping(true);
      setTypedCmd('');
      let i = 0;
      const id = setInterval(() => {
        if (!mounted.current) { clearInterval(id); return; }
        i++;
        setTypedCmd(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(id);
          setIsTyping(false);
          resolve();
        }
      }, TYPING_SPEED);
    });
  }, []);

  /* ── main loop ────────────────────────────────────────────────────── */
  const play = useCallback(async () => {
    if (!mounted.current) return;

    // ─── Phase 1: Terminal ──────────────────────────────────
    setPhase('terminal');
    setLines([]);
    setTypedCmd('');
    setShowGlow(false);
    setCapsuleReady(false);
    setVisibleTests(0);
    setRunClicked(false);
    setProgressWidth(0);

    for (const frame of SCRIPT) {
      if (!mounted.current) return;
      if (frame.delay > 0) await wait(frame.delay);
      if (!mounted.current) return;

      switch (frame.type) {
        case 'cmd':
          await typeCommand(frame.text!);
          setLines(prev => [...prev, frame]);
          setTypedCmd('');
          break;
        case 'output':
        case 'success':
        case 'link':
          if (frame.type === 'link') setShowGlow(true);
          setLines(prev => [...prev, frame]);
          break;
        case 'pause':
          break;
      }
    }

    if (!mounted.current) return;

    // ─── Phase 2: Morph to capsule card ─────────────────────
    setPhase('morphing');
    await wait(600);
    if (!mounted.current) return;

    setPhase('capsule');
    await wait(400);
    if (!mounted.current) return;
    setCapsuleReady(true);

    // Auto-run after a moment
    await wait(1200);
    if (!mounted.current) return;
    setRunClicked(true);

    // Animate progress bar
    setProgressWidth(100);

    // Reveal tests one by one
    for (let i = 0; i < CAPSULE_TESTS.length; i++) {
      await wait(500);
      if (!mounted.current) return;
      setVisibleTests(i + 1);
    }

    // Hold the capsule view
    await wait(3500);
    if (!mounted.current) return;

    // Loop
    if (mounted.current) play();
  }, [typeCommand, wait]);

  useEffect(() => {
    mounted.current = true;
    play();
    return () => {
      mounted.current = false;
      if (loopRef.current) clearTimeout(loopRef.current);
    };
  }, [play]);

  /* ── terminal line renderer ───────────────────────────────────────── */
  const renderLine = (f: Frame, i: number) => {
    switch (f.type) {
      case 'cmd':
        return (
          <div key={i} className="flex items-start gap-2 terminal-fade-in">
            <span className="text-[#00ff87] select-none flex-shrink-0 font-semibold">$</span>
            <span className="text-slate-200">{f.text}</span>
          </div>
        );
      case 'output':
        return (
          <div key={i} className="text-slate-500 pl-4 terminal-fade-in flex items-center gap-2">
            <span className="inline-block w-3 h-3 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin flex-shrink-0" style={{ animationDuration: '0.8s' }} />
            {f.text}
          </div>
        );
      case 'success':
        return (
          <div key={i} className="pl-4 terminal-fade-in flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 flex-shrink-0 text-[#00ff87] terminal-check-pop" viewBox="0 0 16 16" fill="none">
                <path d="M3 8.5l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-slate-300">{f.text}</span>
            </span>
            {f.time && <span className="font-mono text-[11px] text-slate-600 tabular-nums flex-shrink-0">{f.time}</span>}
          </div>
        );
      case 'link':
        return (
          <div key={i} className="terminal-fade-in mt-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit"
              style={{ background: 'rgba(0,255,135,0.06)', border: '1px solid rgba(0,255,135,0.15)' }}>
              <span style={{ color: '#00ff87' }} className="font-semibold text-sm">{f.text}</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  /* ── Capsule Card ─────────────────────────────────────────────────── */
  const renderCapsuleCard = () => (
    <div className={`capsule-card-enter ${capsuleReady ? 'capsule-card-ready' : ''}`}>
      {/* Card header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(0,255,135,0.15), rgba(0,255,135,0.05))', border: '1px solid rgba(0,255,135,0.2)' }}>
            <svg className="w-4 h-4 text-[#00ff87]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm leading-tight">Two Sum</h4>
            <p className="text-slate-500 text-[11px]">Hash map · Arrays</p>
          </div>
        </div>
        {/* Language badge */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
          style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
          Python
        </span>
      </div>

      {/* Code preview */}
      <div className="rounded-lg overflow-hidden mb-2.5 sm:mb-3"
        style={{ background: '#06060e', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between px-3 py-1.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span className="text-[10px] text-slate-600 font-medium">solution.py</span>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
          </div>
        </div>
        <pre className="px-3 py-2.5 text-[11px] leading-[1.6] overflow-hidden font-mono"
          style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
          {CAPSULE_CODE.split('\n').map((line, i) => (
            <div key={i} className="flex">
              <span className="text-slate-700 select-none w-5 text-right mr-3 flex-shrink-0">{i + 1}</span>
              <span>
                {highlightPython(line)}
              </span>
            </div>
          ))}
        </pre>
      </div>

      {/* Run button + Tests */}
      <div className="flex items-center gap-2 mb-3">
        <button
          className={`capsule-run-btn inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${
            runClicked ? 'capsule-run-btn-active' : ''
          }`}
          style={{
            background: runClicked
              ? 'linear-gradient(135deg, #00ff87, #00b894)'
              : 'linear-gradient(135deg, rgba(0,255,135,0.15), rgba(0,255,135,0.08))',
            border: '1px solid rgba(0,255,135,0.3)',
            color: runClicked ? '#000' : '#00ff87',
            boxShadow: runClicked ? '0 0 20px rgba(0,255,135,0.3)' : '0 0 10px rgba(0,255,135,0.1)',
          }}
        >
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2.5 1.5l8 4.5-8 4.5V1.5z" />
          </svg>
          {runClicked ? 'Running…' : 'Run Code'}
        </button>

        {/* Progress bar */}
        {runClicked && (
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${progressWidth}%`,
                background: 'linear-gradient(90deg, #00ff87, #3b82f6)',
                transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </div>
        )}
      </div>

      {/* Test results */}
      {visibleTests > 0 && (
        <div className="space-y-1.5">
          {CAPSULE_TESTS.slice(0, visibleTests).map((t, i) => (
            <div key={i} className="terminal-fade-in flex items-center justify-between px-2.5 py-1.5 rounded-md"
              style={{ background: 'rgba(0,255,135,0.04)', border: '1px solid rgba(0,255,135,0.08)' }}>
              <div className="flex items-center gap-2">
                <svg className="w-3 h-3 text-[#00ff87] terminal-check-pop" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8.5l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[11px] text-slate-400 font-mono">
                  two_sum({t.input})
                </span>
              </div>
              <span className="text-[10px] text-[#00ff87] font-mono font-bold">{t.expected}</span>
            </div>
          ))}

          {/* Summary bar */}
          {visibleTests === CAPSULE_TESTS.length && (
            <div className="terminal-fade-in flex items-center justify-between pt-2 mt-1"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-[11px] text-slate-500">All tests passed</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: 'rgba(0,255,135,0.1)', color: '#00ff87' }}>
                <span className="w-1 h-1 rounded-full bg-[#00ff87]" style={{ boxShadow: '0 0 4px #00ff87' }} />
                3/3
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  /* ── main render ──────────────────────────────────────────────────── */
  return (
    <div className="w-full relative group">
      {/* Outer glow */}
      <div
        className="absolute -inset-[1px] rounded-xl transition-opacity duration-1000 pointer-events-none"
        style={{
          opacity: showGlow ? 1 : 0,
          background: 'linear-gradient(135deg, rgba(0,255,135,0.15), rgba(59,130,246,0.1), rgba(0,255,135,0.1))',
          filter: 'blur(1px)',
        }}
      />

      {/* Terminal / Card container */}
      <div className="relative rounded-xl overflow-hidden"
        style={{ background: '#0a0a12', border: '1px solid rgba(255,255,255,0.08)' }}>

        {/* ── Title bar ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2"
          style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 sm:w-[11px] sm:h-[11px] rounded-full bg-[#ff5f57]" style={{ boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.2)' }} />
            <span className="w-2.5 h-2.5 sm:w-[11px] sm:h-[11px] rounded-full bg-[#febc2e]" style={{ boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.2)' }} />
            <span className="w-2.5 h-2.5 sm:w-[11px] sm:h-[11px] rounded-full bg-[#28c840]" style={{ boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.2)' }} />
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[11px] text-slate-500 font-medium transition-all duration-500">
              {phase === 'capsule' ? 'two-sum.capsule' : 'devcapsules-cli'}
            </span>
          </div>
          <div className="flex gap-1">
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="w-1 h-1 rounded-full bg-slate-700" />
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────── */}
        <div className="relative">
          {/* Terminal phase */}
          <div
            className="px-3.5 sm:px-5 py-3 sm:py-5 font-mono text-[11.5px] sm:text-[13px] leading-relaxed min-h-[220px] sm:min-h-[280px] transition-all duration-500"
            style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', 'Consolas', monospace",
              opacity: phase === 'terminal' ? 1 : phase === 'morphing' ? 0 : 0,
              transform: phase === 'terminal' ? 'translateY(0)' : 'translateY(-8px)',
              position: phase === 'capsule' ? 'absolute' : 'relative',
              pointerEvents: phase === 'capsule' ? 'none' : 'auto',
              inset: 0,
            }}
          >
            <div className="space-y-2">
              {lines.map((f, i) => renderLine(f, i))}
            </div>

            {isTyping && (
              <div className="flex items-start gap-2 mt-2">
                <span className="text-[#00ff87] select-none flex-shrink-0 font-semibold">$</span>
                <span className="text-slate-200">
                  {typedCmd}
                  <span className="inline-block w-[7px] h-[15px] ml-[1px] align-middle"
                    style={{
                      background: cursorVisible ? '#00ff87' : 'transparent',
                      boxShadow: cursorVisible ? '0 0 5px rgba(0,255,135,0.5)' : 'none',
                      transition: 'background 0.1s, box-shadow 0.1s',
                    }} />
                </span>
              </div>
            )}

            {!isTyping && lines.length === 0 && (
              <div className="flex items-start gap-2">
                <span className="text-[#00ff87] select-none flex-shrink-0 font-semibold">$</span>
                <span className="inline-block w-[7px] h-[15px] ml-[1px] align-middle"
                  style={{
                    background: cursorVisible ? '#00ff87' : 'transparent',
                    boxShadow: cursorVisible ? '0 0 5px rgba(0,255,135,0.5)' : 'none',
                    transition: 'background 0.1s, box-shadow 0.1s',
                  }} />
              </div>
            )}
          </div>

          {/* Capsule card phase */}
          <div
            className="px-3.5 sm:px-5 py-3 sm:py-5 min-h-[220px] sm:min-h-[280px] transition-all duration-500"
            style={{
              opacity: phase === 'capsule' ? 1 : 0,
              transform: phase === 'capsule' ? 'translateY(0)' : 'translateY(8px)',
              position: phase !== 'capsule' ? 'absolute' : 'relative',
              pointerEvents: phase !== 'capsule' ? 'none' : 'auto',
              inset: phase !== 'capsule' ? 0 : undefined,
            }}
          >
            {phase === 'capsule' && renderCapsuleCard()}
          </div>

          {/* Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)' }} />
        </div>

        {/* ── Status bar ─────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse" style={{ boxShadow: '0 0 6px #00ff87' }} />
          <span className="font-mono text-[10px]" style={{ color: '#00ff87' }}>
            {phase === 'capsule' ? 'capsule live' : 'execution environment ready'}
          </span>
          <span className="ml-auto font-mono text-[10px] text-slate-600">v2.0.0</span>
        </div>
      </div>
    </div>
  );
}

/* ── Python syntax highlighting (minimal) ──────────────────────────── */
function highlightPython(line: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  const keywords = /\b(def|for|in|if|return|import|from|class|while|else|elif|and|or|not|True|False|None)\b/g;
  const strings = /(["'])(?:(?=(\\?))\2.)*?\1/g;
  const funcs = /\b([a-zA-Z_]\w*)\s*(?=\()/g;
  const comments = /#.*/g;

  // Simple token-based approach
  let remaining = line;
  let idx = 0;

  // Handle leading whitespace
  const leadingSpaces = remaining.match(/^(\s*)/);
  if (leadingSpaces && leadingSpaces[1]) {
    tokens.push(<span key={`ws-${idx}`}>{leadingSpaces[1]}</span>);
    remaining = remaining.slice(leadingSpaces[1].length);
    idx++;
  }

  // Split by meaningful tokens
  const parts = remaining.split(/(\b(?:def|for|in|if|return|import|from|class|while|else|elif|and|or|not|True|False|None)\b|["'][^"']*["']|#.*|\b\w+\s*(?=\()|\{|\}|\[|\]|:)/g);

  parts.forEach((part, i) => {
    if (!part) return;
    if (keywords.test(part)) {
      keywords.lastIndex = 0;
      tokens.push(<span key={`kw-${idx}-${i}`} style={{ color: '#c792ea' }}>{part}</span>);
    } else if (/^["']/.test(part)) {
      tokens.push(<span key={`str-${idx}-${i}`} style={{ color: '#c3e88d' }}>{part}</span>);
    } else if (/^#/.test(part)) {
      tokens.push(<span key={`cmt-${idx}-${i}`} style={{ color: '#546e7a' }}>{part}</span>);
    } else if (funcs.test(part)) {
      funcs.lastIndex = 0;
      tokens.push(<span key={`fn-${idx}-${i}`} style={{ color: '#82aaff' }}>{part}</span>);
    } else if (/^[\{\}\[\]:]$/.test(part)) {
      tokens.push(<span key={`br-${idx}-${i}`} style={{ color: '#89ddff' }}>{part}</span>);
    } else {
      tokens.push(<span key={`txt-${idx}-${i}`} className="text-slate-300">{part}</span>);
    }
  });

  return tokens;
}
