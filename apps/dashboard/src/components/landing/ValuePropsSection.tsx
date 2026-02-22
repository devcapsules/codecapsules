import React from 'react';
import Link from 'next/link';

export function ValuePropsSection() {
  return (
    <section className="py-14 lg:py-20" style={{ background: '#04040a' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-4"
            style={{ background: 'rgba(0,255,135,0.07)', border: '1px solid rgba(0,255,135,0.18)', color: '#00ff87' }}>
            Who It&apos;s For
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white" style={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            The engine behind<br/>
            <span style={{
              background: 'linear-gradient(90deg, #00ff87 0%, #86efac 30%, #00ff87 50%, #00b894 80%, #00ff87 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmerText 3s linear infinite',
            }}>interactive tech education.</span>
          </h2>
        </div>

        {/* Two audience cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-10 reveal-stagger">
          {/* Bootcamps & EdTech */}
          <div className="relative rounded-2xl p-8 overflow-hidden transition-all duration-400 hover:-translate-y-1"
            style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,10,20,0.5)', backdropFilter: 'blur(12px)' }}>
            <div className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full pointer-events-none"
              style={{ background: '#3b82f6', filter: 'blur(60px)', opacity: 0.07 }} />
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
            </div>
            <h3 className="text-xl font-black text-white mb-3">For Bootcamps &amp; EdTech</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-5">
              Eliminate the <strong className="text-slate-400">&ldquo;Week 1 Setup&rdquo;</strong> churn. Drastically reduce your TA payroll by automating the grading of foundational Python, Java, and JavaScript assignments.
            </p>
            <ul className="space-y-2">
              {[
                'Students write code from Day 1, not Day 5',
                'Grading happens automatically, at scale',
                'High concurrency on the Business plan',
              ].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center"
                    style={{ background: 'rgba(0,255,135,0.12)', border: '1px solid rgba(0,255,135,0.2)' }}>
                    <svg width="8" height="8" fill="none" viewBox="0 0 8 8"><path d="M1.5 4l2 2 3-3" stroke="#00ff87" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Solo Creators & Instructors */}
          <div className="relative rounded-2xl p-8 overflow-hidden transition-all duration-400 hover:-translate-y-1"
            style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,10,20,0.5)', backdropFilter: 'blur(12px)' }}>
            <div className="absolute bottom-[-40px] left-[-40px] w-48 h-48 rounded-full pointer-events-none"
              style={{ background: '#8b5cf6', filter: 'blur(60px)', opacity: 0.07 }} />
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </div>
            <h3 className="text-xl font-black text-white mb-3">For Solo Creators &amp; Instructors</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-5">
              Stand out from the crowd. Turn your passive Hashnode articles or Udemy video descriptions into <strong className="text-slate-400">interactive, runnable coding challenges</strong> that keep your audience engaged.
            </p>
            <ul className="space-y-2">
              {[
                'Embed challenges into any blog or course',
                'AI generates test cases, you get the credit',
                'Free tier to get started immediately',
              ].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center"
                    style={{ background: 'rgba(0,255,135,0.12)', border: '1px solid rgba(0,255,135,0.2)' }}>
                    <svg width="8" height="8" fill="none" viewBox="0 0 8 8"><path d="M1.5 4l2 2 3-3" stroke="#00ff87" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center">
          <Link href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-black text-base transition-all hover:scale-[1.03]"
            style={{ background: '#00ff87', boxShadow: '0 0 24px rgba(0,255,135,0.3)' }}>
            Get Started Free
            <svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
