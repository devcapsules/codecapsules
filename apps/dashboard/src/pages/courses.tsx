/**
 * Courses Page - Course Management Dashboard
 */

import React from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import { CourseCreatorDashboard } from '@codecapsule/ui'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://devcapsules-api.devleep-edu.workers.dev/api/v1'

export default function CoursesPage() {
  const { user, session, loading } = useAuth()
  const router = useRouter()

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
      <CourseCreatorDashboard
        organizationId={user.id}
        userId={user.id}
        apiBaseUrl={API_URL}
        authToken={session?.access_token}
        onCreateNew={() => router.push('/courses/new')}
        onPlaylistSelect={(playlist: any) => router.push(`/courses/edit/?id=${playlist.id || playlist.playlist_id}`)}
        onViewDetails={(playlist: any) => router.push(`/courses/detail/?id=${playlist.id || playlist.playlist_id}`)}
        onPreviewPlaylist={(playlist: any) => {
          // Only open preview for draft courses
          if (!playlist.published_at) {
            window.open(`/courses/preview/?id=${playlist.id || playlist.playlist_id}`, '_blank')
          }
        }}
      />
    </div>
  )
}