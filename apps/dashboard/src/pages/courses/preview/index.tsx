/**
 * Course Preview Page
 *
 * Renders an interactive preview of a course with its capsules.
 * Only available for Draft courses — published courses should
 * be viewed via the Course Detail page.
 * Uses query parameter ?id=xxx for static export compatibility.
 */

import React, { useState, useEffect } from 'react'
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

export default function CoursePreviewPage() {
  const { user, session, loading: authLoading } = useAuth()
  const router = useRouter()
  const id = router.query.id as string | undefined

  const [course, setCourse] = useState<CourseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    if (!id || !session?.access_token) return

    const fetchCourse = async () => {
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
    }

    fetchCourse()
  }, [id, session?.access_token])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#04040a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500/30 border-t-emerald-500" />
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#04040a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm">{error || 'Course not found'}</p>
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

  // If published, redirect to the detail page instead
  if (course.published_at) {
    return (
      <div className="min-h-screen bg-[#04040a] flex items-center justify-center">
        <div className="text-center max-w-sm bg-[#0a0a14] rounded-xl border border-slate-800 p-8">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-emerald-400 text-lg">✓</span>
          </div>
          <h3 className="text-white font-medium mb-1">Course is Published</h3>
          <p className="text-sm text-slate-400 mb-5">
            Preview mode is only available for draft courses. This course is already published.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => router.push(`/courses/detail/?id=${id}`)}
              className="px-4 py-2 text-sm font-medium text-[#04040a] bg-[#00ff87] rounded-lg hover:bg-[#00e077] transition-colors"
            >
              View Course
            </button>
            <button
              onClick={() => router.push('/courses')}
              className="px-4 py-2 text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  const getDifficultyColor = (d: string) => {
    switch (d?.toUpperCase()) {
      case 'EASY': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'HARD': return 'bg-red-500/10 text-red-400 border-red-500/20'
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CODE': return '💻'
      case 'DATABASE': return '🗄️'
      case 'TERMINAL': return '🖥️'
      default: return '📝'
    }
  }

  const currentItem = course.items[activeStep]

  return (
    <div className="min-h-screen bg-[#04040a]">

      {/* Draft Preview Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20">
        <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            <span className="text-xs font-medium text-amber-400">Draft Preview</span>
            <span className="text-xs text-amber-400/60">— Students cannot see this version yet</span>
          </div>
          <button
            onClick={() => router.push(`/courses/edit/?id=${id}`)}
            className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
          >
            Continue Editing
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-[#0a0a14] border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/courses')}
              className="text-sm text-slate-500 hover:text-emerald-400 mb-1 flex items-center gap-1 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back to Courses
            </button>
            <h1 className="text-2xl font-bold text-white">{course.title}</h1>
            {course.description && (
              <p className="text-slate-400 mt-1 text-sm">{course.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
              Draft
            </span>
            <span className="text-sm text-slate-500">
              {course.items.length} exercise{course.items.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => router.push(`/courses/edit/?id=${id}`)}
              className="px-3.5 py-2 text-sm font-medium text-[#04040a] bg-[#00ff87] rounded-lg hover:bg-[#00e077] transition-colors"
            >
              Edit Course
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {course.items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-sm">No exercises in this course yet.</p>
            <button
              onClick={() => router.push(`/courses/edit/?id=${id}`)}
              className="mt-4 px-4 py-2 text-sm font-medium text-[#04040a] bg-[#00ff87] rounded-lg hover:bg-[#00e077] transition-colors"
            >
              Add Exercises
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar — Step List */}
            <div className="col-span-4">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Course Outline
              </h2>
              <div className="space-y-2">
                {course.items.map((item, index) => (
                  <button
                    key={item.capsule_id}
                    onClick={() => setActiveStep(index)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      index === activeStep
                        ? 'bg-emerald-500/5 border-emerald-500/30 text-white'
                        : 'bg-[#0a0a14] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === activeStep
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.capsule.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs">{getTypeIcon(item.capsule.type)}</span>
                          <span className={`text-[11px] px-1.5 py-0.5 rounded border ${getDifficultyColor(item.capsule.difficulty)}`}>
                            {item.capsule.difficulty}
                          </span>
                          <span className="text-xs text-slate-600">{item.capsule.language}</span>
                        </div>
                      </div>
                    </div>
                    {item.is_gate && (
                      <span className="inline-block mt-1 ml-10 text-[11px] text-orange-400">🔒 Gate</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content — Exercise Preview */}
            <div className="col-span-8">
              {currentItem && (
                <div className="bg-[#0a0a14] rounded-xl border border-slate-800 overflow-hidden">
                  <div className="p-5 border-b border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {currentItem.capsule.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded border ${getDifficultyColor(currentItem.capsule.difficulty)}`}>
                          {currentItem.capsule.difficulty}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {currentItem.capsule.language}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm whitespace-pre-line">
                      {currentItem.capsule.description}
                    </p>
                  </div>

                  {/* Embedded exercise */}
                  <div className="w-full" style={{ height: '600px' }}>
                    <iframe
                      src={`${EMBED_BASE}/?capsuleId=${currentItem.capsule_id}`}
                      className="w-full h-full border-0"
                      allow="clipboard-write"
                      title={currentItem.capsule.title}
                    />
                  </div>

                  {/* Navigation */}
                  <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                      disabled={activeStep === 0}
                      className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg border border-slate-700 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Previous
                    </button>
                    <span className="text-sm text-slate-500">
                      {activeStep + 1} of {course.items.length}
                    </span>
                    <button
                      onClick={() => setActiveStep(Math.min(course.items.length - 1, activeStep + 1))}
                      disabled={activeStep === course.items.length - 1}
                      className="px-4 py-2 text-sm text-[#04040a] bg-[#00ff87] rounded-lg hover:bg-[#00e077] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
