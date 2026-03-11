import React, { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

const TRACKS = [
  {
    id: 'ai',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v2a4 4 0 0 0 4 4h1v2a4 4 0 0 0 8 0v-2h1a4 4 0 0 0 4-4v-2a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" />
        <circle cx="9" cy="10" r="1" /><circle cx="15" cy="10" r="1" />
      </svg>
    ),
    title: 'AI Engineering',
    badge: '7 Courses',
    badgeNote: '180 exercises · Python & JavaScript',
    copy: 'Build the systems behind AI products — not just API wrappers. Each course produces a portfolio-ready project: agent orchestrators, code reviewers, reliability dashboards, and cost monitors. Pure logic, no external libraries.',
    tags: ['LLM Pipelines', 'Agent Systems', 'RAG', 'Guardrails', 'Cost Optimization', 'Monitoring'],
    example: {
      text: '# Build a tool-calling agent loop that:\n# 1. Parses structured LLM output\n# 2. Routes to the correct tool\n# 3. Feeds results back for next iteration\n# 4. Enforces a token budget ceiling',
      note: 'From Course 2: Python Agentic Pipeline — one of 25 exercises that build a working agent engine.',
    },
    accentColor: '#00ff87',
    accentBg: 'rgba(0,255,135,0.07)',
    accentBorder: 'rgba(0,255,135,0.2)',
    badgeColor: '#00ff87',
    badgeBg: 'rgba(0,255,135,0.1)',
  },
  {
    id: 'data',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v4c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
        <path d="M3 9v4c0 1.66 4.03 3 9 3s9-1.34 9-3V9" /><path d="M3 13v4c0 1.66 4.03 3 9 3s9-1.34 9-3v-4" />
      </svg>
    ),
    title: 'Data Analytics',
    badge: 'MVP-Ready',
    badgeNote: 'Pandas / NumPy: limited dataset sizes',
    copy: 'Skip the Jupyter setup. Embed Python + SQL challenges that let students clean, transform, and analyze real datasets instantly. We pre-install Pandas and NumPy (Creator+ / Business tiers) and provide curated sample datasets sized to run safely in the browser sandbox.',
    tags: ['Python', 'SQL', 'Pandas', 'NumPy'],
    example: {
      text: '# Given a CSV of 500 sales records,\n# calculate the top 3 regions by monthly revenue.',
      note: 'Max dataset size: 5 MB per run on Creator+ tier.',
    },
    accentColor: '#00ff87',
    accentBg: 'rgba(0,255,135,0.07)',
    accentBorder: 'rgba(0,255,135,0.2)',
    badgeColor: '#00ff87',
    badgeBg: 'rgba(0,255,135,0.1)',
  },
  {
    id: 'backend',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
    title: 'Backend Engineering',
    badge: 'MVP-Ready',
    badgeNote: 'Network calls are simulated â€” no external HTTP',
    copy: 'Teach server-side logic and database patterns without giving students internet access or server credentials. Students write Node.js or Python code that runs against pre-seeded databases and mock API endpoints â€” so you can safely teach routing, async flows, and DB queries in a fully isolated environment.',
    tags: ['Node.js', 'Python', 'SQL', 'APIs (mocked)'],
    example: {
      text: '// Implement a REST handler that filters orders\n// by status from a pre-seeded SQLite DB.',
      note: 'External HTTP calls replaced with a simulated client â€” no real endpoints.',
    },
    accentColor: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.07)',
    accentBorder: 'rgba(59,130,246,0.2)',
    badgeColor: '#60a5fa',
    badgeBg: 'rgba(59,130,246,0.1)',
  },
  {
    id: 'cs',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    title: 'CS 101 & Algorithms',
    badge: 'MVP-Ready',
    badgeNote: 'C / C++ â€” Coming Soon',
    copy: 'The auto-grader designed for data structures and algorithms. Run and validate student solutions against the Golden 5 test pattern â€” fast, hidden edge cases and a performance test â€” using Java and Python runners. Native C / C++ support is planned; contact us if you need compiler access during your pilot.',
    tags: ['Java', 'Python', 'Algorithms', 'OOP'],
    example: {
      text: '// Return the k most frequent elements\n// in O(n log k) time.',
      note: 'Golden 5 tests: 2 visible + 2 hidden edge cases + 1 performance/stress test.',
    },
    accentColor: '#a78bfa',
    accentBg: 'rgba(139,92,246,0.07)',
    accentBorder: 'rgba(139,92,246,0.2)',
    badgeColor: '#a78bfa',
    badgeBg: 'rgba(139,92,246,0.1)',
  },
];

export function CurriculumSection() {
  const [active, setActive] = useState(0);
  const [hoveredTab, setHoveredTab] = useState<number | null>(null);
  const track = TRACKS[active];

  return (
    <section className="py-14 lg:py-20" style={{ background: '#04040a' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-4"
            style={{ background: 'rgba(0,255,135,0.07)', border: '1px solid rgba(0,255,135,0.18)', color: '#00ff87' }}
          >
            Curriculum Tracks
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-3" style={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Built for the most in-demand<br className="hidden sm:block" /> tech curriculums.
          </h2>
          <p className="text-slate-500 text-sm max-w-2xl mx-auto leading-relaxed">
            Pre-configured execution environments for modern bootcamps &mdash; with clear limits and safe, deterministic runtimes.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 justify-center mb-8 flex-wrap">
          {TRACKS.map((t, i) => {
            const isActive = active === i;
            const isHovered = hoveredTab === i && !isActive;
            return (
              <button
                key={t.id}
                onClick={() => setActive(i)}
                onMouseEnter={() => setHoveredTab(i)}
                onMouseLeave={() => setHoveredTab(null)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
                style={{
                  background: isActive ? t.accentBg : 'rgba(255,255,255,0.03)',
                  border: isActive
                    ? `1px solid ${t.accentBorder}`
                    : isHovered
                    ? '1px solid rgba(0,255,135,0.25)'
                    : '1px solid rgba(255,255,255,0.07)',
                  color: isActive ? t.accentColor : isHovered ? '#fff' : '#475569',
                  boxShadow: isHovered && !isActive ? '0 4px 14px 0 rgba(16,185,129,0.25)' : 'none',
                }}
              >
                <span style={{ color: isActive ? t.accentColor : isHovered ? '#00ff87' : '#475569' }}>{t.icon}</span>
                {t.title}
              </button>
            );
          })}
        </div>

        {/* Animated track card â€” fixed min-height to prevent layout shift */}
        <div className="relative" style={{ minHeight: 340 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="rounded-2xl p-6 sm:p-8"
              style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${track.accentBorder}` }}
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-5">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: track.accentBg, border: `1px solid ${track.accentBorder}`, color: track.accentColor }}
                >
                  {track.icon}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-lg font-black text-white">{track.title}</h3>
                    {/* MVP-Ready badge with pulse dot */}
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: track.badgeBg, border: `1px solid ${track.accentBorder}`, color: track.badgeColor }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: track.badgeColor, boxShadow: `0 0 5px ${track.badgeColor}` }} />
                      {track.badge}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: '#475569' }}>{track.badgeNote}</p>
                </div>
              </div>

              <p className="text-slate-400 text-sm leading-relaxed mb-5">{track.copy}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-5">
                {track.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Code sample â€” monospace, terminal-style */}
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${track.accentBorder}` }}
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,95,87,0.6)' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,189,46,0.6)' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(39,201,63,0.6)' }} />
                  <span className="ml-auto text-[10px] font-mono" style={{ color: '#334155' }}>sample challenge</span>
                </div>
                <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono" style={{ color: track.accentColor }}>
                  {track.example.text}
                </pre>
                <p className="text-[11px] font-mono mt-2" style={{ color: '#334155' }}># {track.example.note}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* C/C++ enterprise CTA */}
        <p className="text-center text-xs text-slate-600 mt-6">
          Need C / C++ now?{' '}
          <Link href="mailto:hello@devcapsules.com" className="underline hover:text-slate-400 transition-colors">
            Contact us about early compiler access
          </Link>{' '}
          &mdash; we&apos;re qualifying enterprise pilot requests.
        </p>

      </div>
    </section>
  );
}


