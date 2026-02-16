import React from 'react';
import Head from 'next/head';

export default function BlogHome() {
  return (
    <>
      <Head>
        <title>Devcapsules Blog</title>
        <meta name="description" content="Devcapsules Marketing Blog" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* Navigation Header */}
      <nav className="bg-gray-950 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/logo.png" alt="Devcapsules" className="w-12 h-12 mr-3" />
              <span className="text-lg font-bold text-white">Devcapsules</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="/" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                Home
              </a>
              <a href="/dashboard" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Devcapsules Blog
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Learn, Build, and Master Programming with Interactive Capsules
            </p>
            <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
              <p className="text-gray-700">
                Our blog is currently being set up with educational content,
                tutorials, and insights about interactive programming education.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}