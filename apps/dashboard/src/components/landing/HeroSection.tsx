import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import InteractiveCapsuleDemo from './InteractiveCapsuleDemo';
import ProcessSteps from './ProcessSteps';

export function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const [typedText, setTypedText] = useState('');
  const { user, loading } = useAuth();
  const fullText = 'Interactive';
  
  useEffect(() => {
    setMounted(true);
    // Typing animation
    let i = 0;
    const typing = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typing);
      }
    }, 150);
    
    return () => clearInterval(typing);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950">
      {/* Animated Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* Floating particles */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400/30 rounded-full animate-bounce delay-300"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400/40 rounded-full animate-bounce delay-700"></div>
        <div className="absolute bottom-32 left-20 w-1.5 h-1.5 bg-cyan-400/30 rounded-full animate-bounce delay-1000"></div>
        <div className="absolute top-60 right-40 w-1 h-1 bg-blue-400/50 rounded-full animate-ping delay-500"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center">
          {/* Main Headline with animations */}
          <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="block animate-fadeInUp mb-2">Make Any Technical Content</span>
            <span className="block bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x mb-2">
              {typedText}<span className="animate-pulse">|</span>
            </span>
            <span className={`text-2xl md:text-3xl lg:text-4xl text-gray-300 block transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>— In 30 Seconds</span>
          </h1>

          {/* Subheadline with stagger animation */}
          <p className={`text-lg md:text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Whether you're creating <strong className="text-white animate-pulse">courses, documentation, or blog tutorials</strong> — 
            embed live coding environments that let readers interact with your code instead of just reading it.
          </p>

          {/* CTA Buttons with enhanced animations */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 transition-all duration-1000 delay-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            {!loading && user ? (
              // User is logged in - show dashboard links
              <Link href="/create-capsule" className="group w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 relative overflow-hidden text-center">
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
              <button className="group w-full sm:w-auto border border-gray-600 hover:border-gray-500 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-gray-800/50 hover:shadow-lg hover:shadow-gray-500/10 transform hover:scale-105 relative overflow-hidden">
                <span className="relative z-10">See Live Examples</span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </button>
            )}
          </div>

          {/* Hero Visual with animation */}
          {/* Interactive Demo */}
          <div className={`mb-12 transition-all duration-1000 delay-1200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700 max-w-4xl mx-auto backdrop-blur-sm hover:bg-gray-800/70 transition-all duration-300 hover:border-gray-600 hover:shadow-2xl hover:shadow-blue-500/10 group">
              <InteractiveCapsuleDemo />
            </div>
          </div>

          {/* Process Steps */}
          <div className={`mb-12 transition-all duration-1000 delay-1400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="max-w-4xl mx-auto">
              <ProcessSteps />
            </div>
          </div>

          {/* Social Proof with stagger animation */}
          <div className={`flex items-center justify-center space-x-2 text-sm transition-all duration-1000 delay-1400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex text-yellow-400 animate-pulse">
              ⭐⭐⭐⭐⭐
            </div>
            <p className="text-gray-400">
              "Our API docs went from boring to engaging overnight" — 
              <span className="text-white font-medium">Alex Chen, DevRel at TechCorp</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}