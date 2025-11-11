import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Account() {
  const { user, loading } = useAuth();
  const router = useRouter();

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-slate-400">Manage your account preferences and subscription</p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Profile Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                <input
                  type="text"
                  defaultValue={user.user_metadata?.full_name || ''}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                <input
                  type="email"
                  defaultValue={user.email || ''}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">💳 Subscription</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="bg-green-600 text-green-100 px-3 py-1 rounded-full text-sm font-medium">
                    Pro Plan
                  </span>
                  <span className="text-slate-400 text-sm">$29/month</span>
                </div>
                <p className="text-slate-400 text-sm">Unlimited capsules, analytics, and LMS integration</p>
              </div>
              <button className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Manage Billing
              </button>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">📊 Usage This Month</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">12</div>
                <div className="text-sm text-slate-400">Capsules Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">8.2k</div>
                <div className="text-sm text-slate-400">Total Runs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">156</div>
                <div className="text-sm text-slate-400">Unique Students</div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-400 mb-4">⚠️ Danger Zone</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Export Data</div>
                  <div className="text-sm text-slate-400">Download all your capsules and analytics</div>
                </div>
                <button className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Export
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Delete Account</div>
                  <div className="text-sm text-slate-400">Permanently delete your account and all data</div>
                </div>
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}