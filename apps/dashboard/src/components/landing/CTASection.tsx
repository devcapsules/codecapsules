import React from 'react';

export function CTASection() {
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Section Header */}
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
          Make Your Content <span className="text-blue-400">Interactive</span> Today
        </h2>
        
        <p className="text-lg text-gray-300 mb-8">
          Join 1,200+ creators making technical content that people actually engage with.
        </p>

        {/* Segment-Specific CTAs */}
        <div className="grid md:grid-cols-2 gap-6 mb-8 max-w-2xl mx-auto">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-2">Course Creators & Bloggers</h3>
            <p className="text-gray-300 text-sm mb-4">Turn static tutorials into interactive experiences</p>
            <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25">
              Start Free Trial
            </button>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-2">Teams & Enterprises</h3>
            <p className="text-gray-300 text-sm mb-4">Scale interactive training across your organization</p>
            <button className="w-full border border-gray-600 hover:border-gray-500 px-6 py-3 rounded-lg font-semibold transition-all hover:bg-gray-800/50">
              Schedule Demo
            </button>
          </div>
        </div>

        {/* Below CTA Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="flex items-center justify-center sm:justify-start">
            <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-300 text-sm">14-day free trial</span>
          </div>
          <div className="flex items-center justify-center sm:justify-start">
            <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-300 text-sm">No credit card required</span>
          </div>
          <div className="flex items-center justify-center sm:justify-start">
            <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-300 text-sm">Cancel anytime</span>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5"/>
            </svg>
            <span className="text-sm">Stripe Verified</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M12 7C13.11 7 14 7.89 14 9C14 10.11 13.11 11 12 11C10.89 11 10 10.11 10 9C10 7.89 10.89 7 12 7M16 15C16 16.67 14.67 18 13 18H11C9.33 18 8 16.67 8 15V14H16V15Z"/>
            </svg>
            <span className="text-sm">GDPR Compliant</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18,8A6,6 0 0,0 12,2A6,6 0 0,0 6,8H4A2,2 0 0,0 2,10V20A2,2 0 0,0 4,22H20A2,2 0 0,0 22,20V10A2,2 0 0,0 20,8H18M12,4A4,4 0 0,1 16,8H8A4,4 0 0,1 12,4Z"/>
            </svg>
            <span className="text-sm">SSL Secured</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
            </svg>
            <span className="text-sm">99.9% Uptime</span>
          </div>
        </div>
      </div>
    </section>
  );
}