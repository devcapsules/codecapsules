import React, { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
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

  // Check if we're on the dashboard page (has its own Create button)
  const isOnDashboard = router.pathname === '/dashboard' || router.pathname === '/';

  const sidebarNavItems = [
    { href: '/dashboard', label: 'My Capsules', icon: 'collection' },
    { href: '/courses', label: 'Courses', icon: 'academic-cap' },
    { href: '/blog', label: 'Blog', icon: 'newspaper' },
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
      case 'newspaper':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>;
      case 'academic-cap':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>;
      case 'user':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        {/* Global Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1e293b" />
        <meta name="msapplication-TileColor" content="#1e293b" />
        
        {/* Default Open Graph tags (can be overridden by pages) */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Devcapsules" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content="https://devcapsules.com/logo.png" />
        
        {/* Twitter Card defaults */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@devcapsules" />
        
        {/* Favicons - Updated to use logo.png */}
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.ico" />
        <link rel="shortcut icon" type="image/png" href="/favicon.ico" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
        
        {/* Global structured data for brand - Google logo requirements */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Devcapsules",
              "url": "https://devcapsules.com",
              "logo": {
                "@type": "ImageObject",
                "url": "https://devcapsules.com/logo.png",
                "width": 600,
                "height": 60,
                "caption": "Devcapsules Logo"
              },
              "image": "https://devcapsules.com/logo.png",
              "description": "AI-powered interactive coding platform for creating executable programming tutorials",
              "sameAs": [
                "https://twitter.com/devcapsules",
                "https://github.com/devcapsules",
                "https://linkedin.com/company/devcapsules"
              ]
            })
          }}
        />
        
        {/* WebSite structured data for search appearance */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Devcapsules",
              "alternateName": "DevCapsules Interactive Coding Platform",
              "url": "https://devcapsules.com",
              "description": "AI-powered interactive coding platform for creating executable programming tutorials and embedded code widgets",
              "publisher": {
                "@type": "Organization",
                "name": "Devcapsules",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://devcapsules.com/logo.png",
                  "width": 600,
                  "height": 60
                }
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://devcapsules.com/search?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </Head>
      
      <div className="min-h-screen bg-slate-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and Navigation */}
            <div className="flex items-center space-x-4 md:space-x-8">
              {/* Logo */}
              <Link href="/dashboard" className="flex items-center space-x-2">
                <img src="/favicon.ico" alt="Devcapsules" className="w-8 h-8" />
                <div>
                  <div className="text-lg font-bold text-white">Devcapsules</div>
                  <div className="hidden md:block text-xs text-slate-400">Interactive Learning Platform</div>
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
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Create New Capsule Button - Hidden on dashboard since it has its own */}
              {!isOnDashboard && (
                <button
                  onClick={() => {
                    const event = new CustomEvent('openCreateModal');
                    window.dispatchEvent(event);
                  }}
                  className="bg-blue-600 text-white py-2 px-3 md:px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs md:text-sm min-h-[40px]"
                >
                  <span className="hidden sm:inline">Create Capsule</span>
                  <span className="sm:hidden">Create</span>
                </button>
              )}

              {/* User Menu */}
              <div className="flex items-center">
                {loading ? (
                  <div className="w-8 h-8 animate-pulse bg-slate-600 rounded-full"></div>
                ) : user ? (
                  <div className="relative group">
                    <button className="flex items-center space-x-2 md:space-x-3 text-slate-300 hover:text-white px-2 md:px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors min-h-[40px]">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">{getUserInitials(user)}</span>
                      </div>
                      <span className="text-sm font-medium hidden lg:block">{getUserDisplayName(user)}</span>
                      <svg className="w-4 h-4 md:hidden" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* User Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-50">
                      <div className="py-1">
                        <Link href="/account" className="flex items-center px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                          <span>Account Settings</span>
                        </Link>
                        <div className="border-t border-slate-700 my-1"></div>
                        <button 
                          onClick={handleSignOut}
                          className="flex items-center px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors w-full text-left"
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


        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 bg-slate-900 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-800 border-t border-slate-700">
        <nav className="flex items-center justify-around px-2 py-3 safe-area-pb">
          {sidebarNavItems.filter(item => item.href !== '/blog').slice(0, 2).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 transition-colors text-xs font-medium ${
                isActivePage(item.href)
                  ? 'text-blue-400'
                  : 'text-slate-400'
              }`}
            >
              <div className="w-6 h-6 mb-1">
                {getIcon(item.icon)}
              </div>
              <span>{item.label}</span>
            </Link>
          ))}
          
          {/* Create Button */}
          <button
            onClick={() => {
              const event = new CustomEvent('openCreateModal');
              window.dispatchEvent(event);
            }}
            className="flex flex-col items-center justify-center py-1 px-2 text-xs font-medium text-white"
          >
            <div className="w-8 h-8 mb-1 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span>Create</span>
          </button>
          
          {sidebarNavItems.filter(item => item.href !== '/blog').slice(2).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 transition-colors text-xs font-medium ${
                isActivePage(item.href)
                  ? 'text-blue-400'
                  : 'text-slate-400'
              }`}
            >
              <div className="w-6 h-6 mb-1">
                {getIcon(item.icon)}
              </div>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
    </>
  );
}