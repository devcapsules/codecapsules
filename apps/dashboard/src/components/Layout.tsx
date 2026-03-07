import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import CreateCapsuleModal from './CreateCapsuleModal';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
    if (user?.user_metadata?.first_name) {
      return ` `.trim();
    }
    return user?.email || 'User';
  };

  const isActivePage = (path: string) => {
    if (path === '/dashboard' && router.pathname === '/') return true;
    return router.pathname === path;
  };

  const sidebarNavItems = [
    { href: '/dashboard', label: 'My Capsules', icon: 'collection' },
    { href: '/courses', label: 'Courses', icon: 'book' },
    { href: '/blog', label: 'Blog', icon: 'newspaper' },
    { href: '/analytics', label: 'Analytics', icon: 'chart-bar' },
    { href: '/account', label: 'Account', icon: 'user' },
  ];

  const getIcon = (iconName: string) => {
    const iconClass = "w-5 h-5";
    switch (iconName) {
      case 'collection':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
      case 'book':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
      case 'chart-bar':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
      case 'newspaper':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>;
      case 'user':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#04040a' }}>
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex-shrink-0 flex items-center">
                <img src="/favicon.ico" alt="Devcapsules" className="w-8 h-8 mr-2" />
                <span className="text-lg font-bold text-white">Devcapsules</span>
              </Link>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-1">
                {sidebarNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActivePage(item.href) ? 'bg-green-500/10 text-[#00ff87]' : 'text-gray-300 hover:text-white'}`}
                  >
                    {getIcon(item.icon)}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right - CTA + User Menu */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-[#00ff87] hover:bg-[#00ef77] text-black px-4 py-2 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 shadow-lg shadow-green-500/25"
              >
                Create Capsule
              </button>

              {loading ? (
                <div className="w-8 h-8 animate-pulse rounded-full bg-white/10"></div>
              ) : user ? (
                <div className="relative group">
                  <button className="flex items-center space-x-3 text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-colors hover:bg-white/5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500/15 border border-green-500/30">
                      <span className="text-sm font-medium text-[#00ff87]">{getUserInitials(user)}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-300">{getUserDisplayName(user)}</span>
                  </button>

                  {/* User Dropdown */}
                  <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-gray-950 border border-gray-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <Link href="/account" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                        Account Settings
                      </Link>
                      <div className="my-1 border-t border-gray-800"></div>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors w-full text-left">
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full animate-pulse bg-white/10"></div>
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-gray-950 border-t border-gray-800">
        <nav className="flex justify-around py-2">
          {sidebarNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center px-2 py-1 rounded-lg transition-colors text-xs font-medium ${isActivePage(item.href) ? 'text-[#00ff87]' : 'text-slate-500'}`}
            >
              {getIcon(item.icon)}
              <span className="mt-1">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Page Content */}
      <main className="flex-1 pt-16 pb-16 md:pb-0" style={{ background: '#04040a' }}>
        {children}
      </main>

      {/* Create Capsule Modal */}
      <CreateCapsuleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
