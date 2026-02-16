import React, { useState } from 'react';
import { CapsulePreview } from '../components/CapsulePreview';
import { PromptExamples, QuickActions } from '../components/PromptExamples';
import { SuccessToast, ErrorToast } from '../components/ToastNotification';
import { VerificationBanner } from '../components/VerificationBanner';
import { 
  CodeBracketIcon, 
  CommandLineIcon, 
  CircleStackIcon, 
  QuestionMarkCircleIcon, 
  CpuChipIcon,
  SparklesIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  LightBulbIcon,
  BeakerIcon,
  PencilIcon,
  EyeIcon,
  PlayIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface CapsuleConfig {
  prompt: string;
  language: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  includeTestCases: boolean;
  includeHints: boolean;
  includeTimeLimit: boolean;
  runtime: 'wasm' | 'docker';
}

interface GenerationState {
  isGenerating: boolean;
  generatedContent: any | null;
  qualityScore: number | null;
  error: string | null;
}

const CAPSULE_TYPES = [
  { id: 'code', name: 'Code', icon: CodeBracketIcon, color: 'text-blue-400' },
  { id: 'terminal', name: 'Terminal', icon: CommandLineIcon, color: 'text-green-400' },
  { id: 'database', name: 'Database', icon: CircleStackIcon, color: 'text-purple-400' },
  { id: 'quiz', name: 'Quiz', icon: QuestionMarkCircleIcon, color: 'text-yellow-400' },
  { id: 'system-design', name: 'System Design', icon: CpuChipIcon, color: 'text-red-400' }
];

const LEFT_PANEL_SECTIONS = [
  { id: 'problem', name: 'Problem Statement.md', icon: DocumentTextIcon, color: 'text-blue-400' },
  { id: 'code', name: 'StarterCode.js', icon: CodeBracketIcon, color: 'text-green-400' },
  { id: 'solution', name: 'Solution.js', icon: CheckCircleIcon, color: 'text-purple-400' },
  { id: 'hints', name: 'Hints.md', icon: LightBulbIcon, color: 'text-yellow-400' },
  { id: 'tests', name: 'Tests.js', icon: BeakerIcon, color: 'text-red-400' }
];

export default function CreateCapsulePage() {
  const [selectedType, setSelectedType] = useState<string>('code');
  const [activeLeftPanel, setActiveLeftPanel] = useState<string>('code');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editContent, setEditContent] = useState<string>('');
  
  // Responsive state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  
  const [config, setConfig] = useState<CapsuleConfig>({
    prompt: 'Create a simple coding challenge where the user has to complete a function that adds two numbers.',
    language: 'JavaScript',
    difficulty: 'Easy',
    includeTestCases: true,
    includeHints: true,
    includeTimeLimit: false,
    runtime: 'wasm'
  });
  
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    generatedContent: null,
    qualityScore: null,
    error: null
  });

  // UX state management
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [showVerificationBanner, setShowVerificationBanner] = useState<boolean>(false);

  const generateContent = async () => {
    if (!selectedType || !config.prompt.trim()) return;

    setGenerationState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          prompt: config.prompt,
          language: config.language.toLowerCase(),
          difficulty: config.difficulty.toLowerCase(),
          includeTestCases: config.includeTestCases,
          includeHints: config.includeHints,
          runtime: config.runtime
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      
      setGenerationState({
        isGenerating: false,
        generatedContent: result.content,
        qualityScore: result.qualityScore || 85,
        error: null
      });

      // Show success feedback
      setShowSuccessToast(true);
      setShowVerificationBanner(true);

    } catch (error) {
      console.error('Generation failed:', error);
      setGenerationState({
        isGenerating: false,
        generatedContent: null,
        qualityScore: null,
        error: error instanceof Error ? error.message : 'Failed to generate content'
      });
      setShowErrorToast(true);
    }
  };

  const handleGenerate = () => {
    generateContent();
  };

  const handleExampleSelect = (prompt: string, difficulty: string, language: string) => {
    setConfig(prev => ({
      ...prev,
      prompt,
      difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1) as 'Easy' | 'Medium' | 'Hard',
      language: language.charAt(0).toUpperCase() + language.slice(1)
    }));
  };

  const handleReset = () => {
    setConfig({
      prompt: '',
      language: 'JavaScript',
      difficulty: 'Easy',
      includeTestCases: true,
      includeHints: true,
      includeTimeLimit: false,
      runtime: 'wasm'
    });
    setGenerationState({
      isGenerating: false,
      generatedContent: null,
      qualityScore: null,
      error: null
    });
    setShowVerificationBanner(false);
  };

  const handlePreview = () => {
    setIsPreviewMode(true);
  };

  const handleEdit = () => {
    setIsEditMode(true);
    const content = getSectionContent(activeLeftPanel);
    if (content && typeof content === 'string') {
      setEditContent(content);
    } else {
      setEditContent('');
    }
  };

  const handleSaveEdit = () => {
    if (generationState.generatedContent) {
      const updatedContent = { ...generationState.generatedContent };
      
      switch (activeLeftPanel) {
        case 'problem':
          const lines = editContent.split('\n');
          updatedContent.title = lines[0] || updatedContent.title;
          updatedContent.description = lines.slice(1).join('\n') || updatedContent.description;
          break;
        case 'code':
          updatedContent.starterCode = editContent;
          break;
        case 'solution':
          updatedContent.solutionCode = editContent;
          break;
        case 'hints':
          updatedContent.hints = editContent.split('\n').filter(line => line.trim());
          break;
        case 'tests':
          updatedContent.testCases = editContent;
          break;
      }
      
      setGenerationState(prev => ({ ...prev, generatedContent: updatedContent }));
    }
    setIsEditMode(false);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditContent('');
  };

  const getSectionContent = (sectionId: string) => {
    const content = generationState.generatedContent;
    if (!content) return null;

    switch (sectionId) {
      case 'problem':
        return (
          <div className="space-y-4">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-blue-300 mb-3">{content.title}</h4>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{content.description}</p>
            </div>
          </div>
        );

      case 'code':
        return (
          <div className="space-y-4">
            <div className="bg-gray-900/70 border border-gray-700/50 rounded-lg overflow-hidden">
              <div className="bg-gray-800/70 px-4 py-2 border-b border-gray-700/50">
                <span className="text-sm text-gray-400 font-medium">{config.language}</span>
              </div>
              <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
                <code>{content.starterCode}</code>
              </pre>
            </div>
          </div>
        );

      case 'solution':
        return (
          <div className="space-y-4">
            <div className="bg-gray-900/70 border border-gray-700/50 rounded-lg overflow-hidden">
              <div className="bg-gray-800/70 px-4 py-2 border-b border-gray-700/50">
                <span className="text-sm text-yellow-400 font-medium">Complete Solution</span>
              </div>
              <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
                <code>{content.solutionCode}</code>
              </pre>
            </div>
          </div>
        );

      case 'hints':
        return (
          <div className="space-y-3">
            {content.hints && content.hints.length > 0 ? (
              content.hints.map((hint: any, index: number) => (
                <div key={index} className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs bg-yellow-600/30 text-yellow-300 px-2 py-1 rounded-full">
                      {hint.stage || `Hint ${index + 1}`}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm">{hint.text}</p>
                  {hint.codeExample && (
                    <pre className="mt-2 text-xs text-gray-400 bg-gray-900/50 p-2 rounded border border-gray-700/50">
                      <code>{hint.codeExample}</code>
                    </pre>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-400">No hints generated</p>
            )}
          </div>
        );

      case 'tests':
        return (
          <div className="space-y-3">
            {content.testCases ? (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <h5 className="text-green-300 font-medium mb-2">Test Cases</h5>
                <pre className="text-sm text-gray-300 overflow-x-auto">
                  <code>{content.testCases}</code>
                </pre>
              </div>
            ) : (
              <p className="text-gray-400">No test cases generated</p>
            )}
          </div>
        );

      default:
        return <p className="text-gray-400">Select a section to view content</p>;
    }
  };

  return (
    <>
      <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gray-900/50 border-b border-gray-700/50 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-white p-1"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-white">Devcapsules</h1>
          </div>
          <div className="flex items-center space-x-2">
            {generationState.generatedContent && (
              <button
                onClick={handlePreview}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
              >
                <EyeIcon className="h-4 w-4" />
                <span>Preview</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="bg-gray-900 w-80 h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">CONFIGURATION</h3>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              {/* Mobile Configuration Panel */}
              <div className="p-4 overflow-y-auto h-full">
                <div className="space-y-6">
                  {/* Capsule Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Capsule Type</label>
                    <div className="grid grid-cols-1 gap-2">
                      {CAPSULE_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.id}
                            onClick={() => setSelectedType(type.id)}
                            className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                              selectedType === type.id
                                ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                                : 'bg-gray-800/30 border-gray-700/50 text-gray-300 hover:bg-gray-700/30'
                            }`}
                          >
                            <Icon className={`h-5 w-5 ${selectedType === type.id ? 'text-blue-400' : type.color}`} />
                            <span className="text-sm font-medium">{type.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Prompt */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
                    <textarea
                      value={config.prompt}
                      onChange={(e) => setConfig(prev => ({ ...prev, prompt: e.target.value }))}
                      placeholder="Describe what you want to create..."
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm resize-none"
                      rows={4}
                    />
                  </div>

                  {/* Quick Examples */}
                  <PromptExamples 
                    onSelectExample={handleExampleSelect}
                    currentLanguage={config.language}
                    currentDifficulty={config.difficulty}
                  />

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                    <select
                      value={config.language}
                      onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                    >
                      <option value="JavaScript">JavaScript</option>
                      <option value="Python">Python</option>
                      <option value="Java">Java</option>
                      <option value="TypeScript">TypeScript</option>
                      <option value="Go">Go</option>
                      <option value="Rust">Rust</option>
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                    <div className="flex space-x-2">
                      {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setConfig(prev => ({ ...prev, difficulty: level }))}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            config.difficulty === level
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {[
                      { key: 'includeTestCases', label: 'Generate Test Cases', checked: config.includeTestCases },
                      { key: 'includeHints', label: 'Generate Hints', checked: config.includeHints },
                      { key: 'includeTimeLimit', label: 'Enforce Time Limit', checked: config.includeTimeLimit }
                    ].map((option) => (
                      <label key={option.key} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={option.checked}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            [option.key]: e.target.checked 
                          }))}
                          className="h-4 w-4 text-blue-600 bg-gray-800/50 border-gray-600/50 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-300">{option.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        handleGenerate();
                        setIsMobileMenuOpen(false);
                      }}
                      disabled={!selectedType || !config.prompt.trim() || generationState.isGenerating}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      {generationState.isGenerating ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="h-4 w-4" />
                          <span>Generate Capsule</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleReset}
                      className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-1">
          {/* Left Panel - Explorer */}
          <div className={`bg-gray-900/50 border-r border-gray-700/50 flex flex-col transition-all duration-300 ${
            isLeftPanelCollapsed ? 'w-12' : 'w-80'
          }`}>
            {/* Explorer Header */}
            <div className="border-b border-gray-700/50 p-3 flex items-center justify-between">
              {!isLeftPanelCollapsed && (
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">EXPLORER</h3>
              )}
              <button
                onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {isLeftPanelCollapsed ? (
                  <ChevronRightIcon className="h-4 w-4" />
                ) : (
                  <ChevronLeftIcon className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* File Tree */}
            <div className="flex-1 p-2">
              {LEFT_PANEL_SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = activeLeftPanel === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveLeftPanel(section.id)}
                    className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded text-sm hover:bg-gray-800/50 transition-colors ${
                      isActive ? 'bg-gray-700/50 text-white' : 'text-gray-400'
                    }`}
                    title={isLeftPanelCollapsed ? section.name : ''}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? section.color : 'text-gray-500'}`} />
                    {!isLeftPanelCollapsed && <span>{section.name}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Middle Panel - Editor */}
          <div className="flex-1 bg-gray-800/30 border-r border-gray-700/50 flex flex-col min-w-0">
            {/* Tab Bar */}
            <div className="border-b border-gray-700/50 bg-gray-900/30">
              <div className="flex items-center">
                <div className="flex items-center space-x-1 px-4 py-2 bg-gray-800/50 border-r border-gray-700/50">
                  <CodeBracketIcon className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-white truncate">StarterCode.js</span>
                  <button className="ml-2 text-gray-400 hover:text-white">✕</button>
                </div>
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              {generationState.error ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Generation Error</h3>
                  <p className="text-gray-400 text-center">{generationState.error}</p>
                </div>
              ) : generationState.isGenerating ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <ArrowPathIcon className="h-16 w-16 text-blue-400 animate-spin mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Generating Content</h3>
                  <p className="text-gray-400 text-center">Creating your interactive capsule...</p>
                </div>
              ) : generationState.generatedContent ? (
                <div className="space-y-4">
                  {/* Edit Mode Header */}
                  {isEditMode && (
                    <div className="flex items-center justify-between bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                      <span className="text-yellow-300 text-sm">Editing Mode</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Content Display/Edit */}
                  {isEditMode ? (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-96 p-4 bg-gray-900/70 border border-gray-700/50 rounded-lg text-gray-300 font-mono text-sm resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Edit content here..."
                    />
                  ) : (
                    <div>
                      {getSectionContent(activeLeftPanel)}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!isEditMode && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={handleEdit}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors"
                        >
                          <PencilIcon className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={handlePreview}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                        >
                          <EyeIcon className="h-4 w-4" />
                          <span>Preview</span>
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">Quality Score:</span>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <CheckCircleIcon
                              key={i}
                              className={`h-4 w-4 ${
                                i < (generationState.qualityScore || 0) / 20
                                  ? 'text-green-400'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <BeakerIcon className="h-16 w-16 text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Content Generated</h3>
                  <p className="text-gray-400 text-center">Configure your capsule and click Generate to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Configuration */}
          <div className={`bg-gray-900/50 flex flex-col transition-all duration-300 ${
            isRightPanelCollapsed ? 'w-12' : 'w-80'
          }`}>
            {/* Configuration Header */}
            <div className="border-b border-gray-700/50 p-3 flex items-center justify-between">
              <button
                onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {isRightPanelCollapsed ? (
                  <ChevronLeftIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </button>
              {!isRightPanelCollapsed && (
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">CONFIGURATION</h3>
              )}
            </div>

            {!isRightPanelCollapsed && (
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-6">
                  {/* Same configuration content as mobile */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Capsule Type</label>
                    <div className="grid grid-cols-1 gap-2">
                      {CAPSULE_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.id}
                            onClick={() => setSelectedType(type.id)}
                            className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                              selectedType === type.id
                                ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                                : 'bg-gray-800/30 border-gray-700/50 text-gray-300 hover:bg-gray-700/30'
                            }`}
                          >
                            <Icon className={`h-5 w-5 ${selectedType === type.id ? 'text-blue-400' : type.color}`} />
                            <span className="text-sm font-medium">{type.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
                    <textarea
                      value={config.prompt}
                      onChange={(e) => setConfig(prev => ({ ...prev, prompt: e.target.value }))}
                      placeholder="Describe what you want to create..."
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm resize-none"
                      rows={4}
                    />
                  </div>

                  <PromptExamples 
                    onSelectExample={handleExampleSelect}
                    currentLanguage={config.language}
                    currentDifficulty={config.difficulty}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                    <select
                      value={config.language}
                      onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                    >
                      <option value="JavaScript">JavaScript</option>
                      <option value="Python">Python</option>
                      <option value="Java">Java</option>
                      <option value="TypeScript">TypeScript</option>
                      <option value="Go">Go</option>
                      <option value="Rust">Rust</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                    <div className="flex space-x-2">
                      {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setConfig(prev => ({ ...prev, difficulty: level }))}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            config.difficulty === level
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { key: 'includeTestCases', label: 'Generate Test Cases', checked: config.includeTestCases },
                      { key: 'includeHints', label: 'Generate Hints', checked: config.includeHints },
                      { key: 'includeTimeLimit', label: 'Enforce Time Limit', checked: config.includeTimeLimit }
                    ].map((option) => (
                      <label key={option.key} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={option.checked}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            [option.key]: e.target.checked 
                          }))}
                          className="h-4 w-4 text-blue-600 bg-gray-800/50 border-gray-600/50 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-300">{option.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleGenerate}
                      disabled={!selectedType || !config.prompt.trim() || generationState.isGenerating}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      {generationState.isGenerating ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="h-4 w-4" />
                          <span>Generate Capsule</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleReset}
                      className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Content View */}
        <div className="lg:hidden flex-1 flex flex-col overflow-hidden">
          {/* Content Tabs */}
          <div className="bg-gray-900/50 border-b border-gray-700/50">
            <div className="flex overflow-x-auto">
              {LEFT_PANEL_SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = activeLeftPanel === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveLeftPanel(section.id)}
                    className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      isActive 
                        ? 'border-blue-500 text-blue-300' 
                        : 'border-transparent text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? section.color : 'text-gray-500'}`} />
                    <span>{section.name.replace('.md', '').replace('.js', '')}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {generationState.error ? (
              <div className="flex flex-col items-center justify-center h-full">
                <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Generation Error</h3>
                <p className="text-gray-400 text-center">{generationState.error}</p>
              </div>
            ) : generationState.isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full">
                <ArrowPathIcon className="h-16 w-16 text-blue-400 animate-spin mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Generating Content</h3>
                <p className="text-gray-400 text-center">Creating your interactive capsule...</p>
              </div>
            ) : generationState.generatedContent ? (
              getSectionContent(activeLeftPanel)
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <BeakerIcon className="h-16 w-16 text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Content Generated</h3>
                <p className="text-gray-400 text-center mb-4">Configure your capsule and generate content</p>
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Bars3Icon className="h-4 w-4" />
                  <span>Open Configuration</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Action Bar */}
          {generationState.generatedContent && (
            <div className="bg-gray-900/50 border-t border-gray-700/50 p-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleEdit}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors"
                >
                  <PencilIcon className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handlePreview}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  <EyeIcon className="h-4 w-4" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <Bars3Icon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verification Banner */}
      {showVerificationBanner && generationState.generatedContent && (
        <VerificationBanner
          quality={{
            score: generationState.qualityScore || 85,
            issues: 0,
            recommendations: ['Consider adding more test cases', 'Optimize code complexity'],
            passesThreshold: (generationState.qualityScore || 0) >= 70
          }}
          isVisible={showVerificationBanner}
        />
      )}

      {/* Preview Modal */}
      {isPreviewMode && (
        <CapsulePreview
          type={selectedType as any}
          language={config.language}
          title={generationState.generatedContent?.title || 'Generated Capsule'}
          difficulty={config.difficulty.toLowerCase() as any}
          generatedContent={generationState.generatedContent}
          isPreviewMode={isPreviewMode}
          onClosePreview={() => setIsPreviewMode(false)}
        />
      )}

      {/* Toast Notifications */}
      <SuccessToast
        isVisible={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        qualityScore={generationState.qualityScore || undefined}
      />

      <ErrorToast
        isVisible={showErrorToast}
        onClose={() => setShowErrorToast(false)}
        error={generationState.error || ''}
      />
    </>
  );
}