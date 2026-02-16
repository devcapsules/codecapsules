import React, { useState, useEffect } from 'react';

// ========== B2B ANALYTICS DASHBOARD ==========
// Your Strategic Data Moat - The "Brain" of Your Platform

interface FailingTestCase {
  test_case_name: string;
  failure_rate: number;
  student_count: number;
  insight: string;
}

interface AtRiskStudent {
  user_id: string;
  student_name?: string;
  run_to_pass_ratio: number;
  stuck_test_cases: string[];
  time_since_last_attempt: number;
  needs_help_score: number;
}

interface PedagogicalMetrics {
  student_count: number;
  avg_run_to_pass_ratio: number;
  avg_time_to_first_run: number;
  at_risk_students: AtRiskStudent[];
  failing_test_cases: FailingTestCase[];
}

interface Props {
  capsuleId: string;
  cohortId?: string;
  tier: 'pro' | 'b2b';
}

export default function B2BAnalyticsDashboard({ capsuleId, cohortId, tier }: Props) {
  const [metrics, setMetrics] = useState<PedagogicalMetrics | null>(null);
  const [failingTests, setFailingTests] = useState<FailingTestCase[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [capsuleId, cohortId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch pedagogical metrics
      const metricsResponse = await fetch(`/api/analytics/pedagogical/${capsuleId}${cohortId ? `?cohortId=${cohortId}` : ''}`);
      const metricsData = await metricsResponse.json();
      if (metricsData.success) {
        setMetrics(metricsData.metrics);
      }

      // Fetch failing test cases (The "Money Shot")
      const failingResponse = await fetch(`/api/analytics/failing-tests/${capsuleId}`);
      const failingData = await failingResponse.json();
      if (failingData.success) {
        setFailingTests(failingData.failing_tests);
      }

      // Fetch at-risk students if cohort is specified
      if (cohortId) {
        const riskResponse = await fetch(`/api/analytics/at-risk-students/${cohortId}`);
        const riskData = await riskResponse.json();
        if (riskData.success) {
          setAtRiskStudents(riskData.at_risk_students);
        }
      }

    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-slate-400">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {tier === 'b2b' ? 'B2B Pedagogical Intelligence' : 'Pro Content Analytics'}
        </h1>
        <p className="text-blue-100">
          {tier === 'b2b' 
            ? 'Data-driven insights to improve student outcomes' 
            : 'Understand how your content engages users'
          }
        </p>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Students"
            value={metrics.student_count}
            icon="👥"
            description="Total active students"
          />
          <MetricCard
            title="Avg Run-to-Pass Ratio"
            value={metrics.avg_run_to_pass_ratio.toFixed(1)}
            icon="🎯"
            description="Difficulty indicator (lower is easier)"
            trend={metrics.avg_run_to_pass_ratio > 7 ? 'high' : metrics.avg_run_to_pass_ratio < 3 ? 'low' : 'normal'}
          />
          <MetricCard
            title="Avg Time to First Run"
            value={`${metrics.avg_time_to_first_run}s`}
            icon="⏱️"
            description="Problem clarity indicator"
          />
        </div>
      )}

      {/* The "Money Shot" - Top Failing Test Cases */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center">
              💥 Top Failing Test Cases
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              These are the exact topics to re-teach in tomorrow's lecture
            </p>
          </div>
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-1">
            <span className="text-red-400 text-sm font-medium">High Priority</span>
          </div>
        </div>

        <div className="space-y-4">
          {failingTests.map((test, index) => (
            <div
              key={index}
              className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white">{test.test_case_name}</h3>
                <div className="flex items-center space-x-4">
                  <span className="text-red-400 font-semibold">
                    {test.failure_rate.toFixed(1)}% Failure Rate
                  </span>
                  <span className="text-slate-400 text-sm">
                    {test.student_count} students affected
                  </span>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-400">💡</span>
                  <p className="text-slate-300 text-sm">{test.insight}</p>
                </div>
              </div>
              {/* Failure Rate Bar */}
              <div className="mt-3">
                <div className="bg-slate-600 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${test.failure_rate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* At-Risk Students (B2B Only) */}
      {tier === 'b2b' && atRiskStudents.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center">
                🚨 At-Risk Students
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                These students need immediate instructor attention
              </p>
            </div>
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg px-3 py-1">
              <span className="text-orange-400 text-sm font-medium">
                {atRiskStudents.length} students need help
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {atRiskStudents.map((student, index) => (
              <div
                key={index}
                className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-white">
                    {student.student_name || student.user_id}
                  </h3>
                  <div className="flex items-center space-x-4">
                    <span className="text-orange-400 font-semibold">
                      {student.run_to_pass_ratio.toFixed(1)} attempts/pass
                    </span>
                    <span className="text-slate-400 text-sm">
                      {student.time_since_last_attempt}h ago
                    </span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-slate-300 text-sm mb-2">Stuck on:</p>
                  <div className="flex flex-wrap gap-2">
                    {student.stuck_test_cases.map((testCase, idx) => (
                      <span
                        key={idx}
                        className="bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-1 rounded text-xs"
                      >
                        {testCase}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Help Score Bar */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Needs Help Score:</span>
                  <div className="flex items-center space-x-2">
                    <div className="bg-slate-600 rounded-full h-2 w-24">
                      <div
                        className={`h-2 rounded-full ${
                          student.needs_help_score >= 80 ? 'bg-red-500' : 
                          student.needs_help_score >= 60 ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${student.needs_help_score}%` }}
                      ></div>
                    </div>
                    <span className="text-white text-sm font-medium">
                      {student.needs_help_score}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Items */}
      <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-400 mb-4">📋 Recommended Actions</h2>
        <div className="space-y-2">
          {failingTests.slice(0, 3).map((test, index) => (
            <div key={index} className="flex items-start space-x-2">
              <span className="text-blue-400 text-sm mt-1">•</span>
              <p className="text-slate-300 text-sm">
                Address <strong>{test.test_case_name}</strong> in next lecture 
                ({test.failure_rate.toFixed(0)}% of students struggling)
              </p>
            </div>
          ))}
          {atRiskStudents.length > 0 && (
            <div className="flex items-start space-x-2">
              <span className="text-blue-400 text-sm mt-1">•</span>
              <p className="text-slate-300 text-sm">
                Schedule 1-on-1 sessions with {atRiskStudents.length} at-risk students
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Component
function MetricCard({ 
  title, 
  value, 
  icon, 
  description, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  icon: string; 
  description: string; 
  trend?: 'high' | 'low' | 'normal';
}) {
  const getTrendColor = () => {
    switch (trend) {
      case 'high': return 'text-red-400';
      case 'low': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-300 text-sm font-medium uppercase tracking-wide">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="mb-2">
        <span className={`text-2xl font-bold ${getTrendColor()}`}>{value}</span>
      </div>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}