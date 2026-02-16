/**
 * TestFailureDisplay - Enhanced UI for showing test failures with AI Mentor hints
 * Transforms intimidating error messages into helpful, actionable guidance
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Lightbulb, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

export interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  error_message?: string;
  expected?: any;
  actual?: any;
}

export interface AIMentorHint {
  hint_id: string;
  hint_text: string;
  is_cached: boolean;
  confidence_score: number;
  response_time_ms: number;
  cost_saved?: number;
}

export interface TestFailureDisplayProps {
  testResults: TestResult[];
  userCode: string;
  capsuleId: string;
  onHintFeedback?: (hintId: string, isHelpful: boolean) => void;
  onRetry?: () => void;
  className?: string;
}

export function TestFailureDisplay({
  testResults,
  userCode,
  capsuleId,
  onHintFeedback,
  onRetry,
  className
}: TestFailureDisplayProps) {
  const [mentorHints, setMentorHints] = useState<Map<string, AIMentorHint>>(new Map());
  const [loadingHints, setLoadingHints] = useState<Set<string>>(new Set());
  const [hintFeedback, setHintFeedback] = useState<Map<string, 'up' | 'down'>>(new Map());

  const passedTests = testResults.filter(t => t.passed);
  const failedTests = testResults.filter(t => !t.passed);

  // Request AI Mentor hints for failed tests
  useEffect(() => {
    failedTests.forEach(async (test) => {
      if (!test.error_message || mentorHints.has(test.id)) return;

      setLoadingHints(prev => new Set(prev).add(test.id));

      try {
        const hint = await requestMentorHint({
          test_case_id: test.id,
          capsule_id: capsuleId,
          submitted_code: userCode,
          error_message: test.error_message
        });

        setMentorHints(prev => new Map(prev).set(test.id, hint));
      } catch (error) {
        console.error('Failed to get mentor hint:', error);
      } finally {
        setLoadingHints(prev => {
          const newSet = new Set(prev);
          newSet.delete(test.id);
          return newSet;
        });
      }
    });
  }, [failedTests, userCode, capsuleId]);

  const handleHintFeedback = (hintId: string, testId: string, isHelpful: boolean) => {
    setHintFeedback(prev => new Map(prev).set(hintId, isHelpful ? 'up' : 'down'));
    onHintFeedback?.(hintId, isHelpful);
  };

  if (testResults.length === 0) {
    return null;
  }

  return (
    <div className={clsx('test-failure-display', className)}>
      {/* Test Summary Header */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-400 rounded-lg mb-4">
        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
        <div className="flex-1">
          <div className="font-semibold text-gray-900">
            {passedTests.length}/{testResults.length} tests passed
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {failedTests.length === 1 
              ? "One test needs attention" 
              : `${failedTests.length} tests need attention`
            }
          </div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        )}
      </div>

      {/* Failed Tests with AI Mentor Hints */}
      <div className="space-y-4">
        {failedTests.map((test) => {
          const hint = mentorHints.get(test.id);
          const isLoadingHint = loadingHints.has(test.id);
          const feedback = hint ? hintFeedback.get(hint.hint_id) : undefined;

          return (
            <div key={test.id} className="border border-red-200 rounded-lg overflow-hidden">
              {/* Test Error Details */}
              <div className="p-4 bg-red-50">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-2">
                      {test.name}
                    </div>
                    <div className="text-sm text-red-700 font-mono bg-red-100 p-2 rounded border-l-2 border-red-400">
                      Error: {test.error_message}
                    </div>
                    {test.expected !== undefined && test.actual !== undefined && (
                      <div className="mt-2 text-xs text-gray-600">
                        <div>Expected: <code className="bg-gray-100 px-1 rounded">{JSON.stringify(test.expected)}</code></div>
                        <div>Actual: <code className="bg-gray-100 px-1 rounded">{JSON.stringify(test.actual)}</code></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Mentor Hint */}
              <div className="p-4 bg-blue-50 border-t border-red-200">
                {isLoadingHint ? (
                  <div className="flex items-center gap-3 text-blue-600">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span className="text-sm">AI Mentor is analyzing your code...</span>
                  </div>
                ) : hint ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-blue-900 mb-1">
                          AI Mentor
                          {hint.is_cached && (
                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              Instant
                            </span>
                          )}
                        </div>
                        <div className="text-blue-800 leading-relaxed">
                          {hint.hint_text}
                        </div>
                      </div>
                    </div>

                    {/* Hint Feedback */}
                    <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                      <div className="text-xs text-blue-600">
                        Was this helpful?
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleHintFeedback(hint.hint_id, test.id, true)}
                          className={clsx(
                            'p-1.5 rounded-md transition-colors',
                            feedback === 'up'
                              ? 'bg-green-100 text-green-600'
                              : 'hover:bg-blue-100 text-blue-400 hover:text-blue-600'
                          )}
                          disabled={!!feedback}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleHintFeedback(hint.hint_id, test.id, false)}
                          className={clsx(
                            'p-1.5 rounded-md transition-colors',
                            feedback === 'down'
                              ? 'bg-red-100 text-red-600'
                              : 'hover:bg-blue-100 text-blue-400 hover:text-blue-600'
                          )}
                          disabled={!!feedback}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Debug info for development */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                        Confidence: {(hint.confidence_score * 100).toFixed(0)}% • 
                        Response: {hint.response_time_ms}ms • 
                        {hint.cost_saved ? `Saved: $${hint.cost_saved.toFixed(3)}` : 'New hint'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-gray-500">
                    <Lightbulb className="h-4 w-4" />
                    <span className="text-sm">AI Mentor temporarily unavailable</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Passed Tests Summary */}
      {passedTests.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-800">
            ✅ <strong>{passedTests.length}</strong> {passedTests.length === 1 ? 'test' : 'tests'} passing
          </div>
        </div>
      )}
    </div>
  );
}

// API function to request mentor hints
async function requestMentorHint(request: {
  test_case_id: string;
  capsule_id: string;
  submitted_code: string;
  error_message: string;
}): Promise<AIMentorHint> {
  // TODO: Replace with actual API endpoint
  const response = await fetch('/api/mentor/hint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: 'current_user', // Get from auth context
      capsule_id: request.capsule_id,
      test_case_id: request.test_case_id,
      submitted_code: request.submitted_code,
      error_signature: {
        error_type: extractErrorType(request.error_message),
        error_message: request.error_message,
        test_case_id: request.test_case_id,
        capsule_id: request.capsule_id
      },
      timestamp: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error('Failed to get mentor hint');
  }

  return response.json();
}

// Helper function to extract error type from error message
function extractErrorType(errorMessage: string): string {
  if (errorMessage.includes('IndexError')) return 'IndexError';
  if (errorMessage.includes('TypeError')) return 'TypeError';
  if (errorMessage.includes('ValueError')) return 'ValueError';
  if (errorMessage.includes('SyntaxError')) return 'SyntaxError';
  if (errorMessage.includes('NameError')) return 'NameError';
  if (errorMessage.includes('AttributeError')) return 'AttributeError';
  return 'UnknownError';
}