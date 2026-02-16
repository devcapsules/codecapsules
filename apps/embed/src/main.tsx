/// <reference types="./vite-env.d.ts" />
import React from 'react'
import ReactDOM from 'react-dom/client'
import AdaptiveCapsuleEmbed from './components/AdaptiveCapsuleEmbed'
import './index.css'

// Get widget ID from URL params or data attributes
const getWidgetId = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const widgetId = urlParams.get('widgetId') || 
                   document.currentScript?.getAttribute('data-widget-id')
  
  if (!widgetId) {
    console.error('Devcapsules: No widget ID provided')
    return null
  }
  
  return widgetId
}

const widgetId = getWidgetId()

if (widgetId) {
  const container = document.getElementById('devcapsules-root') || document.body
  const root = ReactDOM.createRoot(container)
  
  root.render(
    <React.StrictMode>
      <AdaptiveCapsuleEmbed widgetId={widgetId} />
    </React.StrictMode>,
  )
} else {
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Devcapsules: Invalid widget configuration</div>'
}