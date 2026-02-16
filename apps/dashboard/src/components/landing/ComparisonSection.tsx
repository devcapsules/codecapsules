import React from 'react';
import Link from 'next/link';

export function ComparisonSection() {
  return (
    <section className="py-16 lg:py-24 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
            Why Choose <span className="text-blue-400">DevCapsules</span>?
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Built specifically for technical content creators who want to make their work truly interactive
          </p>
        </div>

        {/* Key Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Benefit 1 */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center hover:bg-gray-800/70 transition-colors">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚡</span>
            </div>
            <h3 className="text-xl font-bold mb-3 text-blue-400">Lightning Fast Setup</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Generate interactive coding environments in 30 seconds with AI. No complex configurations or technical setup required.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center hover:bg-gray-800/70 transition-colors">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎯</span>
            </div>
            <h3 className="text-xl font-bold mb-3 text-green-400">Zero Friction for Users</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your audience can start coding immediately. No accounts, downloads, or installations. Just click and code.
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center hover:bg-gray-800/70 transition-colors">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🌐</span>
            </div>
            <h3 className="text-xl font-bold mb-3 text-purple-400">Embed Anywhere</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Works in any LMS, blog, documentation site, or platform. Simple iframe embed - no special integrations needed.
            </p>
          </div>

          {/* Benefit 4 */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center hover:bg-gray-800/70 transition-colors">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-xl font-bold mb-3 text-cyan-400">Rich Analytics</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              See exactly how your audience interacts with your code. Track engagement, completion rates, and learning patterns.
            </p>
          </div>

          {/* Benefit 5 */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center hover:bg-gray-800/70 transition-colors">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎨</span>
            </div>
            <h3 className="text-xl font-bold mb-3 text-orange-400">Your Brand, Your Style</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Customize colors, themes, and branding to match your content. Professional appearance that builds trust.
            </p>
          </div>

          {/* Benefit 6 */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center hover:bg-gray-800/70 transition-colors">
            <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🚀</span>
            </div>
            <h3 className="text-xl font-bold mb-3 text-pink-400">Built for Scale</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              From individual creators to enterprise training programs. Secure, reliable, and ready for any audience size.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Link href="/signup" className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25">
            Join Early Access Program
          </Link>
        </div>
      </div>
    </section>
  );
}