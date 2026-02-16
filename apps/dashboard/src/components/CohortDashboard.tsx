import React, { useState, useEffect } from 'react';

// ========== COHORT DASHBOARD (B2B TIER) ==========
// Goal: Show student outcomes and pedagogical insights for instructors

interface StudentProgress {
  student_id: string;
  student_name: string;
  email: string;
  capsules_completed: number;
  total_capsules: number;
  avg_run_to_pass_ratio: number;
  time_to_first_run_avg: number;
  last_activity: string;
  is_at_risk: boolean;
  progress_by_capsule: {
    [capsuleId: string]: {
      status: 'passed' | 'failed' | 'not_started';
      attempts: number;
      last_attempt: string;
    };
  };
}

interface CohortMetrics {
  cohort_id: string;
  cohort_name: string;
  student_count: number;
  avg_time_to_first_run: number;
  avg_run_to_pass_ratio: number;
  completion_rate: number;
  students: StudentProgress[];
  at_risk_students: StudentProgress[];
  capsules: Array<{
    id: string;
    title: string;
    difficulty: string;
    completion_rate: number;
  }>;
}

interface Props {
  cohortId: string;
  instructorId?: string;
}

export default function CohortDashboard({ cohortId, instructorId }: Props) {
  const [metrics, setMetrics] = useState<CohortMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchCohortMetrics();
  }, [cohortId]);

  const fetchCohortMetrics = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/api/analytics/cohort/${cohortId}`);
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to fetch cohort metrics:', error);
      // Mock data for demo
      setMetrics({
        cohort_id: cohortId,
        cohort_name: 'CS 101 - Fall 2024',
        student_count: 28,
        avg_time_to_first_run: 4.2,
        avg_run_to_pass_ratio: 5.4,
        completion_rate: 78.5,
        students: [
          {
            student_id: '1',
            student_name: 'Alice Johnson',
            email: 'alice@university.edu',
            capsules_completed: 8,
            total_capsules: 10,
            avg_run_to_pass_ratio: 3.2,
            time_to_first_run_avg: 2.1,
            last_activity: '2024-11-17T14:30:00Z',
            is_at_risk: false,
            progress_by_capsule: {
              'cap1': { status: 'passed', attempts: 2, last_attempt: '2024-11-15T10:00:00Z' },
              'cap2': { status: 'passed', attempts: 1, last_attempt: '2024-11-16T09:00:00Z' },
              'cap3': { status: 'passed', attempts: 4, last_attempt: '2024-11-17T11:00:00Z' },
              'cap4': { status: 'passed', attempts: 3, last_attempt: '2024-11-17T14:00:00Z' },
              'cap5': { status: 'failed', attempts: 8, last_attempt: '2024-11-17T14:30:00Z' }
            }
          },
          {
            student_id: '2',
            student_name: 'Bob Smith',
            email: 'bob@university.edu',
            capsules_completed: 5,
            total_capsules: 10,
            avg_run_to_pass_ratio: 8.7,
            time_to_first_run_avg: 12.5,
            last_activity: '2024-11-16T16:45:00Z',
            is_at_risk: true,
            progress_by_capsule: {
              'cap1': { status: 'passed', attempts: 6, last_attempt: '2024-11-10T10:00:00Z' },
              'cap2': { status: 'passed', attempts: 12, last_attempt: '2024-11-12T09:00:00Z' },
              'cap3': { status: 'failed', attempts: 15, last_attempt: '2024-11-16T16:45:00Z' },
              'cap4': { status: 'not_started', attempts: 0, last_attempt: '' },
              'cap5': { status: 'not_started', attempts: 0, last_attempt: '' }
            }
          },
          {
            student_id: '3',
            student_name: 'Carol Davis',
            email: 'carol@university.edu',
            capsules_completed: 10,
            total_capsules: 10,
            avg_run_to_pass_ratio: 2.1,
            time_to_first_run_avg: 1.8,
            last_activity: '2024-11-17T15:20:00Z',
            is_at_risk: false,
            progress_by_capsule: {
              'cap1': { status: 'passed', attempts: 1, last_attempt: '2024-11-10T10:00:00Z' },
              'cap2': { status: 'passed', attempts: 2, last_attempt: '2024-11-11T09:00:00Z' },
              'cap3': { status: 'passed', attempts: 3, last_attempt: '2024-11-12T11:00:00Z' },
              'cap4': { status: 'passed', attempts: 2, last_attempt: '2024-11-13T14:00:00Z' },
              'cap5': { status: 'passed', attempts: 1, last_attempt: '2024-11-17T15:20:00Z' }
            }
          }
        ],
        at_risk_students: [
          {
            student_id: '2',
            student_name: 'Bob Smith',
            email: 'bob@university.edu',
            capsules_completed: 5,
            total_capsules: 10,
            avg_run_to_pass_ratio: 8.7,
            time_to_first_run_avg: 12.5,
            last_activity: '2024-11-16T16:45:00Z',
            is_at_risk: true,
            progress_by_capsule: {}
          }
        ],
        capsules: [
          { id: 'cap1', title: 'Variables & Data Types', difficulty: 'Easy', completion_rate: 92.8 },
          { id: 'cap2', title: 'Control Flow', difficulty: 'Easy', completion_rate: 89.3 },
          { id: 'cap3', title: 'Functions', difficulty: 'Medium', completion_rate: 76.4 },
          { id: 'cap4', title: 'Arrays & Objects', difficulty: 'Medium', completion_rate: 71.2 },
          { id: 'cap5', title: 'Recursion', difficulty: 'Hard', completion_rate: 58.9 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-slate-700 h-24 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-8">
      {/* Cohort Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">{metrics.cohort_name}</h2>
          <p className="text-slate-400">{metrics.student_count} students • {metrics.capsules.length} capsules</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedView('grid')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'grid' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Grid View
          </button>
          <button
            onClick={() => setSelectedView('list')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'list' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            List View
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="text-2xl font-bold text-white">{metrics.avg_time_to_first_run.toFixed(1)} min</div>
          <div className="text-sm font-medium text-slate-400">Time-to-First-Run</div>
          <div className="text-xs text-slate-500 mt-1">How long students stare before trying</div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="text-2xl font-bold text-white">{metrics.avg_run_to_pass_ratio.toFixed(1)}</div>
          <div className="text-sm font-medium text-slate-400">Run-to-Pass Ratio</div>
          <div className="text-xs text-slate-500 mt-1">Average attempts before success</div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="text-2xl font-bold text-white">{metrics.completion_rate.toFixed(1)}%</div>
          <div className="text-sm font-medium text-slate-400">Completion Rate</div>
          <div className="text-xs text-slate-500 mt-1">Students who finished all capsules</div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="text-2xl font-bold text-red-400">{metrics.at_risk_students.length}</div>
          <div className="text-sm font-medium text-slate-400">At-Risk Students</div>
          <div className="text-xs text-slate-500 mt-1">Need immediate attention</div>
        </div>
      </div>

      {/* At-Risk Students Alert */}
      {metrics.at_risk_students.length > 0 && (
        <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-400">⚠️ Students Need Help</h3>
              <p className="text-red-300 text-sm">These students have high Run-to-Pass ratios - go help them now!</p>
            </div>
          </div>
          <div className="space-y-3">
            {metrics.at_risk_students.map(student => (
              <div key={student.student_id} className="flex items-center justify-between bg-red-600/5 border border-red-600/20 rounded-lg p-4">
                <div>
                  <div className="font-medium text-white">{student.student_name}</div>
                  <div className="text-sm text-red-300">
                    {student.avg_run_to_pass_ratio.toFixed(1)} attempts per success • 
                    Last active: {new Date(student.last_activity).toLocaleDateString()}
                  </div>
                </div>
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Contact Student
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Progress Grid/List */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-white">👥 Student Progress</h3>
          <p className="text-sm text-slate-400">Green = Passed, Red = Failed, Gray = Not Started</p>
        </div>

        {selectedView === 'grid' ? (
          <div className="p-6 overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left text-sm font-medium text-slate-400 pb-4">Student</th>
                  {metrics.capsules.map(capsule => (
                    <th key={capsule.id} className="text-center text-sm font-medium text-slate-400 pb-4 px-2">
                      <div className="transform -rotate-45 origin-bottom-left whitespace-nowrap">
                        {capsule.title}
                      </div>
                    </th>
                  ))}
                  <th className="text-center text-sm font-medium text-slate-400 pb-4">Progress</th>
                </tr>
              </thead>
              <tbody className="space-y-4">
                {metrics.students.map(student => (
                  <tr key={student.student_id} className="border-t border-slate-700/30">
                    <td className="py-4 pr-6">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${student.is_at_risk ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <div>
                          <div className="font-medium text-white">{student.student_name}</div>
                          <div className="text-xs text-slate-400">{student.avg_run_to_pass_ratio.toFixed(1)} avg attempts</div>
                        </div>
                      </div>
                    </td>
                    {metrics.capsules.map(capsule => {
                      const progress = student.progress_by_capsule[capsule.id];
                      return (
                        <td key={capsule.id} className="text-center py-4 px-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto ${
                            progress?.status === 'passed' ? 'bg-green-600' :
                            progress?.status === 'failed' ? 'bg-red-600' :
                            'bg-slate-600'
                          }`}>
                            {progress?.status === 'passed' ? '✓' :
                             progress?.status === 'failed' ? '✗' : '—'}
                          </div>
                          {progress?.attempts > 0 && (
                            <div className="text-xs text-slate-400 mt-1">{progress.attempts}</div>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center py-4">
                      <div className="text-sm font-medium text-white">
                        {student.capsules_completed}/{student.total_capsules}
                      </div>
                      <div className="w-20 bg-slate-700 rounded-full h-2 mx-auto mt-1">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(student.capsules_completed / student.total_capsules) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {metrics.students.map(student => (
              <div key={student.student_id} className="p-6 hover:bg-slate-700/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full mr-4 ${student.is_at_risk ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <div>
                      <div className="font-medium text-white">{student.student_name}</div>
                      <div className="text-sm text-slate-400">{student.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      {student.capsules_completed}/{student.total_capsules} completed
                    </div>
                    <div className="text-xs text-slate-400">
                      {student.avg_run_to_pass_ratio.toFixed(1)} avg attempts
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}