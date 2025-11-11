import React from 'react';

export function ProblemSection() {
  return (
    <section className="py-16 lg:py-24 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
            Why Does <span className="text-red-400">Technical Content</span> Have Such Low Engagement?
          </h2>
        </div>

        {/* 3-Column Pain Points */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Pain Point 1 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">�</span>
            </div>
            <h3 className="text-lg font-bold mb-3 text-red-400">Passive Learning Doesn't Work</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Reading code blocks in docs, tutorials, or courses is like learning to drive by reading the manual.
            </p>
          </div>

          {/* Pain Point 2 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⚙️</span>
            </div>
            <h3 className="text-lg font-bold mb-3 text-orange-400">Setup Friction Kills Interest</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              "Clone the repo, install dependencies, configure..." Most people give up before they start.
            </p>
          </div>

          {/* Pain Point 3 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-lg font-bold mb-3 text-yellow-400">No Interaction Analytics</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              You have no idea if readers actually understand your code or just scroll past it.
            </p>
          </div>
        </div>

        {/* Call-Out Box */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl p-8 text-center">
            <h3 className="text-xl font-bold text-white mb-4">The Universal Problem:</h3>
            <div className="space-y-2 text-gray-200">
              <p className="text-sm">Whether you're writing API docs, blog posts, or courses...</p>
              <p className="text-lg font-semibold text-white">
                Static code examples create passive, disengaged audiences.
              </p>
              <p className="text-xl font-bold text-red-400">
                Interactive content drives 3x higher engagement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}