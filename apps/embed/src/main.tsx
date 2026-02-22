/// <reference types="./vite-env.d.ts" />
import React from 'react'
import ReactDOM from 'react-dom/client'
import AdaptiveCapsuleEmbed from './components/AdaptiveCapsuleEmbed'
import { DCAnimationProvider } from './components/DCAnimations'
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

const widgetId = getWidgetId()
const playlistId = getPlaylistId()

if (widgetId) {
  const container = document.getElementById('devcapsules-root') || document.body
  const root = ReactDOM.createRoot(container)
  
  root.render(
    <React.StrictMode>
      <DCAnimationProvider>
        <AdaptiveCapsuleEmbed widgetId={widgetId} />
      </DCAnimationProvider>
    </React.StrictMode>,
  )
} else {
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Devcapsules: Invalid widget configuration</div>'
}