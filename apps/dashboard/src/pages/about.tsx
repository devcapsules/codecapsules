import Head from 'next/head';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';

export default function About() {
  return (
    <>
      <Head>
        <title>About Us | Devcapsules</title>
        <meta name="description" content="Learn about Devcapsules - the interactive coding platform trusted by instructors worldwide." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Navigation />
        
        <main className="pt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                About Devcapsules
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                We're building the future of interactive coding education, making programming accessible and engaging for everyone.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 mb-16">
              <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
                <p className="text-gray-300 leading-relaxed">
                  To revolutionize how people learn to code by creating interactive, hands-on experiences that make programming concepts come alive. We believe learning should be engaging, practical, and accessible to everyone.
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-4">Our Vision</h2>
                <p className="text-gray-300 leading-relaxed">
                  A world where anyone can learn to code through interactive experiences, where complex programming concepts are broken down into digestible, executable examples that learners can experiment with in real-time.
                </p>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 mb-16">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Why Devcapsules?</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Interactive Learning</h3>
                  <p className="text-gray-300 text-sm">Run code directly in your browser with instant feedback and results.</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">For Educators</h3>
                  <p className="text-gray-300 text-sm">Create engaging lessons with executable code examples and interactive tutorials.</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Global Impact</h3>
                  <p className="text-gray-300 text-sm">Trusted by 127+ instructors across 15 countries worldwide.</p>
                </div>
              </div>
            </div>

            <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Join Our Community</h2>
              <p className="text-blue-100 mb-6">
                Be part of the revolution in coding education. Whether you're an educator, student, or developer, 
                there's a place for you in the Devcapsules community.
              </p>
              <a 
                href="/contact" 
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Get in Touch
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}