import React, { useState } from 'react';
import { 
  XMarkIcon, 
  MagnifyingGlassIcon, 
  BookOpenIcon, 
  CommandLineIcon,
  ClockIcon,
  ChartBarIcon,
  CheckCircleIcon,
  SparklesIcon,
  RocketLaunchIcon,
  CodeBracketIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { 
  LightBulbIcon,
  ServerIcon 
} from '@heroicons/react/24/solid';
import { useCodeGeneration } from '../hooks/useCodeGeneration';
import { useAPI } from '../contexts/APIContext';

interface CreateCapsuleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock archetype data
const mockArchetypes = [
  {
    id: 1,
    title: "Array: Two-Value Sum",
    concepts: "Hash Maps, O(n) Lookup",
    difficulty: "Easy",
    language: "Python",
    successRate: "89%",
    avgTime: "3 min"
  },
  {
    id: 2,
    title: "String: Palindrome Check",
    concepts: "Two Pointers, String Manipulation",
    difficulty: "Easy",
    language: "JavaScript",
    successRate: "92%",
    avgTime: "2 min"
  },
  {
    id: 3,
    title: "Tree: Binary Search",
    concepts: "Recursion, Binary Trees",
    difficulty: "Medium",
    language: "Python",
    successRate: "67%",
    avgTime: "5 min"
  },
  {
    id: 4,
    title: "SQL: JOIN Operations",
    concepts: "Relational Queries, Data Joining",
    difficulty: "Medium",
    language: "SQL",
    successRate: "74%",
    avgTime: "4 min"
  },
  {
    id: 5,
    title: "React: Custom Hooks",
    concepts: "State Management, Reusability",
    difficulty: "Hard",
    language: "JavaScript",
    successRate: "45%",
    avgTime: "8 min"
  },
  {
    id: 6,
    title: "Array: Sliding Window",
    concepts: "Dynamic Programming, Optimization",
    difficulty: "Medium",
    language: "Python",
    successRate: "58%",
    avgTime: "6 min"
  }
];

const languages = ["All", "Python", "JavaScript", "SQL", "HTML/CSS"];
const difficulties = ["All", "Easy", "Medium", "Hard"];

function ArchetypeCard({ archetype, onSelect, isSelected }: { archetype: any; onSelect: (archetype: any) => void; isSelected?: boolean }) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Hard': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getLanguageIcon = (language: string) => {
    switch (language) {
      case 'Python': return <CodeBracketIcon className="w-4 h-4 text-blue-400" />;
      case 'JavaScript': return <CodeBracketIcon className="w-4 h-4 text-yellow-400" />;
      case 'SQL': return <CommandLineIcon className="w-4 h-4 text-green-400" />;
      case 'HTML/CSS': return <BookOpenIcon className="w-4 h-4 text-pink-400" />;
      default: return <CodeBracketIcon className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div 
      onClick={() => onSelect(archetype)}
      className={`relative border rounded-xl p-5 cursor-pointer transition-all duration-300 group ${
        isSelected 
          ? 'border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/20' 
          : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30 hover:shadow-lg'
      }`}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1.5 shadow-lg">
          <CheckCircleIcon className="w-4 h-4" />
        </div>
      )}

      {/* Header with badges */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 text-xs font-medium rounded-full border ${getDifficultyColor(archetype.difficulty)}`}>
            {archetype.difficulty}
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/60 text-slate-300 rounded-full text-xs font-medium">
            {getLanguageIcon(archetype.language)}
            <span>{archetype.language}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
          <ChartBarIcon className="w-4 h-4" />
          <span>{archetype.successRate}</span>
        </div>
      </div>
      
      {/* Title */}
      <h3 className={`font-semibold mb-3 text-lg transition-colors ${
        isSelected ? 'text-blue-400' : 'text-white group-hover:text-blue-400'
      }`}>
        {archetype.title}
      </h3>
      
      {/* Concepts */}
      <p className="text-sm text-slate-400 mb-4 leading-relaxed">
        {archetype.concepts}
      </p>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ClockIcon className="w-4 h-4" />
          <span>Avg: {archetype.avgTime}</span>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
          isSelected ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400'
        }`}>
          <RocketLaunchIcon className="w-4 h-4" />
          <span>{isSelected ? 'Selected' : 'Select'}</span>
        </div>
      </div>
    </div>
  );
}

export default function CreateCapsuleModal({ isOpen, onClose }: CreateCapsuleModalProps) {
  const [activeTab, setActiveTab] = useState<'archetype' | 'prompt'>('archetype');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [customPrompt, setCustomPrompt] = useState('');
  const [promptLanguage, setPromptLanguage] = useState<'python' | 'javascript' | 'java' | 'csharp' | 'go' | 'sql'>('python');
  const [runtime, setRuntime] = useState<'wasm' | 'server'>('wasm');
  const [selectedArchetype, setSelectedArchetype] = useState<any>(null);
  const [localError, setLocalError] = useState<string>('');
  
  // API integration
  const { isConnected, health, executionMode } = useAPI();
  const { 
    generateAndExecute, 
    isCombinedProcessing, 
    combinedResult, 
    combinedError,
    clearResults,
    clearErrors
  } = useCodeGeneration();

  const filteredArchetypes = mockArchetypes.filter(archetype => {
    const matchesSearch = archetype.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         archetype.concepts.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLanguage = selectedLanguage === 'All' || archetype.language === selectedLanguage;
    const matchesDifficulty = selectedDifficulty === 'All' || archetype.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesLanguage && matchesDifficulty;
  });

  const handleArchetypeSelect = (archetype: any) => {
    setSelectedArchetype(archetype);
  };

  const handleGenerateFromArchetype = async () => {
    if (!selectedArchetype || !isConnected) return;
    
    // Clear previous results and errors
    clearResults();
    clearErrors();
    setLocalError('');
    
    try {
      // Convert archetype to prompt
      const archetypePrompt = `Create a ${selectedArchetype.difficulty.toLowerCase()} ${selectedArchetype.language.toLowerCase()} coding problem: ${selectedArchetype.title}. Focus on: ${selectedArchetype.concepts}`;
      
      console.log('🚀 Generating capsule from archetype:', selectedArchetype.title);
      
      const result = await generateAndExecute({
        prompt: archetypePrompt,
        language: selectedArchetype.language.toLowerCase() as any,
        difficulty: selectedArchetype.difficulty.toLowerCase() as any,
      });
      
      if (result?.success) {
        console.log('✅ Capsule generated successfully!', result);
        // Navigate to editor with the generated code
        // Pass the complete capsule data via URL (encode as JSON)
        const capsuleData = (result as any).generation?.fullCapsule;
        const params = new URLSearchParams({
          generated: 'true',
          capsule: JSON.stringify({
            title: capsuleData?.title || selectedArchetype.title,
            description: capsuleData?.description || `A ${selectedArchetype.difficulty.toLowerCase()} coding challenge: ${selectedArchetype.title}`,
            problemStatement: capsuleData?.content?.primary?.problemStatement || capsuleData?.description,
            starterCode: capsuleData?.content?.primary?.code?.wasmVersion?.starterCode || (result as any).generation?.code || '',
            solution: capsuleData?.content?.primary?.code?.wasmVersion?.solution || (result as any).generation?.code || '',
            testCases: capsuleData?.content?.primary?.code?.wasmVersion?.testCases || [],
            hints: capsuleData?.pedagogy?.hints?.sequence || [],
            learningObjectives: capsuleData?.pedagogy?.learningObjectives || [],
            concepts: capsuleData?.pedagogy?.concepts || [],
            language: selectedArchetype.language.toLowerCase(),
            difficulty: selectedArchetype.difficulty.toLowerCase(),
            executionOutput: (result as any).execution?.stdout || '',
            executionSuccess: ((result as any).execution?.success || false)
          })
        });
        
        onClose();
        window.location.href = `/editor?${params.toString()}`;
      } else {
        const errorMsg = result?.error || combinedError || 'Generation failed. Please try again.';
        console.error('❌ Generation failed:', errorMsg);
        setLocalError(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      console.error('❌ Generation error:', error);
      setLocalError(errorMsg);
    }
  };

  const handleGenerateFromPrompt = async () => {
    if (!customPrompt.trim() || !isConnected) return;
    
    // Clear previous results and errors
    clearResults();
    clearErrors();
    setLocalError('');
    
    try {
      console.log('🚀 Generating capsule from prompt:', customPrompt);
      
      const result = await generateAndExecute({
        prompt: customPrompt,
        language: promptLanguage,
        difficulty: 'medium',
      });
      
      if (result?.success) {
        console.log('✅ Custom capsule generated successfully!', result);
        // Navigate to editor with the generated code
        // Pass the complete capsule data via URL (encode as JSON)
        const capsuleData = (result as any).generation?.fullCapsule;
        const params = new URLSearchParams({
          generated: 'true',
          capsule: JSON.stringify({
            title: capsuleData?.title || 'Custom Code Challenge',
            description: capsuleData?.description || customPrompt,
            problemStatement: capsuleData?.content?.primary?.problemStatement || capsuleData?.description || customPrompt,
            starterCode: capsuleData?.content?.primary?.code?.wasmVersion?.starterCode || (result as any).generation?.code || '',
            solution: capsuleData?.content?.primary?.code?.wasmVersion?.solution || (result as any).generation?.code || '',
            testCases: capsuleData?.content?.primary?.code?.wasmVersion?.testCases || [],
            hints: capsuleData?.pedagogy?.hints?.sequence || [],
            learningObjectives: capsuleData?.pedagogy?.learningObjectives || [],
            concepts: capsuleData?.pedagogy?.concepts || [],
            language: promptLanguage,
            difficulty: 'medium',
            executionOutput: (result as any).execution?.stdout || '',
            executionSuccess: ((result as any).execution?.success || false)
          })
        });
        
        onClose();
        window.location.href = `/editor?${params.toString()}`;
      } else {
        const errorMsg = result?.error || combinedError || 'Generation failed. Please try again.';
        console.error('❌ Custom generation failed:', errorMsg);
        setLocalError(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      console.error('❌ Custom generation error:', error);
      setLocalError(errorMsg);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <SparklesIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create New Capsule</h2>
              <p className="text-sm text-slate-400">Choose how you'd like to start your coding exercise</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2.5 hover:bg-slate-700 rounded-xl transition-colors group"
          >
            <XMarkIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-800/20 border-b border-slate-700/50">
          <button
            onClick={() => setActiveTab('archetype')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 relative group ${
              activeTab === 'archetype' 
                ? 'text-blue-400 bg-slate-700/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/20'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <LightBulbIcon className="w-4 h-4" />
              <span>Start from Template</span>
            </div>
            {activeTab === 'archetype' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 relative group ${
              activeTab === 'prompt' 
                ? 'text-blue-400 bg-slate-700/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/20'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CommandLineIcon className="w-4 h-4" />
              <span>Generate from Prompt</span>
            </div>
            {activeTab === 'prompt' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></div>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-200px)] overflow-y-auto">
          {activeTab === 'archetype' ? (
            <div className={`flex ${selectedArchetype ? 'divide-x divide-slate-700/50' : ''}`}>
              {/* Main content */}
              <div className={`${selectedArchetype ? 'w-2/3' : 'w-full'} p-6`}>
              {/* Search and Filters */}
              <div className="mb-8 space-y-6">
                {/* Search Bar */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search coding concepts, algorithms, or technologies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-700/30 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                  {searchQuery && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md">
                      {filteredArchetypes.length} found
                    </div>
                  )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-6">
                  {/* Language Filter */}
                  <div className="min-w-[140px]">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
                      <CodeBracketIcon className="w-4 h-4" />
                      Language
                    </label>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    >
                      {languages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty Filter */}
                  <div className="min-w-[140px]">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
                      <AdjustmentsHorizontalIcon className="w-4 h-4" />
                      Difficulty
                    </label>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    >
                      {difficulties.map(diff => (
                        <option key={diff} value={diff}>{diff}</option>
                      ))}
                    </select>
                  </div>

                  {/* Results Summary */}
                  <div className="flex-1 flex items-end">
                    <div className="text-sm text-slate-400">
                      Showing <span className="text-white font-medium">{filteredArchetypes.length}</span> of {mockArchetypes.length} templates
                    </div>
                  </div>
                </div>
              </div>

              {/* Archetype Gallery */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {filteredArchetypes.map((archetype) => (
                  <ArchetypeCard 
                    key={archetype.id} 
                    archetype={archetype} 
                    onSelect={handleArchetypeSelect}
                    isSelected={selectedArchetype?.id === archetype.id}
                  />
                ))}
              </div>

              {/* Error Display */}
              {(localError || combinedError) && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 text-red-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Generation Failed</span>
                  </div>
                  <p className="text-sm text-red-300 mt-2">
                    {localError || combinedError}
                  </p>
                </div>
              )}

              {/* Generate Button */}
              {selectedArchetype && (
                <div className="border-t border-slate-700/50 pt-6 bg-slate-800/40 -mx-6 px-6 backdrop-blur-sm sticky bottom-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <CheckCircleIcon className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{selectedArchetype.title}</div>
                        <div className="text-xs text-slate-400">
                          {selectedArchetype.difficulty} • {selectedArchetype.language} • ~{selectedArchetype.avgTime}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleGenerateFromArchetype}
                      disabled={!isConnected || isCombinedProcessing}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-blue-600/25 disabled:shadow-none"
                    >
                      {isCombinedProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <RocketLaunchIcon className="w-4 h-4" />
                          Generate Capsule
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              </div>

              {/* Preview Panel */}
              {selectedArchetype && (
                <div className="w-1/3 bg-slate-800/50 p-6">
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <EyeIcon className="w-5 h-5 text-blue-400" />
                      <h3 className="text-lg font-semibold text-white">Preview</h3>
                    </div>
                    
                    <div className="bg-slate-700/50 rounded-xl p-5 space-y-4">
                      <h4 className="font-semibold text-white text-lg">{selectedArchetype.title}</h4>
                      
                      <div className="flex gap-2">
                        <div className={`px-3 py-1.5 text-xs font-medium rounded-full border ${
                          selectedArchetype.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          selectedArchetype.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {selectedArchetype.difficulty}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-600/50 text-slate-300 rounded-full text-xs">
                          {selectedArchetype.language === 'Python' ? <CodeBracketIcon className="w-3 h-3 text-blue-400" /> :
                           selectedArchetype.language === 'JavaScript' ? <CodeBracketIcon className="w-3 h-3 text-yellow-400" /> :
                           selectedArchetype.language === 'SQL' ? <CommandLineIcon className="w-3 h-3 text-green-400" /> :
                           <CodeBracketIcon className="w-3 h-3 text-slate-400" />}
                          <span>{selectedArchetype.language}</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-slate-300 mb-2">Key Concepts</div>
                        <p className="text-sm text-slate-400">{selectedArchetype.concepts}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-700">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                            <ChartBarIcon className="w-4 h-4" />
                          </div>
                          <div className="text-sm font-medium text-white">{selectedArchetype.successRate}</div>
                          <div className="text-xs text-slate-400">Success Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                            <ClockIcon className="w-4 h-4" />
                          </div>
                          <div className="text-sm font-medium text-white">{selectedArchetype.avgTime}</div>
                          <div className="text-xs text-slate-400">Avg Time</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-700/30 rounded-xl p-5">
                    <h4 className="font-medium text-slate-300 mb-3">What you'll learn</h4>
                    <ul className="space-y-2 text-sm text-slate-400">
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>Core algorithm implementation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>Edge case handling</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>Performance optimization</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>Real-world application</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 space-y-8">
              {/* Custom Prompt */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-4">
                  <SparklesIcon className="w-4 h-4" />
                  Describe your ideal coding exercise
                </label>
                <div className="relative">
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Example: Create an interactive exercise that teaches students how to implement a binary search algorithm. Include edge cases, provide helpful hints, and test with arrays of different sizes..."
                    rows={8}
                    className="w-full px-4 py-4 bg-slate-700/30 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none transition-all"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-slate-500">
                    {customPrompt.length}/500 characters
                  </div>
                </div>
                {customPrompt.trim() && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Ready to generate</span>
                  </div>
                )}
              </div>

              {/* Language Selector */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-4">
                  <CodeBracketIcon className="w-4 h-4" />
                  Programming Language
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(['python', 'javascript', 'java', 'csharp', 'go', 'sql'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setPromptLanguage(lang)}
                      className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                        promptLanguage === lang
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-slate-600 bg-slate-700/30 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="font-medium capitalize">{lang}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {lang === 'python' ? 'Fast & Popular' :
                         lang === 'javascript' ? 'Web Ready' :
                         lang === 'java' ? 'Enterprise' :
                         lang === 'csharp' ? '.NET Stack' :
                         lang === 'go' ? 'High Performance' :
                         'Database Queries'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Runtime Selector */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-4">
                  <ServerIcon className="w-4 h-4" />
                  Execution Environment
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setRuntime('wasm')}
                    className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                      runtime === 'wasm' 
                        ? 'border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10' 
                        : 'border-slate-600 bg-slate-700/30 hover:border-slate-500 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                          <RocketLaunchIcon className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="font-semibold text-white">Browser (WASM)</span>
                      </div>
                      {runtime === 'wasm' && (
                        <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mb-2">Fast & Free execution</p>
                    <p className="text-xs text-slate-500">Perfect for Python, JavaScript, and web technologies</p>
                  </button>
                  
                  <button
                    onClick={() => setRuntime('server')}
                    className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                      runtime === 'server' 
                        ? 'border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10' 
                        : 'border-slate-600 bg-slate-700/30 hover:border-slate-500 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <ServerIcon className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="font-semibold text-white">Server (Docker)</span>
                      </div>
                      {runtime === 'server' && (
                        <CheckCircleIcon className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mb-2">Full environments</p>
                    <p className="text-xs text-slate-500">Ideal for SQL, databases, and complex setups</p>
                  </button>
                </div>
              </div>

              {/* Generate Button */}
              <div className="border-t border-slate-700/50 pt-6 -mx-6 px-6 bg-slate-800/40">
                {!isConnected && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                    ⚠️ API server not connected. Please check your connection.
                  </div>
                )}
                {isConnected && (
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm text-center flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Connected to API • {executionMode} execution • {health?.supported_languages?.length || 0} languages
                  </div>
                )}
                
                {/* Error Display for Custom Prompt */}
                {(localError || combinedError) && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-red-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">Generation Failed</span>
                    </div>
                    <p className="text-sm text-red-300 mt-2">
                      {localError || combinedError}
                    </p>
                  </div>
                )}
                
                <button
                  onClick={handleGenerateFromPrompt}
                  disabled={!customPrompt.trim() || !isConnected || isCombinedProcessing}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-blue-600/25 disabled:shadow-none"
                >
                  {isCombinedProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating with AI...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-5 h-5" />
                      Generate Custom Capsule ({promptLanguage})
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}