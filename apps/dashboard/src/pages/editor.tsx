import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import PublishEmbedModal from '../components/PublishEmbedModal';
import { useSaveCapsule } from '../hooks/useSaveCapsule';

// Mock data for the editor
const mockCapsuleData = {
  id: '123',
  title: 'Python: Two-Sum Problem',
  problemStatement: `# Two Sum Problem

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

  const runCode = () => {
    // Simulate code execution
    setOutput('Running tests...\n✅ Test 1 passed\n✅ Test 2 passed\n❌ Test 3 failed: IndexError\n\nScore: 2/3 tests passed');
  };

  const requestHint = () => {
    setShowHints(!showHints);
  };

  return (
    <div className="h-full flex flex-col bg-slate-800/30 rounded-lg overflow-hidden">
      {/* Preview Header */}
      <div className="flex-shrink-0 p-3 border-b border-slate-600/30">
        <h3 className="text-base font-medium text-white">Student View</h3>
      </div>

      {/* Problem Statement */}
      <div className="flex-shrink-0 p-3 border-b border-slate-600/30">
        <div className="text-sm text-slate-200 leading-relaxed">
          <div className="font-medium mb-2">Two Sum Problem</div>
          <div className="text-slate-300 text-xs line-clamp-2">{capsuleData.problemStatement.substring(0, 150)}...</div>
        </div>
      </div>

      {/* Code Editor Area */}
      <div className="flex-1 flex flex-col p-4 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0">
          <label className="block text-sm font-medium text-slate-400 mb-2 flex-shrink-0">Your Solution:</label>
          <textarea
            value={userCode}
            onChange={(e) => setUserCode(e.target.value)}
            className="flex-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-0"
            placeholder="Write your code here..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-3 mb-3 flex-shrink-0">
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
        </div>

        {/* Hints */}
        {showHints && (
          <div className="mb-3 p-3 bg-yellow-600/10 border border-yellow-600/30 rounded-lg flex-shrink-0">
            <h4 className="text-yellow-400 font-medium mb-2">💡 Hints:</h4>
            <ul className="space-y-1 text-sm text-slate-300">
              {capsuleData.hints.map((hint: string, index: number) => (
                <li key={index}>• {hint}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="bg-slate-900 border border-slate-600 rounded-lg p-3 flex-shrink-0 max-h-32 overflow-y-auto">
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
  const { saveCapsule, saving, error: saveError } = useSaveCapsule();

  // Load generated content from URL parameters or existing capsule for editing
  useEffect(() => {
    if (router.query.generated === 'true' && router.query.capsule) {
      console.log('📥 Loading generated content from URL parameters');
      
      try {
        const capsuleJson = JSON.parse(router.query.capsule as string);
        console.log('📋 Parsed capsule data:', capsuleJson);
        
        // Transform hints to match editor format
        const transformedHints = capsuleJson.hints?.map((hint: any, index: number) => {
          const hintContent = typeof hint === 'string' ? hint : hint.content || hint;
          return hintContent;
        }) || [];
        
        // Transform test cases to match editor format  
        const transformedTestCases = capsuleJson.testCases?.map((testCase: any, index: number) => ({
          id: index + 1,
          name: testCase.name || `Test case ${index + 1}`,
          input: testCase.input || `Input: ${JSON.stringify(testCase.inputs || [])}`,
          expected: testCase.output || testCase.expected || 'Expected result'
        })) || [];
        
        const generatedCapsule = {
          ...mockCapsuleData,
          id: `generated_${Date.now()}`,
          title: capsuleJson.title || 'Generated Code Challenge',
          problemStatement: capsuleJson.problemStatement || capsuleJson.description || 'Complete the function below.',
          hints: transformedHints,
          solutionStub: capsuleJson.starterCode || capsuleJson.code || '// Your code here',
          referenceSolution: capsuleJson.solution || capsuleJson.starterCode || '// Solution not available',
          testCases: transformedTestCases,
          language: capsuleJson.language || 'javascript',
          difficulty: capsuleJson.difficulty || 'medium',
          executionOutput: capsuleJson.executionOutput || '',
          executionSuccess: capsuleJson.executionSuccess || false,
          learningObjectives: capsuleJson.learningObjectives || [],
          concepts: capsuleJson.concepts || []
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
  
  const loadCapsuleForEditing = async (capsuleId: string) => {
    try {
      console.log('📝 Loading capsule for editing:', capsuleId);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/capsules/${capsuleId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load capsule');
      }
      
      const data = await response.json();
      
      if (data.success && data.capsule) {
        const dbCapsule = data.capsule;
        
        // Transform database capsule to editor format
        const editorCapsule = {
          id: dbCapsule.id,
          title: dbCapsule.title,
          problemStatement: dbCapsule.description,
          hints: dbCapsule.content?.hints || [],
          solutionStub: dbCapsule.content?.solutionStub || '// Your code here',
          referenceSolution: dbCapsule.content?.referenceSolution || '// Solution not available',
          testCases: dbCapsule.content?.testCases || [],
          language: dbCapsule.content?.language || 'javascript',
          difficulty: dbCapsule.content?.difficulty || 'medium',
          executionOutput: dbCapsule.content?.executionOutput || '',
          executionSuccess: dbCapsule.content?.executionSuccess || false,
          learningObjectives: dbCapsule.content?.learningObjectives || [],
          concepts: dbCapsule.content?.concepts || []
        };
        
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

  const runTests = () => {
    // Simulate running reference solution against test cases
    alert('✅ All tests passed! Reference solution is working correctly.');
  };

  const regenerate = () => {
    // Simulate regenerating with AI
    alert('🔄 Regenerating capsule with fresh AI generation...');
  };

  const publishAndEmbed = () => {
    setIsPublishModalOpen(true);
  };

  const handleSaveCapsule = async () => {
    try {
      // Check if this is a real database capsule or mock data
      const isRealCapsule = capsuleData.id && 
                           capsuleData.id !== '123' && 
                           !capsuleData.id.startsWith('generated_') &&
                           !capsuleData.id.includes('mock');
                           
      if (!isRealCapsule) {
        alert('⚠️ This capsule hasn\'t been generated yet. Please generate a capsule first before saving.');
        return;
      }
      
      // Transform the capsule data to match database schema
      const updateData = {
        title: capsuleData.title,
        description: capsuleData.problemStatement,
        content: {
          problemStatement: capsuleData.problemStatement,
          hints: capsuleData.hints,
          solutionStub: capsuleData.solutionStub,
          referenceSolution: capsuleData.referenceSolution,
          testCases: capsuleData.testCases,
          language: (capsuleData as any).language || 'javascript',
          difficulty: (capsuleData as any).difficulty || 'medium',
          executionOutput: (capsuleData as any).executionOutput || '',
          executionSuccess: (capsuleData as any).executionSuccess || false,
          learningObjectives: (capsuleData as any).learningObjectives || [],
          concepts: (capsuleData as any).concepts || []
        },
        runtime: {
          language: (capsuleData as any).language || 'javascript',
          executionMode: 'wasm',
          dependencies: []
        },
        pedagogy: {
          hints: capsuleData.hints,
          learningObjectives: (capsuleData as any).learningObjectives || [],
          concepts: (capsuleData as any).concepts || []
        }
      };

      console.log('💾 Saving capsule:', capsuleData.title);
      const savedCapsule = await saveCapsule(capsuleData.id, updateData);
      console.log('✅ Capsule saved successfully:', savedCapsule.title);
      
      // Show success message
      alert('✅ Capsule saved successfully!');
      
    } catch (error) {
      console.error('❌ Failed to save capsule:', error);
      alert('❌ Failed to save capsule. Please try again.');
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
              <div className="text-xs text-slate-400">CodeCapsule by Devleep</div>
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
                value={capsuleData.problemStatement}
                onChange={(e) => updateProblemStatement(e.target.value)}
                className="w-full h-32 bg-slate-700/50 border-0 rounded p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describe the coding challenge in detail..."
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
                value={capsuleData.solutionStub}
                onChange={(e) => updateSolutionStub(e.target.value)}
                className="w-full h-24 bg-slate-700/50 border-0 rounded p-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="function solution() {\n    // Your code here\n}"
              />
            </div>

            {/* Reference Solution */}
            <div className="bg-slate-800/30 rounded-lg p-4">
              <label className="block text-sm font-medium text-slate-300 mb-3 uppercase tracking-wide">Reference Solution</label>
              <textarea
                value={capsuleData.referenceSolution}
                onChange={(e) => updateReferenceSolution(e.target.value)}
                className="w-full h-40 bg-slate-700/50 border-0 rounded p-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                placeholder="function solution() {\n    // Complete implementation\n    return result;\n}"
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
            <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 p-4 -mx-6 space-y-3">
              <button 
                onClick={runTests}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Run Tests
              </button>
              
              {/* Save Error Display */}
              {saveError && (
                <div className="mb-3 p-3 bg-red-600/10 border border-red-600/30 rounded-lg">
                  <p className="text-red-400 text-sm">❌ Save failed: {saveError}</p>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button 
                  onClick={handleSaveCapsule}
                  disabled={saving}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  onClick={regenerate}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                >
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Student Live Preview */}
        <div className="flex-1 p-6 min-h-0 overflow-hidden">
          <div className="h-full">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white">Student View</h2>
              <p className="text-sm text-slate-400 mt-1">How students will see and interact with this capsule</p>
            </div>
            <div className="h-[calc(100%-60px)]">
              <LivePreview capsuleData={capsuleData} />
            </div>
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