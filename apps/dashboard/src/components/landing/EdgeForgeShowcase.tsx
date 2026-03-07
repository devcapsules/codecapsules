import React, { useState, useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════════
   EdGE Forge Showcase — "Behind the Scenes" 3-Agent Pipeline Animation
   
   Left: Prompt input area
   Right: Animated 3-agent pipeline (Pedagogist → Coder → Debugger)
   ═══════════════════════════════════════════════════════════════════════════════ */

const DEMO_PROMPTS = [
  'Generate a lab on JWT Authentication with a hidden security vulnerability.',
  'Create a Python challenge on binary search with edge cases.',
  'Build a SQL injection prevention exercise for beginners.',
];

interface AgentStep {
  icon: string;
  agent: string;
  action: string;
  detail: string;
  color: string;
  duration: number; // ms to simulate
}

/* SVG icon components for the pipeline agents */
const PedagogistIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);
const CoderIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
);
const DebuggerIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/>
  </svg>
);

const PIPELINE_STEPS: AgentStep[] = [
  {
    icon: 'pedagogist',
    agent: 'Pedagogist Agent',
    action: 'Designing lesson structure...',
    detail: 'Crafting problem statement, difficulty calibration, learning objectives, and starter code scaffold.',
    color: '#818cf8',
    duration: 1800,
  },
  {
    icon: 'coder',
    agent: 'Coder Agent',
    action: 'Writing reference solution...',
    detail: 'Generating idiomatic, production-quality code with proper error handling and edge case coverage.',
    color: '#60a5fa',
    duration: 1400,
  },
  {
    icon: 'debugger',
    agent: 'Debugger Agent',
    action: 'Building the Golden 5 test cases...',
    detail: '5 robust test cases: happy path, edge cases, type validation, boundary conditions, anti-hardcoding.',
    color: '#00ff87',
    duration: 1200,
  },
];

const agentIcons: Record<string, React.ReactNode> = {
  pedagogist: <PedagogistIcon />,
  coder: <CoderIcon />,
  debugger: <DebuggerIcon />,
};

const GENERATED_RESULT = {
  title: 'JWT Token Validation Flaw',
  difficulty: 'Hard',
  language: 'Python',
  tests: 5,
  lines: 42,
};

export function EdgeForgeShowcase() {
  const [phase, setPhase] = useState<'idle' | 'typing' | 'pipeline' | 'done'>('idle');
  const [typedText, setTypedText] = useState('');
  const [activeAgent, setActiveAgent] = useState(-1);
  const [completedAgents, setCompletedAgents] = useState<number[]>([]);
  const [agentProgress, setAgentProgress] = useState(0);
  const [totalTime, setTotalTime] = useState('0.0');
  const [hasInteracted, setHasInteracted] = useState(false);
  const promptRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const startTimeRef = useRef(0);

  const DEMO_PROMPT = DEMO_PROMPTS[0];

  const startDemo = () => {
    if (phase === 'typing' || phase === 'pipeline') return;
    setPhase('typing');
    setTypedText('');
    setActiveAgent(-1);
    setCompletedAgents([]);
    setAgentProgress(0);
    setTotalTime('0.0');
    setHasInteracted(true);

    // Type out the prompt character by character
    let i = 0;
    const typeInterval = setInterval(() => {
      if (i < DEMO_PROMPT.length) {
        setTypedText(DEMO_PROMPT.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typeInterval);
        // Start pipeline after typing finishes
        setTimeout(() => startPipeline(), 600);
      }
    }, 28);
  };

  const startPipeline = () => {
    setPhase('pipeline');
    startTimeRef.current = Date.now();

    // Start the timer
    timerRef.current = setInterval(() => {
      const elapsed = ((Date.now() - startTimeRef.current) / 1000).toFixed(1);
      setTotalTime(elapsed);
    }, 100);

    // Run agents sequentially
    let delay = 0;
    PIPELINE_STEPS.forEach((step, index) => {
      setTimeout(() => {
        setActiveAgent(index);
        setAgentProgress(0);
        
        // Animate progress for this agent
        let prog = 0;
        const progressInterval = setInterval(() => {
          prog += (100 / (step.duration / 60));
          if (prog >= 100) {
            prog = 100;
            clearInterval(progressInterval);
            setCompletedAgents(prev => [...prev, index]);
            
            // If last agent, finish
            if (index === PIPELINE_STEPS.length - 1) {
              setTimeout(() => {
                if (timerRef.current) clearInterval(timerRef.current);
                const finalTime = ((Date.now() - startTimeRef.current) / 1000).toFixed(1);
                setTotalTime(finalTime);
                setPhase('done');
              }, 300);
            }
          }
          setAgentProgress(Math.min(100, Math.round(prog)));
        }, 60);
      }, delay);
      delay += step.duration + 200;
    });
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <section id="edge-forge" className="relative py-16 lg:py-24 overflow-hidden" style={{
      background: '#04040a',
      borderTop: '1px solid rgba(255,255,255,0.03)',
    }}>
      {/* Background orbs */}
      <div className="absolute top-[20%] left-[-5%] w-[500px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)', filter: 'blur(100px)' }} />
      <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[350px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,255,135,0.05) 0%, transparent 70%)', filter: 'blur(90px)' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-5"
            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.937 15.5A2 2 0 008.5 14.063l-6.135-1.582a.5.5 0 010-.962L8.5 9.937A2 2 0 009.937 8.5l1.582-6.135a.5.5 0 01.963 0L14.063 8.5A2 2 0 0015.5 9.937l6.135 1.581a.5.5 0 010 .964L15.5 14.063a2 2 0 00-1.437 1.437l-1.582 6.135a.5.5 0 01-.963 0z" />
            </svg>
            EdGE Forge Pipeline
          </span>
          <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white mb-4" style={{ letterSpacing: '-0.03em' }}>
            Generate Production-Ready Curriculum{' '}
            <span style={{
              background: 'linear-gradient(90deg, #a78bfa 0%, #818cf8 30%, #60a5fa 60%, #00ff87 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmerText 4s linear infinite',
            }}>Instantly.</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Never write boilerplate, test cases, or grading logic from scratch again. Give EdGE Forge a topic, and our
            proprietary 3-agent pipeline generates an embeddable, interactive coding capsule with perfect test coverage in seconds.
          </p>
        </div>

        {/* ═══ SIDE-BY-SIDE DEMO ═══ */}
        <div className="max-w-[1000px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── LEFT: The Prompt ── */}
          <div className="rounded-2xl overflow-hidden" style={{
            border: '1px solid rgba(139,92,246,0.2)',
            background: 'rgba(10,10,20,0.8)',
            backdropFilter: 'blur(12px)',
          }}>
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-2.5" style={{
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(239,68,68,0.6)' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(234,179,8,0.6)' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(34,197,94,0.5)' }} />
              </div>
              <span className="ml-2 text-xs text-slate-500 font-mono">Creator Dashboard</span>
              <span className="ml-auto text-[0.65rem] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
                EdGE Forge
              </span>
            </div>

            {/* Prompt area */}
            <div className="p-5">
              <label className="block text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Describe your challenge
              </label>
              <div ref={promptRef} className="rounded-xl p-4 min-h-[100px] font-mono text-[0.82rem] leading-relaxed relative"
                style={{
                  background: '#06060c',
                  border: '1px solid rgba(139,92,246,0.15)',
                  color: '#e2e8f0',
                }}>
                {typedText || (
                  <span className="text-slate-600 italic">
                    &quot;Generate a lab on JWT Authentication with a hidden security vulnerability.&quot;
                  </span>
                )}
                {(phase === 'typing') && (
                  <span className="inline-block w-[2px] h-[14px] ml-[1px] align-middle"
                    style={{ background: '#a78bfa', animation: 'cursorBlink 1.2s step-end infinite' }} />
                )}
              </div>

              {/* Settings chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1 text-[0.68rem] font-semibold px-2.5 py-1 rounded-lg"
                  style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                  Python
                </span>
                <span className="inline-flex items-center gap-1 text-[0.68rem] font-semibold px-2.5 py-1 rounded-lg"
                  style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.15)', color: '#fbbf24' }}>
                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Hard
                </span>
                <span className="inline-flex items-center gap-1 text-[0.68rem] font-semibold px-2.5 py-1 rounded-lg"
                  style={{ background: 'rgba(0,255,135,0.06)', border: '1px solid rgba(0,255,135,0.12)', color: '#00ff87' }}>
                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                  5 Test Cases
                </span>
              </div>

              {/* Generate button */}
              <button
                onClick={startDemo}
                disabled={phase === 'typing' || phase === 'pipeline'}
                className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-extrabold transition-all"
                style={{
                  background: (phase === 'typing' || phase === 'pipeline')
                    ? 'rgba(139,92,246,0.15)'
                    : 'linear-gradient(135deg, #a78bfa, #818cf8)',
                  color: (phase === 'typing' || phase === 'pipeline') ? '#a78bfa' : '#fff',
                  boxShadow: (phase === 'typing' || phase === 'pipeline') ? 'none' : '0 0 24px rgba(139,92,246,0.3)',
                  cursor: (phase === 'typing' || phase === 'pipeline') ? 'not-allowed' : 'pointer',
                }}
              >
                {(phase === 'typing' || phase === 'pipeline') ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                    </svg>
                    Generating...
                  </>
                ) : phase === 'done' ? (
                  <>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Run Again
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.937 15.5A2 2 0 008.5 14.063l-6.135-1.582a.5.5 0 010-.962L8.5 9.937A2 2 0 009.937 8.5l1.582-6.135a.5.5 0 01.963 0L14.063 8.5A2 2 0 0015.5 9.937l6.135 1.581a.5.5 0 010 .964L15.5 14.063a2 2 0 00-1.437 1.437l-1.582 6.135a.5.5 0 01-.963 0z" />
                    </svg>
                    Generate with EdGE Forge
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── RIGHT: Pipeline Animation ── */}
          <div className="rounded-2xl overflow-hidden" style={{
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(10,10,20,0.8)',
            backdropFilter: 'blur(12px)',
          }}>
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-2.5" style={{
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <span className="text-xs text-slate-500 font-mono">Pipeline Status</span>
              {(phase === 'pipeline' || phase === 'done') && (
                <span className="ml-auto text-[0.7rem] font-bold font-mono" style={{
                  color: phase === 'done' ? '#00ff87' : '#fbbf24',
                }}>
                  {phase === 'done' ? `✓ ${totalTime}s` : `${totalTime}s`}
                </span>
              )}
            </div>

            {/* Pipeline steps */}
            <div className="p-5 space-y-4">
              {PIPELINE_STEPS.map((step, index) => {
                const isActive = activeAgent === index;
                const isCompleted = completedAgents.includes(index);
                const isWaiting = activeAgent < index && !isCompleted;

                return (
                  <div key={index} className="relative" style={{
                    opacity: isWaiting ? 0.35 : 1,
                    transition: 'opacity 0.4s ease',
                  }}>
                    {/* Connector line */}
                    {index < PIPELINE_STEPS.length - 1 && (
                      <div className="absolute left-[18px] top-[42px] w-[2px] h-[calc(100%+4px)]" style={{
                        background: isCompleted ? step.color : 'rgba(255,255,255,0.06)',
                        transition: 'background 0.4s ease',
                        boxShadow: isCompleted ? `0 0 6px ${step.color}40` : 'none',
                      }} />
                    )}

                    <div className="flex items-start gap-3">
                      {/* Step icon */}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base relative"
                        style={{
                          background: isCompleted
                            ? `${step.color}20`
                            : isActive ? `${step.color}15` : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isCompleted || isActive ? step.color + '40' : 'rgba(255,255,255,0.06)'}`,
                          boxShadow: isActive ? `0 0 16px ${step.color}30` : 'none',
                          transition: 'all 0.4s ease',
                        }}>
                        {isCompleted ? (
                          <svg width="16" height="16" fill="none" stroke={step.color} strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span style={{ color: step.color }}>{agentIcons[step.icon]}</span>
                        )}
                        {isActive && !isCompleted && (
                          <div className="absolute inset-0 rounded-xl" style={{
                            border: `1px solid ${step.color}`,
                            animation: 'agentPulse 1.5s ease-in-out infinite',
                          }} />
                        )}
                      </div>

                      {/* Step content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[0.78rem] font-bold" style={{
                            color: isCompleted || isActive ? step.color : '#475569',
                            transition: 'color 0.3s ease',
                          }}>
                            {step.agent}
                          </span>
                          {isCompleted && (
                            <span className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded" style={{
                              background: `${step.color}15`, color: step.color,
                            }}>DONE</span>
                          )}
                          {isActive && !isCompleted && (
                            <span className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded" style={{
                              background: `${step.color}15`, color: step.color,
                              animation: 'edgePulseDot 2s ease-in-out infinite'
                            }}>ACTIVE</span>
                          )}
                        </div>
                        <p className="text-[0.7rem] mt-0.5" style={{
                          color: isActive ? '#94a3b8' : '#334155',
                          transition: 'color 0.3s ease',
                        }}>
                          {isActive && !isCompleted ? step.action : step.detail}
                        </p>

                        {/* Progress bar for active agent */}
                        {isActive && !isCompleted && (
                          <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <div className="h-full rounded-full" style={{
                              width: `${agentProgress}%`,
                              background: `linear-gradient(90deg, ${step.color}, ${step.color}80)`,
                              boxShadow: `0 0 8px ${step.color}60`,
                              transition: 'width 0.08s linear',
                            }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* ── RESULT CARD ── */}
              {phase === 'done' && (
                <div className="mt-4 rounded-xl p-4" style={{
                  background: 'rgba(0,255,135,0.04)',
                  border: '1px solid rgba(0,255,135,0.15)',
                  animation: 'forgeDoneSlide 0.5s ease forwards',
                }}>
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="14" height="14" fill="none" stroke="#00ff87" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.937 15.5A2 2 0 008.5 14.063l-6.135-1.582a.5.5 0 010-.962L8.5 9.937A2 2 0 009.937 8.5l1.582-6.135a.5.5 0 01.963 0L14.063 8.5A2 2 0 0015.5 9.937l6.135 1.581a.5.5 0 010 .964L15.5 14.063a2 2 0 00-1.437 1.437l-1.582 6.135a.5.5 0 01-.963 0z"/></svg>
                    <span className="text-[0.78rem] font-black text-white">Capsule Ready</span>
                    <span className="ml-auto text-[0.68rem] font-bold font-mono" style={{ color: '#00ff87' }}>
                      {totalTime}s
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="text-[0.65rem] text-slate-600 mb-0.5">Title</div>
                      <div className="text-[0.72rem] font-bold text-white">{GENERATED_RESULT.title}</div>
                    </div>
                    <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="text-[0.65rem] text-slate-600 mb-0.5">Difficulty</div>
                      <div className="text-[0.72rem] font-bold" style={{ color: '#ef4444' }}>{GENERATED_RESULT.difficulty}</div>
                    </div>
                    <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="text-[0.65rem] text-slate-600 mb-0.5">Test Cases</div>
                      <div className="text-[0.72rem] font-bold" style={{ color: '#00ff87' }}>{GENERATED_RESULT.tests} robust tests</div>
                    </div>
                    <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="text-[0.65rem] text-slate-600 mb-0.5">Code</div>
                      <div className="text-[0.72rem] font-bold text-white">{GENERATED_RESULT.lines} lines</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 py-2 rounded-lg text-[0.72rem] font-bold transition-all hover:scale-[1.01]"
                      style={{
                        background: 'linear-gradient(135deg, #00ff87, #00b894)',
                        color: '#04040a',
                        boxShadow: '0 0 16px rgba(0,255,135,0.2)',
                      }}>
                      Publish &amp; Embed
                    </button>
                    <button className="flex-1 py-2 rounded-lg text-[0.72rem] font-semibold"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#94a3b8',
                      }}>
                      Edit in Dashboard
                    </button>
                  </div>
                </div>
              )}

              {/* Idle state */}
              {phase === 'idle' && !hasInteracted && (
                <div className="text-center py-8">
                  <div className="text-slate-600 text-[0.8rem]">
                    Click <strong className="text-slate-400">&quot;Generate with EdGE Forge&quot;</strong> to see the pipeline
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── STATS BAR ── */}
        <div className="max-w-[1000px] mx-auto mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Avg Generation Time', value: '4.2s', icon: <svg width="18" height="18" fill="none" stroke="#fbbf24" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
            { label: 'Test Coverage', value: '100%', icon: <svg width="18" height="18" fill="none" stroke="#00ff87" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4"/></svg> },
            { label: 'Languages Supported', value: '6+', icon: <svg width="18" height="18" fill="none" stroke="#60a5fa" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> },
            { label: 'Capsules Generated', value: '200+', icon: <svg width="18" height="18" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.937 15.5A2 2 0 008.5 14.063l-6.135-1.582a.5.5 0 010-.962L8.5 9.937A2 2 0 009.937 8.5l1.582-6.135a.5.5 0 01.963 0L14.063 8.5A2 2 0 0015.5 9.937l6.135 1.581a.5.5 0 010 .964L15.5 14.063a2 2 0 00-1.437 1.437l-1.582 6.135a.5.5 0 01-.963 0z"/></svg> },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl py-3 px-4 text-center" style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div className="flex justify-center mb-1">{stat.icon}</div>
              <div className="text-sm font-black text-white">{stat.value}</div>
              <div className="text-[0.65rem] text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Inline keyframe styles */}
      <style>{`
        @keyframes cursorBlink { 0%, 50% { opacity: 1 } 51%, 100% { opacity: 0 } }
        @keyframes agentPulse { 0%, 100% { opacity: 1; transform: scale(1) } 50% { opacity: 0.4; transform: scale(1.08) } }
        @keyframes edgePulseDot { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
        @keyframes forgeDoneSlide {
          from { opacity: 0; transform: translateY(10px) }
          to { opacity: 1; transform: translateY(0) }
        }
      `}</style>
    </section>
  );
}
