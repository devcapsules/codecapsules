/**
 * Minimal Learning Interface - Your Brand Moat
 * 
 * Exactly 5 UI elements. No more, no less.
 * This is your competitive differentiator vs. cluttered IDEs.
 * 
 * Every element is purpose-built to fire meaningful learning events.
 * Pedagogical minimalism > Feature bloat.
 */

import React, { useState, useEffect, useRef } from 'react';
import type { 
  RuntimeAwareCapsule, 
  LearningEvent, 
  SessionStartEvent,
  CodeRunInitiatedEvent,
  HintRequestedEvent 
} from '@codecapsule/core';

export interface MinimalLearningInterfaceProps {
  capsule: RuntimeAwareCapsule;
  onEvent: (event: any) => void; // Simplified for now
  sessionId: string;
  userId: string;
}

/**
 * THE 5 ELEMENTS - Your Brand Identity
 * 
 * 1. Problem - Clear, well-formatted prompt
 * 2. Editor - Clean code input area  
 * 3. Tests - Simple, read-only test cases
 * 4. Output - Terminal/console results
 * 5. Help - Hint/solution system
 */
export const MinimalLearningInterface: React.FC<MinimalLearningInterfaceProps> = ({
  capsule,
  onEvent,
  sessionId,
  userId
}) => {
  
  // ===== STATE (Minimal, Event-Driven) =====
  const [code, setCode] = useState(capsule.content.primary.code?.wasmVersion?.starterCode || '');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentHint, setCurrentHint] = useState<number>(-1);
  const [showSolution, setShowSolution] = useState(false);
  
  // Analytics tracking
  const [sessionStartTime] = useState(Date.now());
  const [runCount, setRunCount] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  
  // ===== SESSION MANAGEMENT =====
  useEffect(() => {
    // Fire session_start event
    const startEvent: SessionStartEvent = {
      id: generateEventId(),
      sessionId,
      capsuleId: capsule.id,
      userId,
      timestamp: new Date(),
      type: 'session_start',
      data: {
        capsuleType: capsule.type,
        difficulty: 'medium', // Get from capsule
        userLevel: 'intermediate' // Get from user context
      }
    };
    
    onEvent(startEvent);
    
    // Cleanup on unmount
    return () => {
      const endEvent = {
        id: generateEventId(),
        sessionId,
        capsuleId: capsule.id,
        userId,
        timestamp: new Date(),
        type: 'session_end' as const,
        data: {
          outcome: showSolution ? 'abandoned' as const : 'timeout' as const,
          totalDuration: Date.now() - sessionStartTime,
          solutionViewed: showSolution,
          hintsUsed,
          totalAttempts: runCount
        }
      };
      
      onEvent(endEvent);
    };
  }, []);
  
  // ===== ELEMENT 1: PROBLEM =====
  const ProblemView = () => (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {capsule.title}
      </h2>
      <div className="prose prose-gray max-w-none">
        <p className="text-gray-700 leading-relaxed">
          {capsule.description}
        </p>
      </div>
      
      {/* Learning objectives (pedagogical clarity) */}
      {capsule.content.primary.code?.wasmVersion && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700 font-medium">
            Language: {capsule.content.primary.code.wasmVersion.language}
          </p>
        </div>
      )}
    </div>
  );
  
  // ===== ELEMENT 2: EDITOR =====
  const CodeEditor = () => {
    const handleCodeChange = (newCode: string) => {
      setCode(newCode);
      // Analytics would be handled here in production
    };
    
    const handleRun = () => {
      const newRunCount = runCount + 1;
      setRunCount(newRunCount);
      setIsRunning(true);
      
      // Fire code_run_initiated event (TTFR metric)
      const runEvent: CodeRunInitiatedEvent = {
        id: generateEventId(),
        sessionId,
        capsuleId: capsule.id,
        userId,
        timestamp: new Date(),
        type: 'code_run_initiated',
        data: {
          runNumber: newRunCount,
          codeLength: code.length,
          timeSinceLastRun: newRunCount > 1 ? 5000 : undefined, // Calculate actual time
          timeSinceSessionStart: Date.now() - sessionStartTime
        }
      };
      
      onEvent(runEvent);
      
      // Execute code (WASM or server based on runtime target)
      executeCode(code);
    };
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-medium">Code Editor</span>
          <button
            onClick={handleRun}
            disabled={isRunning || !code.trim()}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            {isRunning ? 'Running...' : '▶ Run'}
          </button>
        </div>
        
        <textarea
          ref={editorRef}
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          className="w-full h-64 p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="// Write your code here..."
          spellCheck={false}
        />
      </div>
    );
  };
  
  // ===== ELEMENT 3: TESTS =====
  const TestsView = () => {
    const tests = capsule.content.primary.code?.wasmVersion?.testCases || [];
    
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Cases</h3>
        
        {tests.length === 0 ? (
          <p className="text-gray-500 text-sm">No test cases available</p>
        ) : (
          <div className="space-y-3">
            {tests.map((test, index) => (
              <div key={index} className="bg-white p-3 rounded border border-gray-100">
                <div className="text-sm text-gray-600 mb-1">Test {index + 1}</div>
                <div className="font-mono text-sm">
                  <div className="text-gray-700">
                    <span className="text-blue-600">Input:</span> {test.input}
                  </div>
                  <div className="text-gray-700">
                    <span className="text-green-600">Expected:</span> {test.expected}
                  </div>
                </div>
                {test.description && (
                  <div className="text-xs text-gray-500 mt-1">{test.description}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  // ===== ELEMENT 4: OUTPUT =====
  const OutputView = () => (
    <div className="bg-gray-900 text-green-400 rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-800 text-white px-4 py-2">
        <span className="text-sm font-medium">Output</span>
      </div>
      
      <div className="p-4 h-32 overflow-y-auto">
        {isRunning ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full"></div>
            <span className="text-sm">Executing...</span>
          </div>
        ) : output ? (
          <pre className="text-sm font-mono whitespace-pre-wrap">{output}</pre>
        ) : (
          <div className="text-gray-500 text-sm">Click "Run" to see output</div>
        )}
      </div>
    </div>
  );
  
  // ===== ELEMENT 5: HELP =====
  const HelpSystem = () => {
    const handleHintRequest = () => {
      const nextHint = currentHint + 1;
      setCurrentHint(nextHint);
      setHintsUsed(hintsUsed + 1);
      
      // Fire hint_requested event (Hint Utilization metric)
      const hintEvent: HintRequestedEvent = {
        id: generateEventId(),
        sessionId,
        capsuleId: capsule.id,
        userId,
        timestamp: new Date(),
        type: 'hint_requested',
        data: {
          hintIndex: nextHint,
          hintType: 'progressive',
          currentAttempts: runCount,
          timeSinceLastAttempt: 0 // Calculate actual time
        }
      };
      
      onEvent(hintEvent);
    };
    
    const handleShowSolution = () => {
      setShowSolution(true);
      
      // Fire solution_viewed event (Give-Up metric)
      onEvent({
        id: generateEventId(),
        sessionId,
        capsuleId: capsule.id,
        userId,
        timestamp: new Date(),
        type: 'solution_viewed',
        data: {
          totalAttempts: runCount,
          timeSpentBeforeViewing: Date.now() - sessionStartTime,
          hintsUsedBeforeViewing: hintsUsed,
          viewReason: 'give_up'
        }
      });
    };
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Help</h3>
        
        <div className="space-y-3">
          {/* Progressive hints */}
          {!showSolution && (
            <button
              onClick={handleHintRequest}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-medium transition-colors"
            >
              💡 Get Hint ({hintsUsed} used)
            </button>
          )}
          
          {/* Current hint display */}
          {currentHint >= 0 && !showSolution && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="text-sm text-yellow-800">
                <strong>Hint {currentHint + 1}:</strong> This is where the hint would appear
              </div>
            </div>
          )}
          
          {/* Solution (last resort) */}
          {!showSolution ? (
            <button
              onClick={handleShowSolution}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-medium transition-colors"
            >
              🔓 Show Solution
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <div className="text-sm text-red-800 mb-2">
                <strong>Solution:</strong>
              </div>
              <pre className="text-sm font-mono bg-white p-2 rounded border">
                {capsule.content.primary.code?.wasmVersion?.solution || 'Solution not available'}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // ===== CODE EXECUTION =====
  const executeCode = async (codeToRun: string) => {
    try {
      // This would integrate with your WASM/Docker execution system
      // For now, simulate execution
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockOutput = `Executed: ${codeToRun.substring(0, 50)}...
Test 1: ✓ PASS
Test 2: ✗ FAIL - Expected 5, got 3
        
2/3 tests passed`;
      
      setOutput(mockOutput);
      
      // Fire code_run_completed event
      onEvent({
        id: generateEventId(),
        sessionId,
        capsuleId: capsule.id,
        userId,
        timestamp: new Date(),
        type: 'code_run_completed',
        data: {
          runNumber: runCount,
          success: true,
          executionTime: 1000,
          output: mockOutput,
          runtimeTarget: capsule.runtime.target === 'hybrid' ? 'wasm' : capsule.runtime.target
        }
      });
      
    } catch (error) {
      setOutput(`Error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };
  
  // ===== MAIN LAYOUT (Grid - Simple & Clean) =====
  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-100 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        
        {/* Left Column */}
        <div className="space-y-6">
          {/* 1. PROBLEM */}
          <ProblemView />
          
          {/* 3. TESTS */}
          <TestsView />
          
          {/* 5. HELP */}
          <HelpSystem />
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          {/* 2. EDITOR */}
          <CodeEditor />
          
          {/* 4. OUTPUT */}
          <OutputView />
        </div>
        
      </div>
    </div>
  );
};

// ===== UTILITIES =====

const generateEventId = (): string => {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ===== EXPORT =====

export default MinimalLearningInterface;