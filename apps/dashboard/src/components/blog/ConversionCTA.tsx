import React, { useState } from 'react'
import Link from 'next/link'

interface ConversionCTAProps {
  type: 'hero-to-signup' | 'feeder-to-hero' | 'newsletter' | 'related-content'
  heroPostUrl?: string
  relatedPosts?: {
    id: string
    title: string
    description: string
    readTime: string
    language?: string
  }[]
  className?: string
}

export default function ConversionCTA({ type, heroPostUrl, relatedPosts, className = '' }: ConversionCTAProps) {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement newsletter subscription
    setIsSubscribed(true)
    setTimeout(() => setIsSubscribed(false), 3000)
  }

  if (type === 'hero-to-signup') {
    return (
      <section className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 text-center ${className}`}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Create Your Own Interactive Content?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of developers and educators who've already transformed their content with DevCapsules. 
            Start creating interactive tutorials that keep your audience engaged.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-bold mb-2">Instant Setup</h3>
              <p className="text-sm text-blue-100">Create your first interactive capsule in under 60 seconds</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-2">🚀</div>
              <h3 className="font-bold mb-2">Zero Infrastructure</h3>
              <p className="text-sm text-blue-100">No servers to manage, no complex deployments</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-2">💰</div>
              <h3 className="font-bold mb-2">Free Forever Plan</h3>
              <p className="text-sm text-blue-100">Unlimited public capsules, no credit card required</p>
            </div>
          </div>
          
          <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex md:justify-center">
            <Link 
              href="/signup"
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
            >
              🚀 Start Creating Now
            </Link>
            <Link 
              href="/demo"
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              📺 Watch 2-Min Demo
            </Link>
          </div>
          
          <p className="text-blue-200 text-sm mt-6">
            ✨ Trusted by developers at Google, Microsoft, Netflix, and 500+ other companies
          </p>
        </div>
      </section>
    )
  }

  if (type === 'feeder-to-hero') {
    return (
      <section className={`bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-8 text-center ${className}`}>
        <div className="max-w-2xl mx-auto">
          <div className="text-4xl mb-4">🤯</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Mind = Blown?</h2>
          <p className="text-lg text-gray-700 mb-6">
            This quick tutorial was just a taste. Want to see the <strong>full power</strong> of interactive learning? 
            Check out our complete deep-dive into how we built this entire blog with embedded code execution.
          </p>
          
          <div className="bg-white border border-indigo-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                CC
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900">Stop Copy-Pasting. Run Code Where You Read It.</h3>
                <p className="text-sm text-gray-600">The complete story of building the world's first interactive developer blog</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 mb-4">
              <span>📅 8 min read</span>
              <span>🎯 3 Interactive Labs</span>
              <span>🔥 2.1k views</span>
            </div>
          </div>
          
          <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex md:justify-center">
            <Link 
              href={heroPostUrl || "/blog/stop-copy-pasting"}
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
            >
              📖 Read the Full Story
            </Link>
            <Link 
              href="/signup"
              className="inline-block border-2 border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg font-bold hover:bg-indigo-600 hover:text-white transition-colors"
            >
              🛠️ Build Your Own
            </Link>
          </div>
        </div>
      </section>
    )
  }

  if (type === 'newsletter') {
    return (
      <section className={`bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl p-8 ${className}`}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-3xl mb-4">📬</div>
          <h2 className="text-2xl font-bold mb-4">Never Miss an Interactive Tutorial</h2>
          <p className="text-green-100 mb-6">
            Get new hands-on tutorials delivered weekly. Each one includes live code you can run instantly—no copy-pasting required.
          </p>
          
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto mb-6">
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
              required
            />
            <button 
              type="submit"
              disabled={isSubscribed}
              className={`px-6 py-3 rounded-lg font-bold transition-colors whitespace-nowrap ${
                isSubscribed 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white text-green-600 hover:bg-gray-100'
              }`}
            >
              {isSubscribed ? '✅ Subscribed!' : 'Subscribe Free'}
            </button>
          </form>
          
          <div className="grid md:grid-cols-3 gap-4 text-sm text-green-100">
            <div className="flex items-center justify-center space-x-2">
              <span>📧</span>
              <span>Weekly delivery</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span>🚫</span>
              <span>No spam ever</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span>👥</span>
              <span>Join 2,500+ developers</span>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (type === 'related-content' && relatedPosts) {
    return (
      <section className={`border-t border-gray-200 pt-8 ${className}`}>
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Continue Your Learning Journey</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {relatedPosts.slice(0, 4).map(post => (
            <Link 
              key={post.id}
              href={`/blog/${post.id}`}
              className="group border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all hover:border-blue-200"
            >
              <div className="flex items-start justify-between mb-3">
                {post.language && (
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {post.language === 'Python' ? '🐍' : post.language === 'SQL' ? '🗄️' : '💻'} {post.language}
                  </span>
                )}
                <span className="text-xs text-gray-500">{post.readTime}</span>
              </div>
              
              <h4 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {post.title}
              </h4>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {post.description}
              </p>
              
              <div className="flex items-center text-blue-600 text-sm font-medium">
                <span>Try Interactive Demo</span>
                <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <Link 
            href="/blog"
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Browse All Tutorials →
          </Link>
        </div>
      </section>
    )
  }

  return null
}