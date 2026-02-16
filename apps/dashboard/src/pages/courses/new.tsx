/**
 * New Course Creation Page
 * 
 * This page provides a form for creating new courses/playlists
 * using the PlaylistEditor component in creation mode.
 */

import React from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { PlaylistEditor } from '../../../../../packages/ui/src/components/playlist/PlaylistEditor'

export default function NewCoursePage() {
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

  const handleSave = (playlist: any) => {
    console.log('Creating new playlist:', playlist)
    // Navigate back to courses dashboard
    router.push('/courses')
  }

  const handleCancel = () => {
    // Navigate back to courses dashboard without saving
    router.push('/courses')
  }

  const handlePreview = (playlist: any) => {
    console.log('Previewing new playlist:', playlist)
    // Show preview modal or temporary preview
    alert('Preview functionality - playlist not saved yet')
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <PlaylistEditor
        playlistId={undefined} // No ID = creation mode
        organizationId={user.id}
        userId={user.id}
        apiBaseUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}
        onSave={handleSave}
        onCancel={handleCancel}
        onPreview={handlePreview}
      />
    </div>
  )
}