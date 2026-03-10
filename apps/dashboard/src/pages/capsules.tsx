/**
 * Public Capsules Catalog — Browse featured capsules without login
 */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useAuth } from '../contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_WORKERS_API_URL || 'https://devcapsules-api.devleep-edu.workers.dev'

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

export default function CapsulesCatalog() {
  const router = useRouter()
  const { user } = useAuth()
  const [capsules, setCapsules] = useState<FeaturedCapsule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterLang, setFilterLang] = useState<string>('')
  const [filterDiff, setFilterDiff] = useState<string>('')

  useEffect(() => {
    fetchFeatured()
  }, [filterLang, filterDiff])

  const fetchFeatured = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filterLang)  params.set('language', filterLang)
      if (filterDiff)  params.set('difficulty', filterDiff)
      params.set('limit', '100')

      const res = await fetch(`${API_URL}/api/v1/capsules/featured?${params}`)
      const json = await res.json()

      if (json.success) {
        // Parse tags if they're still strings
        const parsed = (json.data || []).map((c: any) => ({
          ...c,
          tags: Array.isArray(c.tags) ? c.tags : (() => {
            try { return JSON.parse(c.tags || '[]'); } catch { return []; }
          })(),
        }))
        setCapsules(parsed)
      } else {
        setError('Failed to load capsules')
      }
    } catch {
      setError('Could not connect to the server')
    } finally {
      setLoading(false)
    }
  }

  // Group capsules by tag categories
  const groupedByCategory = () => {
    const groups: Record<string, FeaturedCapsule[]> = {}
    capsules.forEach(c => {
      const categoryTag = c.tags.find(t => t !== 'featured' && t !== 'generated') || 'General'
      if (!groups[categoryTag]) groups[categoryTag] = []
      groups[categoryTag].push(c)
    })
    return groups
  }

  const handleCapsuleClick = (capsuleId: string) => {
    if (user) {
      // Logged in → open solver embed
      window.open(`https://embed.codecapsule.dev/?id=${capsuleId}`, '_blank')
    } else {
      router.push('/login')
    }
  }

  const groups = groupedByCategory()
  const allLanguages = [...new Set(capsules.map(c => c.language))]

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
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              Learn <span style={{ color: '#00ff87' }}>AI Engineering</span> by Building
            </h2>
            <p className="text-slate-400 text-lg">
              Master LLM pipelines, agent patterns, and data engineering — one hands-on capsule at a time. No libraries, no boilerplate. Just you and pure code.
            </p>
          </div>

          {/* ─── Filters ─── */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {/* Language filter */}
            <button
              onClick={() => setFilterLang('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                !filterLang ? 'bg-white/10 text-white border-white/20' : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              All Languages
            </button>
            {allLanguages.map(lang => {
              const meta = LANGUAGE_META[lang] || { icon: lang.slice(0,2).toUpperCase(), label: lang, color: 'bg-white/5 text-slate-400 border-white/10' }
              return (
                <button
                  key={lang}
                  onClick={() => setFilterLang(lang === filterLang ? '' : lang)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    filterLang === lang ? meta.color : 'text-slate-500 border-transparent hover:text-slate-300'
                  }`}
                >
                  {meta.icon} {meta.label}
                </button>
              )
            })}

            <div className="w-px h-5 bg-white/10" />

            {/* Difficulty filter */}
            <button
              onClick={() => setFilterDiff('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                !filterDiff ? 'bg-white/10 text-white border-white/20' : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              All Levels
            </button>
            {['EASY', 'MEDIUM', 'HARD'].map(d => (
              <button
                key={d}
                onClick={() => setFilterDiff(d === filterDiff ? '' : d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  filterDiff === d ? DIFFICULTY_COLORS[d] : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}
              >
                {d.charAt(0) + d.slice(1).toLowerCase()}
              </button>
            ))}
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
          ) : capsules.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-500 text-lg">No capsules yet. Check back soon!</p>
            </div>
          ) : (
            Object.entries(groups).map(([category, items]) => (
              <div key={category} className="mb-12">
                <h3 className="text-lg font-bold text-white/90 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#00ff87' }} />
                  {category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  <span className="text-xs text-slate-600 font-normal ml-1">({items.length} capsules)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(capsule => {
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
                        {/* Top row: language + difficulty */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${langMeta.color}`}>
                            {langMeta.icon}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${diffColor}`}>
                            {capsule.difficulty}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-semibold text-white group-hover:text-[#00ff87] transition-colors line-clamp-2 mb-2">
                          {capsule.title}
                        </h4>

                        {/* Description */}
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                          {capsule.description || 'Practice problem'}
                        </p>

                        {/* Footer meta */}
                        <div className="flex items-center gap-3 text-[10px] text-slate-600">
                          {capsule.test_count > 0 && (
                            <span>{capsule.test_count} tests</span>
                          )}
                          {capsule.has_hints > 0 && (
                            <span>Hints</span>
                          )}
                          {!user && (
                            <span className="ml-auto text-[#00ff87]/60">Sign in to solve →</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </section>

      </div>
    </>
  )
}
