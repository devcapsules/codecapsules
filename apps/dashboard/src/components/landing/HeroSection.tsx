import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import TerminalReplay from './TerminalReplay';

export function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => { setMounted(true); }, []);

  return (
    <section className="relative overflow-hidden bg-[#04040a]">
      {/* Orb glows */}
      <div className="absolute top-[-80px] left-1/4 w-[500px] h-[380px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,255,135,0.13) 0%, transparent 70%)', filter: 'blur(90px)', animation: 'orbFloat1 9s ease-in-out infinite' }} />
      <div className="absolute bottom-0 right-[-60px] w-[420px] h-[320px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.1) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'orbFloat 9s ease-in-out infinite', animationDelay: '-4s' }} />

      {/* ── HERO TEXT — full viewport on mobile, left col on desktop ─── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="min-h-0 lg:min-h-screen flex lg:items-center">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center w-full pt-8 pb-10 lg:py-14">

            {/* ── LEFT COLUMN (text) ──────────────────────────────── */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-7 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ background: 'rgba(0,255,135,0.07)', borderColor: 'rgba(0,255,135,0.2)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff87] flex-shrink-0"
                  style={{ boxShadow: '0 0 8px #00ff87', animation: 'pulseDot 2s ease-in-out infinite' }} />
                <span className="text-[#00ff87] text-xs font-semibold tracking-wide">
                  Now live &mdash; Python &middot; Java &middot; Node.js execution
                </span>
              </div>

              {/* Headline */}
              <h1 className={`text-[1.85rem] sm:text-[2.6rem] lg:text-[3.2rem] font-black leading-[1.1] tracking-[-0.03em] text-white mb-5 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                Embed auto-graded<br />
                <span style={{
                  background: 'linear-gradient(90deg, #00ff87 0%, #86efac 30%, #00ff87 50%, #00b894 80%, #00ff87 100%)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'shimmerText 3s linear infinite',
                }}>coding challenges</span><br />
                anywhere in minutes.
              </h1>

              {/* Subheadline */}
              <p className={`text-sm sm:text-base text-slate-400 mb-8 max-w-md mx-auto lg:mx-0 leading-relaxed transition-all duration-1000 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                Turn your static tutorials into live, interactive coding environments.{' '}
                <span className="text-slate-300">Zero local setup</span> for your students.{' '}
                <span className="text-slate-300">Zero manual grading</span> for your team.
              </p>

              {/* CTA Buttons */}
              <div className={`flex flex-col sm:flex-row gap-3 mb-6 justify-center lg:justify-start transition-all duration-1000 delay-600 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {!loading && user ? (
                  <Link href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-black transition-all hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg,#00ff87,#00b894)', boxShadow: '0 0 24px rgba(0,255,135,0.3)' }}>
                    Create New Capsule
                    <svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </Link>
                ) : (
                  <Link href="/signup"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-black transition-all hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg,#00ff87,#00b894)', boxShadow: '0 0 24px rgba(0,255,135,0.3)' }}>
                    Create Your First Capsule (Free)
                    <svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </Link>
                )}
                <Link href="/blog/stop-copy-pasting"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-slate-300 hover:text-white transition-all hover:border-white/25"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                  <svg width="13" height="13" fill="none" viewBox="0 0 13 13"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 4.5l4 2-4 2V4.5z" fill="currentColor"/></svg>
                  View Live Demo
                </Link>
              </div>

              {/* Trust line */}
              <p className={`text-xs text-slate-500 transition-all duration-1000 delay-800 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                No credit card required &nbsp;&middot;&nbsp; Free tier forever &nbsp;&middot;&nbsp; Setup in &lt;5 min
              </p>
            </div>

            {/* ── RIGHT COLUMN (terminal — desktop only in grid) ──── */}
            <div className={`hidden lg:block transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <TerminalReplay />
            </div>

          </div>
        </div>
      </div>

      {/* ── TERMINAL — below the fold on mobile ─────────────────── */}
      <div className={`lg:hidden relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-6 pb-16 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <TerminalReplay />
      </div>

    </section>
  );
}