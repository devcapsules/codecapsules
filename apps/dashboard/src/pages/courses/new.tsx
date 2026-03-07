/**
 * New Course Creation Page
 */

import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { PlaylistEditor } from '@codecapsule/ui'
import CreateCapsuleModal from '../../components/CreateCapsuleModal'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://devcapsules-api.devleep-edu.workers.dev/api/v1'

export default function NewCoursePage() {
  const { user, session, loading } = useAuth()
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)

  if (loading) {
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

  return (
    <div className="min-h-screen bg-[#04040a]">
      <PlaylistEditor
        playlistId={undefined}
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