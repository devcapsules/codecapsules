import React from 'react';

export function PlatformShowcaseSection() {
  return (
    <section className="py-16 lg:py-24 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
            Embed Interactive Code <span className="text-blue-400">Anywhere</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Works with every platform your audience already uses
          </p>
        </div>

        {/* 3x3 Platform Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          {/* Content Platforms */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center hover:border-blue-500/50 transition-all">
            <div className="text-2xl mb-2">📝</div>
            <h4 className="font-semibold text-sm text-white mb-1">Medium</h4>
            <p className="text-xs text-gray-400">Blog Posts</p>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center hover:border-blue-500/50 transition-all">
            <div className="text-2xl mb-2">👩‍💻</div>
            <h4 className="font-semibold text-sm text-white mb-1">Dev.to</h4>
            <p className="text-xs text-gray-400">Tech Articles</p>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center hover:border-blue-500/50 transition-all">
            <div className="text-2xl mb-2">👻</div>
            <h4 className="font-semibold text-sm text-white mb-1">Ghost</h4>
            <p className="text-xs text-gray-400">Publishing</p>
          </div>

          {/* Documentation */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center hover:border-green-500/50 transition-all">
            <div className="text-2xl mb-2">📚</div>
            <h4 className="font-semibold text-sm text-white mb-1">GitBook</h4>
            <p className="text-xs text-gray-400">API Docs</p>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center hover:border-green-500/50 transition-all">
            <div className="text-2xl mb-2">📄</div>
            <h4 className="font-semibold text-sm text-white mb-1">Notion</h4>
            <p className="text-xs text-gray-400">Documentation</p>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center hover:border-green-500/50 transition-all">
            <div className="text-2xl mb-2">🔗</div>
            <h4 className="font-semibold text-sm text-white mb-1">Confluence</h4>
            <p className="text-xs text-gray-400">Team Wikis</p>
          </div>

          {/* Learning Platforms */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center hover:border-purple-500/50 transition-all">
            <div className="text-2xl mb-2">🎓</div>
            <h4 className="font-semibold text-sm text-white mb-1">Udemy</h4>
            <p className="text-xs text-gray-400">Online Courses</p>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center hover:border-purple-500/50 transition-all">
            <div className="text-2xl mb-2">🏫</div>
            <h4 className="font-semibold text-sm text-white mb-1">Canvas</h4>
            <p className="text-xs text-gray-400">LMS</p>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center hover:border-purple-500/50 transition-all">
            <div className="text-2xl mb-2">📋</div>
            <h4 className="font-semibold text-sm text-white mb-1">Moodle</h4>
            <p className="text-xs text-gray-400">Training</p>
          </div>
        </div>

        {/* Special Callouts */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">📂</div>
            <h3 className="text-lg font-bold mb-2">GitHub READMEs</h3>
            <p className="text-gray-300 text-sm">
              Make your project documentation interactive. Show, don't just tell.
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-green-500/10 to-teal-500/10 border border-green-500/30 rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">🌐</div>
            <h3 className="text-lg font-bold mb-2">Any Website</h3>
            <p className="text-gray-300 text-sm">
              Works anywhere that accepts HTML embeds. No platform restrictions.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-gray-400 mb-4">
            Already have content? Make it interactive in minutes.
          </p>
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25">
            Start Free Trial
          </button>
        </div>
      </div>
    </section>
  );
}