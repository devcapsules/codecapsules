import React from 'react';

export function SolutionSection() {
  return (
    <section className="py-16 lg:py-24 bg-[#04040a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
            Devcapsules = <span className="text-[#00ff87]">Interactive Code</span>, Everywhere
          </h2>
        </div>

        {/* 3-Step Visual Flow */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-[#00ff87]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" fill="none" stroke="#00ff87" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.937 15.5A2 2 0 008.5 14.063l-6.135-1.582a.5.5 0 010-.962L8.5 9.937A2 2 0 009.937 8.5l1.582-6.135a.5.5 0 01.963 0L14.063 8.5A2 2 0 0015.5 9.937l6.135 1.581a.5.5 0 010 .964L15.5 14.063a2 2 0 00-1.437 1.437l-1.582 6.135a.5.5 0 01-.963 0z"/></svg>
            </div>
            <div className="bg-[#00ff87]/10 rounded-lg px-4 py-2 mb-4 inline-block">
              <span className="text-[#00ff87] font-semibold text-sm">Step 1: Generate</span>
            </div>
            <h3 className="text-lg font-bold mb-3">Paste Your Code</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Paste any code snippet.<br />
              EdGE Forge instantly creates an interactive playground with explanations and exercises.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" fill="none" stroke="#a78bfa" strokeWidth="1.5" viewBox="0 0 24 24"><polyline strokeLinecap="round" strokeLinejoin="round" points="16 18 22 12 16 6"/><polyline strokeLinecap="round" strokeLinejoin="round" points="8 6 2 12 8 18"/></svg>
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
              <svg width="32" height="32" fill="none" stroke="#4ade80" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18"/><path strokeLinecap="round" strokeLinejoin="round" d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
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
                <svg width="22" height="22" fill="none" stroke="#f87171" strokeWidth="1.5" viewBox="0 0 24 24" className="mr-3 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"/></svg>
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
                <svg width="22" height="22" fill="none" stroke="#4ade80" strokeWidth="1.5" viewBox="0 0 24 24" className="mr-3 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
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