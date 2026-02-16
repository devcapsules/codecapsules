import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Sparkles, Code2, Zap, LayoutTemplate } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCodeGeneration } from '../hooks/useCodeGeneration';
import { useAPI } from '../contexts/APIContext';

interface CreateCapsuleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LANGUAGES = [
  { id: 'python', name: 'Python', icon: '🐍', color: 'bg-blue-500/10 text-blue-400 border-blue-500/50' },
  { id: 'javascript', name: 'JavaScript', icon: '⚡', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50' },
  { id: 'java', name: 'Java', icon: '☕', color: 'bg-orange-500/10 text-orange-400 border-orange-500/50' },
  { id: 'csharp', name: 'C#', icon: '#️⃣', color: 'bg-purple-500/10 text-purple-400 border-purple-500/50' },
  { id: 'go', name: 'Go', icon: '🔷', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50' },
  { id: 'sql', name: 'SQL', icon: '🗄️', color: 'bg-green-500/10 text-green-400 border-green-500/50' },
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

export default function CreateCapsuleModal({ isOpen, onClose }: CreateCapsuleModalProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedLang, setSelectedLang] = useState('python');
  const [difficulty, setDifficulty] = useState('Medium');
  const [mode, setMode] = useState<'prompt' | 'template'>('prompt');
  const [localError, setLocalError] = useState<string>('');
  
  const { generateAndExecute, isCombinedProcessing, combinedError: generationError, clearErrors, currentStep } = useCodeGeneration();
  const { isConnected } = useAPI();

  console.log('🔍 Modal Debug - isCombinedProcessing:', isCombinedProcessing, 'isConnected:', isConnected);

  const handleGenerate = async () => {
    console.log('🔄 Generate button clicked!');
    console.log('Prompt:', prompt);
    console.log('Language:', selectedLang);
    console.log('Difficulty:', difficulty);
    console.log('Is connected:', isConnected);
    
    if (!prompt.trim()) {
      setLocalError('Please describe what you want to create');
      console.log('❌ No prompt provided');
      return;
    }

    clearErrors();
    setLocalError('');
    
    try {
      console.log('🚀 Starting generation...');
      
      const result = await generateAndExecute({
        prompt: prompt,
        language: selectedLang.toLowerCase() as any,
        difficulty: difficulty.toLowerCase() as any,
      });
      
      console.log('📦 Generation result:', result);
      
      if (result?.success && result.capsule) {
        console.log('✅ Capsule generated successfully!', result);
        
        // Navigate using the same approach as old version
        const capsuleData = result.capsule;
        
        // Detect if this is a SQL/DATABASE capsule
        const isSQL = (capsuleData?.language || '').toLowerCase() === 'sql' || (capsuleData?.type || '').toLowerCase() === 'sql' || (capsuleData?.type || '').toLowerCase() === 'database';
        const database = capsuleData?.content?.primary?.database || {};
        const code = capsuleData?.content?.primary?.code?.wasmVersion || {};
        
        // Store capsule data in localStorage to avoid URL length limits (HTTP 431 error)
        const customCapsuleData = {
          title: capsuleData?.title || 'Generated Code Challenge',
          description: capsuleData?.description || prompt,
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
          // Pass the complete content structure for the editor to use
          content: capsuleData?.content,
          type: capsuleData?.type
        };
        
        console.log('💾 Storing capsule in localStorage, size:', JSON.stringify(customCapsuleData).length, 'bytes');
        
        // Store in localStorage with timestamp to avoid conflicts
        const storageKey = `generated_capsule_${Date.now()}`;
        localStorage.setItem(storageKey, JSON.stringify(customCapsuleData));
        
        onClose();
        // Navigate with just the storage key instead of huge URL params (same as old version)
        window.location.href = `/editor?generated=true&key=${storageKey}`;
      } else {
        const errorMsg = result?.error || generationError || 'Generation failed. Please try again.';
        console.log('❌ Generation failed:', errorMsg);
        setLocalError(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      console.error('💥 Generation error:', error);
      setLocalError(errorMsg);
    }
  };

  const combinedError = localError || generationError;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        />
        
        {/* Modal Content */}
        <div className="relative transform overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl transition-all w-full max-w-2xl">
          
          {/* Header with Mode Toggle */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800/50 bg-slate-900/50">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Create New Capsule
            </h2>
            
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">

            {/* The "Magic" Input Area */}
            <div className="relative group">
              <div className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 group-focus-within:opacity-100 transition duration-500 blur-sm`}></div>
              <div className="relative bg-slate-900 rounded-xl p-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your lesson... e.g. 'Create a Python function to validate email addresses using Regex. Include 3 failing test cases.'"
                  className="w-full h-32 bg-transparent text-white placeholder-slate-500 resize-none focus:outline-none text-lg leading-relaxed"
                />
                
                {/* Quick Prompts (Inspiration) */}
                {prompt.length === 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs text-slate-500 w-full mb-1">Try asking for:</span>
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPrompt(p)}
                        className="px-2 py-1 text-xs rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* The Control Row (Language & Difficulty) */}
            <div className="grid grid-cols-2 gap-6">
              
              {/* Language Selector (Visual Tiles) */}
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
                          : 'border-slate-800 bg-slate-900/50 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-lg">{lang.icon}</span>
                      <span className="text-[10px] font-medium">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Selector (Simple Segmented) */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Difficulty</label>
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 h-[58px] items-center">
                  {DIFFICULTIES.map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`flex-1 py-2 text-xs font-medium rounded-md transition-all h-full ${
                        difficulty === diff
                          ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                          : 'text-slate-500 hover:text-white'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Display */}
            {combinedError && (
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

            {/* The Action Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={isCombinedProcessing || !isConnected || !prompt.trim()}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white font-semibold shadow-lg shadow-blue-900/20 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCombinedProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span className="truncate max-w-[280px]">{currentStep || 'Starting generation...'}</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-white group-hover:text-yellow-300 transition-colors" />
                  <span>Generate Capsule</span>
                  <span className="text-blue-200 text-sm font-normal ml-1">
                    (~30s)
                  </span>
                </>
              )}
            </motion.button>

          </div>
        </div>
      </div>
    </div>
  );
}