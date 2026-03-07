/**
 * Course Detail Page
 *
 * Read-only view of a course with full info, capsule list, analytics, and actions.
 * Uses query parameter ?id=xxx for static export compatibility.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://devcapsules-api.devleep-edu.workers.dev/api/v1'
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
  updated_at: string
  items: CourseItem[]
  total_items: number
}

interface AnalyticsData {
  unique_learners: number
  average_completion_rate: number
  step_completion_rates: Array<{
    capsule_id: string
    completion_rate: number
    average_time_spent: number
  }>
}

export default function CourseDetailPage() {
  const { user, session, loading: authLoading } = useAuth()
  const router = useRouter()
  const id = router.query.id as string | undefined

  const [course, setCourse] = useState<CourseData | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedEmbed, setCopiedEmbed] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'exercises' | 'analytics' | 'embed'>('exercises')

  const fetchCourse = useCallback(async () => {
    if (!id || !session?.access_token) return
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/playlists/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!res.ok) throw new Error(`Failed to load course: ${res.statusText}`)
      const json = await res.json()
      setCourse(json.data || json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course')
    } finally {
      setLoading(false)
    }
  }, [id, session?.access_token])

  const fetchAnalytics = useCallback(async () => {
    if (!id || !session?.access_token) return
    try {
      const res = await fetch(`${API_URL}/playlists/${id}/analytics`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      if (res.ok) {
        const json = await res.json()
        setAnalytics(json.data || json)
      }
    } catch {
      // Analytics are optional; fail silently
    }
  }, [id, session?.access_token])

  useEffect(() => {
    fetchCourse()
    fetchAnalytics()
  }, [fetchCourse, fetchAnalytics])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedEmbed(id)
      setTimeout(() => setCopiedEmbed(null), 2000)
    })
  }

  const isDraft = !course?.published_at
  const totalStudents = analytics?.unique_learners ?? 0
  const avgCompletion = analytics?.average_completion_rate ?? 0
  const avgTime = analytics?.step_completion_rates?.length
    ? Math.round(
        analytics.step_completion_rates.reduce((s, r) => s + r.average_time_spent, 0) /
          analytics.step_completion_rates.length /
          60
      )
    : 0

  // ── Loading / Error states ──

  if (authLoading || !router.isReady || loading) {
    return (
      <div className="min-h-screen bg-[#04040a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500/30 border-t-emerald-500" />
      </div>
    )
  }

  if (!user) { router.push('/login'); return null }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#04040a] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-red-400 text-lg">!</span>
          </div>
          <p className="text-red-400 mb-1">{error || 'Course not found'}</p>
          <button
            onClick={() => router.push('/courses')}
            className="mt-4 px-4 py-2 text-sm bg-slate-800 text-white rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            Back to Courses
          </button>
        </div>
      </div>
    )
  }

  // ── Helpers ──

  const getDifficultyStyle = (d: string) => {
    switch (d?.toUpperCase()) {
      case 'EASY': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'HARD': return 'bg-red-500/10 text-red-400 border-red-500/20'
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CODE': return { icon: '💻', label: 'Code' }
      case 'DATABASE': return { icon: '🗄️', label: 'Database' }
      case 'TERMINAL': return { icon: '🖥️', label: 'Terminal' }
      default: return { icon: '📝', label: type }
    }
  }

  const playlistEmbedCode = `<iframe src="${EMBED_BASE}/?playlist=${course.id}" width="100%" height="700px" frameborder="0" allow="clipboard-write" style="border-radius:8px;border:1px solid #1a1a2e"></iframe>`

  const getLmsEmbed = (capsuleId: string) =>
    `<iframe src="${EMBED_BASE}/?id=${capsuleId}&courseId=${course.id}" width="100%" height="600px" frameborder="0" allow="clipboard-write" style="border-radius:8px;border:1px solid #1a1a2e"></iframe>`

  // ── Render ──

  return (
    <div className="min-h-screen bg-[#04040a]">
      {/* ── Header ── */}
      <div className="bg-[#0a0a14] border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-5">
          {/* Breadcrumb */}
          <button
            onClick={() => router.push('/courses')}
            className="text-sm text-slate-500 hover:text-emerald-400 transition-colors mb-3 flex items-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Courses
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white truncate">{course.title}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${
                  isDraft
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {isDraft ? 'Draft' : 'Published'}
                </span>
              </div>
              {course.description && (
                <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">{course.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                <span>{course.items.length} exercise{course.items.length !== 1 ? 's' : ''}</span>
                <span>Created {new Date(course.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span>Updated {new Date(course.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isDraft && (
                <button
                  onClick={() => window.open(`/courses/preview/?id=${id}`, '_blank')}
                  className="px-3.5 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  Preview
                </button>
              )}
              <button
                onClick={() => router.push(`/courses/edit/?id=${id}`)}
                className="px-3.5 py-2 text-sm font-medium text-[#04040a] bg-[#00ff87] rounded-lg hover:bg-[#00e077] transition-colors flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit Course
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="max-w-5xl mx-auto px-6 -mt-px">
        <div className="grid grid-cols-3 bg-[#0a0a14] rounded-b-xl border border-t-0 border-slate-800 divide-x divide-slate-800">
          <div className="px-5 py-4 text-center">
            <p className="text-xl font-semibold text-white">{totalStudents}</p>
            <p className="text-xs text-slate-500 mt-0.5">Students Enrolled</p>
          </div>
          <div className="px-5 py-4 text-center">
            <p className="text-xl font-semibold text-emerald-400">{Math.round(avgCompletion * 100)}%</p>
            <p className="text-xs text-slate-500 mt-0.5">Avg Completion</p>
          </div>
          <div className="px-5 py-4 text-center">
            <p className="text-xl font-semibold text-sky-400">{avgTime}m</p>
            <p className="text-xs text-slate-500 mt-0.5">Avg Time</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="max-w-5xl mx-auto px-6 mt-6">
        <div className="flex gap-1 border-b border-slate-800 mb-6">
          {([
            { key: 'exercises', label: 'Exercises', count: course.items.length },
            { key: 'analytics', label: 'Analytics' },
            { key: 'embed', label: 'Embed Codes' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.key
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
              {'count' in tab && tab.count !== undefined && (
                <span className="ml-1.5 text-xs text-slate-600">({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Exercises Tab ── */}
        {activeTab === 'exercises' && (
          <div className="space-y-3 pb-12">
            {course.items.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📝</span>
                </div>
                <p className="text-slate-400 mb-4">No exercises in this course yet.</p>
                <button
                  onClick={() => router.push(`/courses/edit/?id=${id}`)}
                  className="px-4 py-2 text-sm font-medium text-[#04040a] bg-[#00ff87] rounded-lg hover:bg-[#00e077] transition-colors"
                >
                  Add Exercises
                </button>
              </div>
            ) : (
              course.items.map((item, index) => {
                const t = getTypeLabel(item.capsule.type)
                const stepAnalytics = analytics?.step_completion_rates?.find(s => s.capsule_id === item.capsule_id)
                return (
                  <div
                    key={item.capsule_id}
                    className="bg-[#0a0a14] rounded-xl border border-slate-800 p-4 hover:border-slate-700 transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Step number */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-semibold text-slate-400 group-hover:border-emerald-500/30 group-hover:text-emerald-400 transition-colors">
                        {index + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-white truncate">{item.capsule.title}</h4>
                          {item.is_gate && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                              🔒 Gate
                            </span>
                          )}
                          {item.is_optional && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                              Optional
                            </span>
                          )}
                        </div>
                        {item.capsule.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-2">{item.capsule.description}</p>
                        )}
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            {t.icon} {t.label}
                          </span>
                          <span className={`text-[11px] px-1.5 py-0.5 rounded border ${getDifficultyStyle(item.capsule.difficulty)}`}>
                            {item.capsule.difficulty}
                          </span>
                          <span className="text-xs text-slate-600">{item.capsule.language}</span>
                          {item.capsule.test_count > 0 && (
                            <span className="text-xs text-slate-600">{item.capsule.test_count} tests</span>
                          )}
                          {stepAnalytics && (
                            <span className="text-xs text-emerald-400/70 ml-auto">
                              {Math.round(stepAnalytics.completion_rate * 100)}% completion
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── Analytics Tab ── */}
        {activeTab === 'analytics' && (
          <div className="pb-12">
            {!analytics ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📊</span>
                </div>
                <p className="text-slate-400">No analytics data yet.</p>
                <p className="text-xs text-slate-500 mt-1">Analytics appear once students start using your course.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Per-exercise completion bars */}
                <div className="bg-[#0a0a14] rounded-xl border border-slate-800 p-5">
                  <h3 className="text-sm font-medium text-white mb-4">Exercise Completion Rates</h3>
                  <div className="space-y-3">
                    {course.items.map((item, index) => {
                      const stepData = analytics.step_completion_rates?.find(s => s.capsule_id === item.capsule_id)
                      const rate = stepData?.completion_rate ?? 0
                      const timeS = stepData?.average_time_spent ?? 0
                      return (
                        <div key={item.capsule_id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-300 truncate max-w-[60%]">
                              {index + 1}. {item.capsule.title}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-500">{Math.round(timeS / 60)}m avg</span>
                              <span className="text-xs font-medium text-emerald-400 w-10 text-right">{Math.round(rate * 100)}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                              style={{ width: `${Math.round(rate * 100)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Embed Tab ── */}
        {activeTab === 'embed' && (
          <div className="pb-12 space-y-6">
            {/* Playlist Embed */}
            <div className="bg-[#0a0a14] rounded-xl border border-slate-800 p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🎮</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">Playlist Embed — Seamless Arcade</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Single iframe for the full course. Best for Notion, Substack, WordPress.
                  </p>
                </div>
              </div>
              <div className="relative">
                <pre className="bg-[#04040a] rounded-lg p-3 text-xs text-emerald-300/80 font-mono overflow-x-auto border border-slate-800">{playlistEmbedCode}</pre>
                <button
                  onClick={() => copyToClipboard(playlistEmbedCode, 'playlist')}
                  className={`absolute top-2 right-2 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    copiedEmbed === 'playlist'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {copiedEmbed === 'playlist' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Per-capsule LMS Embeds */}
            <div className="bg-[#0a0a14] rounded-xl border border-slate-800 p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">📚</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">LMS / Per-Capsule Embeds — Headless Playlist</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    One embed per exercise with courseId baked in. Paste each into its own Graphy / Thinkific lesson.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {course.items.map((item, index) => {
                  const embedId = `lms-${item.capsule_id}`
                  const embedCode = getLmsEmbed(item.capsule_id)
                  return (
                    <div key={item.capsule_id} className="bg-[#04040a] rounded-lg border border-slate-800 p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                            {index + 1}
                          </span>
                          <span className="text-sm text-white truncate">{item.capsule.title}</span>
                          <span className="text-[11px] text-slate-600 flex-shrink-0">{item.capsule.language}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(embedCode, embedId)}
                          className={`px-2.5 py-1 text-xs font-medium rounded transition-colors flex-shrink-0 ${
                            copiedEmbed === embedId
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {copiedEmbed === embedId ? 'Copied!' : 'Copy Embed'}
                        </button>
                      </div>
                      <pre className="text-[10px] text-emerald-300/50 font-mono overflow-x-auto whitespace-nowrap">{embedCode}</pre>
                    </div>
                  )
                })}
                {course.items.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-6">No exercises yet — add them in the editor.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
