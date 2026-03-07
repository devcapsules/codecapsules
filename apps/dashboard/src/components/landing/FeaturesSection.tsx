import React from 'react';

export function FeaturesSection() {
  return (
    <section id="features" className="py-14 lg:py-20 border-t border-white/[0.05] border-b border-white/[0.05]" style={{ background: 'rgba(255,255,255,0.008)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-4"
            style={{ background: 'rgba(0,255,135,0.07)', border: '1px solid rgba(0,255,135,0.18)', color: '#00ff87' }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M3.5 6l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Core Features
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-3" style={{ letterSpacing: '-0.02em' }}>
            Built for educators.<br/>
            <span style={{
              background: 'linear-gradient(90deg, #00ff87 0%, #86efac 30%, #00ff87 50%, #00b894 80%, #00ff87 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmerText 3s linear infinite',
            }}>Designed to save time.</span>
          </h2>
        </div>

        {/* Feature Grid — 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 reveal-stagger">

          {/* Feature 1 — Zero-Setup */}
          <div className="feat-card rounded-2xl p-7 border" style={{
            '--card-glow': 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(10,10,20,0.6)',
            backdropFilter: 'blur(12px)',
          } as React.CSSProperties}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(59,130,246,0.15)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
            </div>
            <h3 className="text-lg font-black text-white mb-2">Zero-Setup Environments</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              Stop losing beginners to environment configuration errors. Students write, run, and test code directly in their browser. We handle isolated execution securely.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa' }}>Python</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', color: '#fb923c' }}>Java</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)', color: '#fbbf24' }}>Node.js</span>
            </div>
          </div>

          {/* Feature 2 — Auto-Grading */}
          <div className="feat-card rounded-2xl p-7 border" style={{
            '--card-glow': 'rgba(0,255,135,0.1)',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(10,10,20,0.6)',
            backdropFilter: 'blur(12px)',
          } as React.CSSProperties}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(0,255,135,0.12)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00ff87" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <h3 className="text-lg font-black text-white mb-2">Instant Auto-Grading</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              Stop paying TAs to review basic syntax. Our hidden test harnesses evaluate student logic instantly, preventing hardcoding and catching edge cases automatically.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.2)', color: '#00ff87' }}>Hidden tests</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.2)', color: '#00ff87' }}>Edge cases</span>
            </div>
          </div>

          {/* Feature 3 — EdGE Forge Generator */}
          <div className="feat-card rounded-2xl p-7 border" style={{
            '--card-glow': 'rgba(139,92,246,0.12)',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(10,10,20,0.6)',
            backdropFilter: 'blur(12px)',
          } as React.CSSProperties}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(139,92,246,0.15)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.937A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
            </div>
            <h3 className="text-lg font-black text-white mb-2">EdGE Forge</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              Never write boilerplate or test cases from scratch again. Describe a topic, and EdGE Forge generates the problem statement, reference solution, and 5 robust test cases in seconds.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}>Creator+</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}>5 test cases</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}