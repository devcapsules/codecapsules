/**
 * LeaderboardToast — "The Passive-Aggressive Upgrade"
 *
 * Shown once after a student's first successful test pass.
 * A tiny, non-blocking prompt that slides up from the bottom:
 *
 *   "Great job! Enter your name to save this to the leaderboard?"
 *   [________] [Save]
 *
 * If they enter a name → merged with their persistent UUID so the
 * creator dashboard shows "Alice" instead of "Student #a3f8c".
 * If they dismiss → never shown again (localStorage flag).
 */
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { embedAnalytics } from '../utils/EmbedAnalytics'

/* ═══════════════════════════════════════════════════════════════════════════════
   CSS (injected once)
   ═══════════════════════════════════════════════════════════════════════════════ */
const STYLE_ID = 'dc-leaderboard-toast-styles'

function injectLeaderboardStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
/* ── Leaderboard Name Toast ───────────────────────────── */
.dc-lb-toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(120px);
  z-index: 100001;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 14px;
  background: rgba(5, 8, 22, 0.95);
  border: 1px solid rgba(0, 255, 135, 0.2);
  backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 255, 135, 0.08);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 420px;
  width: calc(100% - 32px);
  animation: dcLbSlideUp 0.5s 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
.dc-lb-toast.exiting {
  animation: dcLbSlideDown 0.35s ease-in forwards !important;
}

.dc-lb-emoji {
  font-size: 1.3rem;
  flex-shrink: 0;
  animation: dcLbBounce 0.6s 1.1s ease-out;
}

.dc-lb-text {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
  line-height: 1.3;
  white-space: nowrap;
}
.dc-lb-text strong {
  color: #00ff87;
  font-weight: 700;
}

.dc-lb-input {
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 0.78rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.dc-lb-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}
.dc-lb-input:focus {
  border-color: rgba(0, 255, 135, 0.4);
  box-shadow: 0 0 0 2px rgba(0, 255, 135, 0.1);
}

.dc-lb-save {
  padding: 6px 14px;
  border-radius: 8px;
  background: linear-gradient(135deg, #00ff87, #00c96b);
  color: #05050d;
  font-size: 0.75rem;
  font-weight: 800;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: transform 0.15s, box-shadow 0.2s;
}
.dc-lb-save:hover {
  transform: scale(1.04);
  box-shadow: 0 0 16px rgba(0, 255, 135, 0.35);
}
.dc-lb-save:disabled {
  opacity: 0.4;
  cursor: default;
  transform: none;
  box-shadow: none;
}

.dc-lb-dismiss {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #475569;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s, color 0.2s;
}
.dc-lb-dismiss:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* Success confirmation state */
.dc-lb-confirmed {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #00ff87;
  font-size: 0.78rem;
  font-weight: 600;
  animation: dcLbFadeIn 0.3s ease-out;
}

@keyframes dcLbSlideUp {
  0%   { transform: translateX(-50%) translateY(120px); opacity: 0; }
  100% { transform: translateX(-50%) translateY(0); opacity: 1; }
}
@keyframes dcLbSlideDown {
  0%   { transform: translateX(-50%) translateY(0); opacity: 1; }
  100% { transform: translateX(-50%) translateY(120px); opacity: 0; }
}
@keyframes dcLbBounce {
  0%, 100% { transform: translateY(0); }
  40%      { transform: translateY(-6px); }
  60%      { transform: translateY(-2px); }
}
@keyframes dcLbFadeIn {
  0%   { opacity: 0; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}
`
  document.head.appendChild(style)
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════════ */

interface LeaderboardToastProps {
  capsuleId: string
  widgetId: string
  /** Called after the toast disappears (either saved or dismissed) */
  onDone?: () => void
}

export default function LeaderboardToast({ capsuleId, widgetId, onDone }: LeaderboardToastProps) {
  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)
  const [exiting, setExiting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    injectLeaderboardStyles()
  }, [])

  // Auto-focus input after animation finishes (0.6s delay + 0.5s anim)
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 1200)
    return () => clearTimeout(timer)
  }, [])

  // Auto-dismiss after 15 seconds if no interaction
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!saved) handleDismiss()
    }, 15000)
    return () => clearTimeout(timer)
  }, [saved])

  const handleDismiss = useCallback(() => {
    embedAnalytics.dismissNamePrompt()
    setExiting(true)
    setTimeout(() => onDone?.(), 400)
  }, [onDone])

  const handleSave = useCallback(() => {
    const trimmed = name.trim()
    if (!trimmed) return
    embedAnalytics.setLearnerName(trimmed, capsuleId, widgetId)
    setSaved(true)
    // Auto-close after showing confirmation
    setTimeout(() => {
      setExiting(true)
      setTimeout(() => onDone?.(), 400)
    }, 1800)
  }, [name, capsuleId, widgetId, onDone])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') handleDismiss()
  }, [handleSave, handleDismiss])

  return (
    <div className={`dc-lb-toast${exiting ? ' exiting' : ''}`}>
      <span className="dc-lb-emoji">🏆</span>

      {saved ? (
        <div className="dc-lb-confirmed">
          ✓ Saved as <strong>{name.trim()}</strong>
        </div>
      ) : (
        <>
          <span className="dc-lb-text"><strong>Nice!</strong> Save to leaderboard?</span>
          <input
            ref={inputRef}
            className="dc-lb-input"
            type="text"
            placeholder="Your name"
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="dc-lb-save"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            Save
          </button>
          <button className="dc-lb-dismiss" onClick={handleDismiss} title="Dismiss">
            ×
          </button>
        </>
      )}
    </div>
  )
}
