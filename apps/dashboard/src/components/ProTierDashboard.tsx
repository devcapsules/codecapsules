import React, { useState, useEffect } from 'react';

// ========== PRO TIER DASHBOARD (FOR BLOGGERS) ==========
// Goal: Show content engagement for content creators

interface CapsuleEngagement {
  id: string;
  title: string;
  impressions: number;
  runs: number;
  passes: number;
  engagement_rate: number;
  completion_rate: number;
  created_at: string;
}

interface ProTierMetrics {
  total_impressions: number;
  overall_engagement_rate: number;
  overall_completion_rate: number;
  top_capsules: CapsuleEngagement[];
  funnel_data: {
    impressions: number;
    runs: number;
    passes: number;
  };
}

interface Props {
  userId: string;
}

export default function ProTierDashboard({ userId }: Props) {
  const [metrics, setMetrics] = useState<ProTierMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchProTierMetrics();
  }, [userId, timeRange]);

  const fetchProTierMetrics = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      // Fetch Pro Tier metrics
      const response = await fetch(`${apiUrl}/api/analytics/pro-tier/${userId}?range=${timeRange}`);
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to fetch Pro Tier metrics:', error);
      // Mock data for demo
      setMetrics({
        total_impressions: 15847,
        overall_engagement_rate: 34.2,
        overall_completion_rate: 67.8,
        top_capsules: [
          {
            id: '1',
            title: 'JavaScript Array Methods: Complete Guide',
            impressions: 4521,
            runs: 1847,
            passes: 1234,
            engagement_rate: 40.8,
            completion_rate: 66.9,
            created_at: '2024-11-01'
          },
          {
            id: '2', 
            title: 'Python Functions & Recursion',
            impressions: 3210,
            runs: 1102,
            passes: 856,
            engagement_rate: 34.3,
            completion_rate: 77.7,
            created_at: '2024-10-15'
          },
          {
            id: '3',
            title: 'SQL Joins Made Simple',
            impressions: 2847,
            runs: 892,
            passes: 567,
            engagement_rate: 31.3,
            completion_rate: 63.6,
            created_at: '2024-10-28'
          },
          {
            id: '4',
            title: 'React Hooks Deep Dive',
            impressions: 2156,
            runs: 634,
            passes: 421,
            engagement_rate: 29.4,
            completion_rate: 66.4,
            created_at: '2024-11-05'
          },
          {
            id: '5',
            title: 'Git & GitHub Workflow',
            impressions: 1892,
            runs: 445,
            passes: 312,
            engagement_rate: 23.5,
            completion_rate: 70.1,
            created_at: '2024-10-20'
          }
        ],
        funnel_data: {
          impressions: 15847,
          runs: 5420,
          passes: 3690
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-700 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const funnelSteps = [
    {
      label: 'Impressions',
      value: metrics.funnel_data.impressions,
      percentage: 100,
      color: 'bg-blue-500'
    },
    {
      label: 'Runs',
      value: metrics.funnel_data.runs,
      percentage: (metrics.funnel_data.runs / metrics.funnel_data.impressions) * 100,
      color: 'bg-yellow-500'
    },
    {
      label: 'Passes',
      value: metrics.funnel_data.passes,
      percentage: (metrics.funnel_data.passes / metrics.funnel_data.impressions) * 100,
      color: 'bg-green-500'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Content Performance</h2>
          <p className="text-slate-400">Track how your interactive content engages readers</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Big Number KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Impressions */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          <div className="mb-2">
            <div className="text-3xl font-bold text-white">{metrics.total_impressions.toLocaleString()}</div>
            <div className="text-sm font-medium text-slate-400">Total Impressions</div>
          </div>
          <div className="text-xs text-slate-500">How many people loaded your blog posts</div>
        </div>

        {/* Engagement Rate */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm font-medium px-2 py-1 rounded-full bg-green-600/20 text-green-400">
              Your #1 Metric
            </span>
          </div>
          <div className="mb-2">
            <div className="text-3xl font-bold text-white">{metrics.overall_engagement_rate.toFixed(1)}%</div>
            <div className="text-sm font-medium text-slate-400">Engagement Rate</div>
          </div>
          <div className="text-xs text-slate-500">Percentage of readers who click "Run" - Are people engaging?</div>
        </div>

        {/* Completion Rate */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mb-2">
            <div className="text-3xl font-bold text-white">{metrics.overall_completion_rate.toFixed(1)}%</div>
            <div className="text-sm font-medium text-slate-400">Completion Rate</div>
          </div>
          <div className="text-xs text-slate-500">Is your problem too hard or too easy?</div>
        </div>
      </div>

      {/* Top 5 Capsules Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-white">🏆 Top 5 Capsules</h3>
          <p className="text-sm text-slate-400">Ranked by Engagement Rate - Do more of this!</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-700/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Blog Post
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Impressions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Engagement Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Completion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Runs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Passes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {metrics.top_capsules.map((capsule, index) => (
                <tr key={capsule.id} className="hover:bg-slate-700/20">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded text-white text-xs flex items-center justify-center mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-white">{capsule.title}</div>
                        <div className="text-sm text-slate-400">{new Date(capsule.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                    {capsule.impressions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-medium ${
                      capsule.engagement_rate >= 35 ? 'text-green-400' :
                      capsule.engagement_rate >= 25 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {capsule.engagement_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-medium ${
                      capsule.completion_rate >= 70 ? 'text-green-400' :
                      capsule.completion_rate >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {capsule.completion_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                    {capsule.runs.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                    {capsule.passes.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drop-off Funnel */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-6">📊 Drop-off Funnel</h3>
        <p className="text-sm text-slate-400 mb-6">Where are you losing readers?</p>
        
        <div className="space-y-4">
          {funnelSteps.map((step, index) => (
            <div key={step.label} className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${step.color}`}></div>
                  <span className="text-white font-medium">{step.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{step.value.toLocaleString()}</div>
                  <div className="text-sm text-slate-400">{step.percentage.toFixed(1)}%</div>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div 
                  className={`${step.color} h-3 rounded-full transition-all duration-1000`}
                  style={{ width: `${step.percentage}%` }}
                />
              </div>
              {index < funnelSteps.length - 1 && (
                <div className="absolute left-2 top-12 w-0.5 h-4 bg-slate-600"></div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-yellow-600/10 border border-yellow-600/30 rounded-lg">
          <div className="text-sm text-yellow-400 font-medium">📈 Insight</div>
          <div className="text-sm text-slate-300 mt-1">
            You're losing {(100 - (metrics.funnel_data.runs / metrics.funnel_data.impressions) * 100).toFixed(0)}% of readers at the "Run" step. 
            Consider improving your problem descriptions or adding clearer call-to-action buttons.
          </div>
        </div>
      </div>
    </div>
  );
}