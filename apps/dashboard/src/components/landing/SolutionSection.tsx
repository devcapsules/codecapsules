import React from 'react';

export function SolutionSection() {
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
            CodeCapsule = <span className="text-blue-400">Interactive Code</span>, Everywhere
          </h2>
        </div>

        {/* 3-Step Visual Flow */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🤖</span>
            </div>
            <div className="bg-blue-500/10 rounded-lg px-4 py-2 mb-4 inline-block">
              <span className="text-blue-400 font-semibold text-sm">Step 1: Generate</span>
            </div>
            <h3 className="text-lg font-bold mb-3">Paste Your Code</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Paste any code snippet.<br />
              AI instantly creates an interactive playground with explanations and exercises.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🌐</span>
            </div>
            <div className="bg-purple-500/10 rounded-lg px-4 py-2 mb-4 inline-block">
              <span className="text-purple-400 font-semibold text-sm">Step 2: Embed</span>
            </div>
            <h3 className="text-lg font-bold mb-3">Embed Anywhere</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Copy the embed code.<br />
              Works in docs, blogs, courses, GitHub READMEs, or any website.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📊</span>
            </div>
            <div className="bg-green-500/10 rounded-lg px-4 py-2 mb-4 inline-block">
              <span className="text-green-400 font-semibold text-sm">Step 3: Track</span>
            </div>
            <h3 className="text-lg font-bold mb-3">See Engagement</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              See who's interacting with your content.<br />
              Real engagement data, not just page views.
            </p>
          </div>
        </div>

        {/* Before/After Comparison */}
        <div className="max-w-5xl mx-auto">
          <h3 className="text-xl font-bold text-center mb-8">Static vs Interactive Content</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Before */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">📄</span>
                <h4 className="text-lg font-bold text-red-400">Static Code Blocks</h4>
              </div>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  <span>Readers just scroll past</span>
                </div>
                <div className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  <span>No way to test examples</span>
                </div>
                <div className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  <span>Copy-paste to external tools</span>
                </div>
                <div className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  <span>Zero engagement data</span>
                </div>
              </div>
            </div>

            {/* After */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">⚡</span>
                <h4 className="text-lg font-bold text-green-400">Interactive Playgrounds</h4>
              </div>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span>Readers click and explore</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span>Run and modify code instantly</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span>Everything works inline</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span>See who's really engaging</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}