/// <reference types="../vite-env.d.ts" />
import React, { useState, useEffect, useCallback, useRef } from 'react'
import AdaptiveCapsuleEmbed from './AdaptiveCapsuleEmbed'

/* ═══════════════════════════════════════════════════════════════════════════════
   PlaylistEmbed — "Seamless Arcade" Single-Iframe Playlist Player
   
   Renders an entire course inside ONE iframe. When the student completes a
   capsule (all tests pass), a green "Next Challenge →" bar slides in.
   Clicking it swaps the React state to the next capsule — no page reload,
   no iframe-in-iframe inception.
   
   URL: embed.devcapsules.com/?playlist=<playlistId>
   ═══════════════════════════════════════════════════════════════════════════════ */

interface PlaylistItem {
  capsule_id: string
  order: number
  is_gate: boolean
  is_optional: boolean
  capsule: {
    id: string
    title: string
    description: string
    type: string
    difficulty: string
    language: string
    test_count: number
    content?: any
    has_hints?: boolean
    tags?: string[]
    function_name?: string
  }
}

interface PlaylistData {
  playlist_id: string
  title: string
  description: string
  items: PlaylistItem[]
  total_items: number
}

interface PlaylistEmbedProps {
  playlistId: string
  startIndex?: number
}

type StepStatus = 'locked' | 'current' | 'completed'

export default function PlaylistEmbed({ playlistId, startIndex = 0 }: PlaylistEmbedProps) {
  const [playlist, setPlaylist] = useState<PlaylistData | null>(null)
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  const [completedSet, setCompletedSet] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [showNextBar, setShowNextBar] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  
  // Key to force re-mount AdaptiveCapsuleEmbed when capsule changes
  const [embedKey, setEmbedKey] = useState(0)

  const apiUrl = (import.meta as any).env?.VITE_API_URL || 'https://devcapsules-api.devleep-edu.workers.dev/api/v1'

  // ── Fetch playlist manifest ──────────────────────────────────────────────

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const res = await fetch(`${apiUrl}/playlists/${playlistId}/embed`)
        if (!res.ok) throw new Error('Course not found or not published')
        const json = await res.json()
        const data: PlaylistData = json.data || json
        if (!data.items || data.items.length === 0) throw new Error('This course has no exercises')
        setPlaylist(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load course')
      } finally {
        setLoading(false)
      }
    }
    fetchPlaylist()
  }, [playlistId, apiUrl])

  // ── Completion handler ─────────────────────────────────────────────────────

  const handleCapsuleComplete = useCallback(() => {
    if (!playlist) return
    setCompletedSet(prev => {
      const next = new Set(prev)
      next.add(currentIndex)
      return next
    })

    // Show the "Next Challenge" bar if not the last capsule
    if (currentIndex < playlist.items.length - 1) {
      setShowNextBar(true)
    }

    // Report progress to backend (fire-and-forget)
    const capsuleId = playlist.items[currentIndex]?.capsule_id
    if (capsuleId) {
      fetch(`${apiUrl}/playlists/${playlistId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capsule_id: capsuleId, status: 'completed' }),
      }).catch(() => {})

      // Notify opener window (learn/course page) via postMessage
      try {
        window.opener?.postMessage({
          type: 'dc-capsule-complete',
          capsuleId,
          playlistId,
        }, '*')
      } catch {}
    }
  }, [playlist, currentIndex, playlistId, apiUrl])

  // ── Listen for "all tests passed" from the child embed ────────────────────
  // The AdaptiveCapsuleEmbed dispatches a custom event or we listen for
  // postMessage from the execution result. We use a MutationObserver +
  // polling approach: watch for the ".dc-success-overlay" indicator in the DOM.

  useEffect(() => {
    // Poll for the success overlay that DCAnimations renders
    // when allPassed === true (the "All Tests Passed!" overlay).
    const interval = setInterval(() => {
      const successOverlay = document.querySelector('.dc-success-overlay, .dc-success-card')
      if (successOverlay) {
        handleCapsuleComplete()
        clearInterval(interval)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [currentIndex, embedKey, handleCapsuleComplete])

  // ── Also listen for custom event dispatched by modified embed ──────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.allPassed) {
        handleCapsuleComplete()
      }
    }
    window.addEventListener('capsule-complete', handler)
    return () => window.removeEventListener('capsule-complete', handler)
  }, [currentIndex, handleCapsuleComplete])

  // ── Navigate to next capsule ───────────────────────────────────────────────

  const goToStep = useCallback((index: number) => {
    if (!playlist || index < 0 || index >= playlist.items.length) return
    // If gated, must complete previous
    if (index > 0 && playlist.items[index - 1]?.is_gate && !completedSet.has(index - 1)) {
      return // locked
    }
    setTransitioning(true)
    setShowNextBar(false)
    setTimeout(() => {
      setCurrentIndex(index)
      setEmbedKey(k => k + 1)
      setTransitioning(false)
    }, 200)
  }, [playlist, completedSet])

  const goNext = useCallback(() => {
    goToStep(currentIndex + 1)
  }, [currentIndex, goToStep])

  // ── Intercept "Continue Coding" click to auto-advance ──────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('.dc-success-close') && playlist && currentIndex < playlist.items.length - 1) {
        // Let the overlay close first, then auto-advance
        setTimeout(() => goNext(), 400)
      }
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [playlist, currentIndex, goNext])

  // ── Step status ────────────────────────────────────────────────────────────

  const getStepStatus = (index: number): StepStatus => {
    if (completedSet.has(index)) return 'completed'
    if (index === currentIndex) return 'current'
    // Items before current that weren't explicitly completed
    if (index < currentIndex) return 'completed'
    // Items after current: only lock if an uncompleted gate blocks them
    for (let i = 0; i < index; i++) {
      if (playlist?.items[i]?.is_gate && !completedSet.has(i)) return 'locked'
    }
    // If current capsule is completed, the next one is unlocked
    if (completedSet.has(currentIndex) && index === currentIndex + 1) return 'current'
    // Otherwise lock items that are more than 1 step ahead
    if (index > currentIndex + 1 && !completedSet.has(index - 1)) return 'locked'
    return 'locked'
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="pl-loading">
        <div className="pl-spinner" />
        <span>Loading course…</span>
      </div>
    )
  }

  if (error || !playlist) {
    return (
      <div className="pl-error">
        <span className="pl-error-icon">!</span>
        <p>{error || 'Course not found'}</p>
      </div>
    )
  }

  const currentItem = playlist.items[currentIndex]
  const isLastStep = currentIndex === playlist.items.length - 1
  const allDone = completedSet.size === playlist.items.length

  return (
    <div className="pl-root">
      {/* ── Top progress bar ── */}
      <div className="pl-progress-track">
        <div
          className="pl-progress-fill"
          style={{ width: `${(completedSet.size / playlist.items.length) * 100}%` }}
        />
      </div>

      {/* ── Header bar ── */}
      <div className="pl-header">
        <button
          className="pl-sidebar-toggle"
          onClick={() => setShowSidebar(s => !s)}
          aria-label="Toggle course outline"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="pl-header-info">
          <span className="pl-step-label">
            {currentIndex + 1}<span className="pl-step-sep">/</span>{playlist.items.length}
          </span>
          <span className="pl-header-title">{currentItem?.capsule.title}</span>
        </div>
        <div className="pl-header-right">
          {currentItem?.capsule.difficulty && (
            <span className={`pl-diff pl-diff-${currentItem.capsule.difficulty.toLowerCase()}`}>
              {currentItem.capsule.difficulty}
            </span>
          )}
        </div>
      </div>

      <div className="pl-body">
        {/* ── Sidebar overlay ── */}
        {showSidebar && (
          <>
            <div className="pl-sidebar-backdrop" onClick={() => setShowSidebar(false)} />
            <aside className="pl-sidebar">
              <div className="pl-sidebar-head">
                <h3>{playlist.title}</h3>
                <button onClick={() => setShowSidebar(false)} className="pl-sidebar-close" aria-label="Close">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <ul className="pl-sidebar-list">
                {playlist.items.map((item, idx) => {
                  const status = getStepStatus(idx)
                  return (
                    <li key={item.capsule_id}>
                      <button
                        className={`pl-sidebar-item pl-sidebar-${status}`}
                        onClick={() => { if (status !== 'locked') { goToStep(idx); setShowSidebar(false) } }}
                        disabled={status === 'locked'}
                      >
                        <span className="pl-sidebar-num">
                          {status === 'completed' ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dc-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : status === 'locked' ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dc-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                          ) : (
                            <span className="pl-sidebar-dot" />
                          )}
                        </span>
                        <span className="pl-sidebar-title">{item.capsule.title}</span>
                        <span className="pl-sidebar-lang">{item.capsule.language}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </aside>
          </>
        )}

        {/* ── Main capsule area ── */}
        <div className={`pl-capsule-area ${transitioning ? 'pl-fade-out' : 'pl-fade-in'}`}>
          {currentItem && (
            <AdaptiveCapsuleEmbed key={embedKey} widgetId={currentItem.capsule_id} />
          )}
        </div>
      </div>

      {/* ── "Next Challenge" bar (slides up on completion) ── */}
      {showNextBar && !isLastStep && (
        <div className="pl-next-bar pl-next-bar-enter">
          <div className="pl-next-inner">
            <span className="pl-next-check">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--dc-bg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span className="pl-next-text">Challenge complete!</span>
            <button className="pl-next-btn" onClick={goNext}>
              Next Challenge
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Course complete overlay ── */}
      {allDone && isLastStep && completedSet.has(currentIndex) && (
        <div className="pl-complete-overlay">
          <div className="pl-complete-card">
            <div className="pl-complete-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--dc-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2>Course Complete!</h2>
            <p>You crushed all {playlist.items.length} challenges in <strong>{playlist.title}</strong></p>
            <div className="pl-complete-stats">
              <div className="pl-stat">
                <span className="pl-stat-num">{playlist.items.length}</span>
                <span className="pl-stat-label">Challenges</span>
              </div>
              <div className="pl-stat">
                <span className="pl-stat-num">100%</span>
                <span className="pl-stat-label">Completed</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
