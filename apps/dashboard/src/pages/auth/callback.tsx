import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '../../lib/supabase/client'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth callback error:', error)
        router.push('/login?error=auth_callback_failed')
        return
      }

      if (data.session?.user) {
        // Check if this is a new user
        router.push('/dashboard')
      } else {
        // No session, redirect to login
        router.push('/login')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col justify-center items-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">CC</span>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="text-gray-400">Completing authentication...</p>
      </div>
    </div>
  )
}