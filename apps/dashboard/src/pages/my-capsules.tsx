import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import CreateCapsuleModal from '../components/CreateCapsuleModal';

const API_URL = process.env.NEXT_PUBLIC_WORKERS_API_URL || 'https://devcapsules-api.devleep-edu.workers.dev';

interface Capsule {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  language: string;
  function_name: string | null;
  test_count: number;
  has_hints: number;
  tags: string | null;
  quality_score: number | null;
  is_published: number;
  created_at: string;
  updated_at: string;
  impressions: number;
  total_runs: number;
  total_passes: number;
  total_fails: number;
  completion_rate: number;
  course_names: string | null;
}

type GroupBy = 'none' | 'course' | 'language' | 'difficulty' | 'status';

const DIFFICULTY_STYLE: Record<string, string> = {
  EASY:   'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  MEDIUM: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  HARD:   'bg-red-500/15 text-red-400 border border-red-500/20',
};

const LANG_STYLE: Record<string, { label: string; color: string }> = {
  python:     { label: 'Python',     color: 'bg-sky-500/15 text-sky-400 border border-sky-500/20' },
  python3:    { label: 'Python',     color: 'bg-sky-500/15 text-sky-400 border border-sky-500/20' },
  javascript: { label: 'JavaScript', color: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20' },
  java:       { label: 'Java',       color: 'bg-orange-500/15 text-orange-400 border border-orange-500/20' },
  sql:        { label: 'SQL',        color: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' },
  sqlite3:    { label: 'SQL',        color: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' },
};

export default function MyCapsules() {
  const { user, session, loading } = useAuth();
  const router = useRouter();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); }
  }, [user, loading, router]);

  useEffect(() => {
    if (!session?.access_token) return;
    const fetchCapsules = async () => {
      try {
        setFetchLoading(true);
        const res = await fetch(`${API_URL}/api/v1/my-capsules`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error(`Failed to load capsules: ${res.statusText}`);
        const json = await res.json();
        setCapsules(json.capsules || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load capsules');
      } finally {
        setFetchLoading(false);
      }
    };
    fetchCapsules();
  }, [session?.access_token]);

  const filtered = useMemo(() => {
    if (!search.trim()) return capsules;
    const q = search.toLowerCase();
    return capsules.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.language?.toLowerCase().includes(q) ||
      c.course_names?.toLowerCase().includes(q)
    );
  }, [capsules, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, Capsule[]> = {};

    if (groupBy === 'none') {
      groups['All Capsules'] = filtered;
      return groups;
    }

    for (const c of filtered) {
      let keys: string[] = [];
      switch (groupBy) {
        case 'course': {
          const names = c.course_names ? c.course_names.split(',').map(n => n.trim()) : [];
          keys = names.length > 0 ? names : ['Uncategorized'];
          break;
        }
        case 'language':
          keys = [LANG_STYLE[c.language]?.label || c.language || 'Unknown'];
          break;
        case 'difficulty':
          keys = [c.difficulty || 'Unknown'];
          break;
        case 'status':
          keys = [c.is_published ? 'Published' : 'Draft'];
          break;
      }
      for (const key of keys) {
        if (!groups[key]) groups[key] = [];
        groups[key].push(c);
      }
    }

    // Sort group keys — put Uncategorized last
    const sorted: Record<string, Capsule[]> = {};
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'Uncategorized') return 1;
      if (b === 'Uncategorized') return -1;
      return a.localeCompare(b);
    });
    for (const k of sortedKeys) sorted[k] = groups[k];
    return sorted;
  }, [filtered, groupBy]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading || (!user && !loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#04040a' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500/30 border-t-emerald-500"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">My Capsules</h1>
            <p className="text-sm text-slate-400 mt-1">
              {capsules.length} capsule{capsules.length !== 1 ? 's' : ''}
              {capsules.filter(c => c.is_published).length > 0 &&
                <span className="text-emerald-400 ml-2">
                  {capsules.filter(c => c.is_published).length} published
                </span>
              }
            </p>
          </div>
          <button onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#00ff87] hover:bg-[#00e077] text-[#04040a] px-4 py-2 rounded-lg font-semibold text-sm transition-colors shrink-0">
            + New Capsule
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text" placeholder="Search capsules..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0a0a14] border border-gray-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <select value={groupBy} onChange={e => setGroupBy(e.target.value as GroupBy)}
            className="px-3 py-2 rounded-lg bg-[#0a0a14] border border-gray-800 text-white text-sm focus:outline-none focus:border-emerald-500/50 cursor-pointer">
            <option value="none">No grouping</option>
            <option value="course">Group by Course</option>
            <option value="language">Group by Language</option>
            <option value="difficulty">Group by Difficulty</option>
            <option value="status">Group by Status</option>
          </select>
        </div>

        {/* Content */}
        {fetchLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500/30 border-t-emerald-500"></div>
          </div>
        ) : error ? (
          <div className="rounded-xl p-6 text-center" style={{ background: '#0a0a14' }}>
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={() => window.location.reload()}
              className="mt-3 text-sm text-emerald-400 hover:underline">Retry</button>
          </div>
        ) : capsules.length === 0 ? (
          <div className="rounded-xl border border-gray-800 p-12 text-center" style={{ background: '#0a0a14' }}>
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No capsules yet</h3>
            <p className="text-slate-400 text-sm mb-4">Create your first capsule to get started</p>
            <button onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#00ff87] hover:bg-[#00e077] text-[#04040a] px-5 py-2 rounded-lg font-semibold text-sm transition-colors">
              Create Capsule
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-800 p-8 text-center" style={{ background: '#0a0a14' }}>
            <p className="text-slate-400 text-sm">No capsules match "{search}"</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([groupName, items]) => (
              <div key={groupName}>
                {/* Group Header */}
                {groupBy !== 'none' && (
                  <button onClick={() => toggleGroup(groupName)}
                    className="flex items-center gap-2 w-full text-left mb-3 group">
                    <svg className={`w-4 h-4 text-slate-500 transition-transform ${collapsedGroups.has(groupName) ? '' : 'rotate-90'}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                    <span className="text-sm font-semibold text-white">{groupName}</span>
                    <span className="text-xs text-slate-500 ml-1">({items.length})</span>
                    <div className="flex-1 border-t border-gray-800 ml-2"></div>
                  </button>
                )}

                {/* Capsule Grid */}
                {!collapsedGroups.has(groupName) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map(capsule => (
                      <div key={capsule.id}
                        onClick={() => router.push(`/editor?id=${capsule.id}`)}
                        className="rounded-xl border border-gray-800 p-4 cursor-pointer transition-all hover:border-slate-700 hover:bg-white/[0.02]"
                        style={{ background: '#0a0a14' }}>
                        {/* Top row: title + status */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 flex-1">
                            {capsule.title}
                          </h3>
                          <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            capsule.is_published
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                          }`}>
                            {capsule.is_published ? 'Published' : 'Draft'}
                          </span>
                        </div>

                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            LANG_STYLE[capsule.language]?.color || 'bg-slate-500/15 text-slate-400 border border-slate-500/20'
                          }`}>
                            {LANG_STYLE[capsule.language]?.label || capsule.language}
                          </span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            DIFFICULTY_STYLE[capsule.difficulty] || 'bg-slate-500/15 text-slate-400 border border-slate-500/20'
                          }`}>
                            {capsule.difficulty}
                          </span>
                          {capsule.test_count > 0 && (
                            <span className="text-[10px] text-slate-500">{capsule.test_count} tests</span>
                          )}
                        </div>

                        {/* Course association */}
                        {capsule.course_names && (
                          <div className="flex items-center gap-1 mb-2">
                            <svg className="w-3 h-3 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                            </svg>
                            <span className="text-[11px] text-slate-500 truncate">{capsule.course_names}</span>
                          </div>
                        )}

                        {/* Stats row */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-gray-800/50">
                          <span>{formatDate(capsule.updated_at)}</span>
                          {capsule.total_runs > 0 && (
                            <span className="flex items-center gap-2">
                              <span>{capsule.total_runs} runs</span>
                              {capsule.completion_rate > 0 && (
                                <span className="text-emerald-400">{Math.round(capsule.completion_rate)}% pass</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateCapsuleModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </Layout>
  );
}