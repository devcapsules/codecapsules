import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <img src="/favicon.ico" alt="Devcapsules" className="w-8 h-8 mr-2" />
              <span className="text-lg font-bold text-white">Devcapsules</span>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6">
              <Link href="/blog" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                Blog
              </Link>
              <a href="#features" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                Pricing
              </a>
              <a href="#faq" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                FAQ
              </a>
              {user ? (
                <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 px-3 py-2 text-sm font-medium transition-colors">
                  Dashboard
                </Link>
              ) : (
                <>
                  <a href="/dashboard" className="text-blue-400 hover:text-blue-300 px-3 py-2 text-sm font-medium transition-colors">
                    Creator Studio
                  </a>
                  <Link href="/login" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            {user ? (
              <Link 
                href="/dashboard"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
              >
                Create Capsule
              </Link>
            ) : (
              <Link 
                href="/signup"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
              >
                Try Creator Studio
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-950 border-t border-gray-800">
            <Link href="/blog" className="text-gray-300 hover:text-white block px-3 py-2 text-sm font-medium">
              Blog
            </Link>
            <a href="#features" className="text-gray-300 hover:text-white block px-3 py-2 text-sm font-medium">
              Features
            </a>
            <a href="#pricing" className="text-gray-300 hover:text-white block px-3 py-2 text-sm font-medium">
              Pricing
            </a>
            <a href="#faq" className="text-gray-300 hover:text-white block px-3 py-2 text-sm font-medium">
              FAQ
            </a>
            {user ? (
              <Link href="/dashboard" className="text-gray-300 hover:text-white block px-3 py-2 text-sm font-medium">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="text-gray-300 hover:text-white block px-3 py-2 text-sm font-medium">
                Login
              </Link>
            )}
            <div className="px-3 py-2">
              {user ? (
                <Link 
                  href="/dashboard"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-lg font-semibold text-sm transition-all block text-center"
                >
                  Create Capsule
                </Link>
              ) : (
                <Link 
                  href="/signup"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-lg font-semibold text-sm transition-all block text-center"
                >
                  Start Free Trial
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}