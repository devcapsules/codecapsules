/**
 * Course Editor Page - Individual Course/Playlist Editing
 * 
 * This page provides editing capabilities for individual courses/playlists
 * using the PlaylistEditor component.
 */

import React from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../contexts/AuthContext'
import { PlaylistEditor } from '@codecapsule/ui'

export default function CourseEditPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { id } = router.query

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
    console.log('Saving playlist:', playlist)
    // Navigate back to courses dashboard
    router.push('/courses')
  }

  const handleCancel = () => {
    // Navigate back to courses dashboard without saving
    router.push('/courses')
  }

  const handlePreview = (playlist: any) => {
    console.log('Previewing playlist:', playlist)
    // Open preview in new window or show preview modal
    window.open(`/courses/preview/${id}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <PlaylistEditor
        playlistId={id as string}
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

// Required for dynamic routes in Next.js
export async function getStaticPaths() {
  // Return empty paths since we don't want to pre-generate any pages
  // All pages will be generated on-demand (ISR)
  return {
    paths: [],
    fallback: 'blocking'
  }
}

export async function getStaticProps({ params }: { params: { id: string } }) {
  // Return props - we'll let the client handle the data fetching
  return {
    props: {
      id: params.id
    },
    // Revalidate every hour
    revalidate: 3600
  }
}