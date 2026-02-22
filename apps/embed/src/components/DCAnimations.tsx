/**
 * DevCapsules Animation System — Embed Edition
 *
 * Pure CSS + React animations (no GSAP dependency).
 * Provides: toasts, success overlay (5/5), partial pass overlay, confetti.
 *
 * Usage:
 *   <DCAnimationProvider>
 *     <App />
 *   </DCAnimationProvider>
 *
 *   const { toast, showTestPass, showPartialPass } = useDCAnimation();
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';

/* ═══════════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════════ */

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'ai';

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  message: string;
  duration: number;
  exiting?: boolean;
}

interface DCAnimationAPI {
  toast: (type: ToastType, title: string, message: string, duration?: number) => void;
  showTestPass: (passed: number, total: number, time: string) => void;
  showPartialPass: (passed: number, total: number, hint?: string) => void;
  closeOverlays: () => void;
}

const DCAnimationContext = createContext<DCAnimationAPI>({
  toast: () => {},
  showTestPass: () => {},
  showPartialPass: () => {},
  closeOverlays: () => {},
});

export const useDCAnimation = () => useContext(DCAnimationContext);

/* ═══════════════════════════════════════════════════════════════════════════════
   Confetti (canvas-based, self-cleaning)
   ═══════════════════════════════════════════════════════════════════════════════ */

function launchConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  const COLORS = ['#00ff87', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#86efac', '#fff'];
  const pieces = Array.from({ length: 70 }, () => ({
    x: Math.random() * W,
    y: -10 - Math.random() * 60,
    vx: (Math.random() - 0.5) * 5,
    vy: Math.random() * 4 + 2,
    w: Math.random() * 10 + 4,
    h: Math.random() * 6 + 3,
    rot: Math.random() * 360,
    rv: (Math.random() - 0.5) * 10,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    alpha: 1,
    circle: Math.random() > 0.5,
  }));

  let raf: number;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    let active = false;
    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.vx *= 0.99;
      p.rot += p.rv;
      p.alpha -= 0.008;
      if (p.alpha <= 0 || p.y > H + 20) continue;
      active = true;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      if (p.circle) {
        ctx.beginPath();
        ctx.arc(0, 0, p.h / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }
    if (active) raf = requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, W, H);
  };
  draw();
  return () => cancelAnimationFrame(raf);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CSS (injected once)
   ═══════════════════════════════════════════════════════════════════════════════ */

const DC_STYLE_ID = 'dc-anim-styles';

function injectStyles() {
  if (document.getElementById(DC_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = DC_STYLE_ID;
  style.textContent = `
/* ── Toast Stack ───────────────────────────────────────── */
.dc-toast-stack {
  position: fixed; top: 16px; right: 16px;
  display: flex; flex-direction: column; gap: 8px;
  z-index: 99999; pointer-events: none;
}
.dc-toast {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 14px; border-radius: 12px;
  min-width: 260px; max-width: 340px;
  backdrop-filter: blur(16px);
  border: 1px solid; pointer-events: all;
  position: relative; overflow: hidden;
  box-shadow: 0 12px 40px rgba(0,0,0,0.5);
  cursor: pointer;
  animation: dcToastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
}
.dc-toast.exiting {
  animation: dcToastOut 0.3s ease-in forwards;
}
.dc-toast.success { background: rgba(0,25,14,0.88); border-color: rgba(0,255,135,0.25); }
.dc-toast.error   { background: rgba(30,5,5,0.9);   border-color: rgba(239,68,68,0.25); }
.dc-toast.info    { background: rgba(5,10,30,0.9);   border-color: rgba(59,130,246,0.25); }
.dc-toast.warning { background: rgba(30,20,0,0.9);   border-color: rgba(245,158,11,0.25); }
.dc-toast.ai      { background: rgba(15,5,35,0.9);   border-color: rgba(139,92,246,0.3); }
.dc-toast-icon {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; font-size: 0.9rem;
}
.dc-toast.success .dc-toast-icon { background: rgba(0,255,135,0.12); }
.dc-toast.error   .dc-toast-icon { background: rgba(239,68,68,0.12); }
.dc-toast.info    .dc-toast-icon { background: rgba(59,130,246,0.12); }
.dc-toast.warning .dc-toast-icon { background: rgba(245,158,11,0.12); }
.dc-toast.ai      .dc-toast-icon { background: rgba(139,92,246,0.12); }
.dc-toast-body { flex: 1; min-width: 0; }
.dc-toast-title { font-size: 0.82rem; font-weight: 700; color: #fff; margin-bottom: 1px; }
.dc-toast-msg { font-size: 0.73rem; line-height: 1.45; }
.dc-toast.success .dc-toast-msg { color: rgba(0,255,135,0.55); }
.dc-toast.error   .dc-toast-msg { color: rgba(239,68,68,0.55); }
.dc-toast.info    .dc-toast-msg { color: rgba(59,130,246,0.55); }
.dc-toast.warning .dc-toast-msg { color: rgba(245,158,11,0.55); }
.dc-toast.ai      .dc-toast-msg { color: rgba(139,92,246,0.55); }
.dc-toast-close {
  width: 20px; height: 20px; border-radius: 5px; flex-shrink: 0;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
  display: flex; align-items: center; justify-content: center;
  color: #475569; font-size: 14px; cursor: pointer;
}
.dc-toast-close:hover { background: rgba(255,255,255,0.1); color: #fff; }
.dc-toast-progress {
  position: absolute; bottom: 0; left: 0; height: 2px;
  border-radius: 0 0 12px 12px; width: 100%;
  transform-origin: left;
}
.dc-toast.success .dc-toast-progress { background: linear-gradient(90deg,#00ff87,#00c96b); }
.dc-toast.error   .dc-toast-progress { background: linear-gradient(90deg,#ef4444,#dc2626); }
.dc-toast.info    .dc-toast-progress { background: linear-gradient(90deg,#3b82f6,#2563eb); }
.dc-toast.warning .dc-toast-progress { background: linear-gradient(90deg,#f59e0b,#d97706); }
.dc-toast.ai      .dc-toast-progress { background: linear-gradient(90deg,#8b5cf6,#7c3aed); }

@keyframes dcToastIn {
  0%   { transform: translateX(50px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}
@keyframes dcToastOut {
  0%   { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(50px); opacity: 0; }
}
@keyframes dcProgressShrink {
  0%   { transform: scaleX(1); }
  100% { transform: scaleX(0); }
}

/* ── Success Overlay (5/5 pass) ───────────────────────── */
.dc-success-overlay {
  position: fixed; inset: 0; z-index: 100000;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(ellipse at 50% 50%, rgba(0,255,135,0.06) 0%, rgba(5,5,13,0.88) 60%);
  backdrop-filter: blur(4px);
  animation: dcFadeIn 0.3s ease-out forwards;
}
.dc-success-card {
  position: relative;
  background: linear-gradient(160deg, rgba(0,25,15,0.97), rgba(5,5,13,0.97));
  border: 1px solid rgba(0,255,135,0.25);
  border-radius: 24px; padding: 2.5rem 3rem;
  text-align: center;
  box-shadow: 0 0 80px rgba(0,255,135,0.15), 0 32px 80px rgba(0,0,0,0.7);
  max-width: 400px; width: 90%;
  animation: dcScaleIn 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards;
}
.dc-success-card.exiting {
  animation: dcScaleOut 0.3s ease-in forwards;
}
.dc-success-overlay.exiting {
  animation: dcFadeOut 0.35s ease-in forwards;
}
.dc-success-canvas {
  position: absolute; inset: 0; border-radius: 24px; pointer-events: none;
}
.dc-check-ring { width: 72px; height: 72px; margin: 0 auto 1.2rem; position: relative; }
.dc-check-ring svg { width: 100%; height: 100%; }
.dc-ring-track { fill: none; stroke: rgba(0,255,135,0.12); stroke-width: 3; }
.dc-ring-fill {
  fill: none; stroke: #00ff87; stroke-width: 3;
  stroke-linecap: round; stroke-dasharray: 220; stroke-dashoffset: 220;
  transform-origin: center; transform: rotate(-90deg);
  filter: drop-shadow(0 0 8px #00ff87);
  animation: dcRingDraw 0.9s 0.3s ease-in-out forwards;
}
.dc-check-path {
  fill: none; stroke: #00ff87; stroke-width: 3.5;
  stroke-linecap: round; stroke-linejoin: round;
  stroke-dasharray: 50; stroke-dashoffset: 50;
  filter: drop-shadow(0 0 6px #00ff87);
  animation: dcCheckDraw 0.35s 0.9s ease-out forwards;
}
.dc-success-score {
  font-size: 3rem; font-weight: 900; letter-spacing: -0.04em; color: #00ff87;
  line-height: 1; margin-bottom: 0.2rem;
  filter: drop-shadow(0 0 20px rgba(0,255,135,0.5));
}
.dc-success-label { font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 0.4rem; }
.dc-success-sub { font-size: 0.8rem; color: #475569; margin-bottom: 1.5rem; }
.dc-success-time {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Monaco','Menlo',monospace; font-size: 0.72rem;
  color: rgba(0,255,135,0.6);
  background: rgba(0,255,135,0.07); border: 1px solid rgba(0,255,135,0.15);
  padding: 4px 12px; border-radius: 99px; margin-bottom: 1.2rem;
}
.dc-success-close {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 24px; border-radius: 10px;
  background: linear-gradient(135deg, #00ff87, #00c96b);
  color: #05050d; font-size: 0.83rem; font-weight: 800;
  border: none; cursor: pointer;
  box-shadow: 0 0 24px rgba(0,255,135,0.3);
  transition: box-shadow 0.3s, transform 0.15s;
}
.dc-success-close:hover { box-shadow: 0 0 40px rgba(0,255,135,0.5); transform: scale(1.03); }

/* ── Partial Pass Overlay ─────────────────────────────── */
.dc-partial-overlay {
  position: fixed; inset: 0; z-index: 100000;
  display: flex; align-items: center; justify-content: center;
  background: rgba(5,5,13,0.85); backdrop-filter: blur(6px);
  animation: dcFadeIn 0.3s ease-out forwards;
}
.dc-partial-card {
  position: relative;
  background: linear-gradient(160deg, rgba(20,10,0,0.97), rgba(5,5,13,0.97));
  border: 1px solid rgba(245,158,11,0.3);
  border-radius: 20px; padding: 2rem 2.5rem;
  max-width: 360px; width: 90%; text-align: center;
  box-shadow: 0 0 50px rgba(245,158,11,0.1), 0 32px 80px rgba(0,0,0,0.7);
  animation: dcScaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards;
}
.dc-partial-card.exiting { animation: dcScaleOut 0.3s ease-in forwards; }
.dc-partial-overlay.exiting { animation: dcFadeOut 0.35s ease-in forwards; }
.dc-partial-icon { font-size: 2.5rem; margin-bottom: 0.8rem; display: block; }
.dc-partial-score { font-size: 2.5rem; font-weight: 900; color: #f59e0b; letter-spacing: -0.03em; }
.dc-partial-label { font-size: 0.95rem; font-weight: 700; color: #fff; margin: 0.2rem 0 0.6rem; }
.dc-partial-bars { display: flex; gap: 4px; margin: 0.8rem 0; }
.dc-partial-bar {
  flex: 1; height: 6px; border-radius: 3px;
  background: rgba(255,255,255,0.06);
  transition: background 0.3s;
}
.dc-partial-bar.pass { background: #00ff87; animation: dcBarPop 0.3s ease-out; }
.dc-partial-bar.fail { background: rgba(239,68,68,0.5); animation: dcBarPop 0.3s ease-out; }
.dc-partial-hint { font-size: 0.78rem; color: #475569; margin: 0.6rem 0 1.2rem; line-height: 1.5; }
.dc-partial-close {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 9px 20px; border-radius: 9px;
  background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.25);
  color: #f59e0b; font-size: 0.82rem; font-weight: 700;
  cursor: pointer; width: 100%; justify-content: center;
  transition: background 0.2s;
}
.dc-partial-close:hover { background: rgba(245,158,11,0.2); }

/* ── Shared keyframes ──────────────────────────────────── */
@keyframes dcFadeIn  { 0% { opacity: 0; } 100% { opacity: 1; } }
@keyframes dcFadeOut { 0% { opacity: 1; } 100% { opacity: 0; } }
@keyframes dcScaleIn {
  0%   { transform: scale(0.7) translateY(10px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
@keyframes dcScaleOut {
  0%   { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.85); opacity: 0; }
}
@keyframes dcRingDraw {
  0%   { stroke-dashoffset: 220; }
  100% { stroke-dashoffset: 0; }
}
@keyframes dcCheckDraw {
  0%   { stroke-dashoffset: 50; }
  100% { stroke-dashoffset: 0; }
}
@keyframes dcBarPop {
  0%   { transform: scaleY(0); }
  100% { transform: scaleY(1); }
}
`;
  document.head.appendChild(style);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Toast Icons
   ═══════════════════════════════════════════════════════════════════════════════ */

const TOAST_ICONS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
  ai: '🤖',
};

const TOAST_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  error: 5000,
  info: 4000,
  warning: 5000,
  ai: 4000,
};

/* ═══════════════════════════════════════════════════════════════════════════════
   Provider Component
   ═══════════════════════════════════════════════════════════════════════════════ */

export function DCAnimationProvider({ children }: { children: React.ReactNode }) {
  // Inject CSS once
  useEffect(() => { injectStyles(); }, []);

  /* ── Toast state ── */
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  const toast = useCallback((type: ToastType, title: string, message: string, duration?: number) => {
    const id = ++toastIdRef.current;
    const dur = duration ?? TOAST_DURATIONS[type];
    setToasts(prev => [...prev, { id, type, title, message, duration: dur }]);
    setTimeout(() => dismissToast(id), dur);
  }, [dismissToast]);

  /* ── Success overlay (all tests pass) ── */
  const [successState, setSuccessState] = useState<{
    visible: boolean; exiting: boolean; passed: number; total: number; time: string;
  }>({ visible: false, exiting: false, passed: 0, total: 0, time: '' });
  const successCanvasRef = useRef<HTMLCanvasElement>(null);

  const showTestPass = useCallback((passed: number, total: number, time: string) => {
    setSuccessState({ visible: true, exiting: false, passed, total, time });
    // Launch confetti after render
    setTimeout(() => {
      if (successCanvasRef.current) {
        const card = successCanvasRef.current.parentElement;
        if (card) {
          successCanvasRef.current.width = card.offsetWidth;
          successCanvasRef.current.height = card.offsetHeight;
        }
        launchConfetti(successCanvasRef.current);
      }
    }, 400);
  }, []);

  const closeSuccess = useCallback(() => {
    setSuccessState(s => ({ ...s, exiting: true }));
    setTimeout(() => setSuccessState({ visible: false, exiting: false, passed: 0, total: 0, time: '' }), 350);
  }, []);

  /* ── Partial pass overlay ── */
  const [partialState, setPartialState] = useState<{
    visible: boolean; exiting: boolean; passed: number; total: number; hint: string;
  }>({ visible: false, exiting: false, passed: 0, total: 0, hint: '' });

  const showPartialPass = useCallback((passed: number, total: number, hint?: string) => {
    setPartialState({
      visible: true, exiting: false, passed, total,
      hint: hint || `${total - passed} test case${total - passed > 1 ? 's' : ''} failed. Check your edge cases — empty inputs and boundary values may not be handled correctly.`,
    });
  }, []);

  const closePartial = useCallback(() => {
    setPartialState(s => ({ ...s, exiting: true }));
    setTimeout(() => setPartialState({ visible: false, exiting: false, passed: 0, total: 0, hint: '' }), 350);
  }, []);

  const closeOverlays = useCallback(() => {
    closeSuccess();
    closePartial();
  }, [closeSuccess, closePartial]);

  const api: DCAnimationAPI = { toast, showTestPass, showPartialPass, closeOverlays };

  return (
    <DCAnimationContext.Provider value={api}>
      {children}

      {/* ── Toast Stack ── */}
      <div className="dc-toast-stack">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`dc-toast ${t.type}${t.exiting ? ' exiting' : ''}`}
            onClick={() => dismissToast(t.id)}
          >
            <div className="dc-toast-icon">{TOAST_ICONS[t.type]}</div>
            <div className="dc-toast-body">
              <div className="dc-toast-title">{t.title}</div>
              <div className="dc-toast-msg">{t.message}</div>
            </div>
            <button className="dc-toast-close" onClick={(e) => { e.stopPropagation(); dismissToast(t.id); }}>×</button>
            <div
              className="dc-toast-progress"
              style={{ animation: `dcProgressShrink ${t.duration}ms linear forwards` }}
            />
          </div>
        ))}
      </div>

      {/* ── Success Overlay (5/5) ── */}
      {successState.visible && (
        <div
          className={`dc-success-overlay${successState.exiting ? ' exiting' : ''}`}
          onClick={closeSuccess}
        >
          <div className={`dc-success-card${successState.exiting ? ' exiting' : ''}`} onClick={e => e.stopPropagation()}>
            <canvas className="dc-success-canvas" ref={successCanvasRef} />
            <div className="dc-check-ring">
              <svg viewBox="0 0 80 80">
                <circle className="dc-ring-track" cx="40" cy="40" r="34" />
                <circle className="dc-ring-fill" cx="40" cy="40" r="34" />
                <path className="dc-check-path" d="M24 40l11 11 21-22" />
              </svg>
            </div>
            <div className="dc-success-score">{successState.passed}/{successState.total}</div>
            <div className="dc-success-label">All Tests Passed!</div>
            <div className="dc-success-sub">Every test case executed successfully. Clean logic, zero hardcoding.</div>
            <div className="dc-success-time">⚡ {successState.time} execution</div>
            <br />
            <button className="dc-success-close" onClick={closeSuccess}>
              Continue Coding →
            </button>
          </div>
        </div>
      )}

      {/* ── Partial Pass Overlay ── */}
      {partialState.visible && (
        <div
          className={`dc-partial-overlay${partialState.exiting ? ' exiting' : ''}`}
          onClick={closePartial}
        >
          <div className={`dc-partial-card${partialState.exiting ? ' exiting' : ''}`} onClick={e => e.stopPropagation()}>
            <span className="dc-partial-icon">🔥</span>
            <div className="dc-partial-score">{partialState.passed}/{partialState.total}</div>
            <div className="dc-partial-label">Almost there!</div>
            <div className="dc-partial-bars">
              {Array.from({ length: partialState.total }, (_, i) => (
                <div
                  key={i}
                  className={`dc-partial-bar ${i < partialState.passed ? 'pass' : 'fail'}`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <div className="dc-partial-hint">{partialState.hint}</div>
            <button className="dc-partial-close" onClick={closePartial}>
              Keep Trying →
            </button>
          </div>
        </div>
      )}
    </DCAnimationContext.Provider>
  );
}
