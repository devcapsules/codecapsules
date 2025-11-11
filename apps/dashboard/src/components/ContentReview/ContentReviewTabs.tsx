import React, { useState } from 'react';
import { 
  DocumentTextIcon,
  CodeBracketIcon,
  LightBulbIcon,
  CheckCircleIcon,
  BeakerIcon,
  PencilIcon,
  ArrowPathIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface ContentReviewTabsProps {
  content: any;
  onSectionEdit: (section: string, newContent: any) => void;
  onSectionRegenerate: (section: string) => void;
  onRefineWithPrompt: (section: string, refinementPrompt: string) => void;
  onApprove: () => void;
}

const TABS = [
  { id: 'problem', name: 'Problem Statement', icon: DocumentTextIcon, color: 'blue' },
  { id: 'code', name: 'Starter Code', icon: CodeBracketIcon, color: 'green' },
  { id: 'solution', name: 'Solution & Hints', icon: LightBulbIcon, color: 'yellow' },
  { id: 'tests', name: 'Test Cases', icon: BeakerIcon, color: 'purple' },
];

export default function ContentReviewTabs({ 
  content, 
  onSectionEdit, 
  onSectionRegenerate, 
  onRefineWithPrompt, 
  onApprove 
}: ContentReviewTabsProps) {
  const [activeTab, setActiveTab] = useState('problem');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [refinementPrompt, setRefinementPrompt] = useState<string>('');
  const [showRefinementInput, setShowRefinementInput] = useState<string | null>(null);

  const handleEdit = (section: string) => {
    setIsEditing(section);
    setEditContent(getSectionContent(section));
  };

  const handleSaveEdit = () => {
    if (isEditing) {
      onSectionEdit(isEditing, editContent);
      setIsEditing(null);
    }
  };

  const handleRefine = (section: string) => {
    if (refinementPrompt.trim()) {
      onRefineWithPrompt(section, refinementPrompt);
      setRefinementPrompt('');
      setShowRefinementInput(null);
    }
  };

  const getSectionContent = (section: string): string => {
    switch (section) {
      case 'problem':
        return `${content.title}\n\n${content.description}`;
      case 'code':
        return content.starterCode || '';
      case 'solution':
        return content.solutionCode || '';
      case 'tests':
        return JSON.stringify(content.testCases || [], null, 2);
      default:
        return '';
    }
  };

  const renderTabContent = () => {
    const currentTab = TABS.find(tab => tab.id === activeTab);
    
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
        {/* Tab Header */}
        <div className="bg-gray-800/70 px-6 py-4 border-b border-gray-700/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {currentTab && (
              <currentTab.icon className={`h-5 w-5 text-${currentTab.color}-400`} />
            )}
            <h3 className="text-lg font-semibold text-white">{currentTab?.name}</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleEdit(activeTab)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-600/30 transition-colors text-sm"
            >
              <PencilIcon className="h-4 w-4" />
              <span>Edit</span>
            </button>
            
            <button
              onClick={() => onSectionRegenerate(activeTab)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-orange-600/20 text-orange-300 rounded-lg border border-orange-500/30 hover:bg-orange-600/30 transition-colors text-sm"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Regenerate</span>
            </button>
            
            <button
              onClick={() => setShowRefinementInput(activeTab)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600/20 text-purple-300 rounded-lg border border-purple-500/30 hover:bg-purple-600/30 transition-colors text-sm"
            >
              <SparklesIcon className="h-4 w-4" />
              <span>Refine</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'problem' && (
            <ProblemStatementSection 
              content={content}
              isEditing={isEditing === 'problem'}
              editContent={editContent}
              onEditChange={setEditContent}
              onSave={handleSaveEdit}
              onCancel={() => setIsEditing(null)}
            />
          )}
          
          {activeTab === 'code' && (
            <StarterCodeSection 
              content={content}
              isEditing={isEditing === 'code'}
              editContent={editContent}
              onEditChange={setEditContent}
              onSave={handleSaveEdit}
              onCancel={() => setIsEditing(null)}
            />
          )}
          
          {activeTab === 'solution' && (
            <SolutionSection 
              content={content}
              isEditing={isEditing === 'solution'}
              editContent={editContent}
              onEditChange={setEditContent}
              onSave={handleSaveEdit}
              onCancel={() => setIsEditing(null)}
            />
          )}
          
          {activeTab === 'tests' && (
            <TestCasesSection 
              content={content}
              isEditing={isEditing === 'tests'}
              editContent={editContent}
              onEditChange={setEditContent}
              onSave={handleSaveEdit}
              onCancel={() => setIsEditing(null)}
            />
          )}
        </div>

        {/* Refinement Input */}
        {showRefinementInput === activeTab && (
          <div className="border-t border-gray-700/50 p-4 bg-gray-800/30">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                ✨ How would you like to refine this section?
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={refinementPrompt}
                  onChange={(e) => setRefinementPrompt(e.target.value)}
                  placeholder="e.g., Make it more beginner-friendly, add more edge cases, simplify the explanation..."
                  className="flex-1 px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
                <button
                  onClick={() => handleRefine(activeTab)}
                  disabled={!refinementPrompt.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Refine
                </button>
                <button
                  onClick={() => setShowRefinementInput(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-xl border border-gray-700/50">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                isActive
                  ? `bg-${tab.color}-600/20 text-${tab.color}-300 border border-${tab.color}-500/30`
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm">{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-700/50">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <CheckCircleIcon className="h-4 w-4 text-green-400" />
            <span>AI Quality Score: 86.3/100</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Generator
          </button>
          
          <button
            onClick={onApprove}
            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
          >
            <CheckCircleIcon className="h-5 w-5" />
            <span>Approve & Save</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Individual Section Components
function ProblemStatementSection({ content, isEditing, editContent, onEditChange, onSave, onCancel }: any) {
  if (isEditing) {
    return (
      <div className="space-y-4">
        <textarea
          value={editContent}
          onChange={(e) => onEditChange(e.target.value)}
          className="w-full h-64 px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Edit the problem statement..."
        />
        <div className="flex space-x-3">
          <button onClick={onSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Save Changes
          </button>
          <button onClick={onCancel} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-blue-300 mb-3">{content.title}</h4>
        <p className="text-gray-300 leading-relaxed">{content.description}</p>
      </div>
      
      {content.concepts && (
        <div className="flex flex-wrap gap-2">
          {content.concepts.map((concept: string, index: number) => (
            <span key={index} className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm border border-blue-500/30">
              {concept}
            </span>
          ))}
        </div>
      )}
      
      <div className="text-sm text-gray-400">
        <span>⏱️ Estimated Time: {content.timeEstimate}</span>
        <span className="ml-6">🎯 Success Criteria: {content.successCriteria}</span>
      </div>
    </div>
  );
}

function StarterCodeSection({ content, isEditing, editContent, onEditChange, onSave, onCancel }: any) {
  if (isEditing) {
    return (
      <div className="space-y-4">
        <textarea
          value={editContent}
          onChange={(e) => onEditChange(e.target.value)}
          className="w-full h-64 px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white font-mono text-sm resize-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          placeholder="Edit the starter code..."
        />
        <div className="flex space-x-3">
          <button onClick={onSave} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Save Changes
          </button>
          <button onClick={onCancel} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-900/70 border border-gray-700/50 rounded-lg overflow-hidden">
        <div className="bg-gray-800/70 px-4 py-2 border-b border-gray-700/50">
          <span className="text-sm text-gray-400 font-medium">JavaScript</span>
        </div>
        <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
          <code>{content.starterCode}</code>
        </pre>
      </div>
      
      <div className="flex items-center space-x-4 text-sm text-gray-400">
        <span>💻 Language: JavaScript</span>
        <span>🔧 Runtime: WASM</span>
        <span>📏 Complexity: Medium</span>
      </div>
    </div>
  );
}

function SolutionSection({ content, isEditing, editContent, onEditChange, onSave, onCancel }: any) {
  if (isEditing) {
    return (
      <div className="space-y-4">
        <textarea
          value={editContent}
          onChange={(e) => onEditChange(e.target.value)}
          className="w-full h-64 px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white font-mono text-sm resize-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
          placeholder="Edit the solution code..."
        />
        <div className="flex space-x-3">
          <button onClick={onSave} className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
            Save Changes
          </button>
          <button onClick={onCancel} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Solution Code */}
      <div className="bg-gray-900/70 border border-gray-700/50 rounded-lg overflow-hidden">
        <div className="bg-gray-800/70 px-4 py-2 border-b border-gray-700/50">
          <span className="text-sm text-yellow-400 font-medium">Complete Solution</span>
        </div>
        <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
          <code>{content.solutionCode}</code>
        </pre>
      </div>

      {/* Hints */}
      {content.hints && content.hints.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-yellow-300 font-medium flex items-center space-x-2">
            <LightBulbIcon className="h-4 w-4" />
            <span>Progressive Hints</span>
          </h5>
          {content.hints.map((hint: any, index: number) => (
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
          ))}
        </div>
      )}
    </div>
  );
}

function TestCasesSection({ content, isEditing, editContent, onEditChange, onSave, onCancel }: any) {
  if (isEditing) {
    return (
      <div className="space-y-4">
        <textarea
          value={editContent}
          onChange={(e) => onEditChange(e.target.value)}
          className="w-full h-64 px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white font-mono text-sm resize-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          placeholder="Edit test cases (JSON format)..."
        />
        <div className="flex space-x-3">
          <button onClick={onSave} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Save Changes
          </button>
          <button onClick={onCancel} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="text-purple-300 font-medium flex items-center space-x-2">
          <BeakerIcon className="h-4 w-4" />
          <span>Test Cases</span>
        </h5>
        <span className="text-sm text-gray-400">
          {content.testCases?.length || 0} test cases
        </span>
      </div>

      {content.testCases && content.testCases.map((testCase: any, index: number) => (
        <div key={index} className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-300">
              Test Case {index + 1}
            </span>
            {testCase.hidden && (
              <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-1 rounded-full">
                Hidden
              </span>
            )}
          </div>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-400">Input:</span>
              <code className="ml-2 text-gray-300 bg-gray-900/50 px-2 py-1 rounded">
                {testCase.input}
              </code>
            </div>
            <div>
              <span className="text-gray-400">Expected:</span>
              <code className="ml-2 text-gray-300 bg-gray-900/50 px-2 py-1 rounded">
                {testCase.expectedOutput}
              </code>
            </div>
            {testCase.description && (
              <div>
                <span className="text-gray-400">Description:</span>
                <span className="ml-2 text-gray-300">{testCase.description}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}