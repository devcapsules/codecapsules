import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import BlogLayout from '../../components/blog/BlogLayout'

const pillarPosts = [
  {
    id: 'stop-copy-pasting',
    title: 'Stop Copy-Pasting. Run Code Where You Read It.',
    description: 'How we made our blog 100% interactive with embedded code execution. See live Python, SQL, and Linux terminal examples.',
    date: 'November 11, 2025',
    readTime: '5 min read',
    capsuleCount: 3,
    tags: ['Interactive Learning', 'Developer Tools', 'WASM'],
    category: 'pillar',
    featured: true,
    views: '2.1k',
    type: 'Hero Content'
  }
]

const feederPosts = [
  {
    id: 'javascript-array-methods',
    title: 'JavaScript Array Methods Cheat Sheet: map, filter, reduce & More',
    description: 'Master JavaScript array methods with interactive examples. Learn map(), filter(), reduce(), forEach(), find() and more with code you can run instantly.',
    date: 'November 11, 2025',
    readTime: '6 min read',
    capsuleCount: 1,
    tags: ['JavaScript', 'Quick Tips', 'Beginner'],
    category: 'feeder',
    language: 'JavaScript',
    views: '0'
  },
  {
    id: 'sql-join-types-explained',
    title: 'SQL JOIN Types Explained: Visual Guide with Examples',
    description: 'Master SQL JOINs with interactive examples and visual diagrams. Learn INNER, LEFT, RIGHT, and FULL OUTER joins with real data you can query instantly.',
    date: 'November 11, 2025',
    readTime: '7 min read',
    capsuleCount: 1,
    tags: ['SQL', 'Database', 'Intermediate'],
    category: 'feeder',
    language: 'SQL',
    views: '0'
  },
  {
    id: 'git-commands-guide',
    title: 'Git Commands Cheat Sheet: Essential Commands Every Developer Needs',
    description: 'Master Git with this comprehensive cheat sheet. Learn essential commands, workflows, and troubleshooting tips with interactive examples you can try instantly.',
    date: 'November 11, 2025',
    readTime: '8 min read',
    capsuleCount: 1,
    tags: ['Git', 'DevOps', 'Beginner'],
    category: 'feeder',
    language: 'Git',
    views: '0'
  },
  {
    id: 'python-list-comprehensions',
    title: 'Python List Comprehensions: Write Cleaner Code in One Line',
    description: 'Master Python list comprehensions with interactive examples. Transform loops into elegant one-liners. Includes performance comparisons and best practices.',
    date: 'November 11, 2025',
    readTime: '5 min read',
    capsuleCount: 1,
    tags: ['Python', 'Quick Tips', 'Beginner'],
    category: 'feeder',
    language: 'Python',
    views: '0'
  },
  {
    id: 'python-dictionary-methods',
    title: 'Python Dictionary Methods: Complete Guide with Real Examples',
    description: 'Master Python dictionary methods with interactive examples. Learn get(), keys(), values(), items(), and advanced techniques for efficient data handling.',
    date: 'November 11, 2025',
    readTime: '7 min read',
    capsuleCount: 1,
    tags: ['Python', 'Quick Tips', 'Beginner'],
    category: 'feeder',
    language: 'Python',
    views: '0'
  },
  {
    id: 'python-enumerate-tutorial',
    title: 'Python enumerate(): 3 Ways to Write Cleaner Loops',
    description: 'Master Python\'s enumerate() function with interactive examples. Write more readable, Pythonic code in minutes.',
    date: 'November 10, 2025',
    readTime: '3 min read',
    capsuleCount: 2,
    tags: ['Python', 'Quick Tips', 'Beginner'],
    category: 'feeder',
    language: 'Python',
    views: '890'
  },
  {
    id: 'sql-group-by-vs-partition',
    title: 'SQL GROUP BY vs PARTITION BY: When to Use Which',
    description: 'Learn the key differences between GROUP BY and PARTITION BY with live SQL examples you can run instantly.',
    date: 'November 9, 2025',
    readTime: '4 min read',
    capsuleCount: 1,
    tags: ['SQL', 'Database', 'Intermediate'],
    category: 'feeder',
    language: 'SQL',
    views: '1.2k'
  },
  {
    id: 'javascript-async-await-guide',
    title: 'Async/Await vs Promises: The Complete Guide',
    description: 'Master asynchronous JavaScript with interactive examples. See the difference in real code you can execute.',
    date: 'November 8, 2025',
    readTime: '4 min read',
    capsuleCount: 2,
    tags: ['JavaScript', 'Async', 'Intermediate'],
    category: 'feeder',
    language: 'JavaScript',
    views: '756'
  }
]

export default function BlogIndex() {
  return (
    <>
      <Head>
        <title>Devcapsules Blog - Interactive Developer Tutorials</title>
        <meta 
          name="description" 
          content="The world's first fully interactive developer blog. Run code directly in articles with embedded Python, SQL, Java, C#, Go, and Linux environments." 
        />
        <meta name="keywords" content="interactive coding blog, developer tutorials, code execution, programming education, WASM, serverless" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Devcapsules Blog - Interactive Developer Tutorials" />
        <meta property="og:description" content="The world's first fully interactive developer blog with embedded code execution." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://devcapsules.com/blog" />
        
        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Blog",
              "name": "Devcapsules Blog",
              "description": "Interactive developer tutorials with embedded code execution",
              "url": "https://devcapsules.com/blog",
              "publisher": {
                "@type": "Organization",
                "name": "DevCapsules"
              }
            })
          }}
        />
      </Head>
      
      <BlogLayout>

        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              The Interactive Developer Blog
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Where code runs inside articles. No copy-pasting, no context switching—just pure, hands-on learning.
            </p>
            <div className="flex items-center justify-center space-x-8 text-blue-200">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🐍</span>
                <span>Python</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">☕</span>
                <span>Java</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🔷</span>
                <span>C#</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🐹</span>
                <span>Go</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🗄️</span>
                <span>SQL</span>
              </div>
            </div>
          </div>
        </section>

        {/* Blog Posts */}
        <main className="max-w-7xl mx-auto px-6 py-12">
          {/* Hero/Pillar Content Section */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">🎯 Hero Content</h2>
                <p className="text-gray-600">Deep-dive tutorials that showcase DevCapsules's full potential</p>
              </div>
            </div>
            
            {pillarPosts.filter(post => post.featured).map(post => (
            <div key={post.id} className="mb-16">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-8 shadow-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">FEATURED</span>
                  <span className="text-blue-600 text-sm font-medium">🎯 {post.capsuleCount} Interactive Labs</span>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  <Link href={`/blog/${post.id}`} className="hover:text-blue-600 transition-colors">
                    {post.title}
                  </Link>
                </h2>
                
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  {post.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>📅 {post.date}</span>
                    <span>⏱️ {post.readTime}</span>
                  </div>
                  
                  <Link 
                    href={`/blog/${post.id}`}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <span>Read & Run Code</span>
                    <span>→</span>
                  </Link>
                </div>
                
                <div className="mt-6 flex flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <span key={tag} className="bg-white/70 text-blue-700 text-xs px-3 py-1 rounded-full border border-blue-200">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
          </section>

          {/* Daily Feeder Posts Section */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">⚡ Quick Interactive Tutorials</h2>
                <p className="text-gray-600">Bite-sized lessons that get you coding in under 5 minutes</p>
              </div>
              <div className="flex items-center space-x-4">
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Languages</option>
                  <option value="python">Python</option>
                  <option value="sql">SQL</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="csharp">C#</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feederPosts.map(post => (
                <article key={post.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                      post.language === 'Python' ? 'bg-green-100 text-green-800' :
                      post.language === 'SQL' ? 'bg-blue-100 text-blue-800' :
                      post.language === 'JavaScript' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {post.language === 'Python' ? '🐍' : post.language === 'SQL' ? '🗄️' : post.language === 'JavaScript' ? '⚡' : '💻'} {post.language}
                    </span>
                    <span className="text-xs text-gray-500">{post.views} views</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                    <Link href={`/blog/${post.id}`} className="hover:text-blue-600 transition-colors">
                      {post.title}
                    </Link>
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {post.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>📅 {post.date}</span>
                    <span>⏱️ {post.readTime}</span>
                    <span>🎯 {post.capsuleCount} Labs</span>
                  </div>
                  
                  <Link 
                    href={`/blog/${post.id}`}
                    className="w-full bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors text-center block text-sm"
                  >
                    Try Interactive Demo →
                  </Link>
                </article>
              ))}
            </div>
          </section>

          {/* Content Categories */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Browse by Topic</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">�</div>
                <h3 className="font-bold text-green-900 mb-2">Python</h3>
                <p className="text-sm text-green-700 mb-4">Data structures, algorithms, and clean code practices</p>
                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">12 posts</span>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">🗄️</div>
                <h3 className="font-bold text-blue-900 mb-2">SQL & Databases</h3>
                <p className="text-sm text-blue-700 mb-4">Query optimization, joins, and database design</p>
                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">8 posts</span>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-bold text-yellow-900 mb-2">JavaScript</h3>
                <p className="text-sm text-yellow-700 mb-4">Modern ES6+, async programming, and frameworks</p>
                <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">6 posts</span>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">�</div>
                <h3 className="font-bold text-purple-900 mb-2">DevOps</h3>
                <p className="text-sm text-purple-700 mb-4">Linux commands, Git workflows, and automation</p>
                <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">4 posts</span>
              </div>
            </div>
          </section>

          {/* Newsletter Signup */}
          <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Never Miss an Interactive Tutorial</h2>
            <p className="text-indigo-100 mb-6">Get new posts delivered weekly. Each one has live code you can run instantly.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors whitespace-nowrap">
                Subscribe Free
              </button>
            </div>
            <p className="text-indigo-200 text-sm mt-4">
              ✨ No spam, unsubscribe anytime. Join 2,500+ developers already subscribed.
            </p>
          </section>
        </main>
      </BlogLayout>
    </>
  )
}
