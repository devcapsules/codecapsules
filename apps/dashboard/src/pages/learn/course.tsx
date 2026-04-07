/**
 * Learner Course Detail — /learn/course?id=
 *
 * Read-only course view for learners. Shows lesson list and lets learners
 * open individual capsules in the embed sandbox.
 *
 * No analytics, no embed code, no edit controls — those live at /courses/detail.
 * Works without auth (published courses are publicly accessible).
 * Uses ?id= query param for static export compatibility.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useAuth } from '../../contexts/AuthContext'
import { useSoftLogin } from '../../hooks/useSoftLogin'
import SoftLoginModal from '../../components/SoftLoginModal'

const API_URL = process.env.NEXT_PUBLIC_WORKERS_API_URL || 'https://devcapsules-api.devleep-edu.workers.dev'
const EMBED_BASE = 'https://embed.devcapsules.com'

interface CourseItem {
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
  }
}

interface CourseData {
  id: string
  title: string
  description: string
  status: string
  published_at: string | null
  created_at: string
  items: CourseItem[]
  total_items: number
}

const DIFFICULTY_STYLE: Record<string, string> = {
  EASY:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  HARD:   'bg-red-500/10 text-red-400 border-red-500/20',
}

const LANG_ICON: Record<string, { icon: string; color: string }> = {
  python:     { icon: 'PY', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  javascript: { icon: 'JS', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  java:       { icon: 'JV', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  sql:        { icon: 'DB', color: 'bg-green-500/15 text-green-400 border-green-500/30' },
}

export default function LearnCoursePage() {
  const router = useRouter()
  const { user, session } = useAuth()
  const { learner, saveLearner } = useSoftLogin()
  const id = router.query.id as string | undefined

  const [course, setCourse] = useState<CourseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSoftLogin, setShowSoftLogin] = useState(false)
  const [pendingCapsuleId, setPendingCapsuleId] = useState<string | null>(null)

  const fetchCourse = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      // Build headers — include auth if available so the worker can personalise
      // responses (e.g. progress), but the call works without auth for published courses.
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-client': 'devcapsules-learner',
      }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const res = await fetch(`${API_URL}/api/v1/playlists/${id}`, { headers })
      if (!res.ok) throw new Error(`Failed to load course (${res.status})`)
      const json = await res.json()
      setCourse(json.data || json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course')
    } finally {
      setLoading(false)
    }
  }, [id, session?.access_token])

  useEffect(() => {
    if (router.isReady) fetchCourse()
  }, [router.isReady, fetchCourse])

  const openCapsule = (capsuleId: string) => {
    // Soft login: prompt name + phone if not already captured
    if (!user && !learner) {
      setPendingCapsuleId(capsuleId)
      setShowSoftLogin(true)
      return
    }
    window.open(`${EMBED_BASE}/?id=${capsuleId}`, '_blank')
  }

  const handleSoftLoginSubmit = (name: string, phone: string) => {
    saveLearner(name, phone)
    setShowSoftLogin(false)
    if (pendingCapsuleId) {
      window.open(`${EMBED_BASE}/?id=${pendingCapsuleId}`, '_blank')
      setPendingCapsuleId(null)
    }
  }

  // ── Loading ──
  if (!router.isReady || loading) {
    return (
      <div className="min-h-screen bg-[#04040a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500/30 border-t-emerald-500" />
      </div>
    )
  }

  // ── Error ──
  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#04040a] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-red-400 text-lg">!</span>
          </div>
          <p className="text-red-400 mb-1">{error || 'Course not found'}</p>
          <button
            onClick={() => router.push('/learn/capsules')}
            className="mt-4 px-4 py-2 text-sm bg-slate-800 text-white rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            Back to Catalog
          </button>
        </div>
      </div>
    )
  }

  const sortedItems = [...(course.items || [])].sort((a, b) => a.order - b.order)

  return (
    <>
      <Head>
        <title>{course.title} — Devcapsules</title>
        <meta name="description" content={course.description || `Learn ${course.title} with hands-on coding exercises.`} />
      </Head>

      <div className="min-h-screen bg-[#04040a] text-white">
        {/* ── Header ── */}
        <div className="bg-[#0a0a14] border-b border-slate-800">
          <div className="max-w-3xl mx-auto px-6 py-5">
            {/* Breadcrumb */}
            <button
              onClick={() => router.push('/learn/capsules')}
              className="text-sm text-slate-500 hover:text-emerald-400 transition-colors mb-3 flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              All Courses
            </button>

            <h1 className="text-2xl font-bold text-white mb-2">{course.title}</h1>
            {course.description && (
              <p className="text-slate-400 text-sm leading-relaxed mb-3">{course.description}</p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span
                className="px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.18)', color: '#00ff87' }}
              >
                {course.published_at ? 'Published' : 'Preview'}
              </span>
              <span>{sortedItems.length} exercise{sortedItems.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* ── Lesson List ── */}
        <div className="max-w-3xl mx-auto px-6 py-8">
          {!user && !learner && (
            <div
              className="mb-6 px-4 py-3 rounded-lg text-sm flex items-center gap-3"
              style={{ background: 'rgba(0,255,135,0.05)', border: '1px solid rgba(0,255,135,0.15)' }}
            >
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#00ff87' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-slate-300">
                Click <strong style={{ color: '#00ff87' }}>Solve</strong> on any exercise to get started.
              </span>
            </div>
          )}

          {showSoftLogin && (
            <SoftLoginModal
              onSubmit={handleSoftLoginSubmit}
              onClose={() => { setShowSoftLogin(false); setPendingCapsuleId(null); }}
            />
          )}

          {sortedItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-500">No exercises in this course yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedItems.map((item, index) => {
                const cap = item.capsule
                const diffStyle = DIFFICULTY_STYLE[cap?.difficulty?.toUpperCase()] || DIFFICULTY_STYLE.MEDIUM
                const langMeta = LANG_ICON[cap?.language?.toLowerCase()] || null

                return (
                  <div
                    key={item.capsule_id}
                    className="flex items-center gap-4 p-4 rounded-xl transition-all duration-150"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {/* Index */}
                    <span
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: 'rgba(0,255,135,0.08)', color: '#00ff87', border: '1px solid rgba(0,255,135,0.2)' }}
                    >
                      {index + 1}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm font-medium text-white truncate">{cap?.title || 'Untitled'}</p>
                        {item.is_gate && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            GATE
                          </span>
                        )}
                        {item.is_optional && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20">
                            OPTIONAL
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {langMeta && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${langMeta.color}`}>
                            {langMeta.icon}
                          </span>
                        )}
                        {cap?.difficulty && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${diffStyle}`}>
                            {cap.difficulty}
                          </span>
                        )}
                        {cap?.test_count > 0 && (
                          <span className="text-[10px] text-slate-600">{cap.test_count} tests</span>
                        )}
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => openCapsule(item.capsule_id)}
                      className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                      style={{
                        background: (user || learner) ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.05)',
                        border: (user || learner) ? '1px solid rgba(0,255,135,0.3)' : '1px solid rgba(255,255,255,0.1)',
                        color: (user || learner) ? '#00ff87' : '#94a3b8',
                      }}
                    >
                      {(user || learner) ? 'Solve →' : 'Sign in'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
