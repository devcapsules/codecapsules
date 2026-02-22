import React, { useState } from 'react';

export function SocialProofSection() {
  const [copied, setCopied] = useState(false);

  const iframeCode = `<iframe
  src="https://app.devcapsules.com/embed/two-sum"
  width="100%"
  height="520"
  frameborder="0"
  allow="scripts"
></iframe>`;

  function handleCopy() {
    navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="py-14 lg:py-20 relative overflow-hidden" style={{ background: '#04040a' }}>
      {/* background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,255,135,0.06) 0%, transparent 60%)', filter: 'blur(60px)' }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left â€” copy */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-5"
              style={{ background: 'rgba(0,255,135,0.07)', border: '1px solid rgba(0,255,135,0.18)', color: '#00ff87' }}>
              Drop-in Embed
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-4" style={{ letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              One line of code to make your curriculum
              <span style={{
                background: 'linear-gradient(90deg, #00ff87 0%, #86efac 30%, #00ff87 50%, #00b894 80%, #00ff87 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'shimmerText 3s linear infinite',
                display: 'block',
              }}> executable.</span>
            </h2>

            <p className="text-slate-500 text-base mb-7">Drop an iframe wherever your students already live &mdash; no installs, no accounts, no waiting.</p>

            <ul className="space-y-3">
              {[
                ['Works in Canvas, Notion, Webflow & Hashnode', '#00ff87'],
                ['Isolated execution â€” no server-side state leaks', '#00ff87'],
                ['No student accounts required', '#00ff87'],
                ['Fully responsive on any screen', '#00ff87'],
              ].map(([text, color]) => (
                <li key={text} className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.2)' }}>
                    <svg width="10" height="10" fill="none" viewBox="0 0 10 10">
                      <path d="M2 5l2.5 2.5L8 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Right â€” code card */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,10,20,0.6)', backdropFilter: 'blur(16px)' }}>
            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f56' }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ffbd2e' }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#27c93f' }} />
              </div>
              <span className="text-xs text-slate-600">embed.html</span>
              <button onClick={handleCopy}
                className="text-xs px-3 py-1 rounded-lg font-medium transition-all"
                style={{ background: copied ? 'rgba(0,255,135,0.15)' : 'rgba(255,255,255,0.05)', color: copied ? '#00ff87' : '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {/* Code block */}
            <pre className="p-6 text-sm overflow-x-auto" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", lineHeight: 1.7, margin: 0 }}>
<code>
<span style={{ color: '#64748b' }}>&lt;</span><span style={{ color: '#00ff87' }}>iframe</span>{`\n`}
<span style={{ color: '#94a3b8' }}>{'  '}src</span><span style={{ color: '#64748b' }}>=</span><span style={{ color: '#fbbf24' }}>"https://app.devcapsules.com/embed/two-sum"</span>{`\n`}
<span style={{ color: '#94a3b8' }}>{'  '}width</span><span style={{ color: '#64748b' }}>=</span><span style={{ color: '#fbbf24' }}>"100%"</span>{`\n`}
<span style={{ color: '#94a3b8' }}>{'  '}height</span><span style={{ color: '#64748b' }}>=</span><span style={{ color: '#fbbf24' }}>"520"</span>{`\n`}
<span style={{ color: '#94a3b8' }}>{'  '}frameborder</span><span style={{ color: '#64748b' }}>=</span><span style={{ color: '#fbbf24' }}>"0"</span>{`\n`}
<span style={{ color: '#94a3b8' }}>{'  '}allow</span><span style={{ color: '#64748b' }}>=</span><span style={{ color: '#fbbf24' }}>"scripts"</span>{`\n`}
<span style={{ color: '#64748b' }}>&gt;&lt;/</span><span style={{ color: '#00ff87' }}>iframe</span><span style={{ color: '#64748b' }}>&gt;</span>
</code>
</pre>
            {/* Footer tags */}
            <div className="flex flex-wrap gap-2 px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {['Sandboxed', 'HTTPS', 'Responsive', 'Auto-graded'].map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded"
                  style={{ background: 'rgba(0,255,135,0.08)', color: '#00ff87', border: '1px solid rgba(0,255,135,0.15)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
