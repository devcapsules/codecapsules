import React from 'react';

export function SocialProofSection() {
  return (
    <section className="py-16 lg:py-24 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
            Built for <span className="text-blue-400">Technical Creators</span> Like You
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Coming Soon - Join our early access program and be among the first to transform static content into interactive experiences
          </p>
        </div>

        {/* Early Access Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
          <div className="text-center bg-gray-800/30 border border-gray-700 rounded-xl p-6">
            <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">✨</div>
            <div className="text-white font-semibold mb-2">Early Access</div>
            <div className="text-gray-300 text-sm">Be first to try the platform</div>
          </div>
          <div className="text-center bg-gray-800/30 border border-gray-700 rounded-xl p-6">
            <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">50%</div>
            <div className="text-white font-semibold mb-2">Launch Discount</div>
            <div className="text-gray-300 text-sm">Exclusive pricing for beta users</div>
          </div>
          <div className="text-center bg-gray-800/30 border border-gray-700 rounded-xl p-6">
            <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">🎯</div>
            <div className="text-white font-semibold mb-2">Direct Feedback</div>
            <div className="text-gray-300 text-sm">Shape the product roadmap</div>
          </div>
        </div>

        {/* Problem Scenarios (What creators struggle with) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Course Creator Problem */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">🎓</span>
              </div>
              <div>
                <div className="font-semibold text-white">Course Creators</div>
                <div className="text-gray-400 text-sm">Low completion rates</div>
              </div>
            </div>
            <blockquote className="text-gray-300 text-sm leading-relaxed mb-4">
              "Students watch my coding videos but never practice. They get stuck setting up environments and just give up."
            </blockquote>
            <div className="text-blue-400 text-sm font-medium">
              → DevCapsules lets students code directly in your lessons
            </div>
          </div>

          {/* Documentation Writer Problem */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <div className="font-semibold text-white">API Documentation</div>
                <div className="text-gray-400 text-sm">Poor adoption rates</div>
              </div>
            </div>
            <blockquote className="text-gray-300 text-sm leading-relaxed mb-4">
              "Developers read our docs but don't actually try our API. Static examples just aren't compelling enough."
            </blockquote>
            <div className="text-green-400 text-sm font-medium">
              → Turn boring docs into interactive API playgrounds
            </div>
          </div>

          {/* Corporate Training Problem */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">🏢</span>
              </div>
              <div>
                <div className="font-semibold text-white">Corporate Training</div>
                <div className="text-gray-400 text-sm">Slow onboarding</div>
              </div>
            </div>
            <blockquote className="text-gray-300 text-sm leading-relaxed mb-4">
              "New developers need weeks to get productive. Most training time is wasted on environment setup instead of actual coding."
            </blockquote>
            <div className="text-purple-400 text-sm font-medium">
              → Instant coding environments for faster onboarding
            </div>
          </div>

          {/* Tech Blogger Problem */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">✍️</span>
              </div>
              <div>
                <div className="font-semibold text-white">Tech Bloggers</div>
                <div className="text-gray-400 text-sm">Low engagement</div>
              </div>
            </div>
            <blockquote className="text-gray-300 text-sm leading-relaxed mb-4">
              "Readers scroll past code examples without trying them. My tutorials get buried while interactive content goes viral."
            </blockquote>
            <div className="text-orange-400 text-sm font-medium">
              → Make your tutorials stand out with interactive code
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}