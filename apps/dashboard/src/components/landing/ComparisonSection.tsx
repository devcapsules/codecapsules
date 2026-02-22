import React from 'react';
import Link from 'next/link';

export function ComparisonSection() {
  return (
    <section className="py-14 lg:py-20 bg-[#04040a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3">
            Why Choose <span className="text-[#00ff87]">DevCapsules</span>?
          </h2>
          <p className="text-sm text-gray-400 max-w-2xl mx-auto">
            Built specifically for technical content creators who want to make their work truly interactive
          </p>
        </div>

        {/* Key Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 reveal-stagger">
          {/* Benefit 1 */}
          <div className="rounded-xl p-6 text-center transition-all duration-200 cursor-default"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,255,135,0.2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.2)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00ff87" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-[#00ff87]">Lightning Fast Setup</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Generate interactive coding environments in 30 seconds with AI. No complex configurations or technical setup required.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="rounded-xl p-6 text-center transition-all duration-200 cursor-default"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(34,197,94,0.2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-green-400">Zero Friction for Users</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your audience can start coding immediately. No accounts, downloads, or installations. Just click and code.
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="rounded-xl p-6 text-center transition-all duration-200 cursor-default"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(139,92,246,0.2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 18 22 12 16 6"/><path d="M8 6 2 12 8 18"/></svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-purple-400">Embed Anywhere</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Works in any LMS, blog, documentation site, or platform. Simple iframe embed - no special integrations needed.
            </p>
          </div>

          {/* Benefit 4 */}
          <div className="rounded-xl p-6 text-center transition-all duration-200 cursor-default"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(6,182,212,0.2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-cyan-400">Rich Analytics</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              See exactly how your audience interacts with your code. Track engagement, completion rates, and learning patterns.
            </p>
          </div>

          {/* Benefit 5 */}
          <div className="rounded-xl p-6 text-center transition-all duration-200 cursor-default"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(249,115,22,0.2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-orange-400">Your Brand, Your Style</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Customize colors, themes, and branding to match your content. Professional appearance that builds trust.
            </p>
          </div>

          {/* Benefit 6 */}
          <div className="rounded-xl p-6 text-center transition-all duration-200 cursor-default"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(236,72,153,0.2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-pink-400">Built for Scale</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              From individual creators to enterprise training programs. Secure, reliable, and ready for any audience size.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Link href="/signup" className="inline-block bg-[#00ff87] hover:bg-[#00ef77] text-black px-8 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg shadow-green-500/25">
            Join Early Access Program
          </Link>
        </div>
      </div>
    </section>
  );
}