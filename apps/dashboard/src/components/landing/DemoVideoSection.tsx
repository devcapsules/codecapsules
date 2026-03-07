import React, { useRef, useState } from 'react';
import { TEST_CASES } from '../../lib/constants';
import { useAnimation } from '../../context/AnimationContext';

export default function DemoVideoSection() {
  const { openTestPass } = useAnimation();
  const [running,     setRunning]     = useState(false);
  const [visible,     setVisible]     = useState<boolean[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef   = useRef<HTMLDivElement>(null);

  const spawnConfetti = () => {
    const canvas = canvasRef.current;
    const card   = cardRef.current;
    if (!canvas || !card) return;
    canvas.width  = card.offsetWidth;
    canvas.height = card.offsetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const colors = ['#00ff87','#3b82f6','#8b5cf6','#f59e0b','#ec4899','#86efac'];
    const pieces = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width, y: -10,
      vx: (Math.random() - 0.5) * 4,   vy: Math.random() * 3 + 1.5,
      w: Math.random() * 8 + 4,         h: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360,          rv: (Math.random() - 0.5) * 8,
      alpha: 1,
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      pieces.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += p.rv;
        p.vy += 0.08; p.alpha -= 0.012;
        if (p.alpha > 0 && p.y < canvas.height) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
          ctx.restore();
        }
      });
      if (alive) raf = requestAnimationFrame(draw);
    };
    draw();
  };

  const runDemo = () => {
    if (running) return;
    setRunning(true); setVisible([]); setShowSummary(false);
    TEST_CASES.forEach((_, i) => {
      setTimeout(() => {
        setVisible(v => [...v, true]);
        if (i === TEST_CASES.length - 1) {
          setTimeout(() => {
            setShowSummary(true);
            spawnConfetti();
            setRunning(false);
            setTimeout(() => openTestPass(5, 5, '0.12s'), 800);
          }, 200);
        }
      }, 120 + i * 140);
    });
  };

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* LEFT: Before */}
      <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[rgba(10,10,20,0.8)] backdrop-blur-xl hover:-translate-y-1 transition-transform duration-300">
        <div className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
          <span className="ml-2 text-[0.7rem] text-slate-500 font-mono">tutorial.html</span>
          <span className="ml-auto text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-500"> BEFORE</span>
        </div>
        <div className="p-4 font-mono text-[0.8rem] leading-[1.7] text-slate-500">
          <span className="italic" style={{ color: '#374151' }}># Just a code block. Not runnable.</span><br/><br/>
          <span className="text-blue-400/50">def</span> <span className="text-yellow-400/50">sum_list</span>(nums):<br/>
          &nbsp;&nbsp;total = <span className="text-purple-400/50">0</span><br/>
          &nbsp;&nbsp;<span className="text-blue-400/50">for</span> n <span className="text-blue-400/50">in</span> nums:<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;total += n<br/>
          &nbsp;&nbsp;<span className="text-blue-400/50">return</span> total<br/><br/>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-[0.72rem] italic" style={{ color: '#374151' }}>
             Try this in your terminal I guess?<br/>
            Also make sure Python 3 is installed.<br/>
            And virtualenv. And pip. And...
          </div>
        </div>
      </div>

      {/* RIGHT: After */}
      <div
        ref={cardRef}
        className="relative rounded-2xl overflow-hidden backdrop-blur-xl transition-all duration-300"
        style={{
          border: '1px solid rgba(0,255,135,0.3)',
          background: 'rgba(10,10,20,0.8)',
          boxShadow: '0 0 40px rgba(0,255,135,0.12)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 60px rgba(0,255,135,0.2)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 40px rgba(0,255,135,0.12)'; }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 rounded-2xl pointer-events-none" style={{ zIndex: 10 }} />
        <div className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full anim-pulse-dot" style={{ background: '#00ff87', borderRadius: '50%', width: '10px', height: '10px' }} />
          <span className="ml-2 text-[0.7rem] text-slate-400 font-mono">cap_python_sum_01  live</span>
          <span className="ml-auto text-[0.65rem] font-bold px-2 py-0.5 rounded-full text-[#00ff87]" style={{ background: 'rgba(0,255,135,0.12)' }}> AFTER</span>
        </div>
        <div className="p-4 font-mono text-[0.8rem] leading-[1.7]">
          <div className="rounded-xl p-4" style={{ background: '#080812', border: '1px solid rgba(0,255,135,0.08)' }}>
            <span className="text-blue-400">def</span> <span className="text-yellow-300">sum_list</span>(nums):<br/>
            &nbsp;&nbsp;total = <span className="text-purple-400">0</span><br/>
            &nbsp;&nbsp;<span className="text-blue-400">for</span> n <span className="text-blue-400">in</span> nums:<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;total += n<br/>
            &nbsp;&nbsp;<span className="text-blue-400">return</span> total<span className="cursor-blink" />
          </div>
          <div className="flex gap-2 items-center mt-2.5">
            <button
              onClick={runDemo}
              disabled={running}
              className="flex items-center gap-1.5 px-4 py-1.5 text-[0.75rem] font-extrabold rounded-lg transition-shadow font-mono disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #00ff87, #00b894)',
                color: '#04040a',
                boxShadow: running ? 'none' : '0 0 12px rgba(0,255,135,0.3)',
              }}
            >
              {running ? (
                <><svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Running...</>
              ) : (
                <><svg width="10" height="10" fill="currentColor" viewBox="0 0 10 10"><path d="M2 1.5l7 3.5-7 3.5V1.5z"/></svg> Run &amp; Test</>
              )}
            </button>
            <span className="text-[0.68rem] font-mono" style={{ color: '#1e293b' }}>Python 3.11  Sandboxed</span>
          </div>

          {(visible.length > 0 || showSummary) && (
            <div className="mt-3 space-y-1">
              {TEST_CASES.map((tc, i) => (
                <div
                  key={i}
                  className={`demo-test-row${visible[i] ? ' visible' : ''}`}
                >
                  <span></span>
                  <span className="flex-1">{tc}</span>
                  <span className="font-bold" style={{ color: '#00ff87' }}>PASS</span>
                </div>
              ))}
              <div className={`demo-test-summary${showSummary ? ' visible' : ''}`}>
                <span> 5/5 Tests Passed</span>
                <span className="text-[0.7rem] font-normal" style={{ color: '#475569' }}>0.12s  3.1 MB</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
