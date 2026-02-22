'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  
  const { signUp, signInWithProvider } = useAuth()
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const { data, error } = await signUp(email, password, {
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
      }
    })
    
    if (error) {
      setError(error.message)
    } else {
      setMessage('Check your email for the confirmation link!')
      // For new signups, we'll redirect to create-capsule after email confirmation
    }
    
    setLoading(false)
  }

  const handleProviderSignup = async (provider: 'github' | 'google') => {
    setLoading(true)
    const { error } = await signInWithProvider(provider)
    
    if (error) {
      setError(error.message)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex relative" style={{ background: '#04040a' }}>
      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '64px 64px', zIndex: 0 }} />

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Green orb */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(0,255,135,0.13) 0%, transparent 70%)', filter: 'blur(90px)' }} />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)', filter: 'blur(70px)' }} />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <div className="flex items-center mb-8">
            <img src="/favicon.svg" alt="Devcapsules" className="w-12 h-12 mr-4" />
            <span className="text-2xl font-bold text-white">Devcapsules</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            Start Creating<br /><span style={{ color: '#00ff87' }}>Interactive Labs.</span>
          </h1>
          <p className="text-lg text-slate-400 mb-8 leading-relaxed">
            Transform your ideas into engaging coding challenges with AI-powered generation and real-time execution.
          </p>
          <div className="space-y-4">
            {[
              'AI-powered challenge generation',
              'Interactive coding environments',
              'Instant feedback and execution',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,255,135,0.15)', border: '1px solid rgba(0,255,135,0.3)' }}>
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#00ff87" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-slate-300 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/favicon.svg" alt="Devcapsules" className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Start Creating Interactive Labs.
            </h2>
          </div>

          <div className="backdrop-blur-sm py-6 px-6 shadow-xl rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-center mb-6 lg:hidden">
              <p className="text-sm text-slate-400">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-[#00ff87] hover:text-[#00e87a]">
                  Log In
                </Link>
              </p>
            </div>
          {error && (
            <div className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.25)', color: '#00ff87' }}>
              {message}
            </div>
          )}

          {/* Primary Social CTAs */}
          <div className="space-y-3">
            <button
              onClick={() => handleProviderSignup('google')}
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50"
              style={{ background: '#00ff87', color: '#04040a' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#00e87a')}
              onMouseLeave={e => (e.currentTarget.style.background = '#00ff87')}
            >
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
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
              Sign Up with Google
            </button>
            
            <button
              onClick={() => handleProviderSignup('github')}
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-medium text-slate-300 transition-all duration-200 disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            >
              <svg className="h-5 w-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                  clipRule="evenodd"
                />
              </svg>
              Sign Up with GitHub
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 text-slate-500">Or continue with email</span>
              </div>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSignup}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-slate-300">
                  First name
                </label>
                <div className="mt-1">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-white placeholder-slate-500 outline-none transition-colors"
                    style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,255,135,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                    placeholder="John"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-slate-300">
                  Last name
                </label>
                <div className="mt-1">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-white placeholder-slate-500 outline-none transition-colors"
                    style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,255,135,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

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
                  placeholder="john@example.com"
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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-white placeholder-slate-500 outline-none transition-colors pr-10"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,255,135,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
                Confirm password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-white placeholder-slate-500 outline-none transition-colors pr-10"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,255,135,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 rounded"
                style={{ accentColor: '#00ff87' }}
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-slate-300">
                I agree to the{' '}
                <Link href="/terms" className="text-[#00ff87] hover:text-[#00e87a]">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-[#00ff87] hover:text-[#00e87a]">
                  Privacy Policy
                </Link>
              </label>
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
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>

          {/* Desktop Login Link */}
          <div className="hidden lg:block text-center mt-6">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-[#00ff87] hover:text-[#00e87a]">
                Log In
              </Link>
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}