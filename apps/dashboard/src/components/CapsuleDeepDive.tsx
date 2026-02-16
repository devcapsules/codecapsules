import React, { useState, useEffect } from 'react';

// ========== CAPSULE DEEP-DIVE DASHBOARD ==========
// The "Money" View - What you show in sales demos
// Shows detailed analytics for a single capsule

interface FailingTestCase {
  test_name: string;
  description: string;
  failure_rate: number;
  student_count: number;
  avg_attempts: number;
  common_errors: string[];
  insight: string;
}

interface StudentAttempt {
  student_id: string;
  student_name: string;
  attempts: number;
  last_attempt: string;
  status: 'passed' | 'failed' | 'in_progress';
  time_spent: number;
  errors: string[];
}

interface CapsuleDeepDive {
  capsule_id: string;
  capsule_title: string;
  total_students: number;
  completion_rate: number;
  avg_attempts: number;
  avg_time_to_completion: number;
  failing_test_cases: FailingTestCase[];
  student_attempts: StudentAttempt[];
  difficulty_analysis: {
    too_easy: number;
    just_right: number;
    too_hard: number;
  };
  time_analysis: {
    avg_time_to_first_run: number;
    avg_time_between_attempts: number;
    students_who_gave_up: number;
  };
}

interface Props {
  capsuleId: string;
  cohortId?: string;
}

export default function CapsuleDeepDive({ capsuleId, cohortId }: Props) {
  const [data, setData] = useState<CapsuleDeepDive | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'failing-tests' | 'students' | 'insights'>('failing-tests');

  useEffect(() => {
    fetchCapsuleDeepDive();
  }, [capsuleId, cohortId]);

  const fetchCapsuleDeepDive = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/api/analytics/capsule-deep-dive/${capsuleId}${cohortId ? `?cohort=${cohortId}` : ''}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch capsule deep dive:', error);
      // Mock data for demo - THE KILLER FEATURE
      setData({
        capsule_id: capsuleId,
        capsule_title: 'Array Methods: map, filter, reduce',
        total_students: 45,
        completion_rate: 67.8,
        avg_attempts: 4.3,
        avg_time_to_completion: 18.5,
        failing_test_cases: [
          {
            test_name: 'handles_empty_list_exception',
            description: 'Test case for handling empty arrays',
            failure_rate: 78.2,
            student_count: 35,
            avg_attempts: 6.8,
            common_errors: [
              'TypeError: Cannot read property \'length\' of undefined',
              'ReferenceError: result is not defined',
              'Array.prototype.map called on null or undefined'
            ],
            insight: 'Students forget to check if array exists before calling .map(). Add null check example.'
          },
          {
            test_name: 'handles_sql_join_on_null',
            description: 'SQL JOIN with NULL values',
            failure_rate: 62.1,
            student_count: 28,
            avg_attempts: 5.2,
            common_errors: [
              'No rows returned when expected results',
              'NULL values not handled in JOIN condition',
              'Missing COALESCE or ISNULL function'
            ],
            insight: 'Students don\'t understand how NULL affects JOIN operations. Need more NULL handling examples.'
          },
          {
            test_name: 'handles_positive_numbers',
            description: 'Basic positive number validation',
            failure_rate: 5.3,
            student_count: 2,
            avg_attempts: 1.5,
            common_errors: [
              'Off-by-one error in loop condition'
            ],
            insight: 'This test case is working well - students understand positive number logic.'
          },
          {
            test_name: 'recursive_edge_case',
            description: 'Recursion with base case edge conditions',
            failure_rate: 45.7,
            student_count: 21,
            avg_attempts: 8.1,
            common_errors: [
              'Maximum call stack size exceeded',
              'Base case never reached',
              'Incorrect return value for edge case'
            ],
            insight: 'Students struggle with recursion termination. Add visual recursion tree examples.'
          },
          {
            test_name: 'performance_optimization',
            description: 'Algorithm efficiency test',
            failure_rate: 33.8,
            student_count: 15,
            avg_attempts: 4.7,
            common_errors: [
              'Time limit exceeded',
              'O(n²) solution instead of O(n)',
              'Unnecessary nested loops'
            ],
            insight: 'Students need more big-O notation practice. Consider prerequisite on algorithm complexity.'
          }
        ],
        student_attempts: [
          {
            student_id: '1',
            student_name: 'Alice Johnson',
            attempts: 12,
            last_attempt: '2024-11-17T14:30:00Z',
            status: 'failed',
            time_spent: 45,
            errors: ['TypeError: Cannot read property \'length\' of undefined', 'Array.prototype.map called on null']
          },
          {
            student_id: '2',
            student_name: 'Bob Smith',
            attempts: 3,
            last_attempt: '2024-11-17T10:15:00Z',
            status: 'passed',
            time_spent: 22,
            errors: []
          }
        ],
        difficulty_analysis: {
          too_easy: 8.9,
          just_right: 67.8,
          too_hard: 23.3
        },
        time_analysis: {
          avg_time_to_first_run: 3.2,
          avg_time_between_attempts: 4.7,
          students_who_gave_up: 6
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="bg-slate-700 h-32 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-slate-700 h-24 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-600/30 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">🔍 Capsule Deep-Dive</h2>
            <p className="text-purple-300 text-sm">The instructor's secret weapon - Data-driven teaching insights</p>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-white">{data.capsule_title}</h3>
        <p className="text-purple-200">{data.total_students} students • {data.completion_rate.toFixed(1)}% completion rate</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="text-3xl font-bold text-white">{data.avg_attempts.toFixed(1)}</div>
          <div className="text-sm font-medium text-slate-400">Avg Attempts</div>
          <div className="text-xs text-slate-500 mt-1">Before students succeed</div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="text-3xl font-bold text-white">{data.avg_time_to_completion.toFixed(1)} min</div>
          <div className="text-sm font-medium text-slate-400">Avg Time</div>
          <div className="text-xs text-slate-500 mt-1">To complete successfully</div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="text-3xl font-bold text-white">{data.time_analysis.avg_time_to_first_run.toFixed(1)} min</div>
          <div className="text-sm font-medium text-slate-400">Time to First Run</div>
          <div className="text-xs text-slate-500 mt-1">How long students read first</div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="text-3xl font-bold text-red-400">{data.time_analysis.students_who_gave_up}</div>
          <div className="text-sm font-medium text-slate-400">Students Gave Up</div>
          <div className="text-xs text-slate-500 mt-1">Need intervention</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg">
        {[
          { id: 'failing-tests', label: '🎯 Top Failing Test Cases', subtitle: 'The killer feature' },
          { id: 'students', label: '👥 Student Attempts', subtitle: 'Individual progress' },
          { id: 'insights', label: '💡 Teaching Insights', subtitle: 'Actionable data' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`flex-1 text-left px-4 py-3 rounded-lg transition-colors ${
              selectedTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <div className="font-medium">{tab.label}</div>
            <div className="text-xs opacity-75">{tab.subtitle}</div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {selectedTab === 'failing-tests' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-red-600/10 to-orange-600/10">
            <h3 className="text-lg font-semibold text-white">🎯 Top Failing Test Cases</h3>
            <p className="text-sm text-red-300">
              <strong>The Value:</strong> You immediately know what to re-teach in tomorrow's lecture. No more guessing.
            </p>
          </div>
          <div className="p-6 space-y-6">
            {data.failing_test_cases.map((testCase, index) => (
              <div key={testCase.test_name} className="border border-slate-700/50 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg">{testCase.test_name}</h4>
                        <p className="text-slate-400 text-sm">{testCase.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-red-400">{testCase.failure_rate.toFixed(1)}%</div>
                    <div className="text-sm text-slate-400">Failure Rate</div>
                  </div>
                </div>
                
                {/* Failure Rate Bar */}
                <div className="mb-4">
                  <div className="w-full bg-slate-700 rounded-full h-4">
                    <div 
                      className="bg-gradient-to-r from-red-600 to-red-500 h-4 rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
                      style={{ width: `${testCase.failure_rate}%` }}
                    >
                      <span className="text-white text-xs font-bold">{testCase.failure_rate.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>{testCase.student_count} students failed</span>
                    <span>{testCase.avg_attempts.toFixed(1)} avg attempts</span>
                  </div>
                </div>

                {/* Common Errors */}
                <div className="mb-4">
                  <div className="text-sm font-medium text-slate-300 mb-2">🐛 Common Errors:</div>
                  <div className="space-y-1">
                    {testCase.common_errors.map((error, i) => (
                      <div key={i} className="bg-slate-700/50 border border-slate-600/50 rounded p-2 text-sm text-red-300 font-mono">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Insight - The Money Shot */}
                <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-400">💡 Teaching Insight</div>
                      <div className="text-sm text-slate-300 mt-1">{testCase.insight}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTab === 'students' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h3 className="text-lg font-semibold text-white">👥 Individual Student Progress</h3>
            <p className="text-sm text-slate-400">Detailed attempt history and error analysis</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-700/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Attempts</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Time Spent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Last Attempt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {data.student_attempts.map(student => (
                  <tr key={student.student_id} className="hover:bg-slate-700/20">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-white">{student.student_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        student.status === 'passed' ? 'bg-green-600/20 text-green-400' :
                        student.status === 'failed' ? 'bg-red-600/20 text-red-400' :
                        'bg-yellow-600/20 text-yellow-400'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                      {student.attempts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                      {student.time_spent} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                      {new Date(student.last_attempt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === 'insights' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Difficulty Analysis */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">📊 Difficulty Analysis</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Too Easy</span>
                <span className="text-green-400 font-medium">{data.difficulty_analysis.too_easy.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${data.difficulty_analysis.too_easy}%` }} />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Just Right</span>
                <span className="text-blue-400 font-medium">{data.difficulty_analysis.just_right.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${data.difficulty_analysis.just_right}%` }} />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Too Hard</span>
                <span className="text-red-400 font-medium">{data.difficulty_analysis.too_hard.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${data.difficulty_analysis.too_hard}%` }} />
              </div>
            </div>
          </div>

          {/* Timing Insights */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">⏱️ Timing Insights</h3>
            <div className="space-y-6">
              <div>
                <div className="text-2xl font-bold text-white">{data.time_analysis.avg_time_to_first_run.toFixed(1)} min</div>
                <div className="text-sm text-slate-400">Avg time before first attempt</div>
                <div className="text-xs text-slate-500 mt-1">
                  {data.time_analysis.avg_time_to_first_run > 5 ? 'Problem statement may be unclear' : 'Students understand quickly'}
                </div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-white">{data.time_analysis.avg_time_between_attempts.toFixed(1)} min</div>
                <div className="text-sm text-slate-400">Avg time between attempts</div>
                <div className="text-xs text-slate-500 mt-1">
                  {data.time_analysis.avg_time_between_attempts > 6 ? 'Students need more thinking time' : 'Good iteration speed'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}