/**
 * Public Capsules Catalog — Browse featured courses & capsules without login
 */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useAuth } from '../contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_WORKERS_API_URL || 'https://devcapsules-api.devleep-edu.workers.dev'

interface CourseModule {
  id: string
  title: string
  description: string
  position: number
}

interface FeaturedCourse {
  id: string
  title: string
  description: string
  tags: string[]
  total_items: number
  modules: CourseModule[]
  created_at: string
}

interface FeaturedCapsule {
  id: string
  title: string
  description: string
  type: string
  difficulty: string
  language: string
  function_name: string | null
  test_count: number
  has_hints: number
  tags: string[]
  quality_score: number | null
  created_at: string
}

const LANGUAGE_META: Record<string, { icon: string; label: string; color: string }> = {
  python:     { icon: 'PY', label: 'Python',     color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  javascript: { icon: 'JS', label: 'JavaScript', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  java:       { icon: 'JV', label: 'Java',       color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  sql:        { icon: 'DB', label: 'SQL',         color: 'bg-green-500/15 text-green-400 border-green-500/30' },
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  HARD:   'bg-red-500/15 text-red-400 border-red-500/30',
}

// Rich marketing metadata for courses — keyed by title substring match
const COURSE_META: Record<string, {
  project: string
  outcome: string
  level: string
  hours: string
  skills: string[]
}> = {
  'Foundations': {
    project: 'Mini AI Prompt Engine',
    outcome: 'Build a working prompt pipeline from scratch — input validation, token estimation, conversation management, and query routing — the foundation every AI engineer needs.',
    level: 'Beginner',
    hours: '~4 hrs',
    skills: ['Python Fundamentals', 'Prompt Templates', 'Conversation History', 'Input Validation', 'Pipeline Design'],
  },
  'LLM Engineering': {
    project: 'LLM Toolkit Library',
    outcome: 'Build a reusable JavaScript library for tokenization, prompt templating, structured output parsing, and cost tracking — the primitives behind every LLM application.',
    level: 'Intermediate',
    hours: '~5 hrs',
    skills: ['Tokenization', 'Prompt Engineering', 'JSON Schema Validation', 'Cost Optimization'],
  },
  'Agentic Pipeline': {
    project: 'Multi-Agent Pipeline Engine',
    outcome: 'Build a Python agent orchestrator with tool routing, memory management, RAG retrieval, and guardrail enforcement — a mini LangChain you understand end-to-end.',
    level: 'Intermediate',
    hours: '~10 hrs',
    skills: ['Agent Loops', 'Tool Routing', 'RAG Retrieval', 'Guardrails', 'Memory Systems'],
  },
  'Supervising AI': {
    project: 'AI Code Reviewer',
    outcome: 'Build a complete AI code supervision pipeline that detects security issues, measures complexity, and enforces quality gates — the system behind every AI coding assistant\'s safety layer.',
    level: 'Intermediate–Advanced',
    hours: '~12 hrs',
    skills: ['AST Analysis', 'Security Scanning', 'Complexity Metrics', 'Quality Gates'],
  },
  'Customer Support': {
    project: 'AI Support Agent',
    outcome: 'Build a production-ready customer support agent with intent classification, knowledge retrieval, escalation logic, and conversation analytics — ready to demo on GitHub.',
    level: 'Intermediate–Advanced',
    hours: '~12 hrs',
    skills: ['Intent Classification', 'Knowledge Base', 'Escalation Routing', 'Conversation Analytics'],
  },
  'Reliable AI': {
    project: 'AI Reliability Dashboard',
    outcome: 'Build a monitoring and observability system for AI pipelines — drift detection, hallucination scoring, circuit breakers, and automated alerts for production LLM systems.',
    level: 'Advanced',
    hours: '~12 hrs',
    skills: ['Drift Detection', 'Hallucination Scoring', 'Circuit Breakers', 'SLA Monitoring'],
  },
  'Infrastructure': {
    project: 'AI Cost & Scaling Monitor',
    outcome: 'Build the infrastructure layer for AI systems — token budgets, model routing, auto-scaling policies, and cost dashboards that keep LLM spend under control.',
    level: 'Advanced',
    hours: '~12 hrs',
    skills: ['Token Budgeting', 'Model Routing', 'Auto-Scaling', 'Cost Analytics'],
  },
}

function getCourseMetadata(title: string) {
  for (const [key, meta] of Object.entries(COURSE_META)) {
    if (title.includes(key)) return meta
  }
  return null
}

export default function CapsulesCatalog() {
  const router = useRouter()
  const { user } = useAuth()
  const [courses, setCourses] = useState<FeaturedCourse[]>([])
  const [capsules, setCapsules] = useState<FeaturedCapsule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)

  useEffect(() => {
    fetchFeatured()
  }, [])

  const fetchFeatured = async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch featured courses and standalone capsules in parallel
      const [coursesRes, capsulesRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/playlists/featured?limit=50`),
        fetch(`${API_URL}/api/v1/capsules/featured?limit=100`),
      ])

      const coursesJson = await coursesRes.json()
      const capsulesJson = await capsulesRes.json()

      if (coursesJson.success) {
        setCourses(
          (coursesJson.data || []).map((c: any) => ({
            ...c,
            tags: Array.isArray(c.tags) ? c.tags : (() => {
              try { return JSON.parse(c.tags || '[]') } catch { return [] }
            })(),
          }))
        )
      }
      if (capsulesJson.success) {
        setCapsules(
          (capsulesJson.data || []).map((c: any) => ({
            ...c,
            tags: Array.isArray(c.tags) ? c.tags : (() => {
              try { return JSON.parse(c.tags || '[]') } catch { return [] }
            })(),
          }))
        )
      }
      if (!coursesJson.success && !capsulesJson.success) {
        setError('Failed to load content')
      }
    } catch {
      setError('Could not connect to the server')
    } finally {
      setLoading(false)
    }
  }

  const handleCapsuleClick = (capsuleId: string) => {
    if (user) {
      window.open(`https://embed.codecapsule.dev/?id=${capsuleId}`, '_blank')
    } else {
      router.push('/login')
    }
  }

  // Infer language from course tags
  const courseLanguage = (tags: string[]) => {
    for (const t of tags) {
      const lower = t.toLowerCase()
      if (lower in LANGUAGE_META) return lower
    }
    return null
  }

  return (
    <>
      <Head>
        <title>Practice Capsules — CodeCapsule</title>
        <meta name="description" content="Practice AI Engineering, LLM patterns, and Data Engineering with hands-on coding capsules." />
      </Head>

      <div className="min-h-screen bg-[#04040a] text-white">
        {/* ─── Hero ─── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase"
              style={{ background: 'rgba(0,255,135,0.07)', border: '1px solid rgba(0,255,135,0.18)', color: '#00ff87' }}
            >
              For developers &amp; engineers
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              Learn <span style={{ color: '#00ff87' }}>AI Engineering</span> by Building
            </h2>
            <p className="text-slate-400 text-lg">
              Production-grade courses where every exercise is a working component you can ship. Build LLM pipelines, agent orchestrators, and reliability systems — pure code, no wrappers.
            </p>
            <p className="text-slate-500 text-sm">
              Each course produces a <span className="text-slate-300">portfolio-ready project</span> you can demo and push to GitHub.
            </p>
          </div>
        </section>

        {/* ─── Content ─── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500/30 border-t-emerald-500" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-400">{error}</p>
              <button onClick={fetchFeatured} className="mt-4 text-sm text-slate-400 hover:text-white underline">Retry</button>
            </div>
          ) : (
            <>
              {/* ─── Featured Courses ─── */}
              {courses.length > 0 && (
                <div className="mb-16">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#00ff87' }} />
                    Featured Courses
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {courses.map(course => {
                      const lang = courseLanguage(course.tags)
                      const langMeta = lang ? LANGUAGE_META[lang] : null
                      const isExpanded = expandedCourse === course.id
                      const meta = getCourseMetadata(course.title)

                      return (
                        <div
                          key={course.id}
                          className="rounded-xl transition-all duration-200"
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: isExpanded
                              ? '1px solid rgba(0,255,135,0.25)'
                              : '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          {/* Course Header */}
                          <button
                            onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                            className="w-full text-left p-6"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {langMeta && (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${langMeta.color}`}>
                                    {langMeta.icon}
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-[#00ff87]/10 text-[#00ff87] border-[#00ff87]/30">
                                  COURSE
                                </span>
                                {meta && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-white/5 text-slate-400 border-white/10">
                                    {meta.level}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500">
                                {course.total_items} exercises · {meta?.hours || `${course.modules.length} modules`}
                              </span>
                            </div>

                            <h4 className="text-lg font-semibold text-white mb-2">
                              {course.title}
                            </h4>

                            {/* What you'll build — visible without expanding */}
                            {meta && (
                              <div className="mb-3 p-3 rounded-lg" style={{ background: 'rgba(0,255,135,0.04)', border: '1px solid rgba(0,255,135,0.08)' }}>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#00ff87]/60 mb-1">
                                  What you'll build
                                </p>
                                <p className="text-sm font-medium text-white">{meta.project}</p>
                                <p className="text-xs text-slate-400 mt-1">{meta.outcome}</p>
                              </div>
                            )}

                            {!meta && (
                              <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                                {course.description || 'Hands-on coding course'}
                              </p>
                            )}

                            {/* Skill tags */}
                            {meta && (
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {meta.skills.map(skill => (
                                  <span key={skill} className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-400 border border-white/8">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Expand indicator */}
                            <div className="flex items-center gap-1 text-xs text-[#00ff87]/60">
                              <svg
                                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                              {isExpanded ? 'Hide curriculum' : `View ${course.modules.length} modules`}
                            </div>
                          </button>

                          {/* Expanded Modules */}
                          {isExpanded && course.modules.length > 0 && (
                            <div className="px-6 pb-6 border-t border-white/5 pt-4">
                              <div className="space-y-3">
                                {course.modules.map((mod, i) => (
                                  <div
                                    key={mod.id}
                                    className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                                  >
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                                      style={{ background: 'rgba(0,255,135,0.1)', color: '#00ff87' }}
                                    >
                                      {i + 1}
                                    </span>
                                    <div>
                                      <p className="text-sm font-medium text-white">{mod.title}</p>
                                      {mod.description && (
                                        <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* CTA */}
                              <button
                                onClick={() => {
                                  if (user) {
                                    router.push(`/courses/detail/?id=${course.id}`)
                                  } else {
                                    router.push('/login')
                                  }
                                }}
                                className="mt-4 w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
                                style={{
                                  background: 'rgba(0,255,135,0.1)',
                                  border: '1px solid rgba(0,255,135,0.3)',
                                  color: '#00ff87',
                                }}
                                onMouseEnter={e => {
                                  (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,135,0.2)'
                                }}
                                onMouseLeave={e => {
                                  (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,135,0.1)'
                                }}
                              >
                                {user ? 'Start Course →' : 'Sign in to Start →'}
                              </button>
                            </div>
                          )}

                          {/* Collapsed module preview for courses without modules */}
                          {isExpanded && course.modules.length === 0 && (
                            <div className="px-6 pb-6 border-t border-white/5 pt-4">
                              <p className="text-sm text-slate-500">
                                {course.total_items} exercises — no modules defined yet
                              </p>
                              <button
                                onClick={() => {
                                  if (user) {
                                    router.push(`/courses/detail/?id=${course.id}`)
                                  } else {
                                    router.push('/login')
                                  }
                                }}
                                className="mt-4 w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
                                style={{
                                  background: 'rgba(0,255,135,0.1)',
                                  border: '1px solid rgba(0,255,135,0.3)',
                                  color: '#00ff87',
                                }}
                              >
                                {user ? 'Start Course →' : 'Sign in to Start →'}
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ─── Standalone Featured Capsules ─── */}
              {capsules.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#00ff87' }} />
                    Practice Capsules
                    <span className="text-xs text-slate-600 font-normal ml-1">({capsules.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {capsules.map(capsule => {
                      const langMeta = LANGUAGE_META[capsule.language] || { icon: '??', label: capsule.language, color: 'bg-white/5 text-slate-400 border-white/10' }
                      const diffColor = DIFFICULTY_COLORS[capsule.difficulty] || DIFFICULTY_COLORS.MEDIUM
                      return (
                        <button
                          key={capsule.id}
                          onClick={() => handleCapsuleClick(capsule.id)}
                          className="group text-left rounded-xl p-5 transition-all duration-200 hover:scale-[1.02]"
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,135,0.2)'
                            ;(e.currentTarget as HTMLElement).style.background = 'rgba(0,255,135,0.03)'
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'
                            ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${langMeta.color}`}>
                              {langMeta.icon}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${diffColor}`}>
                              {capsule.difficulty}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-white group-hover:text-[#00ff87] transition-colors line-clamp-2 mb-2">
                            {capsule.title}
                          </h4>
                          <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                            {capsule.description || 'Practice problem'}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-600">
                            {capsule.test_count > 0 && <span>{capsule.test_count} tests</span>}
                            {capsule.has_hints > 0 && <span>Hints</span>}
                            {!user && <span className="ml-auto text-[#00ff87]/60">Sign in to solve →</span>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {courses.length === 0 && capsules.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-slate-500 text-lg">No content published yet. Check back soon!</p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  )
}
