import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
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
      className="absolute right-0 top-8 z-10 w-48 bg-slate-700 border border-slate-600 rounded-lg shadow-lg py-1"
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
    <div className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-600 rounded-lg p-6 transition-all group">
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
            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
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
              className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-600 hover:text-white"
            >
              Edit Capsule
            </button>
            <button
              onClick={() => {
                onGetEmbed(capsule);
                setIsDropdownOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-600 hover:text-white"
            >
              Get Embed Code
            </button>
            <button
              onClick={() => {
                // TODO: Add analytics view
                setIsDropdownOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-600 hover:text-white"
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
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded font-medium transition-colors"
        >
          Edit
        </button>
        <button 
          onClick={() => onGetEmbed(capsule)}
          className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
          title="Get Embed Code"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>
        <button className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors" title="Analytics">
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

  // Filter capsules based on search query
  const filteredCapsules = capsules.filter(capsule => 
    capsule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (capsule.language && capsule.language.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
          <h1 className="text-3xl font-bold text-white">
            My Capsules <span className="text-slate-400 font-normal">({capsules.length})</span>
          </h1>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap"
          >
            Create New Capsule
          </button>
        </div>

        {/* View Toggle and Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
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
          
          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search capsules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="text-sm text-slate-400 whitespace-nowrap">
              {filteredCapsules.length} capsule{filteredCapsules.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6">
            <div className="text-2xl font-bold text-white">12.8k</div>
            <div className="text-sm text-slate-400">Total Views</div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6">
            <div className="text-2xl font-bold text-white">8.2k</div>
            <div className="text-sm text-slate-400">Total Runs</div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6">
            <div className="text-2xl font-bold text-green-400">68%</div>
            <div className="text-sm text-slate-400">Success Rate</div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6">
            <div className="text-2xl font-bold text-white">{capsules.length}</div>
            <div className="text-sm text-slate-400">Active Capsules</div>
          </div>
        </div>

        {/* Empty State for New Users */}
        {capsules.length === 0 && !capsulesLoading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-slate-800 rounded-full flex items-center justify-center">
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg"
            >
              Create Your First Capsule
            </button>
          </div>
        )}

        {/* Capsules Content - Conditional Rendering */}
        {capsules.length > 0 && viewMode === 'grid' ? (
          /* Card Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCapsules.map((capsule) => {
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
        ) : capsules.length > 0 ? (
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
              {filteredCapsules.map((capsule) => {
                const analytics = formatAnalytics(capsule);
                const isPublished = capsule.isPublished === true;
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
                          className="text-slate-400 hover:text-blue-400 p-1 rounded transition-colors"
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