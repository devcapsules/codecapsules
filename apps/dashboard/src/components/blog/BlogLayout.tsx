import React from 'react'
import Link from 'next/link'

interface BlogLayoutProps {
  children: React.ReactNode
}

export default function BlogLayout({ children }: BlogLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Blog Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                Devcapsules
              </Link>
              <span className="text-gray-400">/</span>
              <Link href="/blog" className="text-blue-600 hover:text-blue-800 font-medium">
                Blog
              </Link>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/blog" className="text-gray-600 hover:text-gray-900 transition-colors">
                  All Posts
                </Link>
                <Link href="/blog/category/python" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Python
                </Link>
                <Link href="/blog/category/sql" className="text-gray-600 hover:text-gray-900 transition-colors">
                  SQL
                </Link>
                <Link href="/blog/category/javascript" className="text-gray-600 hover:text-gray-900 transition-colors">
                  JavaScript
                </Link>
              </div>
              <div className="h-6 w-px bg-gray-300 hidden md:block"></div>
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                Platform
              </Link>
              <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Try Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>
      
      {/* Blog Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                Devcapsules
              </Link>
              <p className="text-gray-600 mt-4 leading-relaxed">
                The interactive coding platform that lets you run code where you read it. 
                Perfect for technical blogs, documentation, and educational content.
              </p>
              <div className="flex items-center space-x-4 mt-6">
                <a href="https://twitter.com/devcapsules" className="text-gray-400 hover:text-blue-500 transition-colors">
                  <span className="sr-only">Twitter</span>
                  🐦
                </a>
                <a href="https://github.com/devcapsules" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <span className="sr-only">GitHub</span>
                  💻
                </a>
                <a href="https://linkedin.com/company/devcapsules" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  🔗
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Platform</h4>
              <div className="space-y-3">
                <Link href="/" className="block text-gray-600 hover:text-gray-900 transition-colors">
                  Features
                </Link>
                <Link href="/pricing" className="block text-gray-600 hover:text-gray-900 transition-colors">
                  Pricing
                </Link>
                <Link href="/docs" className="block text-gray-600 hover:text-gray-900 transition-colors">
                  Documentation
                </Link>
                <Link href="/api" className="block text-gray-600 hover:text-gray-900 transition-colors">
                  API
                </Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
              <div className="space-y-3">
                <Link href="/blog" className="block text-gray-600 hover:text-gray-900 transition-colors">
                  Blog
                </Link>
                <Link href="/examples" className="block text-gray-600 hover:text-gray-900 transition-colors">
                  Examples
                </Link>
                <Link href="/help" className="block text-gray-600 hover:text-gray-900 transition-colors">
                  Help Center
                </Link>
                <Link href="/contact" className="block text-gray-600 hover:text-gray-900 transition-colors">
                  Contact
                </Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-sm text-gray-500">
                © 2026 DevCapsules. All rights reserved.
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <Link href="/privacy" className="hover:text-gray-700 transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-gray-700 transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}