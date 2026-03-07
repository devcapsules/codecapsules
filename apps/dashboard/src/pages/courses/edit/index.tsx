/**
 * Course Editor Page
 *
 * Uses query parameter ?id=xxx instead of dynamic route [id]
 * because the dashboard uses `output: 'export'` (static export)
 * which doesn't support dynamic routes with fallback: 'blocking'.
 */

import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../contexts/AuthContext'
import { PlaylistEditor } from '@codecapsule/ui'
import CreateCapsuleModal from '../../../components/CreateCapsuleModal'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://devcapsules-api.devleep-edu.workers.dev/api/v1'

export default function CourseEditPage() {
  const { user, session, loading } = useAuth()
  const router = useRouter()
  const id = router.query.id as string | undefined
  const [showCreateModal, setShowCreateModal] = useState(false)

  if (loading || !router.isReady) {
    return (
      <div className="min-h-screen bg-[#04040a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500/30 border-t-emerald-500"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  if (!id) {
    return (
      <div className="min-h-screen bg-[#04040a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400">No course ID specified</p>
          <button
            onClick={() => router.push('/courses')}
            className="mt-4 px-4 py-2 text-sm bg-slate-800 text-white rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            Back to Courses
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#04040a]">
      <PlaylistEditor
        playlistId={id}
        organizationId={user.id}
        userId={user.id}
        apiBaseUrl={API_URL}
        authToken={session?.access_token}
        onSave={() => router.push('/courses')}
        onCancel={() => router.push('/courses')}
        onGenerateAI={() => setShowCreateModal(true)}
      />
      <CreateCapsuleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  )
}
