import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

/* ===================================================================
   Dashboard Animation System  
   Toast · Success Overlay · Partial Pass · Published Overlay
   Pure CSS animations — no extra deps beyond React
   =================================================================== */

// ── Types ──
type ToastType = 'success' | 'error' | 'info' | 'warning' | 'ai';

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
  exiting?: boolean;
}

interface OverlayState {
  kind: 'none' | 'success' | 'partial' | 'published';
  passed: number;
  total: number;
  publishId?: string;
}

interface AnimationContextValue {
  /** Legacy compat */
  openTestPass: (passed: number, total: number, time: string) => void;
  /** Toast notification */
  toast: (type: ToastType, title: string, message?: string) => void;
  /** Full-screen success (all tests pass) */
  showTestPass: (passed: number, total: number) => void;
  /** Partial pass overlay */
  showPartialPass: (passed: number, total: number) => void;
  /** Published overlay */
  showPublished: (capsuleId: string) => void;
  /** Close any open overlay */
  closeOverlays: () => void;
}

const AnimationContext = createContext<AnimationContextValue>({
  openTestPass: () => {},
  toast: () => {},
  showTestPass: () => {},
  showPartialPass: () => {},
  showPublished: () => {},
  closeOverlays: () => {},
});

// ── Inject CSS once ──
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.id = 'dc-dash-anim-styles';
  style.textContent = `
    @keyframes dcDashToastIn  { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes dcDashToastOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(120%); opacity: 0; } }
    @keyframes dcDashScaleIn  { from { transform: scale(0.85) translateY(24px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
    @keyframes dcDashScaleOut { from { transform: scale(1) translateY(0); opacity: 1; } to { transform: scale(0.9) translateY(16px); opacity: 0; } }
    @keyframes dcDashFadeIn   { from { opacity: 0; } to { opacity: 1; } }
    @keyframes dcDashFadeOut  { from { opacity: 1; } to { opacity: 0; } }
    @keyframes dcDashRingDraw { from { stroke-dashoffset: 283; } to { stroke-dashoffset: 0; } }
    @keyframes dcDashCheckDraw { from { stroke-dashoffset: 48; } to { stroke-dashoffset: 0; } }
    @keyframes dcDashBarPop { from { width: 0; } }
    @keyframes dcDashProgressShrink { from { width: 100%; } to { width: 0%; } }
    @keyframes dcDashConfettiBurst { 0% { transform: scale(0); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.8; } 100% { transform: scale(0.8); opacity: 0; } }
    @keyframes dcDashPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(0,255,135,0.4); } 50% { box-shadow: 0 0 0 12px rgba(0,255,135,0); } }
  `;
  document.head.appendChild(style);
}

// ── Toast colors ──
const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string; bar: string }> = {
  success: { bg: 'rgba(0,255,135,0.08)', border: 'rgba(0,255,135,0.3)', icon: '✅', bar: '#00ff87' },
  error:   { bg: 'rgba(255,71,87,0.08)',  border: 'rgba(255,71,87,0.3)',  icon: '❌', bar: '#ff4757' },
  info:    { bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.3)', icon: 'ℹ️', bar: '#38bdf8' },
  warning: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.3)', icon: '⚠️', bar: '#fbbf24' },
  ai:      { bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.3)', icon: '🤖', bar: '#a855f7' },
};

// ── Confetti canvas ──
function launchConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  const colors = ['#00ff87', '#38bdf8', '#a855f7', '#fbbf24', '#ff4757', '#ffffff'];
  const particles: Array<{ x: number; y: number; vx: number; vy: number; r: number; color: string; rot: number; vr: number; life: number }> = [];
  for (let i = 0; i < 70; i++) {
    particles.push({
      x: canvas.width / 2, y: canvas.height / 2 - 40,
      vx: (Math.random() - 0.5) * 14, vy: Math.random() * -12 - 4,
      r: Math.random() * 4 + 2, color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360, vr: (Math.random() - 0.5) * 10, life: 1,
    });
  }
  let frame = 0;
  const maxFrames = 90;
  function draw() {
    if (frame >= maxFrames) { ctx!.clearRect(0, 0, canvas.width, canvas.height); return; }
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.28; p.vx *= 0.98;
      p.rot += p.vr; p.life -= 1 / maxFrames;
      ctx!.save(); ctx!.translate(p.x, p.y); ctx!.rotate((p.rot * Math.PI) / 180);
      ctx!.globalAlpha = Math.max(0, p.life);
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      ctx!.restore();
    });
    frame++;
    requestAnimationFrame(draw);
  }
  draw();
}

// ── Provider ──
export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [overlay, setOverlay] = useState<OverlayState>({ kind: 'none', passed: 0, total: 0 });
  const [overlayExiting, setOverlayExiting] = useState(false);
  const toastIdRef = useRef(0);
  const confettiRef = useRef<HTMLCanvasElement | null>(null);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { injectStyles(); }, []);

  // Auto-dismiss overlay
  useEffect(() => {
    if (overlay.kind !== 'none' && !overlayExiting) {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
      overlayTimerRef.current = setTimeout(() => closeOverlays(), 5000);
    }
    return () => { if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current); };
  }, [overlay.kind, overlayExiting]);

  // Fire confetti when success overlay appears
  useEffect(() => {
    if (overlay.kind === 'success' && confettiRef.current) {
      setTimeout(() => confettiRef.current && launchConfetti(confettiRef.current), 200);
    }
  }, [overlay.kind]);

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev.slice(-4), { id, type, title, message: message || '' }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
    }, 4200);
  }, []);

  const showTestPass = useCallback((passed: number, total: number) => {
    setOverlayExiting(false);
    setOverlay({ kind: 'success', passed, total });
  }, []);

  const showPartialPass = useCallback((passed: number, total: number) => {
    setOverlayExiting(false);
    setOverlay({ kind: 'partial', passed, total });
  }, []);

  const showPublished = useCallback((capsuleId: string) => {
    setOverlayExiting(false);
    setOverlay({ kind: 'published', passed: 0, total: 0, publishId: capsuleId });
  }, []);

  const closeOverlays = useCallback(() => {
    setOverlayExiting(true);
    setTimeout(() => { setOverlay({ kind: 'none', passed: 0, total: 0 }); setOverlayExiting(false); }, 400);
  }, []);

  // Legacy compat
  const openTestPass = useCallback((passed: number, total: number, _time: string) => {
    showTestPass(passed, total);
  }, [showTestPass]);

  const value: AnimationContextValue = { openTestPass, toast, showTestPass, showPartialPass, showPublished, closeOverlays };

  return (
    <AnimationContext.Provider value={value}>
      {children}

      {/* ── Toast Stack ── */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 10001, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none', maxWidth: 380 }}>
        {toasts.map(t => {
          const c = TOAST_COLORS[t.type];
          return (
            <div key={t.id} style={{
              pointerEvents: 'auto',
              background: c.bg, border: `1px solid ${c.border}`,
              borderRadius: 14, padding: '14px 18px', backdropFilter: 'blur(12px)',
              animation: t.exiting ? 'dcDashToastOut 0.35s forwards' : 'dcDashToastIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
              position: 'relative', overflow: 'hidden', cursor: 'pointer',
              boxShadow: `0 8px 32px ${c.border}`,
            }} onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18 }}>{c.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>{t.title}</div>
                  {t.message && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3, lineHeight: 1.4, fontFamily: 'system-ui, sans-serif' }}>{t.message}</div>}
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, height: 3, background: c.bar, animation: 'dcDashProgressShrink 4.2s linear forwards' }} />
            </div>
          );
        })}
      </div>

      {/* ── Success Overlay ── */}
      {overlay.kind === 'success' && (
        <div onClick={closeOverlays} style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(4,4,10,0.85)', backdropFilter: 'blur(8px)',
          animation: overlayExiting ? 'dcDashFadeOut 0.4s forwards' : 'dcDashFadeIn 0.3s forwards',
          cursor: 'pointer',
        }}>
          <canvas ref={confettiRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
          <div style={{
            position: 'relative', background: 'rgba(10,10,20,0.95)',
            border: '1px solid rgba(0,255,135,0.35)', borderRadius: 24,
            padding: '48px 56px', textAlign: 'center',
            boxShadow: '0 0 80px rgba(0,255,135,0.25)',
            animation: overlayExiting ? 'dcDashScaleOut 0.35s forwards' : 'dcDashScaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            maxWidth: 380, width: '90vw',
          }}>
            {/* SVG ring + check */}
            <div style={{ margin: '0 auto 16px', width: 96, height: 96, position: 'relative' }}>
              <svg viewBox="0 0 100 100" style={{ width: 96, height: 96 }}>
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,255,135,0.15)" strokeWidth="4" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#00ff87" strokeWidth="4"
                  strokeDasharray="283" strokeDashoffset="283" strokeLinecap="round"
                  style={{ animation: 'dcDashRingDraw 1s cubic-bezier(0.65,0,0.35,1) 0.2s forwards' }} />
                <polyline points="30,52 45,66 72,36" fill="none" stroke="#00ff87" strokeWidth="5"
                  strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="48" strokeDashoffset="48"
                  style={{ animation: 'dcDashCheckDraw 0.5s ease 0.9s forwards' }} />
              </svg>
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#00ff87', fontFamily: 'monospace', letterSpacing: '-0.02em', marginBottom: 8 }}>
              {overlay.passed}/{overlay.total} Tests Passed
            </div>
            <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
              {['Zero setup', 'Auto-graded', 'Instant'].map(tag => (
                <span key={tag} style={{
                  fontSize: '0.7rem', padding: '3px 10px', borderRadius: 999, fontWeight: 700,
                  background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.25)', color: '#00ff87',
                }}>{tag}</span>
              ))}
            </div>
            <p style={{ marginTop: 20, fontSize: '0.72rem', color: '#475569' }}>click anywhere to dismiss</p>
          </div>
        </div>
      )}

      {/* ── Partial Pass Overlay ── */}
      {overlay.kind === 'partial' && (
        <div onClick={closeOverlays} style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(4,4,10,0.85)', backdropFilter: 'blur(8px)',
          animation: overlayExiting ? 'dcDashFadeOut 0.4s forwards' : 'dcDashFadeIn 0.3s forwards',
          cursor: 'pointer',
        }}>
          <div style={{
            background: 'rgba(10,10,20,0.95)', border: '1px solid rgba(251,191,36,0.35)',
            borderRadius: 24, padding: '40px 48px', textAlign: 'center',
            boxShadow: '0 0 60px rgba(251,191,36,0.15)',
            animation: overlayExiting ? 'dcDashScaleOut 0.35s forwards' : 'dcDashScaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            maxWidth: 380, width: '90vw',
          }}>
            <div style={{ fontSize: '2.8rem', marginBottom: 12 }}>🔧</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fbbf24', fontFamily: 'monospace', marginBottom: 6 }}>
              {overlay.passed}/{overlay.total} Passing
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 20, fontFamily: 'system-ui, sans-serif' }}>Almost there — keep debugging!</p>
            {/* Animated bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 260, margin: '0 auto' }}>
              {Array.from({ length: overlay.total }).map((_, i) => {
                const passed = i < overlay.passed;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace', width: 20, textAlign: 'right' }}>{i + 1}</span>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 4,
                        background: passed ? '#00ff87' : '#ff4757',
                        animation: `dcDashBarPop 0.5s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.12}s both`,
                        width: '100%',
                      }} />
                    </div>
                    <span style={{ fontSize: 13 }}>{passed ? '✅' : '❌'}</span>
                  </div>
                );
              })}
            </div>
            <p style={{ marginTop: 20, fontSize: '0.72rem', color: '#475569' }}>click anywhere to dismiss</p>
          </div>
        </div>
      )}

      {/* ── Published Overlay ── */}
      {overlay.kind === 'published' && (
        <div onClick={closeOverlays} style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(4,4,10,0.85)', backdropFilter: 'blur(8px)',
          animation: overlayExiting ? 'dcDashFadeOut 0.4s forwards' : 'dcDashFadeIn 0.3s forwards',
          cursor: 'pointer',
        }}>
          <canvas ref={confettiRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
          <div onClick={e => e.stopPropagation()} style={{
            position: 'relative', background: 'rgba(10,10,20,0.95)',
            border: '1px solid rgba(168,85,247,0.35)', borderRadius: 24,
            padding: '40px 48px', textAlign: 'center',
            boxShadow: '0 0 80px rgba(168,85,247,0.2)',
            animation: overlayExiting ? 'dcDashScaleOut 0.35s forwards' : 'dcDashScaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            maxWidth: 420, width: '90vw',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🚀</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#a855f7', fontFamily: 'monospace', marginBottom: 6 }}>
              Capsule Published!
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 16, fontFamily: 'system-ui, sans-serif' }}>
              Your capsule is live and ready to embed.
            </p>
            {overlay.publishId && (
              <div style={{
                background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)',
                borderRadius: 10, padding: '10px 14px', fontFamily: 'monospace', fontSize: 12,
                color: '#c4b5fd', wordBreak: 'break-all',
              }}>
                ID: {overlay.publishId}
              </div>
            )}
            <p style={{ marginTop: 20, fontSize: '0.72rem', color: '#475569' }}>click backdrop to dismiss</p>
          </div>
        </div>
      )}
    </AnimationContext.Provider>
  );
}

export function useAnimation(): AnimationContextValue {
  return useContext(AnimationContext);
}
