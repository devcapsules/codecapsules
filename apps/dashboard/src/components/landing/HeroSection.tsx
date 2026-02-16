import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import DemoVideoSection from './DemoVideoSection';
import ProcessSteps from './ProcessSteps';

export function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950">
      {/* Animated Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* Floating particles - subtle accents */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400/20 rounded-full animate-pulse delay-300"></div>
        <div className="absolute bottom-32 right-20 w-1.5 h-1.5 bg-purple-400/20 rounded-full animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center">
          {/* Main Headline with animations */}
          <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="block animate-fadeInUp mb-2">Turn Static Content into</span>
            <span className="block bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">
              Live Coding Labs
            </span>
          </h1>

          {/* Subheadline with stagger animation */}
          <p className={`text-lg md:text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Generate interactive coding environments with AI so anyone can <strong className="text-white">run, experiment, and learn</strong> directly inside your content.
          </p>

          {/* CTA Buttons with enhanced animations */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 transition-all duration-1000 delay-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            {!loading && user ? (
              // User is logged in - show dashboard links
              <Link href="/dashboard" className="group w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 relative overflow-hidden text-center">
                <span className="relative z-10">Create New Capsule</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Link>
            ) : (
              // User not logged in - show signup link
              <Link href="/signup" className="group w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 relative overflow-hidden text-center">
                <span className="relative z-10">Try Free for 14 Days</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Link>
            )}
            {user ? (
              <Link href="/dashboard" className="group w-full sm:w-auto border border-gray-600 hover:border-gray-500 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-gray-800/50 hover:shadow-lg hover:shadow-gray-500/10 transform hover:scale-105 relative overflow-hidden text-center">
                <span className="relative z-10">Go to Dashboard</span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </Link>
            ) : (
              <Link href="/blog/stop-copy-pasting" className="group w-full sm:w-auto border border-gray-600 hover:border-gray-500 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-gray-800/50 hover:shadow-lg hover:shadow-gray-500/10 transform hover:scale-105 relative overflow-hidden text-center">
                <span className="relative z-10">See Live Examples</span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </Link>
            )}
          </div>

          {/* Social Proof */}
          <div className={`flex flex-wrap items-center justify-center gap-6 md:gap-10 text-gray-400 text-sm mb-12 transition-all duration-1000 delay-1100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              No setup required
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              6 languages supported
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Embed anywhere
            </span>
          </div>

          {/* Demo Video */}
          <div className={`mb-12 transition-all duration-1000 delay-1200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <DemoVideoSection />
          </div>

          {/* Process Steps */}
          <div className={`mb-12 transition-all duration-1000 delay-1400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="max-w-4xl mx-auto">
              <ProcessSteps />
            </div>
          </div>


        </div>
      </div>
    </section>
  );
}