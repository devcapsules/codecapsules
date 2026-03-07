import React from 'react';
import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-20 lg:py-24 relative overflow-hidden text-center" style={{ background: 'linear-gradient(180deg, #04040a 0%, #061a10 40%, #071f13 100%)' }}>
      {/* CTA orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] pointer-events-none anim-orb-cta"
        style={{ background: 'radial-gradient(ellipse, rgba(0,255,135,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="relative z-10 max-w-2xl mx-auto px-4">
        <h2 className="text-3xl md:text-[2.5rem] lg:text-[3rem] font-black tracking-tight text-white mb-4" style={{ letterSpacing: '-0.025em', lineHeight: 1.1 }}>
          Ready to stop manually<br/>
          <span style={{
            background: 'linear-gradient(90deg, #00ff87 0%, #86efac 30%, #00ff87 50%, #00b894 80%, #00ff87 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'shimmerText 3s linear infinite',
          }}>grading code?</span>
        </h2>
        <p className="text-slate-500 text-lg mb-10">
          Join the creators and bootcamps building the next generation of interactive education.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Link href="/signup"
            className="inline-flex items-center gap-2 px-6 sm:px-9 py-3.5 sm:py-4 rounded-2xl font-black text-black text-base sm:text-lg transition-all duration-200 hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #00ff87, #00b894)', boxShadow: '0 0 40px rgba(0,255,135,0.35)' }}>
            Start Building Free
            <svg width="18" height="18" fill="none" viewBox="0 0 18 18" className="hidden sm:block"><path d="M3 9h12M10 5l5 4-5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>
        <p className="text-xs text-slate-700">No credit card <span aria-hidden="true"> &middot; </span> Free tier forever <span aria-hidden="true"> &middot; </span> 5-minute setup</p>
      </div>
    </section>
  );
}
