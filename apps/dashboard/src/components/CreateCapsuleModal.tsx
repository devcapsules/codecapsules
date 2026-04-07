import React, { useState, useEffect, useRef, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Code2, Zap, LayoutTemplate } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCodeGeneration } from '../hooks/useCodeGeneration';
import { useAPI } from '../contexts/APIContext';
import { useAnimation } from '../context/AnimationContext';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_WORKERS_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

interface CreateCapsuleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LANGUAGES = [
  { id: 'python', name: 'Python', icon: 'PY', color: 'bg-blue-500/10 text-blue-400 border-blue-500/50' },
  { id: 'javascript', name: 'JavaScript', icon: 'JS', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50' },
  { id: 'java', name: 'Java', icon: 'JV', color: 'bg-orange-500/10 text-orange-400 border-orange-500/50' },
  { id: 'csharp', name: 'C#', icon: 'C#', color: 'bg-purple-500/10 text-purple-400 border-purple-500/50' },
  { id: 'go', name: 'Go', icon: 'GO', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50' },
  { id: 'sql', name: 'SQL', icon: 'DB', color: 'bg-green-500/10 text-green-400 border-green-500/50' },
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const QUICK_PROMPTS = [
  "Reverse a string algorithm",
  "React Counter Component", 
  "REST API with Fetch",
  "SQL Join Query",
  "Binary Search Tree",
  "Password Validator"
];

// ── Generation pipeline steps (matched to animation spec) ──
const GEN_PIPELINE_STEPS = [
  { icon: '01', label: 'Generating problem statement', runBadge: 'Writing…', doneBadge: 'Done',    progressThreshold: 0  },
  { icon: '02', label: 'Writing reference solution',   runBadge: 'Solving…', doneBadge: 'Done',    progressThreshold: 22 },
  { icon: '03', label: 'Crafting 5 test cases',        runBadge: 'Crafting…', doneBadge: '5 cases', progressThreshold: 48 },
  { icon: '04', label: 'Hardcoding resistance check',  runBadge: 'Checking…', doneBadge: 'Clean', progressThreshold: 72 },
  { icon: '05', label: 'Saving to dashboard',          runBadge: 'Saving…',  doneBadge: 'Saved', progressThreshold: 90 },
];

export default function CreateCapsuleModal({ isOpen, onClose }: CreateCapsuleModalProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedLang, setSelectedLang] = useState('python');
  const [difficulty, setDifficulty] = useState('Medium');
  const [capsuleMode, setCapsuleMode] = useState<'standard' | 'supervision' | 'debug' | 'security'>('standard');
  const [mode, setMode] = useState<'prompt' | 'template'>('prompt');
  const [localError, setLocalError] = useState<string>('');
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [generationsRemaining, setGenerationsRemaining] = useState<number | null>(null);
  const [generationsLimit, setGenerationsLimit] = useState<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const { generateAndExecute, isCombinedProcessing, combinedError: generationError, clearErrors, currentStep, progress } = useCodeGeneration();
  const { isConnected } = useAPI();
  const { toast } = useAnimation();
  const { session } = useAuth();

  // Fetch quota info when modal opens
  const fetchQuota = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/payments/subscription`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const gen = json.data?.quotas?.generations;
          if (gen) {
            setGenerationsRemaining(gen.remaining);
            setGenerationsLimit(gen.limit);
            setQuotaExceeded(gen.remaining <= 0);
          }
        }
      }
    } catch {}
  }, [session?.access_token]);

  useEffect(() => {
    if (isOpen) {
      fetchQuota();
      setQuotaExceeded(false);
      setLocalError('');
    }
  }, [isOpen, fetchQuota]);

  // Track elapsed time during generation
  useEffect(() => {
    if (isCombinedProcessing) {
      startTimeRef.current = Date.now();
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((Date.now() - startTimeRef.current) / 1000);
      }, 100);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isCombinedProcessing]);

  // Derive step states from progress
  const getStepState = (stepIndex: number): 'pending' | 'running' | 'done' => {
    if (!isCombinedProcessing) return 'pending';
    const step = GEN_PIPELINE_STEPS[stepIndex];
    const nextStep = GEN_PIPELINE_STEPS[stepIndex + 1];
    if (nextStep && progress >= nextStep.progressThreshold) return 'done';
    if (progress >= step.progressThreshold) return 'running';
    return 'pending';
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setLocalError('Please describe what you want to create');
      return;
    }

    clearErrors();
    setLocalError('');
    
    try {
      const result = await generateAndExecute({
        prompt: prompt,
        language: selectedLang.toLowerCase() as any,
        difficulty: difficulty.toLowerCase() as any,
        capsuleMode: capsuleMode,
      });
      
      if (result?.success && result.capsule) {
        const capsuleData = result.capsule;
        const isSQL = (capsuleData?.language || '').toLowerCase() === 'sql' || (capsuleData?.type || '').toLowerCase() === 'sql' || (capsuleData?.type || '').toLowerCase() === 'database';
        const database = capsuleData?.content?.primary?.database || {};
        const code = capsuleData?.content?.primary?.code?.wasmVersion || {};
        
        const customCapsuleData = {
          title: capsuleData?.title || 'Generated Code Challenge',
          description: capsuleData?.description || prompt,
          context: capsuleData?.context || '',
          task: capsuleData?.task || '',
          insight: capsuleData?.insight || '',
          realWorldUsage: capsuleData?.realWorldUsage || '',
          problemStatement: capsuleData?.content?.primary?.problemStatement || capsuleData?.description || prompt,
          starterCode: isSQL ? (database.starterQuery || '') : (code.starterCode || ''),
          solution: isSQL ? (database.solution || '') : (code.solution || ''),
          testCases: isSQL ? (database.testCases || []) : (code.testCases || []),
          hints: capsuleData?.pedagogy?.hints?.sequence || [],
          learningObjectives: capsuleData?.pedagogy?.learningObjectives || [],
          concepts: capsuleData?.pedagogy?.concepts || [],
          language: selectedLang,
          difficulty: difficulty.toLowerCase(),
          executionOutput: '',
          executionSuccess: true,
          content: capsuleData?.content,
          type: capsuleData?.type
        };
        
        const storageKey = `generated_capsule_${Date.now()}`;
        localStorage.setItem(storageKey, JSON.stringify(customCapsuleData));
        
        onClose();
        toast('ai', 'Capsule Generated!', `"${customCapsuleData.title}" is ready — opening editor.`);
        window.location.href = `/editor?generated=true&key=${storageKey}`;
      } else {
        const errorMsg = result?.error || generationError || 'Generation failed. Please try again.';
        if (errorMsg.includes('limit reached') || errorMsg.includes('QUOTA_EXCEEDED') || errorMsg.includes('limit exceeded')) {
          setQuotaExceeded(true);
          setGenerationsRemaining(0);
        }
        setLocalError(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      if (errorMsg.includes('limit reached') || errorMsg.includes('QUOTA_EXCEEDED') || errorMsg.includes('limit exceeded') || errorMsg.includes('429')) {
        setQuotaExceeded(true);
        setGenerationsRemaining(0);
      }
      console.error('Generation error:', error);
      setLocalError(errorMsg);
    }
  };

  const combinedError = localError || generationError;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity" 
          style={{ background: 'rgba(4,4,10,0.88)', backdropFilter: 'blur(8px)' }} 
          onClick={!isCombinedProcessing ? onClose : undefined}
        />
        
        <div className="relative transform overflow-hidden rounded-2xl shadow-2xl transition-all w-full max-w-2xl" style={{ background: '#04040a', border: '1px solid rgba(255,255,255,0.07)' }}>
          
          <AnimatePresence mode="wait">
            {isCombinedProcessing ? (
              /* ═══════ GENERATION PROGRESS VIEW ═══════ */
              <motion.div
                key="progress"
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="p-8"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-7">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.12))',
                      border: '1px solid rgba(139,92,246,0.3)',
                      animation: 'pulse 2s ease-in-out infinite',
                    }}>
                    <Zap className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-base font-extrabold text-white">EdGE Forge</div>
                    <div className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: '#64748b' }}>
                      <span className="flex gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                      <span>{currentStep || 'Initializing…'}</span>
                    </div>
                  </div>
                </div>

                {/* Pipeline Steps */}
                <div className="flex flex-col gap-2.5 mb-7">
                  {GEN_PIPELINE_STEPS.map((step, i) => {
                    const state = getStepState(i);
                    return (
                      <motion.div
                        key={i}
                        initial={state === 'running' ? { x: -8, opacity: 0 } : false}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition-all duration-300"
                        style={{
                          border: '1px solid transparent',
                          ...(state === 'running' ? {
                            background: 'rgba(139,92,246,0.06)',
                            borderColor: 'rgba(139,92,246,0.2)',
                          } : state === 'done' ? {
                            background: 'rgba(0,255,135,0.04)',
                            borderColor: 'rgba(0,255,135,0.12)',
                          } : {}),
                        }}
                      >
                        {/* Step Icon */}
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs transition-all duration-300"
                          style={{
                            background: state === 'done' ? 'rgba(0,255,135,0.12)'
                              : state === 'running' ? 'rgba(139,92,246,0.15)'
                              : 'rgba(255,255,255,0.04)',
                          }}>
                          {state === 'running' ? (
                            <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin"
                              style={{ borderColor: 'rgba(139,92,246,0.2)', borderTopColor: '#8b5cf6' }} />
                          ) : state === 'done' ? (
                            <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
                              <path d="M2 6l3 3 5-5" stroke="#00ff87" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <span style={{ color: '#1e293b' }}>{step.icon}</span>
                          )}
                        </div>

                        {/* Step Label */}
                        <span className="flex-1 text-[0.82rem] font-semibold transition-all duration-300"
                          style={{
                            color: state === 'done' ? '#86efac'
                              : state === 'running' ? '#a78bfa'
                              : '#334155',
                          }}>
                          {step.label}
                        </span>

                        {/* Step Badge */}
                        <span className="text-[0.68rem] font-bold font-mono px-2 py-0.5 rounded transition-all duration-300"
                          style={{
                            ...(state === 'done' ? {
                              background: 'rgba(0,255,135,0.08)', color: '#00ff87',
                            } : state === 'running' ? {
                              background: 'rgba(139,92,246,0.12)', color: '#a78bfa',
                            } : {
                              background: 'rgba(255,255,255,0.03)', color: '#1e293b',
                            }),
                          }}>
                          {state === 'done' ? step.doneBadge : state === 'running' ? step.runBadge : 'Pending'}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Progress Bar */}
                <div className="rounded-full h-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                      background: 'linear-gradient(90deg, #8b5cf6, #a78bfa, #00ff87)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s linear infinite',
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-[0.72rem] font-mono" style={{ color: '#334155' }}>
                  <span>{progress}% complete</span>
                  <span>{elapsed.toFixed(1)}s</span>
                </div>

                {/* Injected shimmer keyframes */}
                <style>{`
                  @keyframes shimmer {
                    0% { background-position: 100% 0; }
                    100% { background-position: -100% 0; }
                  }
                `}</style>
              </motion.div>
            ) : (
              /* ═══════ NORMAL FORM VIEW ═══════ */
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  <h2 className="text-lg font-semibold text-white">
                    Create New Capsule
                  </h2>
                  <div className="flex items-center gap-3">
                    {generationsRemaining !== null && (
                      <span
                        className="text-xs font-mono px-2.5 py-1 rounded-full"
                        style={{
                          background: generationsRemaining <= 0
                            ? 'rgba(239,68,68,0.12)'
                            : generationsRemaining <= 2
                            ? 'rgba(245,158,11,0.12)'
                            : 'rgba(0,255,135,0.08)',
                          color: generationsRemaining <= 0
                            ? '#f87171'
                            : generationsRemaining <= 2
                            ? '#fbbf24'
                            : '#00ff87',
                          border: `1px solid ${generationsRemaining <= 0 ? 'rgba(239,68,68,0.25)' : generationsRemaining <= 2 ? 'rgba(245,158,11,0.25)' : 'rgba(0,255,135,0.2)'}`,
                        }}
                      >
                        {generationsRemaining}/{generationsLimit} generations left
                      </span>
                    )}
                    <button
                      onClick={onClose}
                      className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=''}
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Prompt Input */}
                  <div className="relative group">
                    <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-emerald-500/30 to-emerald-600/30 opacity-0 group-focus-within:opacity-100 transition duration-500 blur-sm"></div>
                    <div className="relative rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe your lesson... e.g. 'Create a Python function to validate email addresses using Regex. Include 3 failing test cases.'"
                        className="w-full h-32 bg-transparent text-white placeholder-slate-500 resize-none focus:outline-none text-lg leading-relaxed"
                      />
                      {prompt.length === 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="text-xs text-slate-500 w-full mb-1">Try asking for:</span>
                          {QUICK_PROMPTS.map((p) => (
                            <button
                              key={p}
                              onClick={() => setPrompt(p)}
                              className="px-2 py-1 text-xs rounded-md text-slate-400 hover:text-white border transition-colors"
                              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
                              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color='#fff';}}
                              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'; (e.currentTarget as HTMLElement).style.color='';}}  
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Language & Difficulty */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Language</label>
                      <div className="grid grid-cols-3 gap-2">
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang.id}
                            onClick={() => setSelectedLang(lang.id)}
                            className={`p-2 rounded-lg border transition-all flex flex-col items-center justify-center gap-1 ${
                              selectedLang === lang.id 
                                ? lang.color + ' border-opacity-100 bg-opacity-20' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                            style={selectedLang !== lang.id ? { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' } : undefined}
                          >
                            <span className="text-lg">{lang.icon}</span>
                            <span className="text-[10px] font-medium">{lang.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Difficulty</label>
                        <div className="flex p-1 rounded-lg h-[58px] items-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          {DIFFICULTIES.map((diff) => (
                            <button
                              key={diff}
                              onClick={() => setDifficulty(diff)}
                              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all h-full ${
                                difficulty === diff
                                  ? 'text-white shadow-sm'
                                  : 'text-slate-500 hover:text-white'
                              }`}
                              style={difficulty === diff ? { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' } : undefined}
                            >
                              {diff}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Capsule Mode</label>
                        <select
                          value={capsuleMode}
                          onChange={(e) => setCapsuleMode(e.target.value as typeof capsuleMode)}
                          className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none transition-all"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }}
                        >
                          <option value="standard" style={{ background: '#0a0a14', color: '#e2e8f0' }}>Standard</option>
                          <option value="supervision" style={{ background: '#0a0a14', color: '#e2e8f0' }}>Supervision</option>
                          <option value="debug" style={{ background: '#0a0a14', color: '#e2e8f0' }}>Debug</option>
                          <option value="security" style={{ background: '#0a0a14', color: '#e2e8f0' }}>Security</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Quota Exceeded — Upgrade CTA */}
                  {quotaExceeded && (
                    <div className="rounded-xl p-5 text-center" style={{ background: 'linear-gradient(135deg, rgba(0,255,135,0.06), rgba(0,255,135,0.02))', border: '1px solid rgba(0,255,135,0.15)' }}>
                      <h3 className="text-white font-bold text-base mb-1">Generation Limit Reached</h3>
                      <p className="text-slate-400 text-sm mb-4">
                        You've used all your free AI generations this month. Upgrade to Creator for 50 generations/month.
                      </p>
                      <a
                        href="/account"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-[#04040a] transition-all"
                        style={{ background: 'linear-gradient(135deg, #00ff87, #00c96b)', boxShadow: '0 0 20px rgba(0,255,135,0.3)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px rgba(0,255,135,0.5)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(0,255,135,0.3)'}
                      >
                        <Zap className="w-4 h-4" />
                        Upgrade to Creator — ₹2,499/mo
                      </a>
                    </div>
                  )}

                  {/* Error Display (non-quota errors) */}
                  {combinedError && !quotaExceeded && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-red-400">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Generation Failed</span>
                      </div>
                      <p className="text-sm text-red-300 mt-2">{combinedError}</p>
                    </div>
                  )}

                  {/* Connection Status */}
                  {!isConnected && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                      <p className="text-amber-400 text-sm">API server not connected. Please check your connection.</p>
                    </div>
                  )}

                  {/* Generate Button */}
                  {!quotaExceeded && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGenerate}
                      disabled={isCombinedProcessing || !isConnected || !prompt.trim()}
                      className="w-full py-4 rounded-xl text-[#04040a] font-bold shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(135deg, #00ff87, #00c96b)', boxShadow: '0 0 24px rgba(0,255,135,0.25)' }}
                      onMouseEnter={e=>{ if (!(e.currentTarget as HTMLElement).closest('button')?.disabled) (e.currentTarget as HTMLElement).style.boxShadow='0 0 40px rgba(0,255,135,0.45)'; }}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.boxShadow='0 0 24px rgba(0,255,135,0.25)'}
                    >
                      <Zap className="w-5 h-5 fill-white group-hover:text-yellow-300 transition-colors" />
                      <span>Generate Capsule</span>
                      <span className="text-emerald-200 text-sm font-normal ml-1">(~30s)</span>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}