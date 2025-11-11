import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import CreateCapsuleModal from '../components/CreateCapsuleModal';
import PublishEmbedModal from '../components/PublishEmbedModal';
import { useCapsules } from '../hooks/useCapsules';

// Helper function to format analytics data for display
const formatAnalytics = (capsule: any) => ({
  impressions: capsule.analytics?.impressions?.toString() || '0',
  runs: capsule.analytics?.runs?.toString() || '0', 
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

// Capsule Card Component  
function CapsuleCard({ 
  capsule, 
  onGetEmbed 
}: { 
  capsule: any; 
  onGetEmbed: (capsule: any) => void; 
}) {
  const router = useRouter();
  
  const getLanguageColor = (lang: string) => {
    switch (lang) {
      case 'Python': return 'text-blue-400 bg-blue-500/20';
      case 'JavaScript': return 'text-yellow-400 bg-yellow-500/20';
      case 'SQL': return 'text-green-400 bg-green-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getRuntimeBadge = (runtime: string) => {
    return runtime === 'WASM' 
      ? <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">Browser</span>
      : <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded">Server</span>;
  };

  return (
    <div className="bg-slate-800 hover:bg-slate-700 rounded-lg p-6 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 text-xs font-medium rounded ${getLanguageColor(capsule.language)}`}>
              {capsule.language}
            </span>
            {getRuntimeBadge(capsule.runtime)}
          </div>
          <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors mb-1">
            {capsule.title}
          </h3>
          <p className="text-sm text-slate-400">{capsule.created}</p>
        </div>
        <button className="text-slate-400 hover:text-white p-1">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
          </svg>
        </button>
      </div>
      
      {/* Key Analytics */}
      <div className="grid grid-cols-3 gap-4 mb-4 py-3 border-t border-slate-700">
        <div className="text-center">
          <div className="text-lg font-semibold text-white">{capsule.impressions}</div>
          <div className="text-xs text-slate-400">Views</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-white">{capsule.runs}</div>
          <div className="text-xs text-slate-400">Runs</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-400">{capsule.passRate}</div>
          <div className="text-xs text-slate-400">Success</div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="flex gap-2">
        <button 
          onClick={() => onGetEmbed(capsule)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded font-medium transition-colors"
        >
          Get Embed
        </button>
        <button 
          onClick={() => router.push('/editor?id=' + capsule.id)}
          className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
        >
          Edit
        </button>
        <button className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors">
          Analytics
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show dashboard for authenticated users
  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Primary CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-white">My Capsules</h1>
              <div className="flex items-center space-x-2">
                <span className="text-slate-600">•</span>
                <span className="text-sm text-slate-400 font-medium">CodeCapsule by Devleep</span>
              </div>
            </div>
            <p className="text-slate-400 mt-1">{capsules.length} interactive exercises</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap"
          >
            Create New Capsule
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>List</span>
            </button>
          </div>
          
          <div className="text-sm text-slate-400">
            {capsules.length} capsules
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-white">12.8k</div>
            <div className="text-sm text-slate-400">Total Views</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-white">8.2k</div>
            <div className="text-sm text-slate-400">Total Runs</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-green-400">68%</div>
            <div className="text-sm text-slate-400">Success Rate</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-white">{capsules.length}</div>
            <div className="text-sm text-slate-400">Active Capsules</div>
          </div>
        </div>

        {/* Capsules Content - Conditional Rendering */}
        {viewMode === 'grid' ? (
          /* Card Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capsules.map((capsule) => {
              const analytics = formatAnalytics(capsule);
              return (
                <CapsuleCard 
                  key={capsule.id} 
                  capsule={{
                    ...capsule,
                    impressions: analytics.impressions,
                    runs: analytics.runs,
                    passRate: analytics.passRate,
                    created: formatCreationDate(capsule.createdAt),
                    runtime: capsule.language === 'sql' ? 'Server' : 'WASM'
                  }} 
                  onGetEmbed={(capsule) => {
                    setSelectedCapsule(capsule);
                    setIsPublishModalOpen(true);
                  }}
                />
              );
            })}
            
            {/* Add New Capsule Card */}
            <div 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-slate-800 border-2 border-dashed border-slate-600 hover:border-blue-500 rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group"
            >
              <div className="w-12 h-12 bg-blue-500/20 group-hover:bg-blue-500/30 rounded-lg flex items-center justify-center mb-4 transition-colors">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Create New Capsule</h3>
              <p className="text-sm text-slate-400">Start from a template or build from scratch</p>
            </div>
          </div>
        ) : (
          /* List/Table View */
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="bg-slate-700/30 px-6 py-4 border-b border-slate-700/50">
              <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-400 uppercase tracking-wide">
                <div className="col-span-4">Capsule</div>
                <div className="col-span-2">Language</div>
                <div className="col-span-2">Performance</div>
                <div className="col-span-2">Activity</div>
                <div className="col-span-2">Actions</div>
              </div>
            </div>
            
            {/* Table Rows */}
            <div className="divide-y divide-slate-700/30">
              {capsules.map((capsule) => {
                const analytics = formatAnalytics(capsule);
                return (
                  <div key={capsule.id} className="px-6 py-4 hover:bg-slate-700/20 transition-colors">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Capsule Info */}
                      <div className="col-span-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{(capsule.language || 'JS').charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="font-medium text-white">{capsule.title}</div>
                            <div className="text-sm text-slate-400">
                              {capsule.language === 'sql' ? 'Server' : 'WASM'} • {formatCreationDate(capsule.createdAt)}
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
                          className="text-slate-400 hover:text-blue-400 p-1 rounded transition-colors"
                          title="Get Embed Code"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
                          title="More options"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
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
                className="px-6 py-8 hover:bg-slate-700/20 transition-colors cursor-pointer border-2 border-dashed border-slate-700/50 hover:border-blue-500/50 m-4 rounded-lg"
              >
                <div className="flex items-center justify-center space-x-3 text-slate-400 hover:text-blue-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">Create New Capsule</span>
                </div>
              </div>
            </div>
          </div>
        )}
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