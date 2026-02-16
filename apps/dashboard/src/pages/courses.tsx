/**
 * Courses Page - B2B Course Management Dashboard
 * 
 * This page integrates the CourseCreatorDashboard component to provide
 * a complete course/playlist management interface for B2B customers.
 */

import React from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import { CourseCreatorDashboard } from '../../../../packages/ui/src/components/playlist/CourseCreatorDashboard'

export default function CoursesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push('/login')
    return null
  }

  const handleCreateNew = () => {
    router.push('/courses/new')
  }

  const handleEditPlaylist = (playlistId: string) => {
    router.push(`/courses/edit/${playlistId}`)
  }

  const handlePreview = (playlistId: string) => {
    // Open preview in new tab or modal
    window.open(`/preview/${playlistId}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <CourseCreatorDashboard
        organizationId={user.id}
        userId={user.id}
        apiBaseUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}
        onCreateNew={handleCreateNew}
        onEditPlaylist={handleEditPlaylist}
        onPreview={handlePreview}
      />
    </div>
  )
}