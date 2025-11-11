import React from 'react';

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 lg:py-24 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
            Everything You Need to Make Content <span className="text-blue-400">Interactive</span>
          </h2>
        </div>

        {/* Feature Grid (2x3) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-colors">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🌍</span>
            </div>
            <h3 className="text-lg font-bold mb-3">25+ Programming Languages</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Python, JavaScript, Java, C++, Go, Rust, and more. Whatever language you're teaching or documenting.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-colors">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">💻</span>
            </div>
            <h3 className="text-lg font-bold mb-3">Professional Code Editor</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Monaco editor (same as VS Code) with syntax highlighting, auto-completion, and error detection.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-colors">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🔗</span>
            </div>
            <h3 className="text-lg font-bold mb-3">Universal Embeds</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Works everywhere: blogs, docs, courses, GitHub READMEs, or any website that supports HTML embeds.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-colors">
            <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">�</span>
            </div>
            <h3 className="text-lg font-bold mb-3">Enterprise Security</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              SOC 2 compliant, sandboxed execution, and enterprise SSO support for corporate training programs.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-colors">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🎨</span>
            </div>
            <h3 className="text-lg font-bold mb-3">Brand Customization</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Match your brand colors, add your logo, customize the interface to fit your content style.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-colors">
            <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-bold mb-3">Deep Analytics</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              See who's interacting with your code, how long they spend, and what they're actually trying.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}