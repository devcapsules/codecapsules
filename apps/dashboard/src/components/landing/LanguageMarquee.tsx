import React from 'react';

const LANGUAGES = [
  { label: 'Python', status: 'mvp' },
  { label: 'JavaScript', status: 'mvp' },
  { label: 'Java', status: 'mvp' },
  { label: 'SQL', status: 'mvp' },
  { label: 'C', status: 'soon' },
  { label: 'C++', status: 'soon' },
];

export function LanguageMarquee() {
  // Repeat enough times so the track always overflows the viewport for a seamless loop
  const repeated = [...LANGUAGES, ...LANGUAGES, ...LANGUAGES, ...LANGUAGES, ...LANGUAGES];

  return (
    <div
      className="relative py-6 overflow-hidden"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
    >


      {/* Caption */}
      <p className="text-center text-xs text-slate-700 uppercase tracking-widest font-bold mb-4">
        Powered by lightning-fast, secure execution infrastructure
      </p>

      {/* fade-left */}
      <div className="absolute left-0 top-0 h-full w-24 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #04040a, transparent)' }} />
      {/* fade-right */}
      <div className="absolute right-0 top-0 h-full w-24 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #04040a, transparent)' }} />

      <div className="overflow-hidden">
        <div className="marquee-track">
          {repeated.map((lang, i) => (
            <span
              key={`${lang.label}-${i}`}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full whitespace-nowrap text-sm font-medium"
              style={{
                background: lang.status === 'soon' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                border: lang.status === 'soon' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.08)',
                color: lang.status === 'soon' ? '#334155' : '#64748b',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: lang.status === 'soon' ? 'rgba(255,255,255,0.1)' : 'rgba(0,255,135,0.5)' }} />
              {lang.label}
              {lang.status === 'soon' && (
                <span className="text-[9px] font-bold tracking-wide" style={{ color: '#475569' }}>SOON</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
