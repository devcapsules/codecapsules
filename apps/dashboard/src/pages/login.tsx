'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { useAuth } from '../contexts/AuthContext'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLearnerDomain, setIsLearnerDomain] = useState(false)
  
  const { signIn, signInWithProvider } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setIsLearnerDomain(
      typeof window !== 'undefined' && window.location.hostname === 'learn.devcapsules.com'
    );
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error.message)
    } else {
      // Redirect based on returnTo param or learner domain
      const returnTo = (router.query.returnTo as string) || '';
      if (returnTo && returnTo.startsWith('/')) {
        router.push(returnTo);
      } else if (isLearnerDomain) {
        router.push('/learn/capsules');
      } else {
        router.push('/dashboard');
      }
    }
    
    setLoading(false)
  }

  const handleProviderLogin = async (provider: 'google') => {
    setLoading(true)
    const { error } = await signInWithProvider(provider)
    
    if (error) {
      setError(error.message)
    }
    
    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>Sign In - Devcapsules</title>
        <meta
          name="description"
          content="Log in to your Devcapsules creator dashboard. Manage your interactive coding widgets, track analytics, and create EdGE-powered coding environments."
        />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Sign In - Devcapsules" />
        <meta property="og:description" content="Access your Devcapsules creator dashboard" />
      </Head>
      {/* Page background */}
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative" style={{ background: '#04040a' }}>
        {/* Dot grid */}
        <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '64px 64px', zIndex: 0 }} />
        {/* Green orb */}
        <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(0,255,135,0.10) 0%, transparent 70%)', filter: 'blur(80px)' }} />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img src="/favicon.svg" alt="Devcapsules" className="w-12 h-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-white">
          {isLearnerDomain ? 'Welcome Back, Learner.' : 'Welcome Back, Creator.'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          New to Devcapsules?{' '}
          <Link href="/signup" className="font-medium text-[#00ff87] hover:text-[#00e87a]">
            Create account
          </Link>
        </p>
      </div>

      <div className="mt-8 relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="backdrop-blur-sm py-8 px-4 shadow-xl rounded-2xl sm:px-10" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {error && (
            <div className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleEmailLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-white placeholder-slate-500 outline-none transition-colors"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,255,135,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-white placeholder-slate-500 outline-none transition-colors pr-10"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,255,135,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded"
                  style={{ accentColor: '#00ff87' }}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-[#00ff87] hover:text-[#00e87a]">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: '#00ff87', color: '#04040a' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#00e87a')}
                onMouseLeave={e => (e.currentTarget.style.background = '#00ff87')}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 text-slate-500" style={{ background: 'transparent' }}>Or sign in with</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => handleProviderLogin('google')}
                disabled={loading}
                className="w-full inline-flex justify-center items-center py-2.5 px-3 rounded-lg text-sm font-medium text-slate-300 transition-colors disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285f4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34a853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#fbbc05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#ea4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="ml-2">Sign in with Google</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}