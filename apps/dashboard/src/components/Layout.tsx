import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';


interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

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
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim();
    }
    return user?.email || 'User';
  };

  const isActivePage = (path: string) => {
    if (path === '/dashboard' && router.pathname === '/') return true;
    return router.pathname === path;
  };

  const sidebarNavItems = [
    { href: '/dashboard', label: 'My Capsules', icon: 'collection' },
    { href: '/analytics', label: 'Analytics', icon: 'chart-bar' },
    { href: '/account', label: 'Account', icon: 'user' },
  ];

  const getIcon = (iconName: string) => {
    const iconClass = "w-5 h-5";
    switch (iconName) {
      case 'collection':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
      case 'chart-bar':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
      case 'user':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and Navigation */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">D</span>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">CodeCapsule</div>
                  <div className="text-xs text-slate-400">by Devleep</div>
                </div>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center space-x-6">
                {sidebarNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                      isActivePage(item.href)
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {getIcon(item.icon)}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right side - Create Button and User Menu */}
            <div className="flex items-center space-x-4">
              {/* Create New Capsule Button */}
              <button
                onClick={() => {
                  const event = new CustomEvent('openCreateModal');
                  window.dispatchEvent(event);
                }}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Create Capsule
              </button>

              {/* User Menu */}
              <div className="flex items-center">
                {loading ? (
                  <div className="w-8 h-8 animate-pulse bg-slate-600 rounded-full"></div>
                ) : user ? (
                  <div className="relative group">
                    <button className="flex items-center space-x-3 text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">{getUserInitials(user)}</span>
                      </div>
                      <span className="text-sm font-medium hidden lg:block">{getUserDisplayName(user)}</span>
                    </button>
                    
                    {/* User Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="py-1">
                        <Link href="/account" className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                          <span>Account Settings</span>
                        </Link>
                        <div className="border-t border-slate-700 my-1"></div>
                        <button 
                          onClick={handleSignOut}
                          className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors w-full text-left"
                        >
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-slate-600 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <div className="md:hidden border-t border-slate-700 py-3">
            <nav className="flex flex-wrap gap-2">
              {sidebarNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    isActivePage(item.href)
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {getIcon(item.icon)}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 bg-slate-900">
        {children}
      </main>
    </div>
  );
}