import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import CreateCapsuleModal from '../components/CreateCapsuleModal';
import PublishEmbedModal from '../components/PublishEmbedModal';
import { useCapsules } from '../hooks/useCapsules';

// Dashboard metrics from command-center API
interface DashboardMetrics {
  total_capsules: number;
  published_capsules: number;
  draft_capsules: number;
  total_impressions: number;
  total_runs: number;
  total_passes: number;
  total_fails: number;
  runs_this_month: number;
  passes_this_month: number;
  fails_this_month: number;
  hints_this_month: number;
  edge_interventions: number;
}

interface DashboardData {
  metrics: DashboardMetrics;
  recent_playlists: any[];
}

const formatNumber = (n: number): string => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
};

// Helper function to format analytics data for display
const formatAnalytics = (capsule: any) => ({
  impressions: (capsule.analytics?.impressions ?? 0).toString(),
  runs: (capsule.analytics?.runs ?? 0).toString(),
  passRate: capsule.analytics?.passRate || '0%'
});

// Helper function to format creation date
const formatCreationDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return '1 day ago';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return `${Math.floor(diffInDays / 30)} months ago`;
};

// Dropdown Menu Component
function DropdownMenu({ 
  children, 
  isOpen, 
  onClose 
}: { 
  children: React.ReactNode; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-8 z-10 w-48 rounded-lg shadow-lg py-1"
      style={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {children}
    </div>
  );
}

// Capsule Card Component  
function CapsuleCard({ 
  capsule, 
  onGetEmbed,
  onDelete 
}: { 
  capsule: any; 
  onGetEmbed: (capsule: any) => void;
  onDelete: (capsuleId: string) => void; 
}) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const getLanguageColor = (lang: string) => {
    switch (lang) {
      case 'Python': return 'text-blue-400 bg-blue-500/20';
      case 'JavaScript': return 'text-yellow-400 bg-yellow-500/20';
      case 'SQL': return 'text-green-400 bg-green-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  // Status: published if it has isPublished flag
  const isPublished = capsule.isPublished === true;

  return (
    <div className="rounded-lg p-6 transition-all group cursor-pointer" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', transition: 'background 0.2s, border-color 0.2s' }}
      onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(0,255,135,0.25)'; }}
      onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.02)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.07)'; }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 text-xs font-medium rounded ${getLanguageColor(capsule.language)}`}>
              {capsule.language}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            {/* Status Dot */}
            <span 
              className={`w-2 h-2 rounded-full ${isPublished ? 'bg-green-500' : 'bg-yellow-500'}`}
              title={isPublished ? 'Published' : 'Draft'}
            />
            <h3 className="font-semibold text-white group-hover:text-[#00ff87] transition-colors">
              {capsule.title}
            </h3>
          </div>
          <p className="text-sm text-slate-400">{formatCreationDate(capsule.createdAt)}</p>
        </div>
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-slate-400 hover:text-white p-1"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
            </svg>
          </button>
          <DropdownMenu isOpen={isDropdownOpen} onClose={() => setIsDropdownOpen(false)}>
            <button
              onClick={() => {
                router.push('/editor?id=' + capsule.id);
                setIsDropdownOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=''}
            >
              Edit Capsule
            </button>
            <button
              onClick={() => {
                onGetEmbed(capsule);
                setIsDropdownOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=''}
            >
              Get Embed Code
            </button>
            <button
              onClick={() => {
                // TODO: Add analytics view
                setIsDropdownOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=''}
            >
              View Analytics
            </button>
            <hr className="border-slate-600 my-1" />
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete "${capsule.title}"? This action cannot be undone.`)) {
                  onDelete(capsule.id);
                }
                setIsDropdownOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300"
            >
              Delete Capsule
            </button>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Course association + Difficulty */}
      {(capsule.courseNames || capsule.difficulty) && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {capsule.difficulty && (
            <span className="text-xs px-2 py-0.5 rounded" style={{ 
              background: capsule.difficulty === 'Hard' ? 'rgba(239,68,68,0.15)' : capsule.difficulty === 'Medium' ? 'rgba(245,158,11,0.15)' : 'rgba(0,255,135,0.1)',
              color: capsule.difficulty === 'Hard' ? '#f87171' : capsule.difficulty === 'Medium' ? '#fbbf24' : '#00ff87'
            }}>
              {capsule.difficulty}
            </span>
          )}
          {capsule.courseNames && (
            <span className="text-xs text-slate-400 truncate" title={capsule.courseNames}>
              <svg className="w-3 h-3 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              {capsule.courseNames}
            </span>
          )}
        </div>
      )}

      {/* Key Analytics */}
      <div className="grid grid-cols-3 gap-4 mb-4 py-3 border-t border-slate-700">
        <div className="text-center">
          <div className="text-lg font-semibold text-white">{formatAnalytics(capsule).impressions}</div>
          <div className="text-xs text-slate-400">Views</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-white">{formatAnalytics(capsule).runs}</div>
          <div className="text-xs text-slate-400">Runs</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-400">{formatAnalytics(capsule).passRate}</div>
          <div className="text-xs text-slate-400">Success</div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="flex gap-2">
        <button 
          onClick={() => router.push('/editor?id=' + capsule.id)}
          className="flex-1 text-[#04040a] text-sm py-2 px-3 rounded font-bold transition-colors"
            style={{ background: '#00ff87' }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#00e87a'}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='#00ff87'}
        >
          Edit
        </button>
        <button 
          onClick={() => onGetEmbed(capsule)}
          className="px-3 py-2 text-slate-400 hover:text-white rounded transition-colors"
          title="Get Embed Code"
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=''}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>
        <button className="px-3 py-2 text-slate-400 hover:text-white rounded transition-colors" title="Analytics"
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=''}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}



export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { capsules, loading: capsulesLoading, error: capsulesError, refetch } = useCapsules();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [selectedCapsule, setSelectedCapsule] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllCapsules, setShowAllCapsules] = useState(true);
  const [groupBy, setGroupBy] = useState<'none' | 'course' | 'language' | 'difficulty' | 'status'>('none');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Fetch dashboard metrics from command-center API
  useEffect(() => {
    if (!user) return;
    const fetchMetrics = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_WORKERS_API_URL
          || process.env.NEXT_PUBLIC_API_URL
          || 'http://localhost:8787';
        const headers: Record<string, string> = {};
        const stored = localStorage.getItem('devcapsules_auth');
        if (stored) {
          try {
            const auth = JSON.parse(stored);
            if (auth.accessToken && auth.expiresAt > Date.now()) {
              headers['Authorization'] = `Bearer ${auth.accessToken}`;
            }
          } catch { /* ignore */ }
        }
        const res = await fetch(`${apiUrl}/api/v1/analytics/command-center`, { headers });
        if (res.ok) {
          const json = await res.json();
          setDashData(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard metrics:', err);
      } finally {
        setMetricsLoading(false);
      }
    };
    fetchMetrics();
  }, [user]);

  const metrics = dashData?.metrics;
  const totalCourses = dashData?.recent_playlists?.length ?? 0;
  const successRate = metrics && metrics.total_runs > 0
    ? Math.round((metrics.total_passes / metrics.total_runs) * 100)
    : 0;

  // Filter capsules based on search query
  const filteredCapsules = capsules.filter(capsule => 
    capsule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (capsule.language && capsule.language.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (capsule.courseNames && capsule.courseNames.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Grouping logic
  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const getGroups = (items: typeof filteredCapsules) => {
    if (groupBy === 'none') return [{ label: '', items }];
    const map = new Map<string, typeof items>();
    for (const c of items) {
      let keys: string[] = [];
      if (groupBy === 'course') {
        keys = c.courseNames ? c.courseNames.split(',').map(s => s.trim()) : ['Uncategorized'];
      } else if (groupBy === 'language') {
        keys = [c.language || 'Unknown'];
      } else if (groupBy === 'difficulty') {
        keys = [c.difficulty || 'Unset'];
      } else if (groupBy === 'status') {
        keys = [c.isPublished ? 'Published' : 'Draft'];
      }
      for (const k of keys) {
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(c);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] === 'Uncategorized' || a[0] === 'Unset' || a[0] === 'Unknown' ? 1 : a[0].localeCompare(b[0]))
      .map(([label, items]) => ({ label, items }));
  };

  // Delete capsule function
  const handleDeleteCapsule = async (capsuleId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_WORKERS_API_URL
        || process.env.NEXT_PUBLIC_API_URL
        || 'http://localhost:8787';
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Get auth token
      const stored = localStorage.getItem('devcapsules_auth');
      if (stored) {
        try {
          const auth = JSON.parse(stored);
          if (auth.accessToken && auth.expiresAt > Date.now()) {
            headers['Authorization'] = `Bearer ${auth.accessToken}`;
          }
        } catch { /* ignore */ }
      }

      const response = await fetch(`${apiUrl}/api/v1/capsules/${capsuleId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete capsule');
      }

      // Refresh the capsules list
      refetch();
    } catch (error) {
      console.error('Error deleting capsule:', error);
      alert('Failed to delete capsule. Please try again.');
    }
  };

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Listen for create modal events from sidebar
    const handleOpenCreateModal = () => setIsCreateModalOpen(true);
    window.addEventListener('openCreateModal', handleOpenCreateModal);
    return () => window.removeEventListener('openCreateModal', handleOpenCreateModal);
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#04040a' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(0,255,135,0.2)', borderTopColor: '#00ff87' }}></div>
      </div>
    );
  }

  // Show dashboard for authenticated users
  if (!user) {
    return null; // Will redirect to login
  }

  // Capsules to display: show all by default, toggle to collapse to 6
  const displayedCapsules = showAllCapsules ? filteredCapsules : filteredCapsules.slice(0, 6);

  return (
    <div className="min-h-screen" style={{ background: '#04040a' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back{user?.user_metadata?.first_name ? `, ${user.user_metadata.first_name}` : ''}
            </h1>
            <p className="text-slate-400 mt-1">Here&apos;s what&apos;s happening with your capsules</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="text-[#04040a] px-6 py-3 rounded-lg font-bold transition-colors whitespace-nowrap"
            style={{ background: '#00ff87' }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#00e87a'}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='#00ff87'}
          >
            + New Capsule
          </button>
        </div>

        {/* ── Metrics Row ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          {[
            { label: 'Total Executions', value: metrics ? formatNumber(metrics.total_runs) : '—', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ), color: '#00ff87' },
            { label: 'EdGE TA Interventions', value: metrics ? formatNumber(metrics.edge_interventions) : '—', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            ), color: '#a78bfa' },
            { label: 'Success Rate', value: metrics ? `${successRate}%` : '—', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ), color: successRate >= 60 ? '#00ff87' : '#f59e0b' },
            { label: 'Total Capsules', value: metrics ? metrics.total_capsules.toString() : capsules.length.toString(), icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            ), color: '#38bdf8' },
            { label: 'Total Courses', value: totalCourses.toString(), icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            ), color: '#fb923c' },
          ].map((card) => (
            <div key={card.label} className="rounded-xl p-5 transition-all" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span style={{ color: card.color }}>{card.icon}</span>
                <span className="text-xs text-slate-400 uppercase tracking-wide">{card.label}</span>
              </div>
              {metricsLoading ? (
                <div className="h-8 w-16 rounded bg-white/5 animate-pulse" />
              ) : (
                <div className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</div>
              )}
            </div>
          ))}
        </div>

        {/* ── Capsules Section ──────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-white">
            My Capsules <span className="text-slate-400 font-normal text-base">({capsules.length})</span>
          </h2>
          <div className="flex items-center gap-3">
            {filteredCapsules.length > 6 && (
              <button
                onClick={() => setShowAllCapsules(!showAllCapsules)}
                className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                style={{ color: '#00ff87', background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.2)' }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(0,255,135,0.15)'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='rgba(0,255,135,0.08)'}
              >
                {showAllCapsules ? `Show Less (6 of ${filteredCapsules.length})` : `View All ${filteredCapsules.length} Capsules`}
              </button>
            )}
          </div>
        </div>

        {/* View Toggle and Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <div className="flex rounded-lg p-1" style={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                viewMode === 'grid' ? '' : 'text-slate-400 hover:text-white'
              }`}
              style={viewMode === 'grid' ? { background: 'rgba(0,255,135,0.1)', color: '#00ff87' } : undefined}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                viewMode === 'list' ? '' : 'text-slate-400 hover:text-white'
              }`}
              style={viewMode === 'list' ? { background: 'rgba(0,255,135,0.1)', color: '#00ff87' } : undefined}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>List</span>
            </button>
          </div>
          
          {/* Search Bar + Group By */}
          <div className="flex items-center gap-4">
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="border rounded-lg py-2 px-3 text-sm text-white focus:outline-none transition-colors cursor-pointer"
              style={{ background: '#0d0d1a', borderColor: 'rgba(255,255,255,0.07)' }}
              onFocus={(e: any) => e.currentTarget.style.borderColor = 'rgba(0,255,135,0.5)'}
              onBlur={(e: any) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
            >
              <option value="none">No Grouping</option>
              <option value="course">By Course</option>
              <option value="language">By Language</option>
              <option value="difficulty">By Difficulty</option>
              <option value="status">By Status</option>
            </select>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search capsules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 border rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none transition-colors"
                style={{ background: '#0d0d1a', borderColor: 'rgba(255,255,255,0.07)' }}
                onFocus={e=>(e.currentTarget as HTMLElement).style.borderColor='rgba(0,255,135,0.5)'}
                onBlur={e=>(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.07)'}
              />
            </div>
            <div className="text-sm text-slate-400 whitespace-nowrap">
              {filteredCapsules.length} capsule{filteredCapsules.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Empty State for New Users */}
        {capsules.length === 0 && !capsulesLoading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Create your first capsule</h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Interactive coding exercises that embed anywhere. Start teaching with code in minutes.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-[#04040a] px-8 py-4 rounded-lg font-bold transition-colors text-lg"
              style={{ background: '#00ff87' }}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#00e87a'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='#00ff87'}
            >
              Create Your First Capsule
            </button>
          </div>
        )}

        {/* Capsules Content - Conditional Rendering */}
        {capsules.length > 0 && viewMode === 'grid' ? (
          /* Card Grid View — with optional grouping */
          <div>
            {getGroups(displayedCapsules).map((group) => (
              <div key={group.label || '__all'} className={group.label ? 'mb-8' : ''}>
                {group.label && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="flex items-center gap-2 mb-4 text-left w-full group/hdr"
                  >
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform ${collapsedGroups.has(group.label) ? '' : 'rotate-90'}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-base font-semibold text-white group-hover/hdr:text-[#00ff87] transition-colors">{group.label}</span>
                    <span className="text-xs text-slate-500 ml-1">({group.items.length})</span>
                  </button>
                )}
                {!collapsedGroups.has(group.label) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.items.map((capsule) => {
                      const analytics = formatAnalytics(capsule);
              return (
                <CapsuleCard 
                  key={capsule.id} 
                  capsule={{
                    ...capsule,
                    impressions: analytics.impressions,
                    runs: analytics.runs,
                    passRate: analytics.passRate,
                    created: formatCreationDate(capsule.createdAt)
                  }} 
                  onGetEmbed={(capsule) => {
                    setSelectedCapsule(capsule);
                    setIsPublishModalOpen(true);
                  }}
                  onDelete={handleDeleteCapsule}
                />
              );
            })}
                  </div>
                )}
              </div>
            ))}
            
            {/* Add New Capsule Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <div 
            onClick={() => setIsCreateModalOpen(true)}
              className="rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer group border-2 border-dashed transition-all"
              style={{ background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.08)' }}
              onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor='rgba(0,255,135,0.4)'; (e.currentTarget as HTMLElement).style.background='rgba(0,255,135,0.02)'; }}
              onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.01)'; }}
            >
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors" style={{ background: 'rgba(0,255,135,0.08)' }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(0,255,135,0.15)'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='rgba(0,255,135,0.08)'}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#00ff87' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Create New Capsule</h3>
              <p className="text-sm text-slate-400">Start from a template or build from scratch</p>
            </div>
            </div>
          </div>
        ) : capsules.length > 0 ? (
          /* List/Table View */
          <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {/* Table Header */}
            <div className="px-6 py-4" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-400 uppercase tracking-wide">
                <div className="col-span-4">Capsule</div>
                <div className="col-span-2">Language</div>
                <div className="col-span-2">Performance</div>
                <div className="col-span-2">Activity</div>
                <div className="col-span-2">Actions</div>
              </div>
            </div>
            
            {/* Table Rows */}
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {displayedCapsules.map((capsule) => {
                const analytics = formatAnalytics(capsule);
                const isPublished = capsule.isPublished === true;
                return (
                  <div key={capsule.id} className="px-6 py-4 transition-colors" style={{ }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.02)'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=''}>
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Capsule Info */}
                      <div className="col-span-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.2)' }}>
                            <span className="font-bold text-sm" style={{ color: '#00ff87' }}>{(capsule.language || 'JS').charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span 
                                className={`w-2 h-2 rounded-full ${isPublished ? 'bg-green-500' : 'bg-yellow-500'}`}
                                title={isPublished ? 'Published' : 'Draft'}
                              />
                              <span className="font-medium text-white">{capsule.title}</span>
                            </div>
                            <div className="text-sm text-slate-400">
                              {formatCreationDate(capsule.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    
                    {/* Language */}
                    <div className="col-span-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400">
                        {capsule.language}
                      </span>
                    </div>
                    
                    {/* Performance */}
                    <div className="col-span-2">
                      <div className="text-sm">
                        <div className="text-white font-medium">{analytics.passRate} pass rate</div>
                        <div className="text-slate-400">{analytics.runs} runs</div>
                      </div>
                    </div>
                    
                    {/* Activity */}
                    <div className="col-span-2">
                      <div className="text-sm">
                        <div className="text-white font-medium">{analytics.impressions}</div>
                        <div className="text-slate-400">impressions</div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="col-span-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push('/editor?id=' + capsule.id)}
                          className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCapsule(capsule);
                            setIsPublishModalOpen(true);
                          }}
                        className="text-slate-400 hover:text-[#00ff87] p-1 rounded transition-colors"
                          title="Get Embed Code"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${capsule.title}"? This action cannot be undone.`)) {
                              handleDeleteCapsule(capsule.id);
                            }
                          }}
                          className="text-slate-400 hover:text-red-400 p-1 rounded transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Add New Row */}
              <div 
              onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-8 transition-colors cursor-pointer border-2 border-dashed m-4 rounded-lg"
                style={{ borderColor: 'rgba(255,255,255,0.07)' }}
                onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor='rgba(0,255,135,0.3)'; (e.currentTarget as HTMLElement).style.background='rgba(0,255,135,0.01)'; }}
                onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.background=''; }}
              >
                <div className="flex items-center justify-center space-x-3 text-slate-400 transition-colors"
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='#00ff87'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=''}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">Create New Capsule</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Create Capsule Modal */}
      <CreateCapsuleModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Publish & Embed Modal */}
      {selectedCapsule && (
        <PublishEmbedModal 
          isOpen={isPublishModalOpen}
          onClose={() => {
            setIsPublishModalOpen(false);
            setSelectedCapsule(null);
          }}
          capsuleId={selectedCapsule.id.toString()}
          capsuleTitle={selectedCapsule.title}
        />
      )}
    </div>
  );
}