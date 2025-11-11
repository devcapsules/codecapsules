import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function MyCapsules() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show page for authenticated users
  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">My Capsules</h1>
            <button 
              onClick={() => router.push('/create-capsule')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + New Capsule
            </button>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
            <div className="text-slate-400 mb-4">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-white mb-2">No capsules yet</h3>
              <p className="text-slate-400">Create your first capsule to get started!</p>
            </div>
            <button 
              onClick={() => router.push('/create-capsule')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create Your First Capsule
            </button>
          </div>
        </div>
      </div>
  );
}