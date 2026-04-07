/// <reference types="./vite-env.d.ts" />
import React from 'react'
import ReactDOM from 'react-dom/client'
import AdaptiveCapsuleEmbed from './components/AdaptiveCapsuleEmbed'
import PlaylistEmbed from './components/PlaylistEmbed'
import { DCAnimationProvider } from './components/DCAnimations'
import { embedAnalytics } from './utils/EmbedAnalytics'
import './index.css'

// Get widget ID from URL params or data attributes
const getWidgetId = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const widgetId = urlParams.get('widgetId') || 
                   urlParams.get('id') ||
                   document.currentScript?.getAttribute('data-widget-id')
  
  if (!widgetId) {
    console.error('Devcapsules: No widget ID provided')
    return null
  }
  
  return widgetId
}

const getPlaylistId = () => {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('playlist') || null
}

/** "Headless Playlist" — courseId baked into the embed URL for analytics grouping */
const getCourseId = () => {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('courseId') || urlParams.get('course_id') || null
}

const widgetId = getWidgetId()
const playlistId = getPlaylistId()
const courseId = getCourseId()

const getStartIndex = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const s = urlParams.get('start')
  return s ? Math.max(0, parseInt(s, 10) || 0) : 0
}
const startIndex = getStartIndex()

// Attach courseId to analytics singleton so every event is tagged
if (courseId) {
  embedAnalytics.courseId = courseId
}

const container = document.getElementById('devcapsules-root') || document.body
const root = ReactDOM.createRoot(container)

if (playlistId) {
  // ── Playlist mode: Seamless Arcade player ──
  root.render(
    <React.StrictMode>
      <DCAnimationProvider>
        <PlaylistEmbed playlistId={playlistId} startIndex={startIndex} />
      </DCAnimationProvider>
    </React.StrictMode>,
  )
} else if (widgetId) {
  // ── Single capsule mode (original behaviour) ──
  // courseId is the "Headless Playlist" context — purely for analytics grouping.
  // When a creator embeds ?id=abc&courseId=xyz, every event is tagged with the course.
  root.render(
    <React.StrictMode>
      <DCAnimationProvider>
        <AdaptiveCapsuleEmbed widgetId={widgetId} courseId={courseId ?? undefined} />
      </DCAnimationProvider>
    </React.StrictMode>,
  )
} else {
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Devcapsules: Invalid widget configuration. Use ?id=capsuleId or ?playlist=playlistId</div>'
}