import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

// Mock analytics data
const mockAnalytics = {
  timeToFirstRun: { avg: 32, trend: '+5%' },
  runToPassRatio: { avg: 5.4, trend: '-8%' },
  giveUpRate: { avg: 18, trend: '-12%' },
  hintUtilization: { avg: 45, trend: '+3%' },
  topFailingTests: [
    { testCase: 'edge_case_negative_numbers', failCount: 1204, capsule: 'Two Sum Problem' },
    { testCase: 'handles_empty_array', failCount: 890, capsule: 'Array Methods' },
    { testCase: 'handles_positive_numbers', failCount: 567, capsule: 'Binary Search' },
    { testCase: 'recursive_solution', failCount: 445, capsule: 'Tree Traversal' },
    { testCase: 'optimization_check', failCount: 321, capsule: 'Dynamic Programming' }
  ],
  cohortData: [
    { cohort: 'CS 101 - Fall 2024', students: 45, avgScore: 78, completion: 89 },
    { cohort: 'Bootcamp Batch 12', students: 28, avgScore: 82, completion: 94 },
    { cohort: 'Advanced Algorithms', students: 32, avgScore: 71, completion: 76 }
  ],
  capsulePerformance: [
    { name: 'Two Sum Problem', impressions: 2840, runs: 1950, passRate: 67, avgTime: 185 },
    { name: 'Array Methods', impressions: 1923, runs: 1456, passRate: 78, avgTime: 142 },
    { name: 'Binary Search', impressions: 1567, runs: 1123, passRate: 72, avgTime: 203 },
    { name: 'Tree Traversal', impressions: 1245, runs: 876, passRate: 58, avgTime: 267 }
  ]
};

function MetricCard({ 
  title, 
  value, 
  trend, 
  icon, 
  description 
}: { 
  title: string; 
  value: string | number; 
  trend: string; 
  icon: React.ReactNode; 
  description: string; 
}) {
  const isPositive = trend.startsWith('+');
  const isNegative = trend.startsWith('-');
  
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="text-slate-400">{icon}</div>
        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
          isPositive ? 'bg-green-600/20 text-green-400' :
          isNegative ? 'bg-red-600/20 text-red-400' :
          'bg-slate-600/20 text-slate-400'
        }`}>
          {trend}
        </span>
      </div>
      <div className="mb-2">
        <div className="text-3xl font-bold text-white">{value}</div>
        <div className="text-sm font-medium text-slate-400">{title}</div>
      </div>
      <div className="text-xs text-slate-500">{description}</div>
    </div>
  );
}

function FailingTestChart({ data }: { data: any[] }) {
  const maxFails = Math.max(...data.map(d => d.failCount));
  
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Top Failing Test Cases</h3>
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex-1">
                <div className="font-medium text-white truncate">{item.testCase}</div>
                <div className="text-slate-400 text-xs">{item.capsule}</div>
              </div>
              <div className="text-white font-medium ml-4">{item.failCount.toLocaleString()}</div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-red-600 to-red-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(item.failCount / maxFails) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 bg-blue-600/10 border border-blue-600/30 rounded-lg">
        <div className="text-sm text-blue-400 font-medium">Insight</div>
        <div className="text-sm text-slate-300 mt-1">
          Students struggle most with edge cases. Consider adding more scaffolding hints for boundary conditions.
        </div>
      </div>
    </div>
  );
}

function CohortTable({ data }: { data: any[] }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700/50">
        <h3 className="text-lg font-semibold text-white">👥 Cohort Performance</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-700/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Cohort
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Students
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Avg Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Completion Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {data.map((cohort, index) => (
              <tr key={index} className="hover:bg-slate-700/20">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-white">{cohort.cohort}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                  {cohort.students}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`font-medium ${
                    cohort.avgScore >= 80 ? 'text-green-400' :
                    cohort.avgScore >= 70 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {cohort.avgScore}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-1 bg-slate-700 rounded-full h-2 mr-3">
                      <div 
                        className={`h-2 rounded-full ${
                          cohort.completion >= 90 ? 'bg-green-500' :
                          cohort.completion >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${cohort.completion}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-300">{cohort.completion}%</span>
                  </div>
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
  );
}

export default function Analytics() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedCapsule, setSelectedCapsule] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [selectedCohort, setSelectedCohort] = useState('all');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-slate-400">Deep insights into learning patterns and pedagogical effectiveness</p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Capsule</label>
            <select
              value={selectedCapsule}
              onChange={(e) => setSelectedCapsule(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Capsules</option>
              {mockAnalytics.capsulePerformance.map((capsule, index) => (
                <option key={index} value={capsule.name}>{capsule.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Cohort/Student</label>
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Cohorts</option>
              {mockAnalytics.cohortData.map((cohort, index) => (
                <option key={index} value={cohort.cohort}>{cohort.cohort}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Time-to-First-Run"
            value={`${mockAnalytics.timeToFirstRun.avg}s`}
            trend={mockAnalytics.timeToFirstRun.trend}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            description="How quickly students start coding"
          />
          <MetricCard
            title="Run-to-Pass Ratio"
            value={mockAnalytics.runToPassRatio.avg}
            trend={mockAnalytics.runToPassRatio.trend}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0V9a8 8 0 1115.356 2m-15.356 0H4" /></svg>}
            description="Average attempts before success"
          />
          <MetricCard
            title="Give-Up Rate"
            value={`${mockAnalytics.giveUpRate.avg}%`}
            trend={mockAnalytics.giveUpRate.trend}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>}
            description="Students who abandon exercise"
          />
          <MetricCard
            title="Hint Utilization"
            value={`${mockAnalytics.hintUtilization.avg}%`}
            trend={mockAnalytics.hintUtilization.trend}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
            description="Students who request hints"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Failing Test Cases Chart */}
          <div className="lg:col-span-1">
            <FailingTestChart data={mockAnalytics.topFailingTests} />
          </div>

          {/* Capsule Performance */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-6">📊 Capsule Performance</h3>
            <div className="space-y-4">
              {mockAnalytics.capsulePerformance.map((capsule, index) => (
                <div key={index} className="border border-slate-700/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-white">{capsule.name}</h4>
                    <span className="text-sm text-slate-400">{capsule.impressions} views</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-white">{capsule.runs}</div>
                      <div className="text-slate-400">Runs</div>
                    </div>
                    <div className="text-center">
                      <div className={`font-medium ${capsule.passRate >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {capsule.passRate}%
                      </div>
                      <div className="text-slate-400">Pass Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-white">{Math.floor(capsule.avgTime / 60)}m {capsule.avgTime % 60}s</div>
                      <div className="text-slate-400">Avg Time</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cohort Performance Table */}
        <CohortTable data={mockAnalytics.cohortData} />

        {/* Export and Actions */}
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Last updated: {new Date().toLocaleString()}
          </div>
          <div className="flex space-x-3">
            <button className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              📧 Schedule Report
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              📊 Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}