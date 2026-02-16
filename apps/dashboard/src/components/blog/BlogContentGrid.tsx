import React, { useState } from 'react'
import Link from 'next/link'

interface BlogPost {
  id: string
  title: string
  description: string
  date: string
  readTime: string
  capsuleCount: number
  tags: string[]
  category: 'pillar' | 'feeder'
  language?: string
  views: string
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
  type?: string
}

interface BlogContentGridProps {
  posts: BlogPost[]
  showFilters?: boolean
}

export default function BlogContentGrid({ posts, showFilters = true }: BlogContentGridProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const languages = ['Python', 'SQL', 'JavaScript', 'Java', 'C#', 'Go', 'Terminal']
  const difficulties = ['Beginner', 'Intermediate', 'Advanced']

  const filteredPosts = posts.filter(post => {
    if (selectedLanguage && post.language !== selectedLanguage) return false
    if (selectedDifficulty && post.difficulty !== selectedDifficulty) return false
    if (selectedCategory && post.category !== selectedCategory) return false
    return true
  })

  const getLanguageIcon = (language?: string) => {
    switch (language) {
      case 'Python': return '🐍'
      case 'SQL': return '🗄️'
      case 'JavaScript': return '⚡'
      case 'Java': return '☕'
      case 'C#': return '🔷'
      case 'Go': return '🐹'
      case 'Terminal': return '🐧'
      default: return '💻'
    }
  }

  const getLanguageColor = (language?: string) => {
    switch (language) {
      case 'Python': return 'bg-green-100 text-green-800 border-green-200'
      case 'SQL': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'JavaScript': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Java': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'C#': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Go': return 'bg-cyan-100 text-cyan-800 border-cyan-200'
      case 'Terminal': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-700'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-700'
      case 'Advanced': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div>
      {/* Filters */}
      {showFilters && (
        <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Content</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Content</option>
                <option value="pillar">🎯 Hero Content</option>
                <option value="feeder">⚡ Quick Tutorials</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select 
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Languages</option>
                {languages.map(lang => (
                  <option key={lang} value={lang}>{getLanguageIcon(lang)} {lang}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <select 
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Levels</option>
                {difficulties.map(diff => (
                  <option key={diff} value={diff}>{diff}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button 
                onClick={() => {
                  setSelectedLanguage('')
                  setSelectedDifficulty('')
                  setSelectedCategory('')
                }}
                className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
          
          {/* Active Filters */}
          {(selectedLanguage || selectedDifficulty || selectedCategory) && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {selectedCategory && (
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {selectedCategory === 'pillar' ? '🎯 Hero Content' : '⚡ Quick Tutorials'}
                  <button 
                    onClick={() => setSelectedCategory('')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >×</button>
                </span>
              )}
              {selectedLanguage && (
                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {getLanguageIcon(selectedLanguage)} {selectedLanguage}
                  <button 
                    onClick={() => setSelectedLanguage('')}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >×</button>
                </span>
              )}
              {selectedDifficulty && (
                <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  {selectedDifficulty}
                  <button 
                    onClick={() => setSelectedDifficulty('')}
                    className="ml-1 text-yellow-600 hover:text-yellow-800"
                  >×</button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing <span className="font-semibold">{filteredPosts.length}</span> of <span className="font-semibold">{posts.length}</span> posts
        </p>
      </div>

      {/* Posts Grid */}
      <div className="grid gap-6">
        {filteredPosts.map(post => (
          <article 
            key={post.id} 
            className={`border rounded-xl p-6 hover:shadow-lg transition-all ${
              post.category === 'pillar' 
                ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200' 
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
              <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-0">
                {/* Content Type Badge */}
                <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full ${
                  post.category === 'pillar' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-600 text-white'
                }`}>
                  {post.category === 'pillar' ? '🎯 HERO CONTENT' : '⚡ QUICK TIP'}
                </span>
                
                {/* Language Badge */}
                {post.language && (
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getLanguageColor(post.language)}`}>
                    {getLanguageIcon(post.language)} {post.language}
                  </span>
                )}
                
                {/* Difficulty Badge */}
                {post.difficulty && (
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(post.difficulty)}`}>
                    {post.difficulty}
                  </span>
                )}
              </div>
              
              <div className="text-xs text-gray-500">
                {post.views} views
              </div>
            </div>
            
            <h2 className={`font-bold mb-3 leading-tight ${
              post.category === 'pillar' ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'
            }`}>
              <Link href={`/blog/${post.id}`} className="text-gray-900 hover:text-blue-600 transition-colors">
                {post.title}
              </Link>
            </h2>
            
            <p className="text-gray-700 mb-4 leading-relaxed">
              {post.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>📅 {post.date}</span>
                <span>⏱️ {post.readTime}</span>
                <span>🎯 {post.capsuleCount} Interactive {post.capsuleCount === 1 ? 'Lab' : 'Labs'}</span>
              </div>
              
              <Link 
                href={`/blog/${post.id}`}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 text-sm ${
                  post.category === 'pillar'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{post.category === 'pillar' ? 'Read Full Tutorial' : 'Try Interactive Demo'}</span>
                <span>→</span>
              </Link>
            </div>
            
            {/* Tags */}
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <span key={tag} className="bg-white/70 text-gray-700 text-xs px-2 py-1 rounded-full border border-gray-200">
                  #{tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      {/* No Results */}
      {filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No posts match your filters</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search criteria or clearing the filters.</p>
          <button 
            onClick={() => {
              setSelectedLanguage('')
              setSelectedDifficulty('')
              setSelectedCategory('')
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  )
}