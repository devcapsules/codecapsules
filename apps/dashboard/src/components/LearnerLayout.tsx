import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useSoftLogin } from '../hooks/useSoftLogin';

interface LearnerLayoutProps {
  children: React.ReactNode;
}

export default function LearnerLayout({ children }: LearnerLayoutProps) {
  const { user, loading, signOut } = useAuth();
  const { learner, clearLearner } = useSoftLogin();
  const router = useRouter();
  const [isLearnerDomain, setIsLearnerDomain] = useState(false);

  useEffect(() => {
    setIsLearnerDomain(
      typeof window !== 'undefined' && window.location.hostname === 'learn.devcapsules.com'
    );
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  const getUserInitials = (user: any) => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = (user: any) => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    return user?.email || 'User';
  };

  const isActivePage = (path: string) =>
    router.pathname === path || router.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen" style={{ background: '#04040a' }}>
      {isLearnerDomain && (
        <Head>
          <title>Devcapsules Learn — Interactive Coding Courses</title>
          <meta name="description" content="Learn programming with hands-on interactive coding capsules. No setup required." />
          <link rel="canonical" href={`https://learn.devcapsules.com${router.asPath}`} />
          <meta property="og:url" content={`https://learn.devcapsules.com${router.asPath}`} />
          <meta property="og:site_name" content="Devcapsules Learn" />
        </Head>
      )}
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/learn/capsules" className="flex-shrink-0 flex items-center">
                <img src="/favicon.ico" alt="Devcapsules" className="w-8 h-8 mr-2" />
                <span className="text-lg font-bold text-white">Devcapsules</span>
              </Link>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-1">
                <Link
                  href="/learn/capsules"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActivePage('/learn/capsules')
                      ? 'bg-green-500/10 text-[#00ff87]'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>Browse</span>
                </Link>
                <Link
                  href="/learn/my-learning"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActivePage('/learn/my-learning')
                      ? 'bg-green-500/10 text-[#00ff87]'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>My Learning</span>
                </Link>
                <Link
                  href="/learn/profile"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActivePage('/learn/profile')
                      ? 'bg-green-500/10 text-[#00ff87]'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A3 3 0 017 16h10a3 3 0 011.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Profile</span>
                </Link>
              </div>
            </div>

            {/* Right — auth */}
            <div className="hidden md:flex items-center space-x-3">
              {loading ? (
                <div className="w-8 h-8 animate-pulse rounded-full bg-white/10" />
              ) : user ? (
                <div className="relative group">
                  <button className="flex items-center space-x-3 text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-colors hover:bg-white/5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500/15 border border-green-500/30">
                      <span className="text-sm font-medium text-[#00ff87]">{getUserInitials(user)}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-300">{getUserDisplayName(user)}</span>
                  </button>
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-gray-950 border border-gray-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors w-full text-left"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : learner ? (
                <div className="relative group">
                  <button className="flex items-center space-x-3 text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-colors hover:bg-white/5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500/15 border border-green-500/30">
                      <span className="text-sm font-medium text-[#00ff87]">{learner.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-300">{learner.name}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-gray-950 border border-gray-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={clearLearner}
                        className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors w-full text-left"
                      >
                        Switch Account
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-slate-500">Click Solve to start</span>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-gray-300 hover:text-white p-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30" style={{ background: '#0a0a14', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <nav className="flex justify-around py-2">
          <Link
            href="/learn/capsules"
            className={`flex flex-col items-center px-2 py-1 rounded-lg transition-colors text-xs font-medium ${
              isActivePage('/learn/capsules') ? '' : 'text-slate-500'
            }`}
            style={isActivePage('/learn/capsules') ? { color: '#00ff87' } : undefined}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="mt-1">Browse</span>
          </Link>
          <Link
            href="/learn/my-learning"
            className={`flex flex-col items-center px-2 py-1 rounded-lg transition-colors text-xs font-medium ${
              isActivePage('/learn/my-learning') ? '' : 'text-slate-500'
            }`}
            style={isActivePage('/learn/my-learning') ? { color: '#00ff87' } : undefined}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="mt-1">My Learning</span>
          </Link>
          <Link
            href="/learn/profile"
            className={`flex flex-col items-center px-2 py-1 rounded-lg transition-colors text-xs font-medium ${
              isActivePage('/learn/profile') ? '' : 'text-slate-500'
            }`}
            style={isActivePage('/learn/profile') ? { color: '#00ff87' } : undefined}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A3 3 0 017 16h10a3 3 0 011.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="mt-1">Profile</span>
          </Link>
          {!user && !learner && (
            <span className="flex flex-col items-center px-2 py-1 text-xs font-medium text-slate-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="mt-1">Guest</span>
            </span>
          )}
          {!user && learner && (
            <span className="flex flex-col items-center px-2 py-1 text-xs font-medium" style={{ color: '#00ff87' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="mt-1">{learner.name.split(' ')[0]}</span>
            </span>
          )}
        </nav>
      </div>

      {/* Page Content */}
      <main className="flex-1 pt-16 pb-16 md:pb-0" style={{ background: '#04040a' }}>
        {children}
      </main>
    </div>
  );
}
