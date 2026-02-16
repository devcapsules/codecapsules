import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import PublishEmbedModal from '../components/PublishEmbedModal';
import { usePublishCapsule } from '../hooks/usePublishCapsule';

// API URL - use production API in production, localhost in development
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://xbjpi644l4.execute-api.us-east-1.amazonaws.com';

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-white font-mono text-sm flex items-center justify-center">
      <div className="animate-pulse">Loading editor...</div>
    </div>
  ),
});

// Helper function to get Monaco Editor language
const getMonacoLanguage = (language: string) => {
  const languageMap: { [key: string]: string } = {
    'javascript': 'javascript',
    'python': 'python',
    'java': 'java',
    'csharp': 'csharp',
    'go': 'go',
    'sql': 'sql',
    'typescript': 'typescript',
    'cpp': 'cpp',
    'c': 'c'
  };
  return languageMap[language.toLowerCase()] || 'javascript';
};

// Detect language from code content as fallback
const detectLanguageFromCode = (code: string): string => {
  // Python indicators
  if (code.includes('def ') || code.includes('import ') && !code.includes('import {') || 
      code.includes('print(') || code.includes('elif ') || code.includes('self.')) {
    return 'python';
  }
  // Java indicators
  if (code.includes('public class ') || code.includes('public static void main') || 
      code.includes('System.out.println')) {
    return 'java';
  }
  // C++ indicators
  if (code.includes('#include <') || code.includes('std::') || code.includes('cout <<')) {
    return 'cpp';
  }
  // SQL indicators
  if (code.match(/SELECT.*FROM/i) || code.match(/INSERT INTO/i) || code.match(/CREATE TABLE/i)) {
    return 'sql';
  }
  // Default to JavaScript
  return 'javascript';
};

// Helper function to parse SQL schema into table format
const parseSchemaToTables = (schemaStatements: string[]) => {
  const tables: { [tableName: string]: { columns: Array<{ name: string, type: string, constraints: string }>, foreignKeys: string[] } } = {};
  
  schemaStatements.forEach(stmt => {
    const createTableMatch = stmt.match(/CREATE TABLE (\w+)\s*\((.*?)\)/i);
    if (createTableMatch) {
      const tableName = createTableMatch[1];
      const columnsStr = createTableMatch[2];
      
      const columns: Array<{ name: string, type: string, constraints: string }> = [];
      const foreignKeys: string[] = [];
      
      // Split by commas, but be careful of commas inside parentheses
      const parts = columnsStr.split(',').map(p => p.trim());
      
      parts.forEach(part => {
        if (part.toUpperCase().includes('FOREIGN KEY')) {
          foreignKeys.push(part);
        } else if (part.toUpperCase().includes('PRIMARY KEY') && !part.includes('(')) {
          // Column-level primary key
          const colMatch = part.match(/(\w+)\s+(.+)/);
          if (colMatch) {
            columns.push({
              name: colMatch[1],
              type: colMatch[2].replace(/PRIMARY KEY/i, '').trim(),
              constraints: 'PRIMARY KEY'
            });
          }
        } else if (!part.toUpperCase().includes('KEY(')) {
          // Regular column
          const colMatch = part.match(/(\w+)\s+(.+)/);
          if (colMatch) {
            columns.push({
              name: colMatch[1],
              type: colMatch[2],
              constraints: ''
            });
          }
        }
      });
      
      tables[tableName] = { columns, foreignKeys };
    }
  });
  
  return tables;
};

// Mock data for the editor
const mockCapsuleData = {
  id: '123',
  title: 'Python: Two-Sum Problem',
  language: 'python',
  problemStatement: `Two Sum Problem

Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.
 
**Example:**
\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\``,
  hints: [
    'Try using a hash map to store numbers you\'ve seen',
    'For each number, check if target - number exists in your hash map',
    'Don\'t forget to handle the case where the same element can\'t be used twice'
  ],
  solutionStub: `def two_sum(nums, target):
    """
    Find two numbers that add up to target
    
    Args:
        nums: List of integers
        target: Target sum
        
    Returns:
        List containing indices of the two numbers
    """
    # Your code here
    pass`,
  referenceSolution: `def two_sum(nums, target):
    """
    Find two numbers that add up to target using hash map
    
    Args:
        nums: List of integers  
        target: Target sum
        
    Returns:
        List containing indices of the two numbers
    """
    num_map = {}
    
    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_map:
            return [num_map[complement], i]
        num_map[num] = i
    
    return []`,
  testCases: [
    {
      id: 1,
      name: 'Handles positive numbers',
      input: 'nums = [2,7,11,15], target = 9',
      expected: '[0,1]'
    },
    {
      id: 2,
      name: 'Handles edge case (zeros)',
      input: 'nums = [3,2,4], target = 6',
      expected: '[1,2]'
    },
    {
      id: 3,
      name: 'Handles negative numbers',
      input: 'nums = [-1,-2,-3,-4,-5], target = -8',
      expected: '[2,4]'
    }
  ]
};

function TestCase({ testCase, onEdit, onDelete }: { testCase: any; onEdit: (testCase: any) => void; onDelete: (id: number) => void }) {
  return (
    <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-white">{testCase.name}</h4>
        <div className="flex space-x-2">
          <button 
            onClick={() => onEdit(testCase)}
            className="text-slate-400 hover:text-blue-400 text-sm"
          >
            Edit
          </button>
          <button 
            onClick={() => onDelete(testCase.id)}
            className="text-slate-400 hover:text-red-400 text-sm"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-slate-400">Input:</span>
          <code className="ml-2 text-green-400 font-mono">{testCase.input}</code>
        </div>
        <div>
          <span className="text-slate-400">Expected:</span>
          <code className="ml-2 text-blue-400 font-mono">{testCase.expected}</code>
        </div>
      </div>
    </div>
  );
}

function LivePreview({ capsuleData }: { capsuleData: any }) {
  const [userCode, setUserCode] = useState(capsuleData.solutionStub);
  const [output, setOutput] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [showSchema, setShowSchema] = useState(false);

  // Update userCode when capsuleData changes (e.g., after loading from DB)
  useEffect(() => {
    setUserCode(capsuleData.solutionStub);
  }, [capsuleData.solutionStub]);

  const runCode = async () => {
    if (!userCode.trim()) {
      setOutput('❌ Please enter some code first.');
      return;
    }

    try {
      setOutput('🚀 Executing your code...');
      
      // Determine language: use capsuleData.language, or detect from code if missing
      const detectedLanguage = (capsuleData as any).language || detectLanguageFromCode(userCode);
      
      const response = await fetch(`${API_URL}/api/execute-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userCode: userCode,
          testCases: capsuleData.testCases || [],
          language: detectedLanguage,
          functionName: extractFunctionName(userCode)
        })
      });

      const result = await response.json();
      
      if (result.success) {
        const { summary, results } = result;
        
        let outputText = `🧪 Test Results:\n\n`;
        
        if (results && results.length > 0) {
          outputText += `✅ Passed: ${summary.passedTests}/${summary.totalTests} (${summary.successRate.toFixed(1)}%)\n\n`;
          
          results.forEach((test: any, index: number) => {
            const status = test.passed ? '✅' : '❌';
            outputText += `${status} Test ${index + 1}`;
            if (test.description) {
              outputText += `: ${test.description}`;
            }
            outputText += '\n';
            
            if (!test.passed && test.error) {
              outputText += `   Error: ${test.error}\n`;
            }
          });
          
          if (summary.allPassed) {
            outputText += '\n🎉 All tests passed! Great job!';
          } else {
            outputText += '\n💡 Some tests failed. Check your logic and try again.';
          }
        } else {
          outputText = 'Code executed successfully (no test cases to run)';
        }
        
        setOutput(outputText);
      } else {
        setOutput(`❌ Execution failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Code execution error:', error);
      setOutput(`❌ Failed to execute code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Helper function to extract function name from code
  const extractFunctionName = (code: string): string => {
    // Try JavaScript function patterns
    let match = code.match(/function\s+(\w+)\s*\(/);
    if (match) return match[1];
    
    // Try arrow function patterns
    match = code.match(/const\s+(\w+)\s*=\s*\(/);
    if (match) return match[1];
    
    // Try Python function patterns
    match = code.match(/def\s+(\w+)\s*\(/);
    if (match) return match[1];
    
    return 'unknownFunction';
  };

  const requestHint = () => {
    setShowHints(!showHints);
  };

  return (
    <div className="min-h-full flex flex-col bg-slate-800/30 rounded-lg">
      {/* Preview Header */}
      <div className="flex-shrink-0 p-3 border-b border-slate-600/30">
        <h3 className="text-base font-medium text-white">Student View</h3>
      </div>

      {/* Problem Statement */}
      <div className="flex-shrink-0 p-3 border-b border-slate-600/30">
        <div className="text-sm text-slate-200 leading-relaxed">
          <div className="font-medium mb-2">{capsuleData.title || "Coding Exercise"}</div>
          <div className="text-slate-300 text-xs line-clamp-2">{capsuleData.problemStatement.substring(0, 150)}...</div>
        </div>
      </div>



      {/* Code Editor Area */}
      <div className="flex-shrink-0 p-4">
        <label className="block text-sm font-medium text-slate-400 mb-2">Your Solution:</label>
        <div className="h-80 border border-slate-600 rounded-lg overflow-hidden">
            <MonacoEditor
              height="100%"
              language={getMonacoLanguage((capsuleData as any).language || 'javascript')}
              value={userCode}
              onChange={(value) => setUserCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                automaticLayout: true,
                tabSize: 2,
                insertSpaces: true,
                wordWrap: 'on',
                folding: true,
                bracketPairColorization: { enabled: true },
                autoIndent: 'full',
                formatOnPaste: true,
                formatOnType: true,
                quickSuggestions: true,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
                snippetSuggestions: 'top',
                parameterHints: { enabled: true },
                hover: { enabled: true },
                contextmenu: true,
                mouseWheelZoom: true,
                cursorBlinking: 'smooth',
                smoothScrolling: true,
                padding: { top: 16, bottom: 16 }
              }}
            />
          </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-3 mb-3">
          <button 
            onClick={runCode}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Run Tests
          </button>
          <button 
            onClick={requestHint}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Hint
          </button>
          {/* Schema Button (for SQL capsules) */}
          {(capsuleData as any).language === 'sql' && (capsuleData as any).schema_setup && (capsuleData as any).schema_setup.length > 0 && (
            <button 
              onClick={() => setShowSchema(!showSchema)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              📋 Schema
            </button>
          )}
        </div>

        {/* Hints */}
        {showHints && (
          <div className="mb-3 p-3 bg-yellow-600/10 border border-yellow-600/30 rounded-lg">
            <h4 className="text-yellow-400 font-medium mb-2">💡 Hints:</h4>
            <ul className="space-y-1 text-sm text-slate-300">
              {capsuleData.hints.map((hint: string, index: number) => (
                <li key={index}>• {hint}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Database Schema (for SQL capsules) */}
        {showSchema && (capsuleData as any).language === 'sql' && (capsuleData as any).schema_setup && (capsuleData as any).schema_setup.length > 0 && (
          <div className="mb-3 p-3 bg-blue-600/10 border border-blue-600/30 rounded-lg">
            <h4 className="text-blue-400 font-medium mb-3">📋 Database Schema:</h4>
            <div>
              {(() => {
                const tables = parseSchemaToTables((capsuleData as any).schema_setup);
                return Object.entries(tables).map(([tableName, tableInfo]) => (
                  <div key={tableName} className="mb-4 last:mb-0">
                    <div className="text-sm font-semibold text-blue-300 mb-2">📋 {tableName}</div>
                    <div className="bg-slate-900/50 rounded border border-slate-700">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-700 bg-slate-800/50">
                            <th className="text-left p-2 text-slate-300 font-medium">Column</th>
                            <th className="text-left p-2 text-slate-300 font-medium">Type</th>
                            <th className="text-left p-2 text-slate-300 font-medium">Constraints</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableInfo.columns.map((col, idx) => (
                            <tr key={idx} className="border-b border-slate-700/50 last:border-b-0">
                              <td className="p-2 text-green-400 font-mono">{col.name}</td>
                              <td className="p-2 text-yellow-400 font-mono">{col.type}</td>
                              <td className="p-2 text-purple-400 text-xs">
                                {col.constraints && <span className="bg-purple-900/30 px-1 py-0.5 rounded">{col.constraints}</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {tableInfo.foreignKeys.length > 0 && (
                        <div className="p-2 border-t border-slate-700 bg-slate-800/30">
                          <div className="text-xs text-slate-400 mb-1">Foreign Keys:</div>
                          {tableInfo.foreignKeys.map((fk, idx) => (
                            <div key={idx} className="text-xs text-orange-400 font-mono">{fk}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>
            <div className="text-xs text-slate-400 mt-2 italic">💡 Use these tables in your SQL queries.</div>
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="bg-slate-900 border border-slate-600 rounded-lg p-3 mb-3">
            <h4 className="text-slate-400 text-sm font-medium mb-2">Output:</h4>
            <pre className="text-sm text-green-400 whitespace-pre-wrap font-mono">{output}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CapsuleEditor() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [capsuleData, setCapsuleData] = useState(mockCapsuleData);
  const [activeHintIndex, setActiveHintIndex] = useState<number | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Refs for auto-resizing textareas
  const problemStatementRef = useRef<HTMLTextAreaElement>(null);
  const solutionStubRef = useRef<HTMLTextAreaElement>(null);
  const referenceSolutionRef = useRef<HTMLTextAreaElement>(null);
  const { 
    validateCapsule, 
    publishCapsule, 
    validateAndPublish,
    isValidating, 
    isPublishing, 
    validationResult, 
    publishResult, 
    error: publishError,
    clearResults 
  } = usePublishCapsule();

  // Load generated content from URL parameters or existing capsule for editing
  useEffect(() => {
    if (router.query.generated === 'true') {
      console.log('📥 Loading generated content...');
      
      try {
        let capsuleJson;
        
        // Try localStorage first (new method to avoid HTTP 431)
        if (router.query.key) {
          console.log('📦 Loading from localStorage with key:', router.query.key);
          const storedData = localStorage.getItem(router.query.key as string);
          if (storedData) {
            capsuleJson = JSON.parse(storedData);
            // Clean up localStorage after loading
            localStorage.removeItem(router.query.key as string);
          } else {
            console.error('❌ No data found in localStorage for key:', router.query.key);
            return;
          }
        }
        // Fallback to URL params (old method)
        else if (router.query.capsule) {
          console.log('📄 Loading from URL parameters (fallback)');
          capsuleJson = JSON.parse(router.query.capsule as string);
        } else {
          console.error('❌ No capsule data found in URL or localStorage');
          return;
        }
        console.log('📋 Parsed capsule data:', capsuleJson);
        
        // Transform hints to match editor format
        const transformedHints = capsuleJson.hints?.map((hint: any, index: number) => {
          const hintContent = typeof hint === 'string' ? hint : hint.content || hint;
          return hintContent;
        }) || [];
        
        // Extract SQL-specific fields if this is a SQL capsule
        const isSQL = (capsuleJson.language || '').toLowerCase() === 'sql' || (capsuleJson.type || '').toLowerCase() === 'sql'
        const database = capsuleJson.content?.primary?.database || {}
        const code = capsuleJson.content?.primary?.code?.wasmVersion || {}
        
        // Get test cases from the correct location based on capsule type
        const rawTestCases = isSQL ? database.testCases : (code.testCases || capsuleJson.testCases)
        
        // Transform test cases to match editor format  
        const transformedTestCases = rawTestCases?.map((testCase: any, index: number) => ({
          id: index + 1,
          name: testCase.name || testCase.description || `Test case ${index + 1}`,
          input: testCase.input || `Input: ${JSON.stringify(testCase.inputs || [])}`,
          expected: testCase.expected_output 
            ? (Array.isArray(testCase.expected_output) 
               ? JSON.stringify(testCase.expected_output, null, 2)
               : testCase.expected_output)
            : (testCase.output || testCase.expected || 'Expected result')
        })) || []
        
        console.log('🔍 DEBUG - Test case transformation:', {
          rawTestCasesLength: rawTestCases?.length || 0,
          transformedLength: transformedTestCases.length,
          sampleRaw: rawTestCases?.[0],
          sampleTransformed: transformedTestCases[0]
        })
        
        console.log('🔍 Loading generated capsule:', { 
          isSQL, 
          language: capsuleJson.language,
          hasDatabaseObject: !!database,
          schemaSetupCount: database.schema_setup?.length || 0 
        })
        
        const generatedCapsule = {
          ...mockCapsuleData,
          id: `generated_${Date.now()}`,
          title: capsuleJson.title || 'Generated Code Challenge',
          problemStatement: capsuleJson.content?.primary?.problemStatement || capsuleJson.problemStatement || capsuleJson.description || 'Complete the function below.',
          hints: transformedHints,
          solutionStub: isSQL ? (database.starterQuery || capsuleJson.starterCode) : (capsuleJson.starterCode || capsuleJson.code || '// Your code here'),
          referenceSolution: isSQL ? (database.solution || capsuleJson.solution) : (capsuleJson.solution || capsuleJson.starterCode || '// Solution not available'),
          testCases: transformedTestCases,
          // Preserve raw test cases from AI pipeline for validation (input_args/expected_output format)
          _rawTestCases: rawTestCases || [],
          language: capsuleJson.language || 'javascript',
          difficulty: capsuleJson.difficulty || 'medium',
          executionOutput: capsuleJson.executionOutput || '',
          executionSuccess: capsuleJson.executionSuccess || false,
          learningObjectives: capsuleJson.learningObjectives || [],
          concepts: capsuleJson.concepts || [],
          // SQL-specific fields
          schema_setup: database.schema_setup || [],
          test_data_setup: database.test_data_setup || [],
          expected_result: database.expected_result || null,
          schema_definition: database.schema || ''
        };
        
        setCapsuleData(generatedCapsule);
        console.log('✅ Generated capsule loaded:', generatedCapsule.title);
        console.log('📊 Data summary:', {
          hints: generatedCapsule.hints.length,
          testCases: generatedCapsule.testCases.length,
          objectives: generatedCapsule.learningObjectives.length
        });
        
      } catch (error) {
        console.error('❌ Failed to parse capsule data from URL:', error);
        // Fallback to mock data
        setCapsuleData(mockCapsuleData);
      }
    } else if (router.query.id && router.query.id !== 'new') {
      // Load existing capsule for editing
      loadCapsuleForEditing(router.query.id as string);
    }
  }, [router.query]);

  // Auto-resize textarea helper function
  const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  // Auto-resize textareas when content changes
  useEffect(() => {
    const textareas = [problemStatementRef, solutionStubRef, referenceSolutionRef];
    textareas.forEach(ref => {
      if (ref.current) {
        autoResizeTextarea(ref.current);
      }
    });
  }, [capsuleData.problemStatement, capsuleData.solutionStub, capsuleData.referenceSolution]);
  
  const loadCapsuleForEditing = async (capsuleId: string) => {
    try {
      console.log('📝 Loading capsule for editing:', capsuleId);
      const response = await fetch(`${API_URL}/api/capsules/${capsuleId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load capsule');
      }
      
      const data = await response.json();
      
      if (data.success && data.capsule) {
        const dbCapsule = data.capsule;
        console.log('📦 Raw capsule from DB:', JSON.stringify(dbCapsule, null, 2));
        
        // Extract content from Universal Format structure
        const content = dbCapsule.content || {};
        const primary = content.primary || {};
        const code = primary.code || {};
        const database = primary.database || {};
        const wasmVersion = code.wasmVersion || {};
        const pedagogy = dbCapsule.pedagogy || {};
        
        // Detect if this is a SQL capsule
        const isSQL = (dbCapsule.language || '').toLowerCase() === 'sql' || (dbCapsule.type || '').toLowerCase() === 'sql' || (dbCapsule.type || '').toLowerCase() === 'database'
        
        console.log('🔍 Loading existing capsule:', {
          isSQL,
          hasDatabase: !!database,
          databaseKeys: Object.keys(database),
          solution: database.solution?.substring(0, 50),
          testCasesCount: database.testCases?.length || 0,
          schemaSetupCount: database.schema_setup?.length || 0
        });
        
        // Extract hints from pedagogy.hints.sequence
        const hintsSequence = pedagogy.hints?.sequence || [];
        const extractedHints = hintsSequence.map((hint: any) => 
          typeof hint === 'string' ? hint : hint.content || hint.text || ''
        );
        
        // Transform database capsule to editor format
        const editorCapsule: any = {
          id: dbCapsule.id,
          title: dbCapsule.title,
          problemStatement: primary.problemStatement || dbCapsule.description || '',
          hints: extractedHints,
          solutionStub: isSQL ? (database.starterQuery || '-- Write your SQL query\nSELECT -- Add your query here') : (wasmVersion.starterCode || code.starterCode || '// Your code here'),
          referenceSolution: isSQL ? (database.solution || '-- Solution not available') : (wasmVersion.solution || code.solution || '// Solution not available'),
          testCases: isSQL ? (database.testCases || []) : (wasmVersion.testCases || code.testCases || []),
          language: isSQL ? 'sql' : (code.language || dbCapsule.language || 'javascript'),
          difficulty: dbCapsule.difficulty?.toLowerCase() || 'medium',
          executionOutput: '',
          executionSuccess: false,
          learningObjectives: pedagogy.learningObjectives || [],
          concepts: content.concepts || []
        };
        
        // Add SQL-specific fields for database capsules
        if (isSQL) {
          editorCapsule.schema_setup = database.schema_setup || [];
          editorCapsule.test_data_setup = database.test_data_setup || [];
          editorCapsule.schema_definition = database.schema || '';
        }
        
        console.log('✨ Transformed editor capsule:', {
          title: editorCapsule.title,
          hintsCount: editorCapsule.hints.length,
          hasStarterCode: !!editorCapsule.solutionStub,
          hasSolution: !!editorCapsule.referenceSolution,
          testCasesCount: editorCapsule.testCases.length
        });
        
        setCapsuleData(editorCapsule);
        console.log('✅ Existing capsule loaded for editing:', editorCapsule.title);
      } else {
        throw new Error(data.error || 'Failed to load capsule');
      }
    } catch (error) {
      console.error('❌ Failed to load capsule for editing:', error);
      alert('❌ Failed to load capsule for editing. Redirecting to dashboard.');
      router.push('/dashboard');
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const updateProblemStatement = (value: string) => {
    setCapsuleData(prev => ({ ...prev, problemStatement: value }));
  };

  const updateSolutionStub = (value: string) => {
    setCapsuleData(prev => ({ ...prev, solutionStub: value }));
  };

  const updateReferenceSolution = (value: string) => {
    setCapsuleData(prev => ({ ...prev, referenceSolution: value }));
  };

  const addHint = () => {
    setCapsuleData(prev => ({
      ...prev,
      hints: [...prev.hints, 'New hint...']
    }));
  };

  const updateHint = (index: number, value: string) => {
    setCapsuleData(prev => ({
      ...prev,
      hints: prev.hints.map((hint, i) => i === index ? value : hint)
    }));
  };

  const deleteHint = (index: number) => {
    setCapsuleData(prev => ({
      ...prev,
      hints: prev.hints.filter((_, i) => i !== index)
    }));
  };

  const addTestCase = () => {
    const newTestCase = {
      id: Date.now(),
      name: 'New test case',
      input: 'nums = [], target = 0',
      expected: '[]'
    };
    setCapsuleData(prev => ({
      ...prev,
      testCases: [...prev.testCases, newTestCase]
    }));
  };

  const runTests = async () => {
    if (!capsuleData.referenceSolution || !capsuleData.testCases || capsuleData.testCases.length === 0) {
      alert('❌ No reference solution or test cases available to run tests.');
      return;
    }

    try {
      console.log('🧪 Running tests with reference solution...');
      
      // Determine language: use capsuleData.language, or detect from code if missing
      const detectedLanguage = (capsuleData as any).language || detectLanguageFromCode(capsuleData.referenceSolution);
      
      const response = await fetch(`${API_URL}/api/execute-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userCode: capsuleData.referenceSolution,
          testCases: capsuleData.testCases,
          language: detectedLanguage,
          functionName: extractFunctionName(capsuleData.referenceSolution)
        })
      });

      const result = await response.json();
      
      if (result.success) {
        const { summary, results } = result;
        
        let message = `🧪 Test Results:\n\n`;
        message += `✅ Passed: ${summary.passedTests}/${summary.totalTests} (${summary.successRate.toFixed(1)}%)\n\n`;
        
        results.forEach((test: any, index: number) => {
          const status = test.passed ? '✅' : '❌';
          message += `${status} Test ${index + 1}: ${test.description}\n`;
          if (!test.passed && test.error) {
            message += `   Error: ${test.error}\n`;
          }
        });
        
        if (summary.allPassed) {
          message += '\n🎉 All tests passed! Reference solution is working correctly.';
        } else {
          message += '\n⚠️ Some tests failed. Check the reference solution.';
        }
        
        alert(message);
      } else {
        alert(`❌ Test execution failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Test execution error:', error);
      alert(`❌ Failed to run tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Helper function to extract function name from code
  const extractFunctionName = (code: string): string => {
    // Try JavaScript function patterns
    let match = code.match(/function\s+(\w+)\s*\(/);
    if (match) return match[1];
    
    // Try arrow function patterns
    match = code.match(/const\s+(\w+)\s*=\s*\(/);
    if (match) return match[1];
    
    // Try Python function patterns
    match = code.match(/def\s+(\w+)\s*\(/);
    if (match) return match[1];
    
    return 'unknownFunction';
  };

  const regenerate = () => {
    // Simulate regenerating with AI
    alert('🔄 Regenerating capsule with fresh AI generation...');
  };

  const publishAndEmbed = () => {
    setIsPublishModalOpen(true);
  };

  const handleValidateCapsule = async () => {
    try {
      clearResults();
      
      // Check if this is a generated capsule
      const isGeneratedCapsule = (capsuleData as any).language && (capsuleData as any).difficulty;
      
      if (!isGeneratedCapsule) {
        alert('⚠️ This capsule hasn\'t been generated yet. Please generate a capsule first before validating.');
        return;
      }
      
      // Detect SQL capsules
      const language = (capsuleData as any).language || 'javascript';
      const isSQL = language.toLowerCase() === 'sql';
      
      console.log('🧪 Validating capsule:', capsuleData.title, '| Type:', isSQL ? 'SQL' : 'CODE');
      
      // Transform capsule data to API format
      const capsuleForValidation = {
        title: capsuleData.title,
        language: language,
        content: {
          primary: isSQL ? {
            problemStatement: capsuleData.problemStatement,
            database: {
              schema: (capsuleData as any).schema_definition || '',
              seedData: (capsuleData as any).seed_data || [],
              starterQuery: capsuleData.solutionStub || 'SELECT * FROM users;',
              solution: capsuleData.referenceSolution || capsuleData.solutionStub,
              testCases: capsuleData.testCases || [],
              schema_setup: (capsuleData as any).schema_setup || [],
              test_data_setup: (capsuleData as any).test_data_setup || [],
              expected_result: (capsuleData as any).expected_result || null
            }
          } : {
            code: {
              wasmVersion: {
                solution: capsuleData.referenceSolution || capsuleData.solutionStub,
                starterCode: capsuleData.solutionStub,
                testCases: capsuleData.testCases
              }
            },
            problemStatement: capsuleData.problemStatement
          }
        }
      };
      
      await validateCapsule(capsuleForValidation);
      
    } catch (error) {
      console.error('❌ Failed to validate capsule:', error);
      alert('❌ Failed to validate capsule. Please try again.');
    }
  };

  const handlePublishCapsule = async () => {
    try {
      // Check if validation passed
      if (!validationResult?.success || !validationResult?.readyToPublish) {
        alert('⚠️ Please validate the capsule first before publishing.');
        return;
      }
      
      // Transform capsule data to API format
      const language = (capsuleData as any).language || 'javascript'
      const isSQL = language.toLowerCase() === 'sql'
      
      console.log('💾 Saving capsule - DEBUG:', {
        rawLanguage: (capsuleData as any).language,
        language,
        languageLower: language.toLowerCase(),
        isSQL,
        hasSchemaSetup: !!((capsuleData as any).schema_setup),
        schemaSetupLength: ((capsuleData as any).schema_setup || []).length,
        capsuleDataKeys: Object.keys(capsuleData)
      })
      
      const capsuleForPublish = {
        title: capsuleData.title,
        description: capsuleData.problemStatement,
        type: isSQL ? 'SQL' : 'CODE',
        language: language,
        difficulty: (capsuleData as any).difficulty || 'medium',
        tags: ['generated'],
        content: {
          primary: isSQL ? {
            problemStatement: capsuleData.problemStatement,
            database: {
              schema: (capsuleData as any).schema_definition || '',
              seedData: (capsuleData as any).seed_data || [],
              starterQuery: capsuleData.solutionStub || 'SELECT * FROM users;',
              solution: capsuleData.referenceSolution || capsuleData.solutionStub,
              testCases: capsuleData.testCases || [],
              schema_setup: (capsuleData as any).schema_setup || [],
              test_data_setup: (capsuleData as any).test_data_setup || [],
              expected_result: (capsuleData as any).expected_result || null
            }
          } : {
            problemStatement: capsuleData.problemStatement,
            code: {
              wasmVersion: {
                solution: capsuleData.referenceSolution || capsuleData.solutionStub,
                starterCode: capsuleData.solutionStub,
                testCases: capsuleData.testCases
              }
            }
          }
        },
        pedagogy: {
          hints: {
            sequence: capsuleData.hints || []
          },
          learningObjectives: (capsuleData as any).learningObjectives || [],
          concepts: (capsuleData as any).concepts || []
        }
      };
      
      console.log('🚀 Publishing capsule:', capsuleData.title);
      const result = await publishCapsule(capsuleForPublish, { publish: true });
      
      if (result?.success) {
        alert(`✅ Capsule published successfully! ID: ${result.capsule?.id}`);
      }
      
    } catch (error) {
      console.error('❌ Failed to publish capsule:', error);
      alert('❌ Failed to publish capsule. Please try again.');
    }
  };

  const handleValidateAndPublish = async () => {
    try {
      clearResults();
      
      // Check if this is a generated capsule
      const isGeneratedCapsule = (capsuleData as any).language && (capsuleData as any).difficulty;
      
      if (!isGeneratedCapsule) {
        alert('⚠️ This capsule hasn\'t been generated yet. Please generate a capsule first.');
        return;
      }
      
      // Detect SQL capsules
      const language = (capsuleData as any).language || 'javascript';
      const isSQL = language.toLowerCase() === 'sql';
      
      // Use raw test cases from pipeline (input_args/expected_output format) for validation
      // Fall back to display-format test cases if raw ones aren't available
      const rawTestCases = (capsuleData as any)._rawTestCases || [];
      const hasRawTestCases = rawTestCases.length > 0 && rawTestCases[0]?.input_args !== undefined;
      const validationTestCases = hasRawTestCases ? rawTestCases : capsuleData.testCases || [];
      
      console.log('🔍 Test cases for validation:', {
        hasRawTestCases,
        rawCount: rawTestCases.length,
        displayCount: capsuleData.testCases?.length || 0,
        sampleRaw: rawTestCases[0],
        usingRaw: hasRawTestCases
      });
      
      // Transform capsule data to API format
      const capsuleData_ = {
        title: capsuleData.title,
        description: capsuleData.problemStatement,
        type: isSQL ? 'SQL' : 'CODE',
        language: language,
        difficulty: (capsuleData as any).difficulty || 'medium',
        tags: ['generated'],
        content: {
          primary: isSQL ? {
            problemStatement: capsuleData.problemStatement,
            database: {
              schema: (capsuleData as any).schema_definition || '',
              seedData: (capsuleData as any).seed_data || [],
              starterQuery: capsuleData.solutionStub || 'SELECT * FROM users;',
              solution: capsuleData.referenceSolution || capsuleData.solutionStub,
              testCases: validationTestCases,
              schema_setup: (capsuleData as any).schema_setup || [],
              test_data_setup: (capsuleData as any).test_data_setup || [],
              expected_result: (capsuleData as any).expected_result || null
            }
          } : {
            code: {
              wasmVersion: {
                solution: capsuleData.referenceSolution || capsuleData.solutionStub,
                starterCode: capsuleData.solutionStub,
                testCases: validationTestCases
              }
            },
            problemStatement: capsuleData.problemStatement
          }
        },
        pedagogy: {
          hints: {
            sequence: capsuleData.hints || []
          },
          learningObjectives: (capsuleData as any).learningObjectives || [],
          concepts: (capsuleData as any).concepts || []
        }
      };
      
      console.log('🔄 Validating and publishing capsule:', capsuleData.title, '| Type:', isSQL ? 'SQL' : 'CODE');
      
      console.log('📋 Passing test cases to validation:', validationTestCases.length, 'test cases');
      
      const result = await validateAndPublish(capsuleData_, validationTestCases);
      
      if (result?.success) {
        alert(`🎉 Capsule validated and published successfully! ID: ${result.capsule?.id}`);
      }
      
    } catch (error) {
      console.error('❌ Failed to validate and publish capsule:', error);
      alert('❌ Failed to validate and publish capsule. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header Bar */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg lg:text-xl font-semibold text-white">{capsuleData.title}</h1>
              <div className="text-xs text-slate-400">Devcapsules</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="bg-slate-600 hover:bg-slate-700 text-white p-2 rounded-lg transition-colors"
              title={sidebarCollapsed ? "Show Setup Panel" : "Hide Setup Panel"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                )}
              </svg>
            </button>
            <button 
              onClick={publishAndEmbed}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Publish & Embed
            </button>
          </div>
        </div>
      </div>

      {/* Two Panel Layout - 50:50 Split */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel: Complete Setup & Configuration - Scrollable */}
        <div className={`${sidebarCollapsed ? 'hidden' : 'block'} w-1/2 border-r border-slate-700 overflow-y-auto`}>
          <div className="p-6 space-y-6">
            <div className="pb-2">
              <h2 className="text-xl font-semibold text-white">Capsule Setup</h2>
              <p className="text-sm text-slate-400 mt-1">Configure problem, hints, code, solution, and tests</p>
            </div>

            {/* Problem Statement */}
            <div className="bg-slate-800/30 rounded-lg p-4">
              <label className="block text-sm font-medium text-slate-300 mb-3 uppercase tracking-wide">Problem Statement</label>
              <textarea
                ref={problemStatementRef}
                value={capsuleData.problemStatement}
                onChange={(e) => {
                  updateProblemStatement(e.target.value);
                  autoResizeTextarea(e.target);
                }}
                className="w-full min-h-24 bg-slate-700/50 border-0 rounded p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
                placeholder="Describe the coding challenge in detail..."
                style={{ height: 'auto' }}
              />
            </div>

            {/* Hints */}
            <div className="bg-slate-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-300 uppercase tracking-wide">Hints ({capsuleData.hints.length})</label>
                <button 
                  onClick={addHint}
                  className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20 transition-colors font-medium"
                >
                  Add Hint
                </button>
              </div>
              <div className="space-y-2">
                {capsuleData.hints.map((hint, index) => (
                  <div key={index} className="flex space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-slate-600/50 rounded-full flex items-center justify-center text-xs text-slate-300 font-medium">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={hint}
                      onChange={(e) => updateHint(index, e.target.value)}
                      className="flex-1 bg-slate-700/50 border-0 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Hint ${index + 1}...`}
                    />
                    <button 
                      onClick={() => deleteHint(index)}
                      className="text-red-400 hover:text-red-300 p-1.5 text-lg font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Starter Code */}
            <div className="bg-slate-800/30 rounded-lg p-4">
              <label className="block text-sm font-medium text-slate-300 mb-3 uppercase tracking-wide">Starter Code</label>
              <textarea
                ref={solutionStubRef}
                value={capsuleData.solutionStub}
                onChange={(e) => {
                  updateSolutionStub(e.target.value);
                  autoResizeTextarea(e.target);
                }}
                className="w-full min-h-20 bg-slate-700/50 border-0 rounded p-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
                placeholder="function solution() {\n    // Your code here\n}"
                style={{ height: 'auto' }}
              />
            </div>

            {/* Reference Solution */}
            <div className="bg-slate-800/30 rounded-lg p-4">
              <label className="block text-sm font-medium text-slate-300 mb-3 uppercase tracking-wide">Reference Solution</label>
              <textarea
                ref={referenceSolutionRef}
                value={capsuleData.referenceSolution}
                onChange={(e) => {
                  updateReferenceSolution(e.target.value);
                  autoResizeTextarea(e.target);
                }}
                className="w-full min-h-32 bg-slate-700/50 border-0 rounded p-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
                placeholder="function solution() {\n    // Complete implementation\n    return result;\n}"
                style={{ height: 'auto' }}
              />
            </div>

            {/* Test Cases */}
            <div className="bg-slate-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-300 uppercase tracking-wide">Test Cases ({capsuleData.testCases.length})</label>
                <button 
                  onClick={addTestCase}
                  className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20 transition-colors font-medium"
                >
                  Add Test
                </button>
              </div>
              <div className="space-y-3">
                {capsuleData.testCases.map((testCase) => (
                  <div key={testCase.id} className="bg-slate-700/30 rounded-lg p-3">
                    <div className="font-medium text-slate-200 mb-2">{testCase.name}</div>
                    <div className="text-slate-300 font-mono text-sm bg-slate-800/50 rounded p-2">
                      <div className="text-blue-300">Input: {testCase.input}</div>
                      <div className="text-green-300 mt-1">Expected: {testCase.expected}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 p-4 -mx-6">
              {/* Status Messages */}
              {publishError && (
                <div className="mb-3 p-3 bg-red-600/10 border border-red-600/30 rounded-lg">
                  <p className="text-red-400 text-sm">❌ Error: {publishError}</p>
                </div>
              )}
              
              {validationResult && (
                <div className={`mb-3 p-3 rounded-lg ${
                  validationResult.success 
                    ? 'bg-green-600/10 border border-green-600/30' 
                    : 'bg-red-600/10 border border-red-600/30'
                }`}>
                  <p className={`text-sm ${
                    validationResult.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {validationResult.success 
                      ? `✅ Validation passed: ${validationResult.validation?.passedCount}/${validationResult.validation?.totalCount} tests` 
                      : `❌ Validation failed: ${validationResult.error}`
                    }
                  </p>
                </div>
              )}
              
              {publishResult && (
                <div className="mb-3 p-3 bg-green-600/10 border border-green-600/30 rounded-lg">
                  <p className="text-green-400 text-sm">🎉 {publishResult.message}</p>
                </div>
              )}
              
              {/* Four Buttons in Single Row */}
              <div className="flex space-x-2">
                <button 
                  onClick={runTests}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  Run Tests
                </button>
                <button 
                  onClick={handleValidateCapsule}
                  disabled={isValidating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-700 disabled:cursor-not-allowed text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  {isValidating ? 'Validating...' : 'Validate'}
                </button>
                <button 
                  onClick={handleValidateAndPublish}
                  disabled={isValidating || isPublishing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  {(isValidating || isPublishing) ? 'Saving...' : 'Save'}
                </button>
                <button 
                  onClick={regenerate}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Student Live Preview */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div>
            <LivePreview capsuleData={capsuleData} />
          </div>
        </div>
      </div>

      {/* Publish & Embed Modal */}
      <PublishEmbedModal 
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        capsuleId={capsuleData.id}
        capsuleTitle={capsuleData.title}
      />
    </div>
  );
}