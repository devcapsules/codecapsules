import React from 'react';
import { PlayIcon, LightBulbIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface CapsulePreviewProps {
  type: 'code' | 'quiz' | 'terminal' | 'system-design' | null;
  language?: string;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  generatedContent?: any;
  isPreviewMode?: boolean;
  onClosePreview?: () => void;
}

export function CapsulePreview({ 
  type, 
  language, 
  title, 
  difficulty, 
  generatedContent, 
  isPreviewMode = false,
  onClosePreview 
}: CapsulePreviewProps) {
  
  // Full preview modal for generated content
  if (isPreviewMode && generatedContent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <PlayIcon className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Learner Preview</h3>
            </div>
            <button
              onClick={onClosePreview}
              className="text-gray-400 hover:text-gray-600 text-2xl font-light"
              aria-label="Close preview"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
            {/* Problem Statement */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{generatedContent.title}</h2>
              <p className="text-gray-700 leading-relaxed">{generatedContent.description}</p>
            </section>

            {/* Starter Code */}
            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Starting Code</h3>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-green-400 text-sm font-mono">
                  <code>{generatedContent.starterCode}</code>
                </pre>
              </div>
            </section>

            {/* Test Cases Preview */}
            {generatedContent.testCases && generatedContent.testCases.length > 0 && (
              <section className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Cases</h3>
                <div className="space-y-3">
                  {generatedContent.testCases.slice(0, 3).map((test: any, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Test {index + 1}</span>
                        {test.hidden && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Hidden
                          </span>
                        )}
                      </div>
                      <div className="text-sm">
                        <div className="mb-1">
                          <span className="font-medium">Input:</span> 
                          <code className="ml-2 bg-gray-100 px-1 rounded">{test.input}</code>
                        </div>
                        <div>
                          <span className="font-medium">Expected:</span> 
                          <code className="ml-2 bg-gray-100 px-1 rounded">{test.expectedOutput}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                  {generatedContent.testCases.length > 3 && (
                    <div className="text-sm text-gray-500 text-center py-2">
                      +{generatedContent.testCases.length - 3} more test cases
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Hints Preview */}
            {generatedContent.hints && generatedContent.hints.length > 0 && (
              <section className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Available Hints</h3>
                <div className="space-y-3">
                  {generatedContent.hints.slice(0, 2).map((hint: any, index: number) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                          {hint.stage ? hint.stage.replace('_', ' ').toUpperCase() : `Hint ${index + 1}`}
                        </span>
                      </div>
                      <p className="text-blue-800 text-sm mb-2">{hint.text}</p>
                      {hint.codeExample && (
                        <pre className="text-xs text-blue-700 bg-blue-100 p-2 rounded border border-blue-200">
                          <code>{hint.codeExample}</code>
                        </pre>
                      )}
                    </div>
                  ))}
                  {generatedContent.hints.length > 2 && (
                    <div className="text-sm text-gray-500 text-center py-1">
                      +{generatedContent.hints.length - 2} more hints available
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Success Criteria */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Success Criteria</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <p className="text-green-800">{generatedContent.successCriteria}</p>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Estimated solving time: {generatedContent.timeEstimate || 'Not specified'}
            </div>
            <div className="space-x-3">
              <button
                onClick={onClosePreview}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close Preview
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Save Capsule
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!type) {
    return (
      <div className="bg-gray-800/50 border border-gray-600 rounded-xl p-8 text-center">
        <div className="text-gray-400">
          <div className="w-16 h-16 bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">?</span>
          </div>
          <p>Choose a capsule type to see the preview</p>
        </div>
      </div>
    );
  }

  const difficultyColors = {
    beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
    intermediate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    advanced: 'bg-red-500/10 text-red-400 border-red-500/20'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">CC</span>
          </div>
          <span className="font-medium text-gray-700">CodeCapsule</span>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium border ${difficultyColors[difficulty]}`}>
          {difficulty}
        </div>
      </div>

      {/* Content based on type */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {title || 'Your Interactive Exercise'}
        </h3>

        {type === 'code' && (
          <div className="space-y-4">
            {/* Code Editor */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400 uppercase font-medium">{language}</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1">
                  <PlayIcon className="h-3 w-3" />
                  <span>Run</span>
                </button>
              </div>
              <div className="font-mono text-sm text-gray-300 space-y-2">
                <div className="text-gray-500">// Your starter code here</div>
                <div>
                  <span className="text-purple-400">function</span>{' '}
                  <span className="text-blue-400">solveProblem</span>
                  <span className="text-yellow-400">(</span>
                  <span className="text-orange-400">input</span>
                  <span className="text-yellow-400">) {'{'}</span>
                </div>
                <div className="ml-4 text-gray-500">// TODO: Implement solution</div>
                <div className="ml-4">
                  <span className="text-purple-400">return</span>{' '}
                  <span className="text-green-400">null</span>
                  <span className="text-yellow-400">;</span>
                </div>
                <div><span className="text-yellow-400">{'}'}</span></div>
              </div>
            </div>

            {/* Test Results */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-700">Test Results</h4>
                <span className="text-sm text-gray-500">0/3 passing</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <XCircleIcon className="h-4 w-4 text-red-500" />
                  <span className="text-gray-600">Test case 1: Expected 5, got null</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <XCircleIcon className="h-4 w-4 text-red-500" />
                  <span className="text-gray-600">Test case 2: Expected 10, got null</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <XCircleIcon className="h-4 w-4 text-red-500" />
                  <span className="text-gray-600">Test case 3: Expected 15, got null</span>
                </div>
              </div>
            </div>

            {/* Hints */}
            <div className="flex items-center justify-between">
              <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm">
                <LightBulbIcon className="h-4 w-4" />
                <span>Show hint (1/3)</span>
              </button>
              <button className="text-gray-500 hover:text-gray-700 text-sm">
                Reset code
              </button>
            </div>
          </div>
        )}

        {type === 'quiz' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Question 1 of 3</h4>
              <p className="text-gray-700 mb-4">
                Which of the following is the correct way to declare a variable in JavaScript?
              </p>
              <div className="space-y-2">
                {['var myVariable;', 'let myVariable;', 'const myVariable;', 'All of the above'].map((option, index) => (
                  <label key={index} className="flex items-center space-x-3 p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name="quiz-option" className="text-blue-600" />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Progress: 1/3</span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm">
                Next Question
              </button>
            </div>
          </div>
        )}

        {type === 'terminal' && (
          <div className="space-y-4">
            <div className="bg-black rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="flex space-x-1 mr-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
                <span className="text-gray-400 text-sm">Terminal</span>
              </div>
              <div className="font-mono text-sm text-green-400 space-y-1">
                <div>$ pwd</div>
                <div className="text-gray-300">/home/user/project</div>
                <div>$ <span className="bg-gray-600 text-gray-300 px-1">|</span></div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-2">Instructions</h4>
              <p className="text-gray-600 text-sm">
                Navigate to the project directory and list all files including hidden ones.
              </p>
            </div>
          </div>
        )}

        {type === 'system-design' && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-3">Design Challenge</h4>
              <p className="text-gray-600 text-sm mb-4">
                Design a scalable chat application that can handle 1 million concurrent users.
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  <p className="text-sm">Drag components here to build your architecture</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Database</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Load Balancer</span>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Cache</span>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm">
                Add Component
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <span>Powered by CodeCapsule</span>
        <div className="flex items-center space-x-4">
          <span>🔥 2.1k runs</span>
          <span>⭐ 4.8/5</span>
        </div>
      </div>
    </div>
  );
}